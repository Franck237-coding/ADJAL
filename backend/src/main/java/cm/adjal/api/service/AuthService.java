package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

@Service
public class AuthService {
    private final MarketplaceRepository repository;
    public AuthService(MarketplaceRepository repository) { this.repository = repository; }
    public Optional<AuthenticatedUser> findByEmail(String email) { return repository.findByEmail(email); }
    public Optional<AuthenticatedUser> findById(UUID id) { return repository.findById(id); }
    public MarketplaceRepository.Credentials findCredentials(String email) {
        return repository.findCredentials(email).orElse(null);
    }
    public AuthenticatedUser register(String name, String email, String passwordHash, String passwordSalt,
                                      String phone, String city, String role) {
        return repository.insertAccount(name, email, passwordHash, passwordSalt, phone, city, role);
    }
    public void logout(String tokenHash) { repository.deleteSession(tokenHash); }
    public void createSession(String tokenHash, UUID accountId, Instant expiresAt) {
        repository.createSession(tokenHash, accountId, expiresAt);
    }
    public void createResetToken(UUID accountId, String tokenHash, Instant expiresAt) {
        repository.createResetToken(accountId, tokenHash, expiresAt);
    }
    public Optional<MarketplaceRepository.ResetToken> findValidResetToken(String tokenHash) {
        return repository.findValidResetToken(tokenHash);
    }
    public void deleteResetToken(String tokenHash) { repository.deleteResetToken(tokenHash); }
    public boolean consumeResetToken(UUID id, UUID accountId, String passwordHash, String passwordSalt) {
        return repository.consumeResetToken(id, accountId, passwordHash, passwordSalt);
    }
    public void deleteAllSessions(UUID accountId) { repository.deleteAllSessions(accountId); }
}