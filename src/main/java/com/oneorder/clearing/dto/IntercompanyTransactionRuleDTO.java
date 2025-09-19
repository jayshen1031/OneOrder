package com.oneorder.clearing.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 法人间关联交易规则DTO
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IntercompanyTransactionRuleDTO {
    private String ruleId;
    private String correspondingTermsId;
    private String salesEntityId;
    private String salesEntityName;
    private String deliveryEntityId;
    private String deliveryEntityName;
    private String transactionMode; // RATIO_RETENTION, COST_RATIO_MARKUP, COST_FIXED_MARKUP
    private BigDecimal salesProfitRetentionRatio;
    private BigDecimal deliveryProfitRetentionRatio;
    private BigDecimal costMarkupRatio;
    private BigDecimal fixedMarkupAmount;
    private String fixedMarkupCurrency;
    private LocalDateTime createdTime;
}