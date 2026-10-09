package com.hms.room.repository;

import com.hms.booking.entity.BookingStatus;
import com.hms.room.entity.Room;
import com.hms.room.entity.RoomStatus;
import com.hms.room.entity.RoomType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomNumber(String roomNumber);

    boolean existsByRoomNumber(String roomNumber);

    List<Room> findByStatus(RoomStatus status);

    List<Room> findByType(RoomType type);

    /**
     * Row-level lock on the room. The booking service takes this before running the
     * overlap check, which serialises concurrent bookings for the same room.
     * Must be called inside a @Transactional method.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);

    /** Rooms not under maintenance with no active booking overlapping [checkIn, checkOut). */
    @Query("""
            select r from Room r
            where r.status <> com.hms.room.entity.RoomStatus.MAINTENANCE
              and not exists (
                  select 1 from Booking b
                  where b.room = r
                    and b.status in :activeStatuses
                    and b.checkInDate < :checkOut
                    and b.checkOutDate > :checkIn)
            order by r.roomNumber
            """)
    List<Room> findAvailableRooms(@Param("checkIn") LocalDate checkIn,
                                  @Param("checkOut") LocalDate checkOut,
                                  @Param("activeStatuses") Collection<BookingStatus> activeStatuses);

    @Query("""
            select r from Room r
            where r.type = :type
              and r.status <> com.hms.room.entity.RoomStatus.MAINTENANCE
              and not exists (
                  select 1 from Booking b
                  where b.room = r
                    and b.status in :activeStatuses
                    and b.checkInDate < :checkOut
                    and b.checkOutDate > :checkIn)
            order by r.roomNumber
            """)
    List<Room> findAvailableRoomsByType(@Param("type") RoomType type,
                                        @Param("checkIn") LocalDate checkIn,
                                        @Param("checkOut") LocalDate checkOut,
                                        @Param("activeStatuses") Collection<BookingStatus> activeStatuses);
}
