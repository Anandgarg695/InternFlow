package com.internflow.task;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InternTaskRepository extends JpaRepository<InternTask, Long> {

    List<InternTask> findByPlacementIdOrderByDueDateAscIdAsc(Long placementId);
}