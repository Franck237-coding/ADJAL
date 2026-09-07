package cm.adjal.api.security;

import cm.adjal.api.repository.MarketplaceRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class BearerChannelInterceptor implements ChannelInterceptor {
    private final TokenCodec tokenCodec;
    private final MarketplaceRepository repository;

    public BearerChannelInterceptor(TokenCodec tokenCodec, MarketplaceRepository repository) {
        this.tokenCodec = tokenCodec;
        this.repository = repository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = accessor.getFirstNativeHeader("Authorization");
            if (authorization == null) authorization = accessor.getFirstNativeHeader("authorization");
            if (authorization != null && authorization.startsWith("Bearer ")) {
                String token = authorization.substring(7).trim();
                repository.findSession(tokenCodec.sha256(token)).ifPresent(user ->
                    accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()))
                );
            }
        }
        return message;
    }
}