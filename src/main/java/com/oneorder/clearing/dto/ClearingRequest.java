package com.oneorder.clearing.dto;

import com.oneorder.clearing.entity.Order;
import lombok.Data;

import javax.validation.constraints.NotNull;
import java.util.Map;

/**
 * 清分请求DTO
 */
@Data
public class ClearingRequest {
    
    /**
     * 订单信息
     */
    @NotNull(message = "订单信息不能为空")
    private Order order;
    
    /**
     * 是否试算（true：试算不入库，false：正式清分）
     */
    private Boolean isSimulation = false;
    
    /**
     * 强制指定清分模式
     */
    private Order.ClearingMode forceClearingMode;
    
    /**
     * 额外参数
     */
    private Map<String, Object> parameters;
    
    /**
     * 操作人
     */
    private String operator;
    
    /**
     * 备注
     */
    private String remarks;
}