package cm.adjal.api.entity;

import java.time.Instant;
import java.util.UUID;

public record Category(UUID id, String name, String slug, String imageUrl, boolean active, Instant createdAt, Instant updatedAt) {}