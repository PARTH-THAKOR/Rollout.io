package com.rollout.io.server.controlplaneservice.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.messaging.DefaultMessageListenerContainer;
import org.springframework.data.mongodb.core.messaging.MessageListenerContainer;

/**
 * MongoDB Configuration to enable Change Stream MessageListenerContainer.
 * Standardizes background processing of data mutation events.
 */
@Configuration
public class MongoConfig {

    @Bean
    public MessageListenerContainer messageListenerContainer(MongoTemplate mongoTemplate) {
        DefaultMessageListenerContainer container = new DefaultMessageListenerContainer(mongoTemplate);
        container.start();
        return container;
    }

}
