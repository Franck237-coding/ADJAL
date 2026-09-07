package cm.adjal.api.controller;

import cm.adjal.api.dto.response.NotificationResponses;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    List<NotificationResponses.Notification> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return notificationService.forUser(user.id()).stream()
            .map(NotificationResponses.Notification::from).toList();
    }

    @GetMapping("/unread-count")
    java.util.Map<String, Long> unreadCount(@AuthenticationPrincipal AuthenticatedUser user) {
        long count = notificationService.unreadCount(user.id());
        return java.util.Map.of("count", count, "unreadCount", count);
    }

    @GetMapping("/preferences")
    java.util.Map<String, Boolean> preferences(@AuthenticationPrincipal AuthenticatedUser user) {
        return java.util.Map.of("notificationsEnabled", notificationService.notificationsEnabled(user.id()));
    }

    @PatchMapping("/preferences")
    java.util.Map<String, Boolean> updatePreferences(@AuthenticationPrincipal AuthenticatedUser user,
                                                     @RequestBody java.util.Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("notificationsEnabled"));
        notificationService.setNotificationsEnabled(user.id(), enabled);
        return java.util.Map.of("notificationsEnabled", enabled);
    }

    @PutMapping("/preferences")
    java.util.Map<String, Boolean> updatePreferencesPut(@AuthenticationPrincipal AuthenticatedUser user,
                                                         @RequestBody java.util.Map<String, Boolean> body) {
        return updatePreferences(user, body);
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markRead(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        notificationService.markRead(user.id(), id);
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markReadPost(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        markRead(user, id);
    }
}