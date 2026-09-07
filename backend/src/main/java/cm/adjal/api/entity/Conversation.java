package cm.adjal.api.entity;

import java.time.Instant;
import java.util.UUID;

public record Conversation(UUID id, UUID otherId, String otherName, Instant createdAt, Instant updatedAt) {}