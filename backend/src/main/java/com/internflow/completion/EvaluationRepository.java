package com.internflow.completion;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationRepository extends JpaRepository<InternEvaluation, Long> {

    Optional<InternEvaluation> findByPlacementId(Long placementId);
}