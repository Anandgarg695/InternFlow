package com.internflow.screening;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {

    Optional<TestAttempt> findByApplicationId(Long applicationId);

    List<TestAttempt> findByTestId(Long testId);

    boolean existsByTestId(Long testId);
}