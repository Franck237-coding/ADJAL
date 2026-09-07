package cm.adjal.api.dto.response;

import cm.adjal.api.repository.CahierRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class PaymentResponses {
    private PaymentResponses() {}

    public record Payment(UUID id, UUID orderId, UUID payerId, BigDecimal amount,
                          String currency, String method, String providerReference,
                          String status, Instant createdAt, Instant updatedAt, Instant paidAt) {
        public static Payment from(CahierRepository.Payment payment) {
            return new Payment(payment.id(), payment.orderId(), payment.payerId(), payment.amount(),
                payment.currency(), payment.method(), payment.providerReference(), payment.status(),
                payment.createdAt(), payment.updatedAt(), payment.paidAt());
        }
    }
}