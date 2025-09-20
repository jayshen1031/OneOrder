package com.oneorder.clearing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 部门分润汇总DTO - 五项要素
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentProfitSummary {
    
    /**
     * 订单ID
     */
    private String orderId;
    
    /**
     * 部门ID
     */
    private String departmentId;
    
    /**
     * 部门名称
     */
    private String departmentName;
    
    /**
     * 部门类型: SALES/OPERATION
     */
    private String departmentType;
    
    /**
     * 外部收入 - 向客户收取的费用
     */
    private BigDecimal externalRevenue;
    
    /**
     * 内部收入 - 从其他部门收取的费用
     */
    private BigDecimal internalIncome;
    
    /**
     * 内部支出 - 向其他部门支付的费用
     */
    private BigDecimal internalPayment;
    
    /**
     * 外部支出 - 向外部供应商支付的费用
     */
    private BigDecimal externalCost;
    
    /**
     * 部门毛利 = 外部收入 + 内部收入 - 内部支出 - 外部支出
     */
    private BigDecimal departmentProfit;
    
    /**
     * 利润率 = 部门毛利 / (外部收入 + 内部收入)
     */
    private BigDecimal profitMargin;
    
    /**
     * 涉及服务数量
     */
    private Integer serviceCount;
    
    /**
     * 计算时间
     */
    private LocalDateTime calculationTime;
    
    /**
     * 计算版本
     */
    private Integer calculationVersion;
    
    /**
     * 部门类型中文名称
     */
    public String getDepartmentTypeName() {
        if ("SALES".equals(departmentType)) {
            return "销售部门";
        } else if ("OPERATION".equals(departmentType)) {
            return "操作部门";
        }
        return departmentType;
    }
    
    /**
     * 获取总收入 = 外部收入 + 内部收入
     */
    public BigDecimal getTotalIncome() {
        BigDecimal external = externalRevenue != null ? externalRevenue : BigDecimal.ZERO;
        BigDecimal internal = internalIncome != null ? internalIncome : BigDecimal.ZERO;
        return external.add(internal);
    }
    
    /**
     * 获取总支出 = 内部支出 + 外部支出
     */
    public BigDecimal getTotalCost() {
        BigDecimal internal = internalPayment != null ? internalPayment : BigDecimal.ZERO;
        BigDecimal external = externalCost != null ? externalCost : BigDecimal.ZERO;
        return internal.add(external);
    }
    
    /**
     * 验证部门毛利计算是否正确
     */
    public boolean validateProfitCalculation() {
        BigDecimal calculatedProfit = getTotalIncome().subtract(getTotalCost());
        BigDecimal actualProfit = departmentProfit != null ? departmentProfit : BigDecimal.ZERO;
        
        // 允许0.01的误差
        return calculatedProfit.subtract(actualProfit).abs().compareTo(new BigDecimal("0.01")) <= 0;
    }
    
    /**
     * 获取收入结构描述
     */
    public String getIncomeStructure() {
        StringBuilder structure = new StringBuilder();
        BigDecimal total = getTotalIncome();
        
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return "无收入";
        }
        
        if (externalRevenue != null && externalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal percentage = externalRevenue.divide(total, 2, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100"));
            structure.append("外部收入").append(percentage).append("%");
        }
        
        if (internalIncome != null && internalIncome.compareTo(BigDecimal.ZERO) > 0) {
            if (structure.length() > 0) structure.append(" + ");
            BigDecimal percentage = internalIncome.divide(total, 2, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100"));
            structure.append("内部收入").append(percentage).append("%");
        }
        
        return structure.toString();
    }
    
    /**
     * 获取成本结构描述
     */
    public String getCostStructure() {
        StringBuilder structure = new StringBuilder();
        BigDecimal total = getTotalCost();
        
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return "无支出";
        }
        
        if (internalPayment != null && internalPayment.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal percentage = internalPayment.divide(total, 2, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100"));
            structure.append("内部支出").append(percentage).append("%");
        }
        
        if (externalCost != null && externalCost.compareTo(BigDecimal.ZERO) > 0) {
            if (structure.length() > 0) structure.append(" + ");
            BigDecimal percentage = externalCost.divide(total, 2, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100"));
            structure.append("外部支出").append(percentage).append("%");
        }
        
        return structure.toString();
    }
}