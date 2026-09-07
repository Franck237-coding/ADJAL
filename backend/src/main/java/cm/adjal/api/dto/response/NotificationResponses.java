package cm.adjal.api.dto.response;

import cm.adjal.api.repository.CahierRepository;
import java.time.Instant;
import java.util.UUID;

public final class NotificationResponses {
    private NotificationResponses() {}

    public record Notification(UUID id, UUID accountId, String type, String title, String body,
                               String resourceType, UUID resourceId, Instant readAt, Instant createdAt) {
        public static Notification from(CahierRepository.Notification notification) {
            return new Notification(notification.id(), notification.accountId(), notification.type(),
                notification.title(), notification.body(), notification.resourceType(),
                notification.resourceId(), notification.readAt(), notification.createdAt());
        }
    }
}