package com.oneorder.clearing.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单服务DTO
 */
@Data
public class OrderServiceDTO {
    private Long serviceId;
    private String orderId;
    private String orderNo;
    private String customerName;
    private String serviceConfigId;
    private String serviceCode;
    private String serviceName;
    private String serviceDescription;
    private BigDecimal serviceAmount;
    private String currency;
    private String priority;
    private String priorityDescription;
    private String status;
    private String statusDescription;
    
    // 派单信息
    private String operationStaffId;
    private String operationStaffName;
    private String operationDepartmentId;
    private String operationDepartmentName;
    private LocalDateTime assignedTime;
    private String assignedBy;
    private String assignedByName;
    
    // 协议信息
    private String internalProtocolId;
    private String protocolName;
    private LocalDateTime protocolConfirmedTime;
    
    // 执行信息
    private LocalDateTime startedTime;
    private LocalDateTime completedTime;
    private String blockReason;
    private String remarks;
    
    // 订单基本信息
    private String businessType;
    private String portOfLoading;
    private String portOfDischarge;
    private String salesStaffId;
    private String salesStaffName;
    private String salesDepartmentId;
    private String salesDepartmentName;
    
    // 状态统计信息
    private boolean canAssign;
    private boolean canConfirmProtocol;
    private boolean canStart;
    private boolean canComplete;
    private boolean canBlock;
    private long daysSinceAssigned;
    private long daysSinceStarted;
}