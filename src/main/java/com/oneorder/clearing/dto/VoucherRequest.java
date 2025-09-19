package com.oneorder.clearing.dto;

import com.oneorder.clearing.entity.ClearingResult;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 凭证创建请求DTO
 */
@Data
public class VoucherRequest {
    
    /**
     * 订单ID
     */
    @NotNull(message = "订单ID不能为空")
    private String orderId;
    
    /**
     * 清分结果列表
     */
    @NotEmpty(message = "清分结果不能为空")
    private List<ClearingResult> clearingResults;
    
    /**
     * 操作人
     */
    @NotNull(message = "操作人不能为空")
    private String operator;
    
    /**
     * 凭证摘要
     */
    private String summary;
    
    /**
     * 是否自动过账
     */
    private Boolean autoPost = false;
    
    /**
     * 备注
     */
    private String remarks;
}