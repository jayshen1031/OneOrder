package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.Order;
import com.oneorder.clearing.entity.ClearingResult;
import com.oneorder.clearing.dto.ClearingRequest;
import com.oneorder.clearing.dto.ClearingResponse;

import java.util.List;

/**
 * 清分引擎接口
 */
public interface ClearingEngine {
    
    /**
     * 执行清分计算
     * @param request 清分请求
     * @return 清分结果
     */
    ClearingResponse executeClearing(ClearingRequest request);
    
    /**
     * 试算清分结果（不入库）
     * @param order 订单信息
     * @return 清分结果列表
     */
    List<ClearingResult> calculateClearing(Order order);
    
    /**
     * 星式清分
     * @param order 订单信息
     * @return 清分结果列表
     */
    List<ClearingResult> starModeClearing(Order order);
    
    /**
     * 链式清分
     * @param order 订单信息
     * @return 清分结果列表
     */
    List<ClearingResult> chainModeClearing(Order order);
    
    /**
     * 验证清分结果
     * @param results 清分结果列表
     * @return 验证是否通过
     */
    boolean validateClearingResults(List<ClearingResult> results);
}