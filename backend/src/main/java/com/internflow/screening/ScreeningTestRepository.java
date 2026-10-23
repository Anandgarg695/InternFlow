package com.internflow.screening;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ScreeningTestRepository extends JpaRepository<ScreeningTest, Long> {

    Optional<ScreeningTest> findByInternshipIdAndRoundNumber(Long internshipId, int roundNumber);

    List<ScreeningTest> findByInternshipIdOrderByRoundNumberAsc(Long internshipId);
}