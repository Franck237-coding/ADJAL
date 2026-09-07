package cm.adjal.api.dto.request;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class ProfileRequests {
    private ProfileRequests() {}
    public record UpdateProfile(@Size(max = 255) String name, @Size(max = 64) String phone,
                                 @Size(max = 120) String city, @Size(max = 2000) String avatarUrl,
                                 BigDecimal latitude, BigDecimal longitude) {}
    public record Interests(List<String> interests) {}
    public record Interaction(String productId, String type) {}
}