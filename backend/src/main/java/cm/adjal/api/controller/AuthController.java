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
    ResponseEntity<AuthResponses.Session> login(@Valid @RequestBody AuthRequests.Login body) {
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
                if (!emailService.isConfigured()) return;
                String rawToken = tokens.generate();
                authService.createResetToken(account.id(), tokens.sha256(rawToken), now.plusSeconds(900));
                try {
                    emailService.sendPasswordReset(email, rawToken, 15);
                } catch (RuntimeException exception) {
                    authService.deleteResetToken(tokens.sha256(rawToken));
                }
            });
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @PostMapping("/password-reset/confirm")
    ResponseEntity<Void> confirmReset(@Valid @RequestBody AuthRequests.PasswordResetConfirmation body) {
        String token = body.token();
        String password = body.password();
        Optional<MarketplaceRepository.ResetToken> reset = authService.findValidResetToken(tokens.sha256(token));
        if (reset.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset credential");
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