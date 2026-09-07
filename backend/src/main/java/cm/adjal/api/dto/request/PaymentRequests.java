package cm.adjal.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class PaymentRequests {
    private PaymentRequests() {}

    public record Create(@NotNull UUID orderId, @NotBlank @Size(max = 40) String method) {}
    public record Status(@NotBlank String status) {}
}