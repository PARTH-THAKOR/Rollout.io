package com.rollout.io.server.configserver.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test class for validating the security and filtering mechanisms of the Config Server.
 * Checks that the actuator health endpoint is public and other properties routes are protected.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class SecurityConfigTests {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Confirms that Health actuator endpoint bypasses security layer and permits all.
     * Evaluates checking for HTTP 200 OK.
     */
    @Test
    public void testActuatorHealthPermitAll() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    /**
     * Confirms that an arbitrary configuration request is unauthorized without credentials.
     * Evaluates checking for HTTP 401 Unauthorized.
     */
    @Test
    public void testArbitraryConfigRequestWithoutAuth() throws Exception {
        mockMvc.perform(get("/application/default"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Confirms that an authenticated request receives a 200 or 404 response
     * indicating it passed the security filter but route processing happened.
     */
    @Test
    @WithMockUser(username = "config", password = "pass")
    public void testArbitraryConfigRequestWithAuth() throws Exception {
        mockMvc.perform(get("/application/default"))
                .andExpect(result -> {
                    int statusCode = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(
                            statusCode == 200 || statusCode == 404,
                            "Expected 200 or 404, but got: " + statusCode
                    );
                });
    }

}
