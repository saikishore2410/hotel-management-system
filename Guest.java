package com.hms.guest.entity;

import com.hms.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "guests", uniqueConstraints = {
        @UniqueConstraint(name = "uk_guests_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_guests_id_number", columnNames = "id_number")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Guest extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    /** Identity proof number (sensitive: never log, expose minimally in responses). */
    @Column(name = "id_number", nullable = false, length = 50)
    private String idNumber;
}
