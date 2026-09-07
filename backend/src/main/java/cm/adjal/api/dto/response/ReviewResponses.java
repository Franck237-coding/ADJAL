package cm.adjal.api.dto.response;

import cm.adjal.api.repository.CahierRepository;
import java.time.Instant;
import java.util.UUID;

public final class ReviewResponses {
    private ReviewResponses() {}

    public record Review(UUID id, UUID productId, UUID orderId, UUID reviewerId,
                         String reviewerName, int rating, String comment,
                         String status, Instant createdAt) {
        public static Review from(CahierRepository.Review review) {
            return new Review(review.id(), review.productId(), review.orderId(), review.reviewerId(),
                review.reviewerName(), review.rating(), review.comment(), review.status(), review.createdAt());
        }
    }
}