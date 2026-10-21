package com.internflow.internship;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InternshipRepository
        extends JpaRepository<Internship, Long>, JpaSpecificationExecutor<Internship> {

    List<Internship> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    Optional<Internship> findByIdAndCompanyId(Long id, Long companyId);
}