package com.rollout.io.server.controlplaneservice.configuration;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ infrastructure configuration for the Control Plane Service.
 * Declares the shared topic exchange and all cascading deletion queues with their bindings.
 * The Control Plane Service acts as both a consumer and producer:
 * consuming {@code user.deleted} events from AuthService, and internally
 * cascading through {@code project.deleted} and {@code environment.deleted} events.
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "rollout.cascade.exchange";

    public static final String USER_DELETED_QUEUE = "user.deleted.queue";
    public static final String USER_DELETED_ROUTING_KEY = "cascade.user.deleted";

    public static final String PROJECT_DELETED_QUEUE = "project.deleted.queue";
    public static final String PROJECT_DELETED_ROUTING_KEY = "cascade.project.deleted";

    public static final String ENVIRONMENT_DELETED_QUEUE = "environment.deleted.queue";
    public static final String ENVIRONMENT_DELETED_ROUTING_KEY = "cascade.environment.deleted";

    // ===================================================================
    // Exchange
    // ===================================================================

    /**
     * Declares the shared durable topic exchange used across all Rollout.io services
     * for broadcasting cascading lifecycle events.
     *
     * @return the configured TopicExchange instance
     */
    @Bean
    public TopicExchange cascadeExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    // ===================================================================
    // Queues
    // ===================================================================

    /**
     * Durable queue receiving user deletion events published by AuthService.
     *
     * @return the configured Queue instance
     */
    @Bean
    public Queue userDeletedQueue() {
        return QueueBuilder.durable(USER_DELETED_QUEUE).build();
    }

    /**
     * Durable queue receiving project deletion events for environment cascade processing.
     *
     * @return the configured Queue instance
     */
    @Bean
    public Queue projectDeletedQueue() {
        return QueueBuilder.durable(PROJECT_DELETED_QUEUE).build();
    }

    /**
     * Durable queue receiving environment deletion events for flag and audit log cleanup.
     *
     * @return the configured Queue instance
     */
    @Bean
    public Queue environmentDeletedQueue() {
        return QueueBuilder.durable(ENVIRONMENT_DELETED_QUEUE).build();
    }

    // ===================================================================
    // Bindings
    // ===================================================================

    /**
     * Binds the user deletion queue to the cascade exchange.
     *
     * @param userDeletedQueue the target queue
     * @param cascadeExchange the source exchange
     * @return the Binding definition
     */
    @Bean
    public Binding userDeletedBinding(Queue userDeletedQueue, TopicExchange cascadeExchange) {
        return BindingBuilder.bind(userDeletedQueue).to(cascadeExchange).with(USER_DELETED_ROUTING_KEY);
    }

    /**
     * Binds the project deletion queue to the cascade exchange.
     *
     * @param projectDeletedQueue the target queue
     * @param cascadeExchange the source exchange
     * @return the Binding definition
     */
    @Bean
    public Binding projectDeletedBinding(Queue projectDeletedQueue, TopicExchange cascadeExchange) {
        return BindingBuilder.bind(projectDeletedQueue).to(cascadeExchange).with(PROJECT_DELETED_ROUTING_KEY);
    }

    /**
     * Binds the environment deletion queue to the cascade exchange.
     *
     * @param environmentDeletedQueue the target queue
     * @param cascadeExchange the source exchange
     * @return the Binding definition
     */
    @Bean
    public Binding environmentDeletedBinding(Queue environmentDeletedQueue, TopicExchange cascadeExchange) {
        return BindingBuilder.bind(environmentDeletedQueue).to(cascadeExchange).with(ENVIRONMENT_DELETED_ROUTING_KEY);
    }

    // ===================================================================
    // Serialization
    // ===================================================================

    /**
     * Configures Jackson-based JSON serialization for AMQP message payloads,
     * ensuring consistent object mapping across producer and consumer services.
     *
     * @return the JSON message converter
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configures the RabbitTemplate with JSON serialization and the cascade exchange as default.
     *
     * @param connectionFactory the AMQP connection factory
     * @param jsonMessageConverter the Jackson message converter
     * @return the production-ready RabbitTemplate
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        template.setExchange(EXCHANGE_NAME);
        return template;
    }

}
