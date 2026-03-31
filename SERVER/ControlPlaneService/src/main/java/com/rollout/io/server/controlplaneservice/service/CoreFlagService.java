package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service interface outlining the business logic for managing Core Feature Flags.
 * Defines operations for creating, mutating, toggling, and safely deleting independent flags.
 */
@Service
public interface CoreFlagService {

    Flag createCoreFlag(Jwt jwt, String environmentId, Flag flag);

    List<Flag> getCoreFlags(Jwt jwt, String environmentId);

    List<Flag> getBasicCoreFlags(Jwt jwt, String environmentId);

    List<Flag> getJsonCoreFlags(Jwt jwt, String environmentId);

    Flag getCoreFlag(Jwt jwt, String flagId);

    List<Flag> getCoreFlagsBySdkKey(String sdkKey);

    Flag updateCoreFlag(Jwt jwt, String flagId, Flag flag);

    void deleteCoreFlag(Jwt jwt, String flagId);

    Flag toggleCoreFlag(Jwt jwt, String flagId);

}
