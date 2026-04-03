package com.rollout.io.server.sdkservice.entity;

/**
 * Operators for targeting rule evaluation.
 * EQUALS / NOT_EQUALS -> exact match
 * IN / NOT_IN         -> value in list
 * CONTAINS            -> substring match (strings)
 * GT / GTE / LT / LTE -> numeric comparison
 */
public enum TargetOperator {

    EQUALS,
    NOT_EQUALS,
    IN,
    NOT_IN,
    CONTAINS,
    GT,
    GTE,
    LT,
    LTE

}
