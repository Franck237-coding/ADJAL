package cm.adjal.api.controller;

import cm.adjal.api.dto.request.CatalogRequests;
import cm.adjal.api.dto.request.ProfileRequests;
import cm.adjal.api.dto.response.AccountResponse;
import cm.adjal.api.dto.response.CatalogResponses;
import cm.adjal.api.dto.response.ProfileResponses;
import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.RecommendationService;
import cm.adjal.api.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class MarketplaceController {
    private final RecommendationService recommendations;
    private final CatalogService catalog;

    public MarketplaceController(RecommendationService recommendations, CatalogService catalog) {
        this.recommendations = recommendations;
        this.catalog = catalog;
    }

    @GetMapping("/healthz")
    CatalogResponses.HealthStatus health() {
        return new CatalogResponses.HealthStatus("ok");
    }

    @GetMapping("/categories")
    List<CatalogResponses.Category> categories() {
        return catalog.activeCategories().stream().map(this::categoryJson).toList();
    }

    @GetMapping("/accounts")
    List<AccountResponse> accounts(@AuthenticationPrincipal AuthenticatedUser user,
                                   @RequestParam(defaultValue = "") String search) {
        return catalog.searchAccounts(user.id(), search).stream().map(AccountResponse::from).toList();
    }

    @GetMapping("/products")
    List<CatalogResponses.Product> products(@AuthenticationPrincipal AuthenticatedUser user) {
        requireRole(user, "buyer", "farmer");
        return catalog.saleableProducts().stream().map(this::productJson).toList();
    }

    @GetMapping("/public/products")
    List<CatalogResponses.Product> publicProducts() {
        return catalog.saleableProducts().stream().map(this::productJson).toList();
    }

    @GetMapping("/products/mine")
    List<CatalogResponses.Product> myProducts(@AuthenticationPrincipal AuthenticatedUser user) {
        requireRole(user, "farmer");
        return catalog.productsForFarmer(user.id()).stream().map(this::productJson).toList();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    CatalogResponses.Product createProduct(@AuthenticationPrincipal AuthenticatedUser user,
                                           @Valid @RequestBody CatalogRequests.CreateProduct body) {
        requireRole(user, "farmer");
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("name", body.name());
        values.put("category", body.category());
        values.put("city", body.city());
        values.put("price", body.price());
        values.put("unit", body.unit());
        values.put("stock", body.stock());
        values.put("harvestDate", body.harvestDate());
        values.put("shelfLifeDays", body.shelfLifeDays());
        values.put("description", body.description());
        values.put("imageUrl", body.imageUrl());
        values.put("latitude", body.latitude());
        values.put("longitude", body.longitude());
        return productJson(catalog.createProduct(values, user.id()));
    }

    @GetMapping("/products/{id}")
    CatalogResponses.Product product(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        requireRole(user, "buyer", "farmer");
        return productJson(catalog.findProduct(id).orElseThrow(() -> new NoSuchElementException("Product not found")));
    }

    @PatchMapping("/products/{id}")
    CatalogResponses.Product updateProduct(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                                           @Valid @RequestBody CatalogRequests.UpdateProduct body) {
        requireRole(user, "farmer");
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("name", body.name());
        values.put("category", body.category());
        values.put("price", body.price());
        values.put("unit", body.unit());
        values.put("stock", body.stock());
        values.put("city", body.city());
        values.put("harvestDate", body.harvestDate());
        values.put("shelfLifeDays", body.shelfLifeDays());
        values.put("description", body.description());
        values.put("imageUrl", body.imageUrl());
        values.put("latitude", body.latitude());
        values.put("longitude", body.longitude());
        return productJson(catalog.updateProduct(user.id(), id, values));
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteProduct(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        requireRole(user, "farmer");
        catalog.deleteProduct(user.id(), id);
    }

    @GetMapping("/catalog/products")
    List<CatalogResponses.Product> searchProducts(@AuthenticationPrincipal AuthenticatedUser user,
                                                   @RequestParam(required = false) String q,
                                                   @RequestParam(required = false) String category,
                                                   @RequestParam(required = false) String city,
                                                   @RequestParam(required = false) java.math.BigDecimal minPrice,
                                                   @RequestParam(required = false) java.math.BigDecimal maxPrice) {
        requireRole(user, "buyer", "farmer");
        return catalog.searchProducts(q, category, city, minPrice, maxPrice)
            .stream().map(this::productJson).toList();
    }

    @PatchMapping("/profile")
    AccountResponse updateProfile(@AuthenticationPrincipal AuthenticatedUser user,
                                  @Valid @RequestBody ProfileRequests.UpdateProfile body) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("name", body.name());
        values.put("phone", body.phone());
        values.put("city", body.city());
        values.put("avatarUrl", body.avatarUrl());
        values.put("latitude", body.latitude());
        values.put("longitude", body.longitude());
        return AccountResponse.from(catalog.updateProfile(user.id(), values).orElseThrow());
    }

    @GetMapping("/interests")
    ProfileResponses.Interests interests(@AuthenticationPrincipal AuthenticatedUser user) {
        return new ProfileResponses.Interests(user.interests());
    }

    @PutMapping("/interests")
    ProfileResponses.Interests saveInterests(@AuthenticationPrincipal AuthenticatedUser user,
                                             @Valid @RequestBody ProfileRequests.Interests body) {
        if (body.interests() == null || body.interests().size() < 1 || body.interests().size() > 3) {
            throw new IllegalArgumentException("Interests must contain between 1 and 3 values");
        }
        return new ProfileResponses.Interests(catalog.saveInterests(user.id(), body.interests()));
    }

    @PostMapping("/interactions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void interaction(@AuthenticationPrincipal AuthenticatedUser user,
                     @Valid @RequestBody ProfileRequests.Interaction body) {
        if (body.productId() == null || body.productId().isBlank() || body.type() == null || body.type().isBlank()) {
            throw new IllegalArgumentException("productId and type are required");
        }
        if (!Set.of("view", "search", "purchase").contains(body.type())) {
            throw new IllegalArgumentException("Unsupported interaction type");
        }
        UUID productId = UUID.fromString(body.productId());
        catalog.findProduct(productId).orElseThrow(() -> new NoSuchElementException("Product not found"));
        catalog.recordInteraction(user.id(), productId, body.type());
    }

    @GetMapping("/recommendations")
    List<Map<String, Object>> recommendations(@AuthenticationPrincipal AuthenticatedUser user) {
        return recommendations.recommend(user.id());
    }

    private CatalogResponses.Category categoryJson(MarketplaceRepository.Category category) {
        return CatalogResponses.Category.from(category);
    }

    private CatalogResponses.Product productJson(MarketplaceRepository.Product product) {
        return CatalogResponses.Product.from(product);
    }

    static void requireRole(AuthenticatedUser user, String... roles) {
        if (user == null || Arrays.stream(roles).noneMatch(role -> role.equals(user.role()))) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Required role missing");
        }
    }
}