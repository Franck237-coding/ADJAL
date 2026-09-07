package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.security.PasswordCodec;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.Map;
import java.util.Optional;

@Service
public class AccountService {
    private final MarketplaceRepository repository;
    private final PasswordCodec passwords;

    public AccountService(MarketplaceRepository repository, PasswordCodec passwords) {
        this.repository = repository;
        this.passwords = passwords;
    }

    public boolean verifyPassword(AuthenticatedUser user, String password) {
        MarketplaceRepository.Credentials credentials = repository.findCredentials(user.email()).orElse(null);
        return credentials != null
            && passwords.matches(password, credentials.passwordHash(), credentials.passwordSalt());
    }

    public void deleteOwnAccount(AuthenticatedUser user, String password) {
        if (!verifyPassword(user, password)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }
        if ("admin".equals(user.role())) {
            throw new IllegalStateException("Administrator accounts must be managed separately");
        }
        repository.deleteAccount(user.id());
    }

    public void deleteUser(UUID id) {
        repository.deleteAccount(id);
    }

    public Optional<AuthenticatedUser> updateProfile(UUID id, Map<String, Object> body) {
        return repository.updateProfile(id, body);
    }
}