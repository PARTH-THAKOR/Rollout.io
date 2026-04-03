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

    /**
     * Instantiates a new standalone CORE feature flag inside a mapped environment.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the mapped target namespace where the flag resides
     * @param flag the configuration object payload representing the flag parameters
     * @return the fully generated Core Flag document saved to MongoDB
     */
    Flag createCoreFlag(Jwt jwt, String environmentId, Flag flag);

    /**
     * Resolves all CORE categorized flags belonging strictly to the mapped environment.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the environment identity boundary parameter
     * @return a mapped sequence list evaluating every active standalone core flag
     */
    List<Flag> getCoreFlags(Jwt jwt, String environmentId);

    /**
     * Fetches only subset CORE flags where structural typing excludes raw generic JSON payloads.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the requested environment identifier
     * @return a list array containing purely structured boolean/numeric/string flags
     */
    List<Flag> getBasicCoreFlags(Jwt jwt, String environmentId);

    /**
     * Scans specifically for raw dynamically formatted JSON object CORE flags.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the active mapping environment identifier
     * @return collection containing solely JSON variant feature flags
     */
    List<Flag> getJsonCoreFlags(Jwt jwt, String environmentId);

    /**
     * Selects and extracts a precise CORE flag mapping securely by its explicit document ID.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId the individual database document key locating the flag
     * @return the fully populated instantiated Flag model
     */
    Flag getCoreFlag(Jwt jwt, String flagId);

    /**
     * Background evaluation extractor meant largely for runtime proxy SDK systems validating state blocks.
     *
     * @param sdkKey secure application token assigned independently to an environment
     * @return a raw subset block holding every evaluated CORE logic flag accessible by environment
     */
    List<Flag> getCoreFlagsBySdkKey(String sdkKey);

    /**
     * Updates and securely stores target metadata/value overwrites for a standalone flag.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId specific document signature identifying the active flag
     * @param flag incoming partial snapshot describing new configurations
     * @return the cleanly processed active document persisted synchronously
     */
    Flag updateCoreFlag(Jwt jwt, String flagId, Flag flag);

    /**
     * Hard-erases an identified CORE mapped feature flag globally.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId exact document sequence representing the flag configuration cache
     */
    void deleteCoreFlag(Jwt jwt, String flagId);

    /**
     * Efficiently flips only the standalone enabled constraint parameters.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId active core flag record being mapped dynamically
     * @return fully persisted new object referencing toggled enabled flags
     */
    Flag toggleCoreFlag(Jwt jwt, String flagId);

}
