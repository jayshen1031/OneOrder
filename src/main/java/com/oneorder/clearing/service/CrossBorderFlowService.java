package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.CrossBorderFlow;
import com.oneorder.clearing.entity.Order;
import com.oneorder.clearing.entity.ClearingResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 过账流程服务接口
 */
public interface CrossBorderFlowService {
    
    /**
     * 判断订单是否需要过账处理
     * @param order 订单
     * @return 是否需要过账处理
     */
    boolean requiresCrossBorderFlow(Order order);
    
    /**
     * 获取适用的过账流程配置
     * @param order 订单
     * @return 过账流程列表
     */
    List<CrossBorderFlow> getApplicableCrossBorderFlows(Order order);
    
    /**
     * 处理过账流程
     * 如：宁波付款 → 香港过账 → 泰国收款
     * @param order 订单
     * @param amount 金额
     * @return 清分结果列表
     */
    List<ClearingResult> processCrossBorderFlow(Order order, BigDecimal amount);
    
    /**
     * 处理过账抵消
     * @param orders 同批次订单列表
     * @return 抵消处理结果
     */
    Map<String, List<ClearingResult>> processNettingRules(List<Order> orders);
    
    /**
     * 计算过账公司留存金额
     * @param crossBorderFlow 过账流程配置
     * @param originalAmount 原始金额
     * @return 留存金额
     */
    BigDecimal calculateTransitRetention(CrossBorderFlow crossBorderFlow, BigDecimal originalAmount);
    
    /**
     * 处理平收平付
     * @param order 订单
     * @param crossBorderFlow 过账流程配置
     * @param amount 金额
     * @return 清分结果列表
     */
    List<ClearingResult> processFlatTransfer(Order order, CrossBorderFlow crossBorderFlow, BigDecimal amount);
    
    /**
     * 处理差额流转
     * @param order 订单
     * @param crossBorderFlow 过账流程配置
     * @param amount 金额
     * @return 清分结果列表
     */
    List<ClearingResult> processNetTransfer(Order order, CrossBorderFlow crossBorderFlow, BigDecimal amount);
    
    /**
     * 检查抵消条件是否满足
     * @param orders 订单列表
     * @param crossBorderFlow 过账流程配置
     * @return 是否满足抵消条件
     */
    boolean canApplyNetting(List<Order> orders, CrossBorderFlow crossBorderFlow);
    
    /**
     * 生成抵消处理报告
     * @param nettingResults 抵消结果
     * @return 抵消报告
     */
    String generateNettingReport(Map<String, List<ClearingResult>> nettingResults);
}