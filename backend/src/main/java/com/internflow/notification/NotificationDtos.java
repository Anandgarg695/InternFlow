package com.internflow.notification;

import java.time.Instant;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record NotificationResponse(Long id, String title, String message, String link, boolean read,
            Instant createdAt) {
    }

    public record UnreadResponse(long unread) {
    }
}