package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ReportService {
    private static final Set<String> REASONS = Set.of("fraud", "harassment", "unsafe_product", "spam", "other");
    private final MarketplaceRepository repository;
    public ReportService(MarketplaceRepository repository) { this.repository = repository; }

    public MarketplaceRepository.Report create(UUID reporterId, UUID farmerId, String reason, String details) {
        if (!REASONS.contains(reason)) throw new IllegalArgumentException("Invalid report reason");
        if (reporterId.equals(farmerId)) throw new IllegalArgumentException("Cannot report yourself");
        if (!repository.isFarmer(farmerId)) throw new java.util.NoSuchElementException("Farmer not found");
        if (repository.hasPendingReport(reporterId, farmerId)) throw new IllegalStateException("A pending report already exists");
        return repository.insertReport(reporterId, farmerId, reason, details.trim());
    }

    public List<MarketplaceRepository.Report> mine(UUID reporterId) { return repository.reportsForReporter(reporterId); }
    public List<MarketplaceRepository.Report> all(String status) { return repository.reportsByStatus(status); }
    public MarketplaceRepository.Report moderate(UUID id, UUID moderatorId, String action, String resolution) {
        if (!Set.of("dismiss", "warn", "ban").contains(action)) throw new IllegalArgumentException("Invalid moderation action");
        MarketplaceRepository.Report current = repository.findReport(id).orElseThrow(() -> new java.util.NoSuchElementException("Report not found"));
        String status = action.equals("dismiss") ? "dismissed" : action.equals("warn") ? "warned" : "banned";
        MarketplaceRepository.Report updated = repository.moderateReport(id, moderatorId, status, resolution.trim());
        if (action.equals("ban")) repository.updateAccountStatus(current.farmerId(), "suspended");
        return updated;
    }
}