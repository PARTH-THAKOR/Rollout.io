package com.rollout.io.server.controlplaneservice.configuration;

import com.rollout.io.server.controlplaneservice.entity.Environment;
import com.rollout.io.server.controlplaneservice.repository.EnvironmentRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.Optional;

/**
 * Security interceptor for WebSocket handshakes.
 * Responsible for verifying the 'Authorization: Bearer <JWT>' header and 
 * ensuring the connection is restricted to a valid 'environmentId'.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtDecoder jwtDecoder;
    private final EnvironmentRepository environmentRepository;

    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public boolean beforeHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                                   @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) {
        
        if (!(request instanceof ServletServerHttpRequest servletRequest)) return false;

        String authHeader = servletRequest.getHeaders().getFirst("Authorization");
        String environmentId = servletRequest.getServletRequest().getParameter("environmentId");

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX) || environmentId == null) {
            log.warn("Unauthorized handshake attempt: Missing credentials or environment scope.");
            response.setStatusCode(HttpStatus.BAD_REQUEST);
            return false;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            Jwt jwt = jwtDecoder.decode(token);
            String uid = jwt.getSubject();

            // Scope validation: Ensure the requested environment exists
            Optional<Environment> env = environmentRepository.findById(environmentId);
            if (env.isEmpty()) {
                log.warn("Access denied for user {}: Environment {} not found.", uid, environmentId);
                response.setStatusCode(HttpStatus.FORBIDDEN);
                return false;
            }

            // Persist scope and identity in the session attributes for the handler
            attributes.put("uid", uid);
            attributes.put("environmentId", environmentId);
            return true;

        } catch (Exception e) {
            log.error("Token validation failed during WebSocket handshake: {}", e.getMessage());
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                               @NonNull WebSocketHandler wsHandler, Exception exception) {
    }

}
