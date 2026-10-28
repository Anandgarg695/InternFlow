package com.internflow.offer;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findByInternshipIdOrderByCreatedAtDesc(Long internshipId);

    List<Offer> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<Offer> findByStatusAndExpiresOnBefore(Offer.Status status, LocalDate date);

    long countByInternshipIdAndStatusIn(Long internshipId, Collection<Offer.Status> statuses);

    Optional<Offer> findByIdAndStudentId(Long id, Long studentId);
}