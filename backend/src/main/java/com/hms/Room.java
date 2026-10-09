package com.hms;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Entity
@Table(name="rooms", uniqueConstraints=@UniqueConstraint(columnNames="room_number"))
public class Room {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @NotBlank @Column(name="room_number",nullable=false,unique=true) public String roomNumber;
    @NotNull @Enumerated(EnumType.STRING) @Column(nullable=false) public RoomType type=RoomType.DOUBLE;
    @NotNull @DecimalMin("0.01") @Column(nullable=false,precision=10,scale=2) public BigDecimal pricePerNight;
    @NotNull @Enumerated(EnumType.STRING) @Column(nullable=false) public RoomStatus status=RoomStatus.AVAILABLE;
    public Room() {}
    public Room(String number,RoomType type,BigDecimal price,RoomStatus status){this.roomNumber=number;this.type=type;this.pricePerNight=price;this.status=status;}
}
