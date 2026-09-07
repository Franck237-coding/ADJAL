package cm.adjal.api.controller;

import cm.adjal.api.dto.request.ReviewRequests;
import cm.adjal.api.dto.response.ReviewResponses;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/products/{productId}/reviews")
    List<ReviewResponses.Review> list(@AuthenticationPrincipal AuthenticatedUser user,
                                      @PathVariable UUID productId) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        return reviewService.forProduct(productId).stream().map(ReviewResponses.Review::from).toList();
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    ReviewResponses.Review create(@AuthenticationPrincipal AuthenticatedUser user,
                                  @Valid @RequestBody ReviewRequests.Create body) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        return ReviewResponses.Review.from(reviewService.create(user.id(), body.productId(),
            body.orderId(), body.rating(), body.comment()));
    }
}