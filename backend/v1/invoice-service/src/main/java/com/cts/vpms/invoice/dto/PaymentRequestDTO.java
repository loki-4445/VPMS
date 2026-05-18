package com.cts.vpms.invoice.dto;

import com.cts.vpms.invoice.enums.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import jakarta.validation.constraints.NotNull;

// Request body for POST /api/billing/pay
// CONCEPT: Jackson deserializes the JSON body into this class.
// It calls the no-arg constructor first, then each setter.
// Example JSON: { "invoiceId": 1, "paymentMethod": "UPI" }
@Schema(description = "Request body to confirm payment for an invoice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class PaymentRequestDTO {

    // CONCEPT: @NotNull — invoiceId must be provided.
    // message → shown in the validation error response body.
    @NotNull(message = "Request body to confirm payment for an invoice")
    @Schema(description = "ID of the invoice to pay", example = "1")
    private Long invoiceId;

    // CONCEPT: @NotNull on an enum field — caller must supply a valid enum value.
    // Jackson will reject unknown strings before validation even runs,
    // but @NotNull ensures the field is not simply omitted from the JSON body.
    @NotNull(message = "Payment method must not be null")
    @Schema(description = "Payment method chosen by the customer",
            example = "UPI",
            allowableValues = {"UPI", "CASH", "CARD", "WALLET"})
    private PaymentMethod paymentMethod;
}