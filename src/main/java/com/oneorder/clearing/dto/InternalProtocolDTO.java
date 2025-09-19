package com.oneorder.clearing.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 内部协议DTO
 */
@Data
public class InternalProtocolDTO {
    private String protocolId;
    private String protocolName;
    private String salesDepartmentId;
    private String salesDepartmentName;
    private String operationDepartmentId;
    private String operationDepartmentName;
    private String serviceCode;
    private String serviceName;
    private String businessType;
    private BigDecimal baseCommissionRate;
    private BigDecimal performanceBonusRate;
    private BigDecimal totalCommissionRate;
    private Boolean active;
    private LocalDate effectiveDate;
    private LocalDate expiryDate;
    private String createdBy;
    private String createdByName;
    
    // 分润规则列表
    private List<ProtocolRevenueRuleDTO> revenueRules;
    
    // 协议状态信息
    private boolean effective;
    private String status;
    private String statusDescription;
}