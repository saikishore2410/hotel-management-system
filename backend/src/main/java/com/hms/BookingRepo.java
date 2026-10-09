package com.hms;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
public interface BookingRepo extends JpaRepository<Booking,Long> {
  List<Booking> findAllByOrderByCheckInDateAsc();
  @Query("select (count(b)>0) from Booking b where b.room.id=:roomId and b.status in :statuses and b.checkInDate < :outDate and b.checkOutDate > :inDate")
  boolean existsOverlap(@Param("roomId") Long roomId,@Param("inDate") LocalDate inDate,@Param("outDate") LocalDate outDate,@Param("statuses") List<BookingStatus> statuses);
}
