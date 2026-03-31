package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.entity.FlagType;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class FlagHelperLogicTest {

    @InjectMocks
    private FlagHelperLogic flagHelperLogic;

    private Flag flag;

    @BeforeEach
    void setUp() {
        flag = new Flag();
        flag.setKey("sample-flag");
        flag.setType(FlagType.BOOLEAN);
        flag.setValue(true);
    }

    @Test
    void testValidateFlagValue_validBoolean() {
        assertDoesNotThrow(() -> flagHelperLogic.validateFlagValue(flag), "Boolean flag validation should not throw an exception");
    }

    @Test
    void testValidateFlagValue_invalidBooleanThrowsError() {
        flag.setValue("Not a boolean");
        RolloutError error = assertThrows(RolloutError.class, () -> flagHelperLogic.validateFlagValue(flag));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertTrue(error.getMessage().contains("Invalid value for flag type"));
    }

    @Test
    void testValidateFlagValue_validInteger() {
        flag.setType(FlagType.INTEGER);
        flag.setValue(42);
        assertDoesNotThrow(() -> flagHelperLogic.validateFlagValue(flag));
    }
    
    @Test
    void testValidateFlagValue_validStringBoundedInteger() {
        flag.setType(FlagType.INTEGER);
        flag.setValue("100");
        assertDoesNotThrow(() -> flagHelperLogic.validateFlagValue(flag));
        assertEquals(100, flag.getValue()); // validates parsing logic
    }

    @Test
    void testValidateFlagValue_nullForCoreThrowsError() {
        flag.setValue(null);
        RolloutError error = assertThrows(RolloutError.class, () -> flagHelperLogic.validateFlagValue(flag));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertTrue(error.getMessage().contains("cannot be null"));
    }
}
