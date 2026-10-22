package com.internflow.screening;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

    List<TestQuestion> findByTestIdOrderBySortOrderAsc(Long testId);

    long countByTestId(Long testId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from TestQuestion q where q.testId = :testId")
    void deleteByTestId(@Param("testId") Long testId);
}