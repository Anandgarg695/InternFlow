package com.internflow.screening;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ScreeningTestRepository extends JpaRepository<ScreeningTest, Long> {

    Optional<ScreeningTest> findByInternshipId(Long internshipId);
}