package com.oneorder.clearing.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 货代订单响应
 */
@Data
public class FreightOrderResponse {
    
    private String orderId;
    private String orderNo;
    private String customerId;
    private String customerName;
    private String salesEntityId;
    private String deliveryEntityId;
    private String paymentEntityId;
    
    private String portOfLoading;
    private String portOfDischarge;
    private String commodityDescription;
    private BigDecimal weight;
    private BigDecimal volume;
    private Integer containers;
    private String tradeTerms;
    
    private BigDecimal totalAmount;
    private BigDecimal totalCost;
    private BigDecimal estimatedProfit;
    private String currency;
    
    private String orderStatus;
    private String clearingStatus;
    private String clearingMode;
    
    private LocalDateTime orderDate;
    private LocalDateTime bookingDate;
    private LocalDateTime customsDate;
    private LocalDateTime shippingDate;
    private LocalDateTime arrivalDate;
    private LocalDateTime deliveryDate;
    
    // 船期信息
    private String vesselName;
    private String voyage;
    private LocalDateTime etd;
    private LocalDateTime eta;
    private LocalDateTime actualDeparture;
    private LocalDateTime actualArrival;
    
    // 报关信息
    private String customsDeclarationNo;
    private String customsStatus;
    
    // 费用明细
    private List<OrderItemResponse> orderItems;
    
    // 操作时间轴
    private List<OrderEventResponse> timeline;
    
    private String specialRequirements;
    private String currentStage;
    private String nextAction;
    private String remarks;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    public static class OrderItemResponse {
        private String itemId;
        private String costType;
        private String description;
        private BigDecimal amount;
        private BigDecimal actualAmount;
        private String currency;
        private String supplier;
        private String status;
        private String remarks;
    }
    
    @Data
    public static class OrderEventResponse {
        private String eventId;
        private String eventType;
        private String description;
        private String operator;
        private LocalDateTime timestamp;
        private String status;
        private String remarks;
    }
}