package com.rollout.io.server.controlplaneservice.configuration;

import com.rollout.io.server.controlplaneservice.logic.FlagWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket configuration for supporting real-time feature flag observability.
 * Exposes securely authenticated endpoints for the administrative dashboard.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final FlagWebSocketHandler flagWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    /**
     * Configures the WebSocket registry by mapping handlers to endpoints and attaching authentication interceptors.
     * Enforces the /ws/flags endpoint for the platform's real-time communication.
     *
     * @param registry the WebSocket handler registry
     */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(flagWebSocketHandler, "/wsControl/flags")
                .setAllowedOrigins("*")
                .addInterceptors(webSocketAuthInterceptor);
    }

}
