package cm.adjal.api.controller;

import cm.adjal.api.dto.request.MarketRequests;
import cm.adjal.api.dto.response.MarketResponses;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.MarketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/market")
public class MarketController {
    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping("/prices")
    List<MarketResponses.Price> prices(@AuthenticationPrincipal AuthenticatedUser user,
                                       @RequestParam(required = false) String productName,
                                       @RequestParam(required = false) String city) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        return marketService.prices(productName, city).stream().map(MarketResponses.Price::from).toList();
    }

    @GetMapping("/alerts")
    List<MarketResponses.Alert> alerts(@AuthenticationPrincipal AuthenticatedUser user) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        return marketService.alerts(user.id()).stream().map(MarketResponses.Alert::from).toList();
    }

    @PostMapping("/prices")
    @ResponseStatus(HttpStatus.CREATED)
    MarketResponses.Price addPrice(@AuthenticationPrincipal AuthenticatedUser user,
                                   @Valid @RequestBody MarketRequests.Price body) {
        MarketplaceController.requireRole(user, "admin");
        return MarketResponses.Price.from(marketService.addPrice(user.id(), body.productName(),
            body.category(), body.city(), body.region(), body.unit(), body.price()));
    }
}