package cm.adjal.api.security;

import cm.adjal.api.repository.MarketplaceRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class BearerAuthFilter extends OncePerRequestFilter {
    private final TokenCodec tokenCodec;
    private final MarketplaceRepository repository;

    public BearerAuthFilter(TokenCodec tokenCodec, MarketplaceRepository repository) {
        this.tokenCodec = tokenCodec;
        this.repository = repository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String rawToken = authorization.substring(7).trim();
            if (!rawToken.isEmpty()) {
                repository.findSession(tokenCodec.sha256(rawToken)).ifPresent(user -> {
                    if (user.isEnabled()) {
                        SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
                        );
                    }
                });
            }
        }
        chain.doFilter(request, response);
    }
}