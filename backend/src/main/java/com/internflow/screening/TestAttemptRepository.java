package com.internflow.screening;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {

    Optional<TestAttempt> findByApplicationIdAndTestId(Long applicationId, Long testId);

    List<TestAttempt> findByTestIdIn(Collection<Long> testIds);

    boolean existsByTestId(Long testId);
}