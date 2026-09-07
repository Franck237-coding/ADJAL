package cm.adjal.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Validated HTTP input models for authentication. */
public final class AuthRequests {
    private AuthRequests() {}
    public record Register(
        @NotBlank @Size(min = 2, max = 120) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 10, max = 128) String password,
        @NotBlank @Pattern(regexp = "\\+237[0-9]{9}") String phone,
        @NotBlank @Size(min = 2, max = 80) String city,
        @NotBlank @Pattern(regexp = "buyer|farmer") String role
    ) {}

    public record Login(
        @NotBlank @Size(min = 3, max = 160) String email,
        @NotBlank @Size(max = 128) String password
    ) {}

    public record PasswordReset(@NotBlank @Email String email) {}

    public record PasswordResetConfirmation(
        @NotBlank @Size(min = 40, max = 128) String token,
        @NotBlank @Size(min = 10, max = 128) String password
    ) {}
}