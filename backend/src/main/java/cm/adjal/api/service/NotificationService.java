package cm.adjal.api.service;

import cm.adjal.api.repository.CahierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final CahierRepository repository;

    public NotificationService(CahierRepository repository) {
        this.repository = repository;
    }

    public List<CahierRepository.Notification> forUser(UUID accountId) {
        return repository.notifications(accountId);
    }

    public CahierRepository.Notification create(UUID accountId, String type, String title, String body,
                                                String resourceType, UUID resourceId) {
        if (!repository.notificationsEnabled(accountId)) return null;
        return repository.createNotification(accountId, type, title, body, resourceType, resourceId);
    }

    public boolean notificationsEnabled(UUID accountId) { return repository.notificationsEnabled(accountId); }
    public void setNotificationsEnabled(UUID accountId, boolean enabled) { repository.updateNotificationsEnabled(accountId, enabled); }
    public long unreadCount(UUID accountId) { return repository.unreadNotificationCount(accountId); }

    public void markRead(UUID accountId, UUID notificationId) {
        repository.markNotificationRead(accountId, notificationId);
    }
}