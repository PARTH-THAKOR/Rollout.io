package com.rollout.io.server.authservice.configuration;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ infrastructure configuration for the Auth Service.
 * Declares the shared topic exchange and the user deletion queue with its binding.
 * The Auth Service acts as a producer: publishing {@code user.deleted} events
 * when a developer account is permanently removed from the platform.
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "rollout.cascade.exchange";
    public static final String USER_DELETED_QUEUE = "user.deleted.queue";
    public static final String USER_DELETED_ROUTING_KEY = "cascade.user.deleted";

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

    /**
     * Declares the durable queue that receives user deletion events.
     * ControlPlaneService binds a consumer to this queue.
     *
     * @return the configured Queue instance
     */
    @Bean
    public Queue userDeletedQueue() {
        return QueueBuilder.durable(USER_DELETED_QUEUE).build();
    }

    /**
     * Binds the user deletion queue to the cascade exchange using a topic routing key.
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
