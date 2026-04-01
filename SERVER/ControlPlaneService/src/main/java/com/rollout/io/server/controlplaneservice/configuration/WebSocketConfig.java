package com.rollout.io.server.controlplaneservice.configuration;

import com.rollout.io.server.controlplaneservice.logic.FlagWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket configuration for real-time flag updates.
 * Registers /ws/flags endpoint for dashboard UI components.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final FlagWebSocketHandler flagWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(flagWebSocketHandler, "/ws/flags")
                .setAllowedOrigins("*")
                .addInterceptors(webSocketAuthInterceptor);
    }

}
