package cm.adjal.api.dto.response;

import cm.adjal.api.repository.MarketplaceRepository;
import java.time.Instant;
import java.util.UUID;

public final class CatalogResponses {
    private CatalogResponses() {}
    public record HealthStatus(String status) {}
    public record Category(UUID id, String name, String slug, String imageUrl, boolean active, Instant createdAt, Instant updatedAt) {
        public static Category from(MarketplaceRepository.Category c) {
            return new Category(c.id(), c.name(), c.slug(), c.imageUrl(), c.active(), c.createdAt(), c.updatedAt());
        }
    }
    public record Product(UUID id, String name, String category, String city, java.math.BigDecimal price,
                          String unit, java.math.BigDecimal stock, String status, java.time.LocalDate harvestDate,
                           Integer shelfLifeDays, String ownerName, String description, String imageUrl,
                           java.math.BigDecimal latitude, java.math.BigDecimal longitude, String ownerAvatarUrl) {
        public static Product from(MarketplaceRepository.Product p) {
            return new Product(p.id(), p.name(), p.category(), p.city(), p.price(), p.unit(), p.stock(),
                p.status(), p.harvestDate(), p.shelfLifeDays(), p.ownerName(), p.description(), p.imageUrl(),
                p.latitude(), p.longitude(), p.ownerAvatarUrl());
        }
    }
}