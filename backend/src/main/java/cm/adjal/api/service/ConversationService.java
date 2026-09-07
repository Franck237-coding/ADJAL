package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class ConversationService {
    private final MarketplaceRepository repository;
    public ConversationService(MarketplaceRepository repository) { this.repository = repository; }
    public List<MarketplaceRepository.Conversation> list(UUID id) { return repository.conversations(id); }
    public MarketplaceRepository.Conversation findOrCreate(UUID id, UUID other) {
        return repository.findOrCreateConversation(id, other);
    }
    public List<MarketplaceRepository.Message> messages(UUID id) { return repository.messages(id); }
    public void markRead(UUID conversationId, UUID accountId) { repository.markConversationRead(conversationId, accountId); }
    public MarketplaceRepository.Message send(UUID conversation, UUID sender, String body) {
        return repository.insertMessage(conversation, sender, body);
    }
    public boolean isParticipant(UUID conversation, UUID account) {
        return repository.isConversationParticipant(conversation, account);
    }
    public UUID otherParticipant(UUID conversationId, UUID accountId) {
        return repository.otherConversationParticipant(conversationId, accountId);
    }
    public boolean accountExists(UUID accountId) {
        return repository.findById(accountId).isPresent();
    }
}