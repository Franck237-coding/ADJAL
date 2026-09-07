package cm.adjal.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AccountRequests {
    private AccountRequests() {}

    public record DeleteAccount(@NotBlank @Size(max = 128) String password) {}
}