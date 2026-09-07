package cm.adjal.api.dto.response;

import cm.adjal.api.repository.CahierRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class MarketResponses {
    private MarketResponses() {}

    public record Price(UUID id, String productName, String category, String city, String region,
                        String unit, BigDecimal price, Instant recordedAt) {
        public static Price from(CahierRepository.MarketPrice price) {
            return new Price(price.id(), price.productName(), price.category(), price.city(),
                price.region(), price.unit(), price.price(), price.recordedAt());
        }
    }

    public record Alert(UUID id, UUID accountId, String productName, String city, String title,
                        String message, BigDecimal variationPercent, boolean active, Instant createdAt) {
        public static Alert from(CahierRepository.MarketAlert alert) {
            return new Alert(alert.id(), alert.accountId(), alert.productName(), alert.city(),
                alert.title(), alert.message(), alert.variationPercent(), alert.active(), alert.createdAt());
        }
    }
}