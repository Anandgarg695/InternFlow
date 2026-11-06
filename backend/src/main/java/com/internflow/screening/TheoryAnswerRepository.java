package com.internflow.screening;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TheoryAnswerRepository extends JpaRepository<TheoryAnswer, Long> {

    List<TheoryAnswer> findByAttemptId(Long attemptId);

    Optional<TheoryAnswer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
}
