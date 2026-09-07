package cm.adjal.api.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Order(UUID id, UUID productId, String productName, UUID buyerId, int quantity,
                    BigDecimal unitPrice, String status, String city, Instant createdAt,
                    String sellerName, String sellerCity, String sellerPhone,
                    BigDecimal sellerLatitude, BigDecimal sellerLongitude,
                    String buyerName, String buyerCity, String buyerPhone) {}