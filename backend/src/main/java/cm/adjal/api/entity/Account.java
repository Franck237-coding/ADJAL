package cm.adjal.api.entity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

/** Immutable domain account; persistence credentials remain repository-only. */
public record Account(UUID id, String name, String email, String phone, String role, String city,
                      String country, String status, String avatarUrl, List<String> interests,
                       Instant createdAt, BigDecimal latitude, BigDecimal longitude) {}