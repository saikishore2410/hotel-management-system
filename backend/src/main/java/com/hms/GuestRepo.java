package com.hms;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface GuestRepo extends JpaRepository<Guest,Long> { boolean existsByEmailIgnoreCase(String email); List<Guest> findByEmailContainingIgnoreCase(String email); }
