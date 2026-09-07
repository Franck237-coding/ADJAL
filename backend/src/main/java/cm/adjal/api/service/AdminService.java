package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminService {
    private final MarketplaceRepository repository;

    public AdminService(MarketplaceRepository repository) {
        this.repository = repository;
    }

    public MarketplaceRepository.AdminSummary summary() {
        return repository.adminSummary();
    }

    public List<AuthenticatedUser> users() {
        return repository.allAccounts();
    }

    public AuthenticatedUser updateUserStatus(UUID id, String status) {
        return repository.updateAccountStatus(id, status);
    }

    public void deleteUser(UUID id) {
        AuthenticatedUser target = repository.findById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("User not found"));
        if ("admin".equals(target.role())) {
            throw new IllegalStateException("Administrator accounts cannot be deleted here");
        }
        repository.deleteAccount(id);
    }

    public AuthenticatedUser updateUserRole(UUID id, String role) {
        return repository.updateAccountRole(id, role);
    }

    public List<MarketplaceRepository.Product> products() {
        return repository.allProducts();
    }

    public List<MarketplaceRepository.Order> orders(String status) {
        return repository.allOrders(status);
    }

    public MarketplaceRepository.Order updateOrderStatus(UUID adminId, UUID orderId, String status) {
        return repository.updateOrderStatusAsAdmin(adminId, orderId, status);
    }

    public MarketplaceRepository.Product moderateProduct(UUID id, String status) {
        return repository.moderateProduct(id, status);
    }

    public List<MarketplaceRepository.Category> categories() {
        return repository.allCategories();
    }

    public MarketplaceRepository.Category createCategory(String name, String slug, boolean active, String imageUrl) {
        return repository.insertCategory(name, slug, active, imageUrl);
    }

    public MarketplaceRepository.Category updateCategory(UUID id, Map<String, Object> body) {
        return repository.updateCategory(id, body);
    }

    public void deleteCategory(UUID id) {
        repository.deleteCategory(id);
    }

    public List<MarketplaceRepository.Report> reports(String status) { return repository.reportsByStatus(status); }
    public MarketplaceRepository.Report moderateReport(UUID id, UUID moderatorId, String action, String resolution) {
        if (!Set.of("dismiss", "warn", "ban").contains(action)) throw new IllegalArgumentException("Invalid moderation action");
        MarketplaceRepository.Report current = repository.findReport(id).orElseThrow(() -> new java.util.NoSuchElementException("Report not found"));
        String status = action.equals("dismiss") ? "dismissed" : action.equals("warn") ? "warned" : "banned";
        MarketplaceRepository.Report updated = repository.moderateReport(id, moderatorId, status, resolution.trim());
        if (action.equals("ban")) repository.updateAccountStatus(current.farmerId(), "suspended");
        return updated;
    }
}