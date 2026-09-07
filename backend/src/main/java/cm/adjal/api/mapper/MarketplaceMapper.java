package cm.adjal.api.mapper;

import cm.adjal.api.dto.response.*;
import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.entity.*;

/** Single mapping boundary between JDBC projections and HTTP response models. */
public final class MarketplaceMapper {
    private MarketplaceMapper() {}
    public static AccountResponse account(AuthenticatedUser a) { return AccountResponse.from(a); }
    public static CatalogResponses.Product product(MarketplaceRepository.Product p) {
        return CatalogResponses.Product.from(p);
    }
    public static CatalogResponses.Category category(MarketplaceRepository.Category c) {
        return CatalogResponses.Category.from(c);
    }
    public static OrderResponse order(MarketplaceRepository.Order o) { return OrderResponse.from(o); }
    public static MessageResponses.Message message(MarketplaceRepository.Message m) {
        return MessageResponses.Message.from(m);
    }
    /** Converts repository JDBC projections into domain entities before response mapping. */
    public static Account accountEntity(AuthenticatedUser a) {
        return new Account(a.id(), a.name(), a.email(), a.phone(), a.role(), a.city(), a.country(),
            a.status(), a.avatarUrl(), a.interests(), a.createdAt(), a.latitude(), a.longitude());
    }
    public static Product productEntity(MarketplaceRepository.Product p) {
        return new Product(p.id(), p.name(), p.category(), p.city(), p.price(), p.unit(), p.stock(),
            p.status(), p.harvestDate(), p.shelfLifeDays(), p.ownerId(), p.ownerName(),
            p.description(), p.imageUrl(), p.latitude(), p.longitude());
    }
    public static Order orderEntity(MarketplaceRepository.Order o) {
        return new Order(o.id(), o.productId(), o.productName(), o.buyerId(), o.quantity(), o.unitPrice(),
            o.status(), o.city(), o.createdAt(), o.sellerName(), o.sellerCity(), o.sellerPhone(),
            o.sellerLatitude(), o.sellerLongitude(), o.buyerName(), o.buyerCity(), o.buyerPhone());
    }
}