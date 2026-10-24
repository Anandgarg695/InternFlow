package com.internflow.interview;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByApplicationIdInOrderByScheduledAtDesc(Collection<Long> applicationIds);

    List<Interview> findByStudentIdOrderByScheduledAtAsc(Long studentId);

    List<Interview> findByStudentIdAndStatusIn(Long studentId, Collection<Interview.Status> statuses);

    boolean existsByApplicationIdAndStatusIn(Long applicationId, Collection<Interview.Status> statuses);

    Optional<Interview> findByIdAndStudentId(Long id, Long studentId);
}
