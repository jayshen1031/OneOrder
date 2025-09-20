package com.oneorder.clearing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 管理账分润计算结果DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagementProfitCalculationResult {
    
    /**
     * 订单ID
     */
    private String orderId;
    
    /**
     * 计算时间
     */
    private LocalDateTime calculationTime;
    
    /**
     * 总毛利
     */
    private BigDecimal totalGrossProfit;
    
    /**
     * 服务数量
     */
    private Integer serviceCount;
    
    /**
     * 部门数量
     */
    private Integer departmentCount;
    
    /**
     * 计算版本
     */
    private Integer calculationVersion;
    
    /**
     * 服务分润结果列表
     */
    private List<ServiceProfitResult> serviceProfitResults;
    
    /**
     * 部门汇总列表
     */
    private List<DepartmentProfitSummary> departmentSummaries;
    
    /**
     * 验证结果
     */
    private ValidationResult validationResult;
    
    /**
     * 计算状态
     */
    private String calculationStatus;
    
    /**
     * 计算耗时(毫秒)
     */
    private Long calculationDurationMs;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationResult {
        
        /**
         * 内部收支是否平衡
         */
        private boolean internalBalanced;
        
        /**
         * 部门毛利是否等于总毛利
         */
        private boolean profitConsistent;
        
        /**
         * 内部收入总和
         */
        private BigDecimal totalInternalIncome;
        
        /**
         * 内部支出总和
         */
        private BigDecimal totalInternalPayment;
        
        /**
         * 内部收支差额
         */
        private BigDecimal internalBalance;
        
        /**
         * 验证错误信息
         */
        private List<String> validationErrors;
    }
}