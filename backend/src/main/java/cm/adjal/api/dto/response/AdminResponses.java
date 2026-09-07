package cm.adjal.api.dto.response;

public final class AdminResponses {
    private AdminResponses() {}

    public record Summary(long userCount, long productCount, long transactionCount, long pendingProductCount, long pendingReportCount) {}
}