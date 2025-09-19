package com.oneorder.clearing.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * 服务派单请求DTO
 */
@Data
public class ServiceAssignRequest {
    private List<Long> serviceIds;
    private String operationStaffId;
    private String operationDepartmentId;
    private String internalProtocolId;
    private String priority;
    private BigDecimal serviceAmount;
    private String remarks;
    
    // 批量派单选项
    private boolean autoConfirmProtocol;
    private boolean notifyOperationStaff;
    private String assignReason;
}