package cm.adjal.api.controller;

import cm.adjal.api.dto.request.AdminRequests;
import cm.adjal.api.dto.request.CatalogRequests;
import cm.adjal.api.dto.response.AccountResponse;
import cm.adjal.api.dto.response.AdminResponses;
import cm.adjal.api.dto.response.CatalogResponses;
import cm.adjal.api.dto.response.PaymentResponses;
import cm.adjal.api.dto.response.OrderResponse;
import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.AdminService;
import cm.adjal.api.service.NotificationService;
import cm.adjal.api.service.PaymentService;
import cm.adjal.api.service.ReviewService;
import cm.adjal.api.dto.response.ReviewResponses;
import cm.adjal.api.dto.request.ReportRequests;
import cm.adjal.api.dto.response.ReportResponses;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final ReviewService reviewService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    public AdminController(AdminService adminService, ReviewService reviewService, PaymentService paymentService,
                           NotificationService notificationService) {
        this.adminService = adminService;
        this.reviewService = reviewService;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }

    @GetMapping("/summary")
    AdminResponses.Summary summary(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        var summary = adminService.summary();
        return new AdminResponses.Summary(summary.userCount(), summary.productCount(),
            summary.transactionCount(), summary.pendingProductCount(), summary.pendingReportCount());
    }

    @GetMapping("/users")
    List<AccountResponse> users(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return adminService.users().stream().map(AccountResponse::from).toList();
    }

    @PatchMapping("/users/{id}/status")
    AccountResponse updateUser(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                               @Valid @RequestBody AdminRequests.AccountStatus body) {
        requireAdmin(user);
        String status = body.status();
        if (!Set.of("active", "suspended").contains(status)) throw new IllegalArgumentException("Invalid account status");
        return AccountResponse.from(adminService.updateUserStatus(id, status));
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteUser(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        requireAdmin(user);
        if (user.id().equals(id)) throw new IllegalStateException("Administrator cannot delete the current account");
        adminService.deleteUser(id);
    }

    @PatchMapping("/users/{id}/role")
    AccountResponse updateUserRole(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                                   @Valid @RequestBody AdminRequests.RoleUpdate body) {
        requireAdmin(user);
        if (user.id().equals(id) && !"admin".equals(body.role())) {
            throw new IllegalStateException("Administrator cannot remove its own role");
        }
        return AccountResponse.from(adminService.updateUserRole(id, body.role()));
    }

    @GetMapping("/products")
    List<CatalogResponses.Product> products(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return adminService.products().stream().map(this::productJson).toList();
    }

    @GetMapping("/orders")
    List<OrderResponse> orders(@AuthenticationPrincipal AuthenticatedUser user,
                               @RequestParam(defaultValue = "all") String status) {
        requireAdmin(user);
        return adminService.orders(status).stream().map(OrderResponse::from).toList();
    }

    @PatchMapping("/orders/{id}/status")
    OrderResponse updateOrderStatus(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                                    @Valid @RequestBody AdminRequests.OrderStatus body) {
        requireAdmin(user);
        OrderResponse order = OrderResponse.from(adminService.updateOrderStatus(user.id(), id, body.status()));
        String text = "La commande « " + order.productName() + " » est maintenant : " + OrderController.statusLabel(order.status());
        notificationService.create(order.buyerId(), "order_status", "Mise à jour de commande", text, "order", order.id());
        if (order.sellerId() != null) {
            notificationService.create(order.sellerId(), "order_status", "Mise à jour de commande", text, "order", order.id());
        }
        return order;
    }

    @GetMapping("/reports")
    List<ReportResponses.Report> reports(@AuthenticationPrincipal AuthenticatedUser user, @RequestParam(defaultValue = "pending") String status) {
        requireAdmin(user);
        return adminService.reports(status).stream().map(ReportResponses.Report::from).toList();
    }

    @PatchMapping("/reports/{id}")
    ReportResponses.Report moderateReport(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                                          @Valid @RequestBody ReportRequests.Moderate body) {
        requireAdmin(user);
        return ReportResponses.Report.from(adminService.moderateReport(id, user.id(), body.action(), body.resolution()));
    }

    @PatchMapping("/products/{id}/moderation")
    CatalogResponses.Product moderate(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                                      @Valid @RequestBody AdminRequests.ProductModeration body) {
        requireAdmin(user);
        String status = body.status();
        if (!Set.of("published", "removed").contains(status)) throw new IllegalArgumentException("Invalid product moderation status");
        MarketplaceRepository.Product product = adminService.moderateProduct(id, status);
        if (product.ownerId() != null) {
            boolean published = "published".equals(status);
            notificationService.create(product.ownerId(), "product_status",
                published ? "Produit publié" : "Produit retiré",
                published
                    ? "Votre produit « " + product.name() + " » est maintenant visible par les acheteurs."
                    : "Votre produit « " + product.name() + " » a été retiré du marché par l'administrateur.",
                "product", product.id());
        }
        return productJson(product);
    }

    @GetMapping("/categories")
    List<CatalogResponses.Category> categories(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return adminService.categories().stream().map(this::categoryJson).toList();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    CatalogResponses.Category createCategory(@AuthenticationPrincipal AuthenticatedUser user,
                                             @Valid @RequestBody CatalogRequests.Category body) {
        requireAdmin(user);
        return categoryJson(adminService.createCategory(body.name(), body.slug(), body.active(), body.imageUrl()));
    }

    @PatchMapping("/categories/{id}")
    CatalogResponses.Category updateCategory(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                                             @Valid @RequestBody CatalogRequests.UpdateCategory body) {
        requireAdmin(user);
        Map<String, Object> values = new LinkedHashMap<>();
        if (body.name() != null) values.put("name", body.name());
        if (body.slug() != null) values.put("slug", body.slug());
        if (body.active() != null) values.put("active", body.active());
        if (body.imageUrl() != null) values.put("imageUrl", body.imageUrl());
        return categoryJson(adminService.updateCategory(id, values));
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteCategory(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        requireAdmin(user);
        adminService.deleteCategory(id);
    }

    @GetMapping("/reviews")
    List<ReviewResponses.Review> reviews(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return reviewService.all().stream().map(ReviewResponses.Review::from).toList();
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteReview(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        requireAdmin(user);
        reviewService.remove(id);
    }

    @GetMapping("/payments")
    List<PaymentResponses.Payment> payments(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return paymentService.forUser(user.id(), user.role()).stream()
            .map(PaymentResponses.Payment::from).toList();
    }

    @PatchMapping("/payments/{id}/status")
    PaymentResponses.Payment updatePaymentStatus(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @PathVariable UUID id,
                                                  @Valid @RequestBody AdminRequests.PaymentStatus body) {
        requireAdmin(user);
        return PaymentResponses.Payment.from(paymentService.updateStatus(id, body.status()));
    }

    private void requireAdmin(AuthenticatedUser user) {
        if (user == null || !"admin".equals(user.role()))
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator role required");
    }

    private CatalogResponses.Product productJson(MarketplaceRepository.Product product) {
        return CatalogResponses.Product.from(product);
    }

    private CatalogResponses.Category categoryJson(MarketplaceRepository.Category category) {
        return CatalogResponses.Category.from(category);
    }
}