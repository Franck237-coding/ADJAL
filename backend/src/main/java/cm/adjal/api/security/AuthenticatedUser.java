package cm.adjal.api.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.math.BigDecimal;

public record AuthenticatedUser(
    UUID id,
    String name,
    String email,
    String phone,
    String role,
    String city,
    String country,
    String status,
    String avatarUrl,
    List<String> interests,
    Instant createdAt,
    BigDecimal latitude,
    BigDecimal longitude
) implements UserDetails {
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
    }

    @Override public String getPassword() { return ""; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return !"suspended".equals(status); }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return !"suspended".equals(status); }
}