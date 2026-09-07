package cm.adjal.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public final class AdminRequests {
    private AdminRequests() {}
    public record AccountStatus(@NotBlank String status) {}
    public record ProductModeration(@NotBlank String status) {}
    public record PaymentStatus(@NotBlank String status) {}
    public record RoleUpdate(@NotBlank String role) {}
    public record OrderStatus(@NotBlank String status) {}
}