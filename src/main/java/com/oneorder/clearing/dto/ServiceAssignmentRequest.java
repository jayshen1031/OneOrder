package com.oneorder.clearing.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 服务派单请求DTO
 */
@Data
public class ServiceAssignmentRequest {
    
    /**
     * 服务ID
     */
    @NotNull(message = "服务ID不能为空")
    private Long serviceId;
    
    /**
     * 客服ID (派单人)
     */
    @NotBlank(message = "客服ID不能为空")
    private String customerServiceId;
    
    /**
     * 操作人员ID (被派单人)
     */
    @NotBlank(message = "操作人员ID不能为空")
    private String operationStaffId;
    
    /**
     * 内部协议ID
     */
    @NotBlank(message = "内部协议ID不能为空")
    private String protocolId;
    
    /**
     * 派单说明/备注
     */
    private String message;
    
    /**
     * 是否紧急
     */
    private Boolean urgent = false;
    
    /**
     * 预期完成时间
     */
    private java.time.LocalDateTime expectedCompletionTime;
    
    /**
     * 特殊要求
     */
    private String specialRequirements;
}