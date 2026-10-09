package com.hms.booking.service;

import com.hms.booking.dto.BookingResponse;
import com.hms.booking.dto.CreateBookingRequest;
import com.hms.booking.dto.UpdateBookingDatesRequest;
import com.hms.booking.entity.Booking;
import com.hms.booking.entity.BookingStatus;
import com.hms.booking.mapper.BookingMapper;
import com.hms.booking.repository.BookingRepository;
import com.hms.common.dto.PageResponse;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.InvalidRequestException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.guest.entity.Guest;
import com.hms.guest.repository.GuestRepository;
import com.hms.room.entity.Room;
import com.hms.room.entity.RoomStatus;
import com.hms.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static com.hms.booking.entity.BookingStatus.*;

/**
 * Booking engine business logic.
 *
 * <p>Concurrency model: every write that depends on room availability first takes a
 * pessimistic row lock on the {@link Room} (and on the {@link Booking} when modifying an
 * existing one). Concurrent requests for the same room therefore queue up, and the overlap
 * check always runs against committed data. Lock order is always booking -> room, so
 * deadlocks between two booking operations cannot occur.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingService {

    /** Allowed lifecycle transitions; anything not listed is rejected. */
    private static final Map<BookingStatus, Set<BookingStatus>> ALLOWED_TRANSITIONS = Map.of(
            PENDING, EnumSet.of(CONFIRMED, CANCELLED),
            CONFIRMED, EnumSet.of(CHECKED_IN, CANCELLED),
            CHECKED_IN, EnumSet.of(CHECKED_OUT),
            CHECKED_OUT, EnumSet.noneOf(BookingStatus.class),
            CANCELLED, EnumSet.noneOf(BookingStatus.class));

    private final BookingRepository bookingRepository;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;
    private final BookingMapper bookingMapper;

    // ------------------------------------------------------------------ create

    /**
     * Creates a PENDING booking. All steps run in one transaction: if anything fails,
     * nothing is persisted.
     *
     * <ol>
     *   <li>validate dates</li>
     *   <li>load the guest and lock the room row</li>
     *   <li>room must be AVAILABLE</li>
     *   <li>room must have no overlapping active booking (PENDING, CONFIRMED or CHECKED_IN)</li>
     *   <li>total = price per night x number of nights</li>
     * </ol>
     */
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        validateDates(request.checkInDate(), request.checkOutDate());

        Guest guest = guestRepository.findById(request.guestId())
                .orElseThrow(() -> new ResourceNotFoundException("Guest", request.guestId()));
        Room room = lockRoom(request.roomId());

        assertRoomAvailable(room);
        assertNoOverlap(room, request.checkInDate(), request.checkOutDate(), null);

        BigDecimal totalAmount = calculateTotal(room.getPricePerNight(),
                request.checkInDate(), request.checkOutDate());

        Booking booking = Booking.builder()
                .guest(guest)
                .room(room)
                .checkInDate(request.checkInDate())
                .checkOutDate(request.checkOutDate())
                .totalAmount(totalAmount)
                .status(PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} created: room {} from {} to {}, total {}",
                saved.getId(), room.getRoomNumber(), saved.getCheckInDate(),
                saved.getCheckOutDate(), totalAmount);
        return bookingMapper.toResponse(saved);
    }

    // -------------------------------------------------------------------- read

    public BookingResponse getBooking(Long id) {
        Booking booking = bookingRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));
        return bookingMapper.toResponse(booking);
    }

    /** Lists bookings, optionally filtered by guest and/or status. */
    public PageResponse<BookingResponse> getBookings(Long guestId, BookingStatus status, Pageable pageable) {
        Page<Booking> page;
        if (guestId != null && status != null) {
            page = bookingRepository.findByGuestIdAndStatus(guestId, status, pageable);
        } else if (guestId != null) {
            page = bookingRepository.findByGuestId(guestId, pageable);
        } else if (status != null) {
            page = bookingRepository.findByStatus(status, pageable);
        } else {
            page = bookingRepository.findAll(pageable);
        }
        return PageResponse.from(page.map(bookingMapper::toResponse));
    }

    // ------------------------------------------------------------------ update

    /**
     * Changes the stay dates of a PENDING or CONFIRMED booking. Availability is re-checked
     * (ignoring this booking itself) and the total is recalculated at the room's current rate.
     */
    @Transactional
    public BookingResponse updateBookingDates(Long id, UpdateBookingDatesRequest request) {
        Booking booking = lockBooking(id);
        if (booking.getStatus() != PENDING && booking.getStatus() != CONFIRMED) {
            throw new ConflictException("Only PENDING or CONFIRMED bookings can be modified; booking "
                    + id + " is " + booking.getStatus());
        }
        validateDates(request.checkInDate(), request.checkOutDate());

        Room room = lockRoom(booking.getRoom().getId());
        assertNoOverlap(room, request.checkInDate(), request.checkOutDate(), booking.getId());

        booking.setCheckInDate(request.checkInDate());
        booking.setCheckOutDate(request.checkOutDate());
        booking.setTotalAmount(calculateTotal(room.getPricePerNight(),
                request.checkInDate(), request.checkOutDate()));

        // saveAndFlush so the audit timestamp in the response reflects this update
        return bookingMapper.toResponse(bookingRepository.saveAndFlush(booking));
    }

    /**
     * Moves a booking through its lifecycle and keeps the room status in sync:
     * check-in marks the room BOOKED (occupied), check-out marks it AVAILABLE again.
     */
    @Transactional
    public BookingResponse updateBookingStatus(Long id, BookingStatus target) {
        Booking booking = lockBooking(id);
        BookingStatus current = booking.getStatus();

        if (!ALLOWED_TRANSITIONS.get(current).contains(target)) {
            throw new ConflictException("Cannot change booking status from " + current + " to " + target);
        }

        switch (target) {
            case CHECKED_IN -> {
                Room room = lockRoom(booking.getRoom().getId());
                if (room.getStatus() != RoomStatus.AVAILABLE) {
                    throw new ConflictException("Room " + room.getRoomNumber()
                            + " cannot be checked into (room status: " + room.getStatus() + ")");
                }
                room.setStatus(RoomStatus.BOOKED);
            }
            case CHECKED_OUT -> {
                Room room = lockRoom(booking.getRoom().getId());
                if (room.getStatus() == RoomStatus.BOOKED) {
                    room.setStatus(RoomStatus.AVAILABLE);
                }
            }
            default -> {
                // CONFIRMED / CANCELLED only change the booking itself
            }
        }

        booking.setStatus(target);
        log.info("Booking {} status {} -> {}", id, current, target);
        return bookingMapper.toResponse(bookingRepository.saveAndFlush(booking));
    }

    // ------------------------------------------------------------------ delete

    /**
     * Hard-deletes a booking. Only PENDING (created in error) and CANCELLED bookings may be
     * removed; confirmed, in-house and completed stays are financial records. To cancel a
     * booking, use {@link #updateBookingStatus}.
     */
    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = lockBooking(id);
        if (booking.getStatus() != PENDING && booking.getStatus() != CANCELLED) {
            throw new ConflictException("Only PENDING or CANCELLED bookings can be deleted; booking "
                    + id + " is " + booking.getStatus());
        }
        bookingRepository.delete(booking);
        log.info("Booking {} deleted", id);
    }

    // ----------------------------------------------------------------- helpers

    /** Total = price per night x whole nights between check-in and check-out. */
    static BigDecimal calculateTotal(BigDecimal pricePerNight, LocalDate checkIn, LocalDate checkOut) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        return pricePerNight.multiply(BigDecimal.valueOf(nights)).setScale(2, RoundingMode.HALF_UP);
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (!checkOut.isAfter(checkIn)) {
            throw new InvalidRequestException("Check-out date must be after check-in date");
        }
    }

    private void assertRoomAvailable(Room room) {
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ConflictException("Room " + room.getRoomNumber()
                    + " is not available (status: " + room.getStatus() + ")");
        }
    }

    private void assertNoOverlap(Room room, LocalDate checkIn, LocalDate checkOut, Long excludeBookingId) {
        boolean overlaps = (excludeBookingId == null)
                ? bookingRepository.existsOverlappingBooking(
                        room.getId(), checkIn, checkOut, BookingStatus.ACTIVE)
                : bookingRepository.existsOverlappingBookingExcluding(
                        room.getId(), excludeBookingId, checkIn, checkOut, BookingStatus.ACTIVE);
        if (overlaps) {
            throw new ConflictException("Room " + room.getRoomNumber()
                    + " already has a reservation overlapping " + checkIn + " to " + checkOut);
        }
    }

    private Room lockRoom(Long roomId) {
        return roomRepository.findByIdForUpdate(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", roomId));
    }

    private Booking lockBooking(Long bookingId) {
        return bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));
    }
}
