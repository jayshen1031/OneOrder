package com.oneorder.clearing.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 费用确认响应
 */
@Data
public class CostConfirmResponse {
    
    private String orderId;
    private String orderNo;
    private BigDecimal totalRevenue;
    private BigDecimal totalCost;
    private BigDecimal profit;
    private BigDecimal profitMargin;
    
    private String clearingStatus;
    private LocalDateTime clearingTime;
    private List<ClearingResultSummary> clearingResults;
    
    private String message;
    private boolean success;
    
    @Data
    public static class ClearingResultSummary {
        private String entityId;
        private String entityName;
        private BigDecimal amount;
        private String transactionType;
        private String accountType;
        private String description;
    }
}