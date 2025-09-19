package com.oneorder.clearing.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 批量服务派单请求DTO
 */
@Data
public class BatchServiceAssignmentRequest {
    
    /**
     * 派单列表
     */
    @NotEmpty(message = "派单列表不能为空")
    @Valid
    private List<ServiceAssignmentRequest> assignments;
    
    /**
     * 批量操作备注
     */
    private String batchNotes;
    
    /**
     * 是否并行处理
     */
    private Boolean parallel = true;
}