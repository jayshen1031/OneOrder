package com.oneorder.clearing.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单创建请求DTO
 */
@Data
public class OrderCreationRequest {
    
    /**
     * 客服ID (当前登录的客服)
     */
    @NotBlank(message = "客服ID不能为空")
    private String customerServiceId;
    
    /**
     * 客户ID
     */
    @NotBlank(message = "客户ID不能为空")
    private String customerId;
    
    /**
     * 业务类型
     */
    @NotBlank(message = "业务类型不能为空")
    private String businessType;
    
    /**
     * 选定的服务编码列表
     */
    @NotEmpty(message = "必须选择至少一个服务")
    private List<String> selectedServices;
    
    // ==================== 运输信息 ====================
    
    /**
     * 起运港/地
     */
    private String portOfLoading;
    
    /**
     * 目的港/地
     */
    private String portOfDischarge;
    
    /**
     * 预计开船/起运日期
     */
    private LocalDateTime estimatedDeparture;
    
    /**
     * 预计到达日期
     */
    private LocalDateTime estimatedArrival;
    
    // ==================== 货物信息 ====================
    
    /**
     * 货物描述
     */
    private String cargoDescription;
    
    /**
     * 件数
     */
    private Integer packageCount;
    
    /**
     * 重量 (KG)
     */
    private BigDecimal weight;
    
    /**
     * 体积 (CBM)
     */
    private BigDecimal volume;
    
    // ==================== 其他信息 ====================
    
    /**
     * 特殊要求/备注
     */
    private String specialRequirements;
    
    /**
     * 是否紧急订单
     */
    private Boolean urgent = false;
    
    /**
     * 客户参考号
     */
    private String customerReference;
}