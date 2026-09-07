package cm.adjal.api.entity;

import java.time.Instant;
import java.util.UUID;

public record Message(UUID id, UUID conversationId, UUID senderId, String senderName, String body,
                      Instant createdAt, Instant readAt) {}