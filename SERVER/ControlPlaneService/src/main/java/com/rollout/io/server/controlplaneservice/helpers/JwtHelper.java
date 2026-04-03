package com.rollout.io.server.controlplaneservice.helpers;

import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.objects.Helper;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Utility class for safely extracting and validating information from JWT tokens.
 */
@Helper
public class JwtHelper {

    private JwtHelper() {

    }

    /**
     * Extracts the validated user UID from the subject claim of the JWT.
     * Evaluates for token validity and enforces authorization presence.
     *
     * @param jwt the verified JWT object parsed by the Resource Server
     * @return the extracted unique developer UID
     * @throws RolloutError if the token is null or missing a subject claim
     */
    public static String getUidFromJwt(Jwt jwt) {
        if (jwt == null) {
            throw new RolloutError("Invalid authentication token", HttpStatus.UNAUTHORIZED);
        }
        String uid = jwt.getSubject();
        if (uid == null || uid.isBlank()) {
            throw new RolloutError("Invalid token: UID missing", HttpStatus.UNAUTHORIZED);
        }
        return uid;
    }

}
