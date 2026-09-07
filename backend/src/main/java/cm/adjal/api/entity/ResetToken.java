package cm.adjal.api.entity;

import java.time.Instant;
import java.util.UUID;

public record ResetToken(UUID id, UUID accountId, Instant expiresAt) {}