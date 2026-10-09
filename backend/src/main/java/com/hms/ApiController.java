package com.hms;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins={"http://localhost:5173","http://localhost:4173"})
public class ApiController {
    private final RoomRepo rooms;
    private final GuestRepo guests;
    private final BookingRepo bookings;
    public ApiController(RoomRepo rooms,GuestRepo guests,BookingRepo bookings){this.rooms=rooms;this.guests=guests;this.bookings=bookings;}

    public record GuestRequest(@NotBlank @Size(max=100) String name,@Email @NotBlank @Size(max=150) String email,@NotBlank @Size(max=20) String phone,@NotBlank @Size(max=50) String idNumber){}
    public record CreateBookingRequest(@NotNull Long guestId,@NotNull Long roomId,@NotNull LocalDate checkInDate,@NotNull LocalDate checkOutDate){}
    public record StatusRequest(@NotNull BookingStatus status){}
    public record BookingView(Long id,Long guestId,String guestName,Long roomId,String roomNumber,RoomType roomType,LocalDate checkInDate,LocalDate checkOutDate,long nights,BigDecimal totalAmount,BookingStatus status,java.time.Instant createdAt,java.time.Instant updatedAt){}

    @GetMapping("/health") public Map<String,String> health(){return Map.of("status","UP");}
    @GetMapping("/rooms") public List<Room> listRooms(){return rooms.findAllByOrderByRoomNumberAsc();}
    @PostMapping("/rooms") @ResponseStatus(HttpStatus.CREATED) public Room createRoom(@Valid @RequestBody Room room){
        if(room.id!=null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Do not supply a room ID");
        return rooms.save(room);
    }
    @GetMapping("/guests") public Map<String,Object> listGuests(@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="200") int size){
        List<Guest> list=(q==null||q.isBlank())?guests.findAll():guests.findByEmailContainingIgnoreCase(q);
        int safeSize=Math.max(1,Math.min(size,200)), from=Math.min(Math.max(page,0)*safeSize,list.size()), to=Math.min(from+safeSize,list.size());
        return Map.of("content",list.subList(from,to),"page",page,"size",safeSize,"totalElements",list.size());
    }
    @PostMapping("/guests") @ResponseStatus(HttpStatus.CREATED) public Guest createGuest(@Valid @RequestBody GuestRequest req){
        if(guests.existsByEmailIgnoreCase(req.email())) throw new ResponseStatusException(HttpStatus.CONFLICT,"A guest with this email already exists");
        Guest g=new Guest();g.name=req.name().trim();g.email=req.email().trim().toLowerCase(Locale.ROOT);g.phone=req.phone().trim();g.idNumber=req.idNumber().trim();return guests.save(g);
    }
    @GetMapping("/bookings") public Map<String,Object> listBookings(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="200") int size){
        List<BookingView> list=bookings.findAllByOrderByCheckInDateAsc().stream().map(this::view).toList();
        int safeSize=Math.max(1,Math.min(size,200)),from=Math.min(Math.max(page,0)*safeSize,list.size()),to=Math.min(from+safeSize,list.size());
        return Map.of("content",list.subList(from,to),"page",page,"size",safeSize,"totalElements",list.size());
    }
    @PostMapping("/bookings") @ResponseStatus(HttpStatus.CREATED) @Transactional public BookingView createBooking(@Valid @RequestBody CreateBookingRequest req){
        validateDates(req.checkInDate(),req.checkOutDate());
        Guest guest=guests.findById(req.guestId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Guest not found"));
        Room room=rooms.findById(req.roomId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Room not found"));
        if(room.status!=RoomStatus.AVAILABLE) throw new ResponseStatusException(HttpStatus.CONFLICT,"Room is not available");
        if(bookings.existsOverlap(room.id,req.checkInDate(),req.checkOutDate(),List.of(BookingStatus.PENDING,BookingStatus.CONFIRMED,BookingStatus.CHECKED_IN))) throw new ResponseStatusException(HttpStatus.CONFLICT,"Room already has an overlapping reservation");
        Booking b=new Booking();b.guest=guest;b.room=room;b.checkInDate=req.checkInDate();b.checkOutDate=req.checkOutDate();b.totalAmount=room.pricePerNight.multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(b.checkInDate,b.checkOutDate)));return view(bookings.save(b));
    }
    @PatchMapping("/bookings/{id}/status") @Transactional public BookingView changeStatus(@PathVariable Long id,@Valid @RequestBody StatusRequest req){
        Booking b=bookings.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Booking not found"));
        Map<BookingStatus,Set<BookingStatus>> transitions=Map.of(
          BookingStatus.PENDING,Set.of(BookingStatus.CONFIRMED,BookingStatus.CANCELLED),
          BookingStatus.CONFIRMED,Set.of(BookingStatus.CHECKED_IN,BookingStatus.CANCELLED),
          BookingStatus.CHECKED_IN,Set.of(BookingStatus.CHECKED_OUT),
          BookingStatus.CHECKED_OUT,Set.of(),BookingStatus.CANCELLED,Set.of());
        if(!transitions.get(b.status).contains(req.status())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Invalid booking status transition");
        if(req.status()==BookingStatus.CHECKED_IN){if(b.room.status!=RoomStatus.AVAILABLE)throw new ResponseStatusException(HttpStatus.CONFLICT,"Room is not available for check-in");b.room.status=RoomStatus.BOOKED;rooms.save(b.room);}
        if(req.status()==BookingStatus.CHECKED_OUT && b.room.status==RoomStatus.BOOKED){b.room.status=RoomStatus.AVAILABLE;rooms.save(b.room);}
        b.status=req.status();return view(bookings.save(b));
    }
    private void validateDates(LocalDate in,LocalDate out){if(in.isBefore(LocalDate.now()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Check-in cannot be in the past");if(!out.isAfter(in))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Check-out must be after check-in");}
    private BookingView view(Booking b){return new BookingView(b.id,b.guest.id,b.guest.name,b.room.id,b.room.roomNumber,b.room.type,b.checkInDate,b.checkOutDate,ChronoUnit.DAYS.between(b.checkInDate,b.checkOutDate),b.totalAmount,b.status,b.createdAt,b.updatedAt);}
}
