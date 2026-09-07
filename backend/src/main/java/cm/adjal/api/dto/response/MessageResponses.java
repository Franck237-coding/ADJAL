package cm.adjal.api.dto.response;

import cm.adjal.api.repository.MarketplaceRepository;
import java.time.Instant;
import java.util.UUID;

public final class MessageResponses {
    private MessageResponses() {}
    public record Conversation(UUID id, UUID otherUserId, String otherUserName, String otherUserAvatarUrl,
                                long unreadCount, Instant createdAt, Instant updatedAt) {
        public static Conversation from(MarketplaceRepository.Conversation c) {
            return new Conversation(c.id(), c.otherId(), c.otherName(), c.otherAvatarUrl(), c.unreadCount(), c.createdAt(), c.updatedAt());
        }
    }
    public record Message(UUID id, UUID conversationId, UUID senderId, String senderName, String body,
                          Instant createdAt, Instant readAt) {
        public static Message from(MarketplaceRepository.Message m) {
            return new Message(m.id(), m.conversationId(), m.senderId(), m.senderName(), m.body(),
                m.createdAt(), m.readAt());
        }
    }
}