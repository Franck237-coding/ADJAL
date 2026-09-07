package cm.adjal.api.dto.response;

import java.util.List;

public final class ProfileResponses {
    private ProfileResponses() {}

    public record Interests(List<String> interests) {}
}