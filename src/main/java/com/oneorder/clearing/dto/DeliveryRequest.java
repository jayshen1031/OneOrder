package com.oneorder.clearing.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 提货请求
 */
@Data
public class DeliveryRequest {
    
    @NotNull(message = "提货时间不能为空")
    private LocalDateTime deliveryTime;
    
    private String deliveryReceipt;
    private String receiverName;
    private String receiverPhone;
    private String deliveryAddress;
    private String driverName;
    private String truckNo;
    private String remarks;
}