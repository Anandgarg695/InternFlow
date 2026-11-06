package com.internflow.screening;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TheoryQuestionRepository extends JpaRepository<TheoryQuestion, Long> {

    List<TheoryQuestion> findByTestIdOrderBySortOrderAsc(Long testId);

    long countByTestId(Long testId);

    void deleteByTestId(Long testId);
}
