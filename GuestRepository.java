package com.hms.guest.repository;

import com.hms.guest.entity.Guest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {

    Optional<Guest> findByEmailIgnoreCase(String email);

    Optional<Guest> findByIdNumber(String idNumber);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByIdNumber(String idNumber);

    /** Reception desk search: partial name, email or phone match. */
    @Query("""
            select g from Guest g
            where lower(g.name) like lower(concat('%', :q, '%'))
               or lower(g.email) like lower(concat('%', :q, '%'))
               or g.phone like concat('%', :q, '%')
            """)
    Page<Guest> search(@Param("q") String query, Pageable pageable);
}
