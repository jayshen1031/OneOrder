package com.oneorder.clearing.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 合约匹配结果DTO
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractMatchResultDTO {
    private String contractId;
    private String contractName;
    private String profitSharingModel; // BUY_SELL_PRICE, COST_PLUS_FEE, RATIO_SHARING, CUSTOM_SCRIPT
    private BigDecimal commissionRate;
    private BigDecimal performanceBonusRate;
    private String terms;
    private LocalDateTime effectiveDate;
    private LocalDateTime expiryDate;
    private Boolean isActive;
}