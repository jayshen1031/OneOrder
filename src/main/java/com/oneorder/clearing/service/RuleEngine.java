package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.Order;
import com.oneorder.clearing.entity.ClearingResult;
import com.oneorder.clearing.entity.ClearingRule;

import java.util.List;

/**
 * 规则引擎接口
 */
public interface RuleEngine {
    
    /**
     * 应用规则处理清分结果
     * @param order 订单信息
     * @param results 原始清分结果
     * @return 处理后的清分结果
     */
    List<ClearingResult> applyRules(Order order, List<ClearingResult> results);
    
    /**
     * 处理借抬头规则
     * @param order 订单信息
     * @param results 清分结果
     * @return 处理后的清分结果
     */
    List<ClearingResult> processTransitEntityRules(Order order, List<ClearingResult> results);
    
    /**
     * 处理过账规则
     * @param order 订单信息
     * @param results 清分结果
     * @return 处理后的清分结果
     */
    List<ClearingResult> processCrossBorderRules(Order order, List<ClearingResult> results);
    
    /**
     * 处理净额抵消规则
     * @param order 订单信息
     * @param results 清分结果
     * @return 处理后的清分结果
     */
    List<ClearingResult> processNettingRules(Order order, List<ClearingResult> results);
    
    /**
     * 获取适用的规则列表
     * @param order 订单信息
     * @param ruleType 规则类型
     * @return 规则列表
     */
    List<ClearingRule> getApplicableRules(Order order, ClearingRule.RuleType ruleType);
    
    /**
     * 验证规则条件
     * @param rule 规则
     * @param order 订单信息
     * @return 是否满足条件
     */
    boolean evaluateRuleCondition(ClearingRule rule, Order order);
}