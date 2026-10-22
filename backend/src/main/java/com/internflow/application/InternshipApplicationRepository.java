package com.internflow.application;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InternshipApplicationRepository extends JpaRepository<InternshipApplication, Long> {

    List<InternshipApplication> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<InternshipApplication> findByInternshipIdOrderByCreatedAtDesc(Long internshipId);

    Optional<InternshipApplication> findByIdAndStudentId(Long id, Long studentId);

    boolean existsByInternshipIdAndStudentId(Long internshipId, Long studentId);
}