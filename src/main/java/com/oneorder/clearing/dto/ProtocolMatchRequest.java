package com.oneorder.clearing.dto;

import lombok.Data;

/**
 * 协议匹配请求DTO
 */
@Data
public class ProtocolMatchRequest {
    private String salesDepartmentId;
    private String operationDepartmentId;
    private String serviceCode;
    private String businessType;
    private String orderId;
    
    // 可选的过滤条件
    private Double minCommissionRate;
    private Double maxCommissionRate;
    private Boolean includeExpiring;
    private Integer maxResults;
}