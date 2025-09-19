package com.oneorder.clearing.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 考核补贴规则DTO
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssessmentSubsidyRuleDTO {
    private String ruleId;
    private String ruleNameCn;
    private String ruleNameEn;
    private String applicableCostCenters;
    private String applicableServices;
    private String subsidyConditions;
    private String subsidyCostCenterType; // SALES, DELIVERY
    private String subsidyMode; // PROFIT_MARKUP, FIXED_SUBSIDY
    private String markupBase; // TOTAL_PROFIT, DEPT_PROFIT
    private BigDecimal markupCoefficient;
    private Boolean excludeNegativeProfit;
    private String subsidyCurrency;
    private String unitOfMeasurement;
    private BigDecimal unitSubsidyAmount;
    private BigDecimal minimumSubsidyPerOrder;
    private BigDecimal maximumSubsidyPerOrder;
    private Boolean isCommissionCalculated;
    private LocalDate validFrom;
    private LocalDate validTo;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
    
    // 解析后的列表
    private List<String> applicableCostCentersList;
    private List<String> applicableServicesList;
    
    // 状态信息
    private Boolean isCurrentlyValid;
    private Integer daysUntilExpiration;
}