package cm.adjal.api.controller;

import cm.adjal.api.dto.request.MessageRequests;
import cm.adjal.api.dto.response.MessageResponses;
import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.ConversationService;
import cm.adjal.api.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/conversations")
public class MessageController {
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messaging;
    private final NotificationService notificationService;

    public MessageController(ConversationService conversationService, SimpMessagingTemplate messaging,
                             NotificationService notificationService) {
        this.conversationService = conversationService;
        this.messaging = messaging;
        this.notificationService = notificationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MessageResponses.Conversation createConversation(@AuthenticationPrincipal AuthenticatedUser user,
                                                    @Valid @RequestBody MessageRequests.CreateConversation body) {
        UUID otherId = UUID.fromString(body.otherUserId());
        if (!conversationService.accountExists(otherId)) throw new NoSuchElementException("Account not found");
        return MessageResponses.Conversation.from(conversationService.findOrCreate(user.id(), otherId));
    }

    @GetMapping
    List<MessageResponses.Conversation> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return conversationService.list(user.id()).stream().map(MessageResponses.Conversation::from).toList();
    }

    @GetMapping("/{id}/messages")
    List<MessageResponses.Message> history(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        ensureParticipant(user, id);
        conversationService.markRead(id, user.id());
        return conversationService.messages(id).stream().map(this::messageJson).toList();
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markRead(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        ensureParticipant(user, id);
        conversationService.markRead(id, user.id());
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    MessageResponses.Message send(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
                                  @Valid @RequestBody MessageRequests.SendMessage body) {
        ensureParticipant(user, id);
        String text = body.body().trim();
        MarketplaceRepository.Message message = conversationService.send(id, user.id(), text);
        MessageResponses.Message json = messageJson(message);
        notifyParticipant(user, id);
        messaging.convertAndSend("/topic/conversations/" + id, json);
        return json;
    }

    @MessageMapping("/conversations/{id}")
    public void sendOverWebSocket(@DestinationVariable UUID id, Map<String, Object> body, Principal principal) {
        if (!(principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth)
            || !(auth.getPrincipal() instanceof AuthenticatedUser user)) return;
        ensureParticipant(user, id);
        String text = String.valueOf(body.getOrDefault("body", "")).trim();
        if (text.isEmpty() || text.length() > 4000) return;
        MarketplaceRepository.Message message = conversationService.send(id, user.id(), text);
        notifyParticipant(user, id);
        messaging.convertAndSend("/topic/conversations/" + id, messageJson(message));
    }

    private void notifyParticipant(AuthenticatedUser sender, UUID conversationId) {
        UUID recipient = conversationService.otherParticipant(conversationId, sender.id());
        notificationService.create(recipient, "message", "Nouveau message",
            sender.name() + " vous a envoyé un message.", "conversation", conversationId);
    }

    private void ensureParticipant(AuthenticatedUser user, UUID id) {
        if (!conversationService.isParticipant(id, user.id())) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation access denied");
        }
    }

    private MessageResponses.Conversation conversationJson(MarketplaceRepository.Conversation conversation) {
        return MessageResponses.Conversation.from(conversation);
    }

    private MessageResponses.Message messageJson(MarketplaceRepository.Message message) {
        return MessageResponses.Message.from(message);
    }
}