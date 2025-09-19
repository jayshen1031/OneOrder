package com.oneorder.clearing.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 报表请求参数DTO
 */
@Data
public class ReportRequest {
    
    /**
     * 开始时间
     */
    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startTime;
    
    /**
     * 结束时间
     */
    @NotNull(message = "结束时间不能为空")
    private LocalDateTime endTime;
    
    /**
     * 法人体ID列表（可选，为空则查询所有）
     */
    private List<String> entityIds;
    
    /**
     * 币种列表（可选，为空则查询所有）
     */
    private List<String> currencies;
    
    /**
     * 业务类型列表（可选）
     */
    private List<String> businessTypes;
    
    /**
     * 清分模式（可选）
     */
    private String clearingMode;
    
    /**
     * 是否包含中转留存
     */
    private Boolean includeTransitRetention = true;
    
    /**
     * 分组维度：ENTITY（法人体）、CURRENCY（币种）、BUSINESS_TYPE（业务类型）
     */
    private String groupBy = "ENTITY";
    
    /**
     * 排序字段
     */
    private String sortBy = "entity_id";
    
    /**
     * 排序方向：ASC | DESC
     */
    private String sortDirection = "ASC";
    
    /**
     * 页码（分页查询）
     */
    private Integer pageNumber = 0;
    
    /**
     * 每页大小（分页查询）
     */
    private Integer pageSize = 100;
    
    /**
     * 是否只查询有差异的记录
     */
    private Boolean onlyDifferences = false;
    
    /**
     * 报表标题
     */
    private String reportTitle;
    
    /**
     * 备注
     */
    private String remarks;
}