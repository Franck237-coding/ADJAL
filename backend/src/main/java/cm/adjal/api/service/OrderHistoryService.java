package cm.adjal.api.service;

import cm.adjal.api.repository.CahierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OrderHistoryService {
    private final CahierRepository repository;

    public OrderHistoryService(CahierRepository repository) {
        this.repository = repository;
    }

    public List<CahierRepository.OrderStatus> forOrder(UUID accountId, String role, UUID orderId) {
        return repository.orderHistory(accountId, role, orderId);
    }
}