package com.internflow.user;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole_Name(String roleName);

    long countByRole_NameAndEnabledTrue(String roleName);

    @Query("select u from User u where (:role = '' or u.role.name = :role) "
            + "and (:pending = false or (u.role.name = 'COMPANY' and u.approved = false)) "
            + "and (:q = '' or lower(u.email) like :pattern or lower(u.fullName) like :pattern)")
    Page<User> search(@Param("role") String role, @Param("pending") boolean pending,
            @Param("q") String q, @Param("pattern") String pattern, Pageable pageable);
}