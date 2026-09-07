package cm.adjal.api.entity;

import java.time.Instant;
import java.util.UUID;

public record Session(String tokenHash, UUID accountId, Instant expiresAt) {}