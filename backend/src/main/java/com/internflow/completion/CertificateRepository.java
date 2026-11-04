package com.internflow.completion;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateRepository extends JpaRepository<IssuedCertificate, Long> {

    Optional<IssuedCertificate> findByPlacementId(Long placementId);

    Optional<IssuedCertificate> findByCode(String code);

    boolean existsByCode(String code);
}