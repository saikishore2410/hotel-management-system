package com.hms;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name="bookings", indexes=@Index(columnList="room_id,check_in_date,check_out_date"))
public class Booking {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="guest_id",nullable=false) public Guest guest;
    @ManyToOne(optional=false,fetch=FetchType.EAGER) @JoinColumn(name="room_id",nullable=false) public Room room;
    @Column(name="check_in_date",nullable=false) public LocalDate checkInDate;
    @Column(name="check_out_date",nullable=false) public LocalDate checkOutDate;
    @Column(name="total_amount",nullable=false,precision=10,scale=2) public BigDecimal totalAmount;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public BookingStatus status=BookingStatus.PENDING;
    @Column(nullable=false,updatable=false) public Instant createdAt=Instant.now();
    @Column(nullable=false) public Instant updatedAt=Instant.now();
    @PreUpdate public void touch(){updatedAt=Instant.now();}
    public Booking() {}
}
