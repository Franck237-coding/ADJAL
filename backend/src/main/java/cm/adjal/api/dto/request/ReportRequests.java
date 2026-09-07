package cm.adjal.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class ReportRequests {
    private ReportRequests() {}
    public record Create(@NotNull UUID farmerId, @NotBlank String reason, @NotBlank @Size(min = 10, max = 2000) String details) {}
    public record Moderate(@NotBlank String action, @NotBlank @Size(min = 3, max = 2000) String resolution) {}
}