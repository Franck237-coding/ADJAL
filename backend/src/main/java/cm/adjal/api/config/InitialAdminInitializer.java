package cm.adjal.api.config;

import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.security.PasswordCodec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Creates the first administrator after Flyway has prepared the database.
 *
 * The initializer is deliberately idempotent: an existing administrator is
 * never modified. A non-admin account using the reserved address stops startup
 * instead of silently escalating that account's privileges.
 */
@Component
public class InitialAdminInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(InitialAdminInitializer.class);

    private final MarketplaceRepository repository;
    private final PasswordCodec passwordCodec;
    private final String email;
    private final String password;
    private final String name;
    private final String phone;
    private final String city;

    public InitialAdminInitializer(
        MarketplaceRepository repository,
        PasswordCodec passwordCodec,
        @Value("${adjal.initial-admin.email:admin@adjal.cm}") String email,
        @Value("${adjal.initial-admin.password:${INITIAL_ADMIN_PASSWORD:admin123}}") String password,
        @Value("${adjal.initial-admin.name:A DJAL Administrateur}") String name,
        @Value("${adjal.initial-admin.phone:+237690000000}") String phone,
        @Value("${adjal.initial-admin.city:Yaoundé}") String city
    ) {
        this.repository = repository;
        this.passwordCodec = passwordCodec;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.password = password;
        this.name = name.trim();
        this.phone = phone.trim();
        this.city = city.trim();
    }

    @Override
    public void run(String... args) {
        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                "Initial administrator password is empty. Set INITIAL_ADMIN_PASSWORD before starting the API."
            );
        }

        var existing = repository.findByEmail(email);
        if (existing.isPresent()) {
            AuthenticatedUser account = existing.get();
            if (!"admin".equals(account.role())) {
                throw new IllegalStateException(
                    "Reserved administrator email already belongs to a non-admin account: " + email
                );
            }
            log.info("Initial administrator already exists; keeping the existing account.");
            return;
        }

        PasswordCodec.HashResult credentials = passwordCodec.hash(password);
        repository.insertAccount(
            name,
            email,
            credentials.hash(),
            credentials.salt(),
            phone,
            city,
            "admin"
        );
        log.info("Initial administrator account created for {}", email);
    }
}