package cm.adjal.api.controller;

import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.security.PasswordCodec;
import cm.adjal.api.security.TokenCodec;
import cm.adjal.api.service.EmailService;
import cm.adjal.api.service.AuthService;
import cm.adjal.api.dto.request.AuthRequests;
import cm.adjal.api.dto.response.AccountResponse;
import cm.adjal.api.dto.response.AuthResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final PasswordCodec passwords;
    private final TokenCodec tokens;
    private final EmailService emailService;
    private final Map<String, Instant> resetCooldowns = new ConcurrentHashMap<>();
    /** Échecs de saisie du code par compte : bloque après 5 essais pendant 15 minutes. */
    private final Map<UUID, ResetAttempts> resetAttempts = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private static final int MAX_RESET_ATTEMPTS = 5;
    private static final long RESET_TTL_SECONDS = 900;

    private record ResetAttempts(int failures, Instant since) {}

    public AuthController(AuthService authService, PasswordCodec passwords,
                          TokenCodec tokens, EmailService emailService) {
        this.authService = authService;
        this.passwords = passwords;
        this.tokens = tokens;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    ResponseEntity<AuthResponses.Session> register(@Valid @RequestBody AuthRequests.Register body) {
        String name = body.name();
        String email = body.email().toLowerCase(Locale.ROOT);
        String password = body.password();
        String phone = body.phone();
        String city = body.city();
        String role = body.role();
        if (authService.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        PasswordCodec.HashResult hash = passwords.hash(password);
        AuthenticatedUser account = authService.register(name.trim(), email, hash.hash(), hash.salt(), phone, city.trim(), role);
        return ResponseEntity.status(HttpStatus.CREATED).body(session(account));
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponses.Session> login(@RequestBody AuthRequests.Login body) {
        String email = body.email();
        String password = body.password();
        MarketplaceRepository.Credentials credentials = authService.findCredentials(email);
        if (credentials == null || !passwords.matches(password, credentials.passwordHash(), credentials.passwordSalt())
            || !"active".equals(credentials.status())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        AuthenticatedUser account = authService.findById(credentials.id()).orElseThrow();
        return ResponseEntity.ok(session(account));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletRequest request) {
        String token = bearer(request);
        if (token != null) authService.logout(tokens.sha256(token));
    }

    @GetMapping("/me")
    AccountResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return AccountResponse.from(user);
    }

    @PostMapping("/password-reset")
    ResponseEntity<Void> requestReset(@Valid @RequestBody AuthRequests.PasswordReset body, HttpServletRequest request) {
        String email = body.email().trim().toLowerCase(Locale.ROOT);
        String key = tokens.sha256(email + ":" + request.getRemoteAddr());
        Instant now = Instant.now();
        if (email.contains("@") && resetCooldowns.getOrDefault(key, Instant.MIN).isBefore(now.minusSeconds(60))) {
            resetCooldowns.put(key, now);
            authService.findByEmail(email).ifPresent(account -> {
                if (!emailService.isConfigured()) {
                    System.err.println("[RESET] Email non envoyé : SMTP non configuré (voir backend/smtp.properties).");
                    return;
                }
                // Code à 6 chiffres, facile à saisir sur téléphone, valable 15 minutes et à usage unique.
                String code = String.format("%06d", random.nextInt(1_000_000));
                String codeHash = resetCodeHash(account.id(), code);
                authService.createResetToken(account.id(), codeHash, now.plusSeconds(RESET_TTL_SECONDS));
                resetAttempts.remove(account.id());
                try {
                    emailService.sendPasswordReset(email, code, 15);
                } catch (RuntimeException exception) {
                    System.err.println("[RESET] Échec d'envoi de l'email à " + email + " : " + exception.getMessage());
                    if (exception.getCause() != null) System.err.println("[RESET] Cause : " + exception.getCause().getMessage());
                    authService.deleteResetToken(codeHash);
                }
            });
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @PostMapping("/password-reset/confirm")
    ResponseEntity<Void> confirmReset(@Valid @RequestBody AuthRequests.PasswordResetConfirmation body) {
        String token = body.token().trim();
        String password = body.password();
        Optional<MarketplaceRepository.ResetToken> reset;
        if (token.matches("\\d{6}")) {
            // Code à 6 chiffres : il est lié au compte, l'email est donc obligatoire.
            String email = body.email() == null ? "" : body.email().trim().toLowerCase(Locale.ROOT);
            AuthenticatedUser account = authService.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide ou expiré."));
            ResetAttempts attempts = resetAttempts.get(account.id());
            if (attempts != null && attempts.since().isBefore(Instant.now().minusSeconds(RESET_TTL_SECONDS))) {
                resetAttempts.remove(account.id());
                attempts = null;
            }
            if (attempts != null && attempts.failures() >= MAX_RESET_ATTEMPTS) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Trop d'essais. Demandez un nouveau code dans quelques minutes.");
            }
            reset = authService.findValidResetToken(resetCodeHash(account.id(), token));
            if (reset.isEmpty()) {
                resetAttempts.merge(account.id(), new ResetAttempts(1, Instant.now()),
                    (previous, ignored) -> new ResetAttempts(previous.failures() + 1, previous.since()));
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide ou expiré.");
            }
            resetAttempts.remove(account.id());
        } else {
            // Ancien format (long code) toujours accepté.
            reset = authService.findValidResetToken(tokens.sha256(token));
        }
        if (reset.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide ou expiré.");
        PasswordCodec.HashResult hash = passwords.hash(password);
        if (!authService.consumeResetToken(reset.get().id(), reset.get().accountId(), hash.hash(), hash.salt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset credential");
        }
        authService.deleteAllSessions(reset.get().accountId());
        return ResponseEntity.noContent().build();
    }

    private AuthResponses.Session session(AuthenticatedUser account) {
        String rawToken = tokens.generate();
        authService.createSession(tokens.sha256(rawToken), account.id(), Instant.now().plusSeconds(30L * 86400));
        return AuthResponses.Session.from(rawToken, account);
    }

    private String resetCodeHash(UUID accountId, String code) {
        return tokens.sha256("reset:" + accountId + ":" + code);
    }

    public static AccountResponse accountJson(AuthenticatedUser account) {
        return AccountResponse.from(account);
    }

    static String required(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || value.toString().isBlank()) throw new IllegalArgumentException(key + " is required");
        return value.toString();
    }

    static String bearer(HttpServletRequest request) {
        String value = request.getHeader("Authorization");
        return value != null && value.startsWith("Bearer ") ? value.substring(7).trim() : null;
    }
}