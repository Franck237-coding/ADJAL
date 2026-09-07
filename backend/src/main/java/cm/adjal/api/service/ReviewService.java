package cm.adjal.api.service;

import cm.adjal.api.repository.CahierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ReviewService {
    private final CahierRepository repository;

    public ReviewService(CahierRepository repository) {
        this.repository = repository;
    }

    public List<CahierRepository.Review> forProduct(UUID productId) {
        return repository.reviewsForProduct(productId);
    }

    public CahierRepository.Review create(UUID reviewerId, UUID productId, UUID orderId,
                                          int rating, String comment) {
        return repository.createReview(reviewerId, productId, orderId, rating, comment);
    }

    public List<CahierRepository.Review> all() {
        return repository.allReviews();
    }

    public void remove(UUID id) {
        repository.removeReview(id);
    }
}