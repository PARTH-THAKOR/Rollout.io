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
 * Handshake interceptor for securing WebSocket connections.
 * Validates the JWT bearer token and enforces environment-level access controls during the handshake phase.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtDecoder jwtDecoder;
    private final EnvironmentRepository environmentRepository;

    private static final String BEARER_PREFIX = "Bearer ";

    /**
     * Intercepts the handshake to perform authentication and environment scoping.
     * Extracts and validates the JWT from headers and environment identifier from query parameters.
     *
     * @param request    the server request
     * @param response   the server response
     * @param wsHandler  the WebSocket handler
     * @param attributes session attributes to be populated
     * @return true if the handshake is authorized
     */
    @Override
    public boolean beforeHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                                   @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) {

        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        String authHeader = servletRequest.getHeaders().getFirst("Authorization");
        String environmentId = servletRequest.getServletRequest().getParameter("environmentId");

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX) || environmentId == null) {
            log.warn("Handshake rejected: Missing credentials or environment scope.");
            response.setStatusCode(HttpStatus.BAD_REQUEST);
            return false;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            Jwt jwt = jwtDecoder.decode(token);
            String uid = jwt.getSubject();

            Optional<Environment> env = environmentRepository.findById(environmentId);
            if (env.isEmpty()) {
                log.warn("Handshake abandoned: Environment {} not found for user {}.", environmentId, uid);
                response.setStatusCode(HttpStatus.FORBIDDEN);
                return false;
            }

            attributes.put("uid", uid);
            attributes.put("environmentId", environmentId);
            return true;

        } catch (Exception e) {
            log.error("Handshake failed: Token validation error - {}", e.getMessage());
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    /**
     * Post-handshake processing placeholder. Currently, no logic required.
     */
    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                               @NonNull WebSocketHandler wsHandler, Exception exception) {

    }

}
