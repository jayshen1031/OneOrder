package com.oneorder.clearing.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.util.List;

/**
 * 创建货代订单请求
 */
@Data
public class CreateFreightOrderRequest {
    
    @NotBlank(message = "订单编号不能为空")
    private String orderNo;
    
    @NotBlank(message = "客户ID不能为空")
    private String customerId;
    
    @NotBlank(message = "客户名称不能为空")
    private String customerName;
    
    @NotBlank(message = "销售法人体ID不能为空")
    private String salesEntityId;
    
    private String deliveryEntityId;
    private String paymentEntityId;
    
    @NotBlank(message = "起运港不能为空")
    private String portOfLoading;
    
    @NotBlank(message = "目的港不能为空")
    private String portOfDischarge;
    
    @NotBlank(message = "货物描述不能为空")
    private String commodityDescription;
    
    @DecimalMin(value = "0", message = "货物重量不能为负数")
    private BigDecimal weight;
    
    @DecimalMin(value = "0", message = "货物体积不能为负数")
    private BigDecimal volume;
    
    private Integer containers;
    
    @NotBlank(message = "贸易条款不能为空")
    private String tradeTerms;
    
    @DecimalMin(value = "0", message = "报价金额不能为负数")
    private BigDecimal quotedAmount;
    
    @NotBlank(message = "币种不能为空")
    private String currency;
    
    @NotBlank(message = "清分模式不能为空")
    private String clearingMode;
    
    private String specialRequirements;
    
    private List<OrderItemRequest> orderItems;
    
    @Data
    public static class OrderItemRequest {
        @NotBlank(message = "费用类型不能为空")
        private String costType;
        
        @NotBlank(message = "费用描述不能为空")
        private String description;
        
        @NotNull(message = "费用金额不能为空")
        @DecimalMin(value = "0", message = "费用金额不能为负数")
        private BigDecimal amount;
        
        private String currency;
        private String supplier;
        private String remarks;
    }
}