package com.internflow.placement;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlacementRepository extends JpaRepository<Placement, Long> {

    boolean existsByApplicationId(Long applicationId);

    List<Placement> findByInternshipIdOrderByStartDateAsc(Long internshipId);

    List<Placement> findByStudentIdOrderByStartDateDesc(Long studentId);

    List<Placement> findByMentorIdOrderByStartDateAsc(Long mentorId);

    @Query("select count(p) from Placement p where p.mentorId = :mentorId and p.status = :status "
            + "and p.internshipId in (select i.id from Internship i where i.companyId = :companyId)")
    long countForMentorAndCompany(@Param("mentorId") Long mentorId, @Param("companyId") Long companyId,
            @Param("status") Placement.Status status);
}