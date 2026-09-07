package cm.adjal.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class MessageRequests {
    private MessageRequests() {}
    public record CreateConversation(@NotBlank String otherUserId) {}
    public record SendMessage(@NotBlank @Size(max = 4000) String body) {}
}