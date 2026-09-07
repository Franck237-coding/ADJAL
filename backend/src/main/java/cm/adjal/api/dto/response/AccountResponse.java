package cm.adjal.api.dto.response;

import cm.adjal.api.security.AuthenticatedUser;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AccountResponse(UUID id, String name, String email, String phone, String role, String city,
                              String country, String status, String avatarUrl, List<String> interests,
                               Instant createdAt, BigDecimal latitude, BigDecimal longitude) {
    public static AccountResponse from(AuthenticatedUser a) {
        return new AccountResponse(a.id(), a.name(), a.email(), a.phone(), a.role(), a.city(), a.country(),
                a.status(), a.avatarUrl(), a.interests(), a.createdAt(), a.latitude(), a.longitude());
    }
}