package com.cts.vpms.invoice.enums;

public enum SlotType {
    TWO_WHEELER,
    FOUR_WHEELER;

    // CONCEPT: Factory method to parse the DB enum string "2W"/"4W"
    // into our Java enum. Centralises the mapping in one place.
    public static SlotType fromString(String type) {
        return switch (type) {
            case "2W" -> TWO_WHEELER;
            case "4W" -> FOUR_WHEELER;
            default -> throw new IllegalArgumentException("Unknown slot type: " + type);
        };
    }
}