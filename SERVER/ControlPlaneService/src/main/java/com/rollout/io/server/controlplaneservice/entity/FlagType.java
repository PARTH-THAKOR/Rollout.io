package com.rollout.io.server.controlplaneservice.entity;


/**
 * Enumeration of the precise, strongly-typed evaluation boundaries allowed for Feature Flag assignments.
 */
public enum FlagType {

    BOOLEAN,
    STRING,
    INTEGER,
    DOUBLE,
    JSON

}

