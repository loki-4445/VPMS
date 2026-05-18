package com.cts.vpms.invoice.entity;

import lombok.experimental.UtilityClass;

import java.math.BigDecimal;

// CONCEPT: @UtilityClass — Lombok shorthand for a constants/utility class.
// Equivalent to: public final class BillingRates { private BillingRates(){} }
// All fields are implicitly static when inside @UtilityClass.
@UtilityClass
public class BillingRates {

    // ── 2-Wheeler rates ───────────────────────────────────────
    public final BigDecimal TWO_WHEELER_BASE      = new BigDecimal("10.00");
    public final BigDecimal TWO_WHEELER_HOURLY    = new BigDecimal("5.00");
    public final BigDecimal TWO_WHEELER_DAILY_CAP = new BigDecimal("80.00");

    // ── 4-Wheeler rates ───────────────────────────────────────
    public final BigDecimal FOUR_WHEELER_BASE      = new BigDecimal("20.00");
    public final BigDecimal FOUR_WHEELER_HOURLY    = new BigDecimal("10.00");
    public final BigDecimal FOUR_WHEELER_DAILY_CAP = new BigDecimal("200.00");

}