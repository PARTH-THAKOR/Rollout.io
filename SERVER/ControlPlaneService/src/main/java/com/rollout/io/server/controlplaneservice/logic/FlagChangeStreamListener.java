package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.mongodb.client.model.changestream.FullDocument;
import com.mongodb.client.model.changestream.OperationType;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import org.bson.Document;
import org.springframework.data.mongodb.core.messaging.ChangeStreamRequest;
import org.springframework.data.mongodb.core.messaging.Message;
import org.springframework.data.mongodb.core.messaging.MessageListenerContainer;
import org.springframework.data.mongodb.core.messaging.Subscription;
import org.springframework.stereotype.Component;

/**
 * Managed MongoDB Change Stream listener.
 * Observes the 'flags' collection and bridges data mutations 
 * to the WebSocket handler for real-time delivery to dashboards.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FlagChangeStreamListener {

    private final MessageListenerContainer listenerContainer;
    private final FlagWebSocketHandler webSocketHandler;
    private Subscription subscription;

    /**
     * Initializes the Change Stream listener on application startup.
     * Captures INSERT, UPDATE, and DELETE operations.
     */
    @PostConstruct
    public void startListening() {
        log.info("Registering MongoDB Change Stream listener for 'flags' collection...");

        ChangeStreamRequest<Flag> request = ChangeStreamRequest.builder(this::handleMessage)
                .collection("flags")
                .fullDocumentLookup(FullDocument.UPDATE_LOOKUP)
                .build();

        subscription = listenerContainer.register(request, Flag.class);
        log.info("Change Stream registration successful. Listener Active: {}", listenerContainer.isRunning());
    }

    /**
     * Internal message handler invoked by the listener container.
     * Extracts mutation details and delegates to the evaluation-aware WebSocket handler.
     *
     * @param message the raw mutation document parsed from the active stream
     */
    private void handleMessage(Message<ChangeStreamDocument<Document>, Flag> message) {
        ChangeStreamDocument<Document> event = message.getRaw();
        if (event == null) return;

        OperationType opType = event.getOperationType();
        String opName = opType != null ? opType.name() : "UNKNOWN";
        Flag flagData = message.getBody();

        if (opType == OperationType.DELETE) {
            String key = (event.getDocumentKey() != null && event.getDocumentKey().containsKey("key")) 
                    ? event.getDocumentKey().getString("key").getValue() 
                    : null;
            webSocketHandler.handleFlagChange("DELETE", Flag.builder().key(key).build());
        } else if (flagData != null) {
            webSocketHandler.handleFlagChange(opName, flagData);
        }
    }

    /**
     * Reclaims connection resources cleaning out active polling streams gracefully
     * whenever the encompassing Spring Context shuts down.
     */
    @PreDestroy
    public void stopListening() {
        if (subscription != null) {
            log.info("Closing MongoDB Change Stream subscription for maintenance/shutdown.");
            listenerContainer.remove(subscription);
        }
    }

}
