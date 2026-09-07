package cm.adjal.api.dto.response;

import cm.adjal.api.repository.MarketplaceRepository;
import java.time.Instant;
import java.util.UUID;

public final class ReportResponses {
    private ReportResponses() {}
    public record Report(UUID id, String reason, String details, String status, String resolution,
                         Instant createdAt, String reporterName, String reporterEmail,
                         UUID farmerId, String farmerName, String farmerEmail, String farmerStatus) {
        public static Report from(MarketplaceRepository.Report report) {
            return new Report(report.id(), report.reason(), report.details(), report.status(), report.resolution(),
                report.createdAt(), report.reporterName(), report.reporterEmail(), report.farmerId(),
                report.farmerName(), report.farmerEmail(), report.farmerStatus());
        }
    }
}