package cm.adjal.api.dto.response;

import cm.adjal.api.repository.CahierRepository;
import java.time.Instant;
import java.util.UUID;

public record OrderHistoryResponse(UUID id, UUID orderId, String status, UUID changedBy, Instant createdAt) {
    public static OrderHistoryResponse from(CahierRepository.OrderStatus status) {
        return new OrderHistoryResponse(status.id(), status.orderId(), status.status(),
            status.changedBy(), status.createdAt());
    }
}