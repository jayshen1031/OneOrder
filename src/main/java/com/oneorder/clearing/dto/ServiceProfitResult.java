package com.oneorder.clearing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 服务分润结果DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceProfitResult {
    
    /**
     * 服务代码
     */
    private String serviceCode;
    
    /**
     * 服务名称
     */
    private String serviceName;
    
    /**
     * 销售部门ID
     */
    private String salesDepartmentId;
    
    /**
     * 销售部门名称
     */
    private String salesDepartmentName;
    
    /**
     * 操作部门ID
     */
    private String operationDepartmentId;
    
    /**
     * 操作部门名称
     */
    private String operationDepartmentName;
    
    /**
     * 外部收入
     */
    private BigDecimal externalRevenue;
    
    /**
     * 外部支出
     */
    private BigDecimal externalCost;
    
    /**
     * 毛利
     */
    private BigDecimal grossProfit;
    
    /**
     * 毛利率
     */
    private BigDecimal grossProfitMargin;
    
    /**
     * 协议ID
     */
    private Long protocolId;
    
    /**
     * 协议名称
     */
    private String protocolName;
    
    /**
     * 分润比例(如"50:50")
     */
    private String profitSharingRatio;
    
    /**
     * 销售分润金额
     */
    private BigDecimal salesProfitAmount;
    
    /**
     * 操作分润金额
     */
    private BigDecimal operationProfitAmount;
    
    /**
     * 销售内部支出
     */
    private BigDecimal salesInternalPayment;
    
    /**
     * 操作内部收入
     */
    private BigDecimal operationInternalIncome;
    
    /**
     * 销售分润比例
     */
    private BigDecimal salesRatio;
    
    /**
     * 操作分润比例
     */
    private BigDecimal operationRatio;
    
    /**
     * 计算毛利率
     */
    public BigDecimal getGrossProfitMargin() {
        if (externalRevenue == null || externalRevenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return grossProfit.divide(externalRevenue, 4, BigDecimal.ROUND_HALF_UP);
    }
    
    /**
     * 获取销售部门名称
     */
    public String getSalesDepartmentName() {
        if (salesDepartmentName != null) {
            return salesDepartmentName;
        }
        return mapDepartmentIdToName(salesDepartmentId);
    }
    
    /**
     * 获取操作部门名称
     */
    public String getOperationDepartmentName() {
        if (operationDepartmentName != null) {
            return operationDepartmentName;
        }
        return mapDepartmentIdToName(operationDepartmentId);
    }
    
    private String mapDepartmentIdToName(String departmentId) {
        if (departmentId == null) return "";
        
        switch (departmentId) {
            case "OCEAN_SALES": return "海运销售部";
            case "AIR_SALES": return "空运销售部";
            case "LAND_SALES": return "陆运销售部";
            case "OCEAN_OPERATION": return "海运操作部";
            case "AIR_OPERATION": return "空运操作部";
            case "LAND_OPERATION": return "陆运操作部";
            case "CONTAINER_OPERATION": return "内装操作部";
            case "CUSTOMS_OPERATION": return "报关部";
            default: return departmentId;
        }
    }
}