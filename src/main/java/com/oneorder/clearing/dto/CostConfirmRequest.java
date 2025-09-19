package com.oneorder.clearing.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

/**
 * 费用确认请求
 */
@Data
public class CostConfirmRequest {
    
    @NotNull(message = "总收入不能为空")
    private BigDecimal totalRevenue;
    
    @NotNull(message = "总成本不能为空")
    private BigDecimal totalCost;
    
    private List<CostItemRequest> costItems;
    
    private String remarks;
    
    @Data
    public static class CostItemRequest {
        private String costType;
        private String description;
        private BigDecimal budgetAmount;
        private BigDecimal actualAmount;
        private String currency;
        private String supplier;
        private String status;
        private String remarks;
    }
}