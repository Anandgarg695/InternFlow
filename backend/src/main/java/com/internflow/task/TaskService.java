package com.internflow.task;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.placement.Placement;
import com.internflow.placement.PlacementRepository;
import com.internflow.task.TaskDtos.Decision;
import com.internflow.task.TaskDtos.ReviewRequest;
import com.internflow.task.TaskDtos.SubmissionRequest;
import com.internflow.task.TaskDtos.TaskRequest;
import com.internflow.task.TaskDtos.TaskResponse;

@Service
public class TaskService {

    // Dates are calendar dates in Indian time, even though the server runs in UTC
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final InternTaskRepository taskRepository;
    private final PlacementRepository placementRepository;

    public TaskService(InternTaskRepository taskRepository, PlacementRepository placementRepository) {
        this.taskRepository = taskRepository;
        this.placementRepository = placementRepository;
    }

    // ---------------------------------------------------------------- mentor side

    @Transactional(readOnly = true)
    public List<TaskResponse> listForMentor(Long mentorId, Long placementId) {
        mentorPlacement(mentorId, placementId, "Intern not found");
        return taskRepository.findByPlacementIdOrderByDueDateAscIdAsc(placementId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public TaskResponse create(Long mentorId, Long placementId, TaskRequest request) {
        Placement placement = mentorPlacement(mentorId, placementId, "Intern not found");
        requireOpen(placement);
        validateDue(placement, request.dueDate());

        InternTask task = new InternTask();
        task.setPlacementId(placementId);
        task.setStatus(InternTask.Status.ASSIGNED);
        apply(task, request);
        taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse update(Long mentorId, Long taskId, TaskRequest request) {
        InternTask task = taskById(taskId);
        Placement placement = mentorPlacement(mentorId, task.getPlacementId(), "Task not found");
        if (task.getStatus() != InternTask.Status.ASSIGNED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only tasks without a submission can be edited");
        }
        requireOpen(placement);
        validateDue(placement, request.dueDate());
        apply(task, request);
        taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public void delete(Long mentorId, Long taskId) {
        InternTask task = taskById(taskId);
        mentorPlacement(mentorId, task.getPlacementId(), "Task not found");
        if (task.getStatus() != InternTask.Status.ASSIGNED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only tasks without a submission can be deleted");
        }
        taskRepository.delete(task);
    }

    @Transactional
    public TaskResponse review(Long mentorId, Long taskId, ReviewRequest request) {
        InternTask task = taskById(taskId);
        mentorPlacement(mentorId, task.getPlacementId(), "Task not found");
        if (task.getStatus() != InternTask.Status.SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only submitted work can be reviewed");
        }

        String feedback = clean(request.feedback());
        if (request.decision() == Decision.APPROVE) {
            if (request.rating() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Give a rating from 1 to 5");
            }
            task.setStatus(InternTask.Status.REVIEWED);
            task.setRating(request.rating());
        } else {
            if (feedback == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Explain what needs to change");
            }
            task.setStatus(InternTask.Status.CHANGES_REQUESTED);
            task.setRating(null);
        }
        task.setFeedback(feedback);
        task.setReviewedAt(Instant.now());
        taskRepository.save(task);
        return toResponse(task);
    }

    // ---------------------------------------------------------------- student side

    @Transactional(readOnly = true)
    public List<TaskResponse> listForStudent(Long studentId, Long placementId) {
        placementRepository.findById(placementId)
                .filter(p -> studentId.equals(p.getStudentId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        return taskRepository.findByPlacementIdOrderByDueDateAscIdAsc(placementId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public TaskResponse submit(Long studentId, Long taskId, SubmissionRequest request) {
        InternTask task = taskById(taskId);
        Placement placement = placementRepository.findById(task.getPlacementId())
                .filter(p -> studentId.equals(p.getStudentId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));

        if (placement.getStatus() != Placement.Status.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "This internship is no longer active");
        }
        LocalDate today = today();
        if (today.isBefore(placement.getStartDate())) {
            throw new ApiException(HttpStatus.CONFLICT, "The internship has not started yet");
        }
        if (today.isAfter(placement.getEndDate())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "The internship has ended, so work can no longer be submitted");
        }
        if (task.getStatus() != InternTask.Status.ASSIGNED
                && task.getStatus() != InternTask.Status.CHANGES_REQUESTED) {
            throw new ApiException(HttpStatus.CONFLICT, "This task cannot be submitted now");
        }

        task.setSubmissionText(request.text().trim());
        task.setSubmissionLink(clean(request.link()));
        task.setSubmittedAt(Instant.now());
        task.setStatus(InternTask.Status.SUBMITTED);
        // A resubmission starts a fresh review
        task.setRating(null);
        task.setFeedback(null);
        task.setReviewedAt(null);
        taskRepository.save(task);
        return toResponse(task);
    }

    // ---------------------------------------------------------------- helpers

    private InternTask taskById(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    // Only the mentor currently assigned to the intern can use the placement.
    // Anyone else gets the same answer as for a missing one.
    private Placement mentorPlacement(Long mentorId, Long placementId, String notFoundMessage) {
        return placementRepository.findById(placementId)
                .filter(p -> mentorId.equals(p.getMentorId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, notFoundMessage));
    }

    private void requireOpen(Placement placement) {
        if (placement.getStatus() != Placement.Status.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "This internship is no longer active");
        }
        if (today().isAfter(placement.getEndDate())) {
            throw new ApiException(HttpStatus.CONFLICT, "The internship has ended, so tasks can no longer be added");
        }
    }

    private void validateDue(Placement placement, LocalDate due) {
        LocalDate today = today();
        LocalDate earliest = today.isAfter(placement.getStartDate()) ? today : placement.getStartDate();
        if (due.isBefore(earliest) || due.isAfter(placement.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "The due date must be between " + earliest + " and " + placement.getEndDate());
        }
    }

    private void apply(InternTask task, TaskRequest request) {
        task.setTitle(request.title().trim());
        task.setDescription(request.description().trim());
        task.setDueDate(request.dueDate());
    }

    private LocalDate today() {
        return LocalDate.now(ZONE);
    }

    private TaskResponse toResponse(InternTask t) {
        boolean late = t.getSubmittedAt() != null
                && t.getSubmittedAt().atZone(ZONE).toLocalDate().isAfter(t.getDueDate());
        return new TaskResponse(t.getId(), t.getPlacementId(), t.getTitle(), t.getDescription(), t.getDueDate(),
                t.getStatus(), t.getSubmissionText(), t.getSubmissionLink(), t.getSubmittedAt(), late,
                t.getRating(), t.getFeedback(), t.getReviewedAt());
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}