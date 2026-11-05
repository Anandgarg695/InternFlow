package com.internflow.notification;

import java.time.Instant;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.common.PageResponse;
import com.internflow.notification.NotificationDtos.NotificationResponse;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    // Called by other services. It joins the caller's transaction, so a failed action leaves no notification.
    @Transactional
    public void send(Long userId, String title, String message, String link) {
        if (userId == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(cut(title, 150));
        notification.setMessage(cut(message, 500));
        // Only internal paths are stored, never a full web address
        notification.setLink(link != null && link.startsWith("/") && !link.startsWith("//") ? cut(link, 200) : null);
        repository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(Long userId, int page, int size) {
        return PageResponse.of(repository
                .findByUserIdOrderByCreatedAtDescIdDesc(userId,
                        PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)))
                .map(n -> new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.getLink(),
                        n.getReadAt() != null, n.getCreatedAt())));
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markRead(Long userId, Long id) {
        // Someone else's notification looks exactly like a missing one
        Notification notification = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            repository.save(notification);
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        repository.markAllRead(userId, Instant.now());
    }

    private String cut(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}