package com.internflow.placement;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorLinkRepository extends JpaRepository<MentorLink, Long> {

    Optional<MentorLink> findByCompanyIdAndMentorId(Long companyId, Long mentorId);

    Optional<MentorLink> findByIdAndCompanyId(Long id, Long companyId);

    Optional<MentorLink> findByIdAndMentorId(Long id, Long mentorId);

    List<MentorLink> findByCompanyIdAndStatusInOrderByCreatedAtDesc(Long companyId,
            Collection<MentorLink.Status> statuses);

    List<MentorLink> findByMentorIdAndStatusOrderByCreatedAtDesc(Long mentorId, MentorLink.Status status);
}