package cm.adjal.api.dto.response;

import cm.adjal.api.repository.MarketplaceRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderResponse(UUID id, UUID productId, String productName, UUID buyerId, UUID sellerId, int quantity,
                            BigDecimal unitPrice, String status, String city, Instant createdAt,
                            String sellerName, String sellerCity, String sellerPhone,
                            BigDecimal sellerLatitude, BigDecimal sellerLongitude,
                            String buyerName, String buyerCity, String buyerPhone,
                            String productImageUrl, String productCategory, String productUnit,
                            String sellerAvatarUrl, String buyerAvatarUrl) {
    public static OrderResponse from(MarketplaceRepository.Order o) {
        return new OrderResponse(o.id(), o.productId(), o.productName(), o.buyerId(), o.sellerId(), o.quantity(),
            o.unitPrice(), o.status(), o.city(), o.createdAt(), o.sellerName(), o.sellerCity(), o.sellerPhone(),
            o.sellerLatitude(), o.sellerLongitude(), o.buyerName(), o.buyerCity(), o.buyerPhone(),
            o.productImageUrl(), o.productCategory(), o.productUnit(), o.sellerAvatarUrl(), o.buyerAvatarUrl());
    }
}