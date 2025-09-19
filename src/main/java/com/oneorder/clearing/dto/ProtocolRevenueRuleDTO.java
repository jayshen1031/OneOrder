package com.oneorder.clearing.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 协议分润规则DTO
 */
@Data
public class ProtocolRevenueRuleDTO {
    private String ruleId;
    private String protocolId;
    private String protocolName;
    private String legalEntityId;
    private String legalEntityName;
    private String revenueSplitMethod;
    private String revenueSplitMethodDescription;
    private Double salesCommissionRate;
    private Double operationCommissionRate;
    private Double managementFeeRate;
    private BigDecimal fixedSalesAmount;
    private BigDecimal fixedOperationAmount;
    private BigDecimal fixedManagementAmount;
    private String description;
    private Boolean active;
    private String createdBy;
    private String createdByName;
    
    // 计算字段
    private Double totalRate;
    private BigDecimal totalFixedAmount;
    private String splitMethodDisplay;
}