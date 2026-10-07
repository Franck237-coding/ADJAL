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
         @NotBlank String email,
        @NotBlank @Size(min = 10, max = 128) String password,
        @NotBlank @Pattern(regexp = "\\+237[0-9]{9}") String phone,
        @NotBlank @Size(min = 2, max = 80) String city,
        @NotBlank @Pattern(regexp = "buyer|farmer") String role
    ) {}

    public record Login(
        String email,
        String password
    ) {}

    public record PasswordReset(@NotBlank String email) {}

    public record PasswordResetConfirmation(
        /** Code à 6 chiffres reçu par email (ou ancien code long). */
        @NotBlank @Size(min = 6, max = 128) String token,
        @NotBlank @Size(min = 10, max = 128) String password,
        /** Email du compte, obligatoire avec un code à 6 chiffres. */
        String email
    ) {}
}