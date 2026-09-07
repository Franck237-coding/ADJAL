package cm.adjal.api.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public final class OrderRequests {
    private OrderRequests() {}
    public record CreateOrder(@NotNull UUID productId, @Positive int quantity,
                               @Size(min = 2, max = 80) String city) {}
    public record CheckoutLine(@NotNull UUID productId, @Positive int quantity) {}
    public record Checkout(@NotEmpty List<@NotNull CheckoutLine> lines,
                           @Size(min = 2, max = 80) String city) {}
    public record Status(@NotBlank String status) {}
}