package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {
    private final MarketplaceRepository repository;
    public OrderService(MarketplaceRepository repository) { this.repository = repository; }
    public List<MarketplaceRepository.Order> forUser(AuthenticatedUser user) { return repository.ordersFor(user); }
    public MarketplaceRepository.Order create(UUID buyer, UUID product, int quantity, String city) {
        return repository.createOrder(buyer, product, quantity, city);
    }
    public List<MarketplaceRepository.Order> checkout(UUID buyer, List<MarketplaceRepository.CheckoutLine> lines, String city) {
        return repository.checkout(buyer, lines, city);
    }
    public MarketplaceRepository.Order updateStatus(UUID accountId, String role, UUID orderId, String status) {
        return repository.updateOrderStatus(accountId, role, orderId, status);
    }
    public UUID ownerIdForProduct(UUID productId) {
        return repository.ownerIdForProduct(productId);
    }
}