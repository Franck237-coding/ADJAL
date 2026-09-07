package cm.adjal.api.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class CatalogRequests {
    private CatalogRequests() {}
    public record CreateProduct(@NotBlank String name, @NotBlank String category, @NotBlank String city,
        @NotNull @Positive BigDecimal price, @NotBlank String unit, @NotNull @Positive BigDecimal stock,
        @NotNull LocalDate harvestDate, @PositiveOrZero Integer shelfLifeDays,
        @NotBlank @Size(max = 4000) String description,
        @Size(max = 1000) String imageUrl,
        BigDecimal latitude, BigDecimal longitude) {}
    public record UpdateProduct(String name, String category, BigDecimal price, String unit, BigDecimal stock,
        String city, LocalDate harvestDate, Integer shelfLifeDays, String description, String imageUrl,
        BigDecimal latitude, BigDecimal longitude) {}
    public record Category(@NotBlank String name, @NotBlank String slug, boolean active, @Size(max = 1000) String imageUrl) {}
    public record UpdateCategory(String name, String slug, Boolean active, @Size(max = 1000) String imageUrl) {}
    public record Moderation(@NotBlank String status) {}
}