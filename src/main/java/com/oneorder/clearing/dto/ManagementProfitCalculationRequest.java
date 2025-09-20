package com.oneorder.clearing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * 管理账分润计算请求DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagementProfitCalculationRequest {
    
    /**
     * 订单ID
     */
    @NotBlank(message = "订单ID不能为空")
    private String orderId;
    
    /**
     * 是否强制重新计算
     * true: 即使已有计算结果也重新计算
     * false: 如果已有结果则直接返回
     */
    private boolean forceRecalculate = false;
    
    /**
     * 计算备注
     */
    private String calculationNotes;
    
    /**
     * 计算人
     */
    private String calculatedBy;
}