package com.rollout.io.server.controlplaneservice.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.messaging.DefaultMessageListenerContainer;
import org.springframework.data.mongodb.core.messaging.MessageListenerContainer;

/**
 * MongoDB configuration to enable Change Stream observation using a MessageListenerContainer.
 * This infrastructure facilitates real-time data synchronization across the platform.
 */
@Configuration
public class MongoConfig {

    /**
     * Initializes and starts a background container for listening to MongoDB events.
     * Required for real-time WebSocket state propagation.
     *
     * @param mongoTemplate the template used for MongoDB operations
     * @return the active message listener container instance
     */
    @Bean
    public MessageListenerContainer messageListenerContainer(MongoTemplate mongoTemplate) {
        DefaultMessageListenerContainer container = new DefaultMessageListenerContainer(mongoTemplate);
        container.start();
        return container;
    }

}
