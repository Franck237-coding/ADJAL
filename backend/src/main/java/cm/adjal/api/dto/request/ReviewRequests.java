package cm.adjal.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class ReviewRequests {
    private ReviewRequests() {}

    public record Create(@NotNull UUID productId, @NotNull UUID orderId,
                         @Min(1) @Max(5) int rating,
                         @Size(max = 2000) String comment) {}
}