package cm.adjal.api.controller;

import cm.adjal.api.dto.request.PaymentRequests;
import cm.adjal.api.dto.response.PaymentResponses;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    List<PaymentResponses.Payment> list(@AuthenticationPrincipal AuthenticatedUser user) {
        MarketplaceController.requireRole(user, "buyer", "farmer");
        return paymentService.forUser(user.id(), user.role()).stream()
            .map(PaymentResponses.Payment::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    PaymentResponses.Payment create(@AuthenticationPrincipal AuthenticatedUser user,
                                    @Valid @RequestBody PaymentRequests.Create body) {
        MarketplaceController.requireRole(user, "buyer");
        return PaymentResponses.Payment.from(paymentService.create(user.id(), body.orderId(), body.method()));
    }
}