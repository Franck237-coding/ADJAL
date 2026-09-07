package cm.adjal.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class MarketRequests {
    private MarketRequests() {}

    public record Price(@NotBlank @Size(max = 180) String productName,
                         @Size(max = 120) String category,
                         @NotBlank @Size(max = 120) String city,
                         @Size(max = 120) String region,
                         @NotBlank @Size(max = 40) String unit,
                         @NotNull @Positive BigDecimal price) {}
}