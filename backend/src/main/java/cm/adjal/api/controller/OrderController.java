package cm.adjal.api.controller;

import cm.adjal.api.dto.request.OrderRequests;
import cm.adjal.api.dto.response.OrderResponse;
import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.OrderService;
import cm.adjal.api.service.NotificationService;
import cm.adjal.api.service.OrderHistoryService;
import cm.adjal.api.dto.response.OrderHistoryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class OrderController {
    private final OrderService orderService;
    private final NotificationService notificationService;
    private final OrderHistoryService orderHistoryService;

    public OrderController(OrderService orderService, NotificationService notificationService,
                           OrderHistoryService orderHistoryService) {
        this.orderService = orderService;
        this.notificationService = notificationService;
        this.orderHistoryService = orderHistoryService;
    }

    @GetMapping("/orders")
    List<OrderResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        return orderService.forUser(user).stream().map(this::orderJson).toList();
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    OrderResponse create(@AuthenticationPrincipal AuthenticatedUser user,
                         @Valid @RequestBody OrderRequests.CreateOrder body) {
        MarketplaceController.requireRole(user, "buyer");
        String city = body.city() == null ? user.city() : body.city().trim();
        if (city.length() < 2 || city.length() > 80) throw new IllegalArgumentException("City must be a valid Cameroon city name");
        OrderResponse response = orderJson(orderService.create(user.id(), body.productId(), body.quantity(), city));
        notifyFarmerOfNewOrder(user, response);
        return response;
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    List<OrderResponse> checkout(@AuthenticationPrincipal AuthenticatedUser user,
                                 @Valid @RequestBody OrderRequests.Checkout body) {
        MarketplaceController.requireRole(user, "buyer");
        List<MarketplaceRepository.CheckoutLine> lines = new ArrayList<>();
        for (OrderRequests.CheckoutLine line : body.lines()) {
            lines.add(new MarketplaceRepository.CheckoutLine(line.productId(), line.quantity()));
        }
        String city = body.city() == null ? user.city() : body.city().trim();
        if (city.length() < 2 || city.length() > 80) throw new IllegalArgumentException("City must be a valid Cameroon city name");
        List<OrderResponse> responses = orderService.checkout(user.id(), lines, city).stream()
            .map(this::orderJson).toList();
        responses.forEach(response -> notifyFarmerOfNewOrder(user, response));
        return responses;
    }

    @PatchMapping("/orders/{id}/status")
    OrderResponse updateStatus(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                               @Valid @RequestBody OrderRequests.Status body) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        String status = body.status();
        if (!Set.of("confirmed", "delivered", "cancelled").contains(status))
            throw new IllegalArgumentException("Invalid order status");
        OrderResponse response = orderJson(orderService.updateStatus(user.id(), user.role(), id, status));
        UUID recipient = "buyer".equals(user.role())
            ? orderService.ownerIdForProduct(response.productId()) : response.buyerId();
        notificationService.create(recipient, "order_status", "Mise à jour de commande",
            "Le statut de votre commande est maintenant : " + response.status(), "order", response.id());
        return response;
    }

    @GetMapping("/orders/{id}/history")
    List<OrderHistoryResponse> history(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        return orderHistoryService.forOrder(user.id(), user.role(), id).stream()
            .map(OrderHistoryResponse::from).toList();
    }

    private void notifyFarmerOfNewOrder(AuthenticatedUser buyer, OrderResponse order) {
        UUID farmerId = orderService.ownerIdForProduct(order.productId());
        if (!farmerId.equals(buyer.id())) {
            notificationService.create(farmerId, "new_order", "Nouvelle demande d'achat",
                "Une nouvelle demande concerne votre produit " + order.productName(),
                "order", order.id());
        }
    }

    private OrderResponse orderJson(MarketplaceRepository.Order order) {
        return OrderResponse.from(order);
    }
}