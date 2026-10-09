package com.hms;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name="guests",uniqueConstraints=@UniqueConstraint(columnNames="email"))
public class Guest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @NotBlank @Size(max=100) @Column(nullable=false,length=100) public String name;
    @Email @NotBlank @Size(max=150) @Column(nullable=false,unique=true,length=150) public String email;
    @NotBlank @Size(max=20) @Column(nullable=false,length=20) public String phone;
    @NotBlank @Size(max=50) @Column(name="id_number",nullable=false,length=50) public String idNumber;
    public Guest() {}
}
