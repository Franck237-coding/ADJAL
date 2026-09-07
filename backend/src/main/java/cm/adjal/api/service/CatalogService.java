package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import cm.adjal.api.security.AuthenticatedUser;

@Service
public class CatalogService {
    private final MarketplaceRepository repository;
    public CatalogService(MarketplaceRepository repository) { this.repository = repository; }
    public List<MarketplaceRepository.Category> activeCategories() { return repository.activeCategories(); }
    public List<MarketplaceRepository.Product> saleableProducts() { return repository.saleableProducts(); }
    public List<MarketplaceRepository.Product> productsForFarmer(UUID id) { return repository.productsForFarmer(id); }
    public List<MarketplaceRepository.Product> searchProducts(String q, String category, String city,
                                                               java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        return repository.searchProducts(q, category, city, minPrice, maxPrice);
    }
    public MarketplaceRepository.Product createProduct(Map<String, Object> body, UUID owner) {
        return repository.insertProduct(body, owner);
    }
    public MarketplaceRepository.Product updateProduct(UUID owner, UUID productId, Map<String, Object> body) {
        return repository.updateProduct(owner, productId, body);
    }
    public void deleteProduct(UUID owner, UUID productId) {
        repository.deleteProduct(owner, productId);
    }
    public List<AuthenticatedUser> searchAccounts(UUID excludeId, String search) {
        return repository.searchAccounts(excludeId, search);
    }
    public Optional<AuthenticatedUser> updateProfile(UUID id, Map<String, Object> body) {
        return repository.updateProfile(id, body);
    }
    public List<String> saveInterests(UUID id, List<String> interests) {
        return repository.saveInterests(id, interests);
    }
    public Optional<MarketplaceRepository.Product> findProduct(UUID id) {
        return repository.findProduct(id);
    }
    public void recordInteraction(UUID accountId, UUID productId, String type) {
        repository.recordInteraction(accountId, productId, type);
    }
}