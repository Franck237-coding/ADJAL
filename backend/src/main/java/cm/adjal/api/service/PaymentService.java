package cm.adjal.api.service;

import cm.adjal.api.repository.CahierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {
    private final CahierRepository repository;

    public PaymentService(CahierRepository repository) {
        this.repository = repository;
    }

    public List<CahierRepository.Payment> forUser(UUID accountId, String role) {
        return repository.paymentsFor(accountId, role);
    }

    public CahierRepository.Payment create(UUID payerId, UUID orderId, String method) {
        return repository.createPayment(payerId, orderId, method);
    }

    public CahierRepository.Payment updateStatus(UUID id, String status) {
        return repository.updatePaymentStatus(id, status);
    }
}