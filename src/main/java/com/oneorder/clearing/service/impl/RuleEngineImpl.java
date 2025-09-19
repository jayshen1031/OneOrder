package com.oneorder.clearing.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oneorder.clearing.entity.Order;
import com.oneorder.clearing.entity.ClearingResult;
import com.oneorder.clearing.entity.ClearingRule;
import com.oneorder.clearing.entity.LegalEntity;
import com.oneorder.clearing.service.RuleEngine;
import com.oneorder.clearing.repository.ClearingRuleRepository;
import com.oneorder.clearing.repository.LegalEntityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 规则引擎实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RuleEngineImpl implements RuleEngine {
    
    private final ClearingRuleRepository ruleRepository;
    private final LegalEntityRepository entityRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    public List<ClearingResult> applyRules(Order order, List<ClearingResult> results) {
        log.debug("开始应用规则处理，订单ID: {}", order.getOrderId());
        
        List<ClearingResult> processedResults = new ArrayList<>(results);
        
        // 1. 处理借抬头规则
        processedResults = processTransitEntityRules(order, processedResults);
        
        // 2. 处理过账规则
        processedResults = processCrossBorderRules(order, processedResults);
        
        // 3. 处理净额抵消规则
        processedResults = processNettingRules(order, processedResults);
        
        // 4. 处理管报与法报差异
        processedResults = processReportingDifferences(order, processedResults);
        
        log.debug("规则处理完成，最终生成{}条记录", processedResults.size());
        return processedResults;
    }
    
    @Override
    public List<ClearingResult> processTransitEntityRules(Order order, List<ClearingResult> results) {
        List<ClearingRule> transitRules = getApplicableRules(order, ClearingRule.RuleType.TRANSIT_ENTITY);
        
        if (transitRules.isEmpty()) {
            return results;
        }
        
        List<ClearingResult> processedResults = new ArrayList<>(results);
        
        for (ClearingRule rule : transitRules) {
            try {
                Map<String, Object> config = parseRuleConfig(rule.getRuleConfig());
                
                String transitEntityId = (String) config.get("transitEntityId");
                BigDecimal retentionRate = new BigDecimal(config.get("retentionRate").toString());
                String applicableType = (String) config.get("applicableType"); // "RECEIVABLE" or "PAYABLE"
                
                // 查找需要处理的清分结果
                List<ClearingResult> targetResults = processedResults.stream()
                    .filter(r -> shouldApplyTransitRule(r, applicableType))
                    .collect(Collectors.toList());
                
                for (ClearingResult targetResult : targetResults) {
                    // 创建借抬头中转记录
                    ClearingResult transitResult = createTransitRetentionResult(
                        order, transitEntityId, targetResult, retentionRate
                    );
                    processedResults.add(transitResult);
                    
                    // 调整原记录金额
                    BigDecimal retentionAmount = targetResult.getAmount()
                        .multiply(retentionRate)
                        .setScale(2, RoundingMode.HALF_UP);
                    targetResult.setAmount(targetResult.getAmount().subtract(retentionAmount));
                    targetResult.setOriginalAmount(targetResult.getAmount().add(retentionAmount));
                    targetResult.setRetentionRate(retentionRate);
                    targetResult.setRuleId(rule.getRuleId());
                }
                
            } catch (Exception e) {
                log.error("处理借抬头规则失败，规则ID: {}", rule.getRuleId(), e);
            }
        }
        
        return processedResults;
    }
    
    @Override
    public List<ClearingResult> processCrossBorderRules(Order order, List<ClearingResult> results) {
        List<ClearingRule> crossBorderRules = getApplicableRules(order, ClearingRule.RuleType.CROSS_BORDER);
        
        if (crossBorderRules.isEmpty()) {
            return results;
        }
        
        List<ClearingResult> processedResults = new ArrayList<>(results);
        
        for (ClearingRule rule : crossBorderRules) {
            try {
                Map<String, Object> config = parseRuleConfig(rule.getRuleConfig());
                
                String transitEntityId = (String) config.get("transitEntityId");
                Boolean enableNetting = (Boolean) config.getOrDefault("enableNetting", false);
                BigDecimal handlingFee = config.containsKey("handlingFee") ? 
                    new BigDecimal(config.get("handlingFee").toString()) : BigDecimal.ZERO;
                
                // 处理跨境过账
                List<ClearingResult> crossBorderResults = processedResults.stream()
                    .filter(r -> needsCrossBorderProcessing(r, order))
                    .collect(Collectors.toList());
                
                for (ClearingResult crossBorderResult : crossBorderResults) {
                    // 创建过账中转记录
                    if (handlingFee.compareTo(BigDecimal.ZERO) > 0) {
                        ClearingResult handlingFeeResult = createHandlingFeeResult(
                            order, transitEntityId, handlingFee
                        );
                        processedResults.add(handlingFeeResult);
                    }
                    
                    crossBorderResult.setRuleId(rule.getRuleId());
                }
                
            } catch (Exception e) {
                log.error("处理过账规则失败，规则ID: {}", rule.getRuleId(), e);
            }
        }
        
        return processedResults;
    }
    
    @Override
    public List<ClearingResult> processNettingRules(Order order, List<ClearingResult> results) {
        List<ClearingRule> nettingRules = getApplicableRules(order, ClearingRule.RuleType.NETTING);
        
        if (nettingRules.isEmpty()) {
            return results;
        }
        
        List<ClearingResult> processedResults = new ArrayList<>(results);
        
        for (ClearingRule rule : nettingRules) {
            try {
                Map<String, Object> config = parseRuleConfig(rule.getRuleConfig());
                
                BigDecimal threshold = new BigDecimal(config.get("threshold").toString());
                
                // 按法人体分组计算净额
                Map<String, List<ClearingResult>> entityGroups = processedResults.stream()
                    .collect(Collectors.groupingBy(ClearingResult::getEntityId));
                
                for (Map.Entry<String, List<ClearingResult>> entry : entityGroups.entrySet()) {
                    String entityId = entry.getKey();
                    List<ClearingResult> entityResults = entry.getValue();
                    
                    BigDecimal netAmount = entityResults.stream()
                        .map(ClearingResult::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    // 如果净额超过阈值，进行净额处理
                    if (netAmount.abs().compareTo(threshold) >= 0) {
                        ClearingResult nettingResult = createNettingResult(order, entityId, netAmount);
                        nettingResult.setRuleId(rule.getRuleId());
                        processedResults.add(nettingResult);
                    }
                }
                
            } catch (Exception e) {
                log.error("处理净额规则失败，规则ID: {}", rule.getRuleId(), e);
            }
        }
        
        return processedResults;
    }
    
    @Override
    public List<ClearingRule> getApplicableRules(Order order, ClearingRule.RuleType ruleType) {
        List<ClearingRule> allRules = ruleRepository.findByRuleTypeAndIsActiveTrue(ruleType);
        
        return allRules.stream()
            .filter(rule -> evaluateRuleCondition(rule, order))
            .sorted(Comparator.comparing(ClearingRule::getPriority))
            .collect(Collectors.toList());
    }
    
    @Override
    public boolean evaluateRuleCondition(ClearingRule rule, Order order) {
        if (rule.getConditionExpression() == null || rule.getConditionExpression().trim().isEmpty()) {
            return true;
        }
        
        try {
            // 简单的条件表达式解析（实际项目中可以使用SpEL或其他表达式引擎）
            String condition = rule.getConditionExpression();
            
            // 替换变量
            condition = condition.replace("${order.currency}", "\"" + order.getCurrency() + "\"");
            condition = condition.replace("${order.businessType}", "\"" + (order.getBusinessType() != null ? order.getBusinessType() : "") + "\"");
            condition = condition.replace("${order.totalAmount}", order.getTotalAmount().toString());
            
            // 这里简化处理，实际项目中应该使用专业的表达式引擎
            return evaluateSimpleCondition(condition, order);
            
        } catch (Exception e) {
            log.warn("规则条件评估失败，规则ID: {}，条件: {}", rule.getRuleId(), rule.getConditionExpression(), e);
            return false;
        }
    }
    
    /**
     * 处理管报与法报差异
     */
    private List<ClearingResult> processReportingDifferences(Order order, List<ClearingResult> results) {
        List<ClearingRule> reportingRules = getApplicableRules(order, ClearingRule.RuleType.RETENTION);
        
        for (ClearingRule rule : reportingRules) {
            try {
                Map<String, Object> config = parseRuleConfig(rule.getRuleConfig());
                
                String targetEntityId = (String) config.get("targetEntityId");
                BigDecimal managementRate = new BigDecimal(config.get("managementRate").toString());
                BigDecimal legalRate = new BigDecimal(config.get("legalRate").toString());
                
                // 查找需要调整的清分结果
                results.stream()
                    .filter(r -> targetEntityId.equals(r.getEntityId()))
                    .forEach(r -> {
                        // 管理口径：按managementRate计算
                        BigDecimal managementAmount = r.getAmount().multiply(managementRate);
                        r.setManagementAmount(managementAmount);
                        
                        // 法定口径：按legalRate计算
                        BigDecimal legalAmount = r.getAmount().multiply(legalRate);
                        r.setLegalAmount(legalAmount);
                        
                        r.setRuleId(rule.getRuleId());
                    });
                    
            } catch (Exception e) {
                log.error("处理报表差异规则失败，规则ID: {}", rule.getRuleId(), e);
            }
        }
        
        return results;
    }
    
    /**
     * 解析规则配置JSON
     */
    private Map<String, Object> parseRuleConfig(String ruleConfig) {
        try {
            if (ruleConfig == null || ruleConfig.trim().isEmpty()) {
                return new HashMap<>();
            }
            return objectMapper.readValue(ruleConfig, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("解析规则配置失败: {}", ruleConfig, e);
            return new HashMap<>();
        }
    }
    
    /**
     * 判断是否应用借抬头规则
     */
    private boolean shouldApplyTransitRule(ClearingResult result, String applicableType) {
        if ("RECEIVABLE".equals(applicableType)) {
            return ClearingResult.TransactionType.RECEIVABLE.equals(result.getTransactionType());
        } else if ("PAYABLE".equals(applicableType)) {
            return ClearingResult.TransactionType.PAYABLE.equals(result.getTransactionType());
        }
        return false;
    }
    
    /**
     * 创建借抬头留存记录
     */
    private ClearingResult createTransitRetentionResult(Order order, String transitEntityId,
                                                      ClearingResult originalResult, BigDecimal retentionRate) {
        ClearingResult transitResult = new ClearingResult();
        transitResult.setResultId(UUID.randomUUID().toString());
        transitResult.setOrder(order);
        transitResult.setEntityId(transitEntityId);
        
        BigDecimal retentionAmount = originalResult.getAmount()
            .multiply(retentionRate)
            .setScale(2, RoundingMode.HALF_UP);
        
        transitResult.setAmount(retentionAmount);
        transitResult.setCurrency(originalResult.getCurrency());
        transitResult.setTransactionType(ClearingResult.TransactionType.TRANSIT_FEE);
        transitResult.setAccountType(ClearingResult.AccountType.INTERNAL_RECEIVABLE);
        transitResult.setClearingMode(originalResult.getClearingMode());
        transitResult.setIsTransitRetention(true);
        transitResult.setRetentionRate(retentionRate);
        transitResult.setOriginalAmount(originalResult.getAmount());
        
        return transitResult;
    }
    
    /**
     * 判断是否需要跨境处理
     */
    private boolean needsCrossBorderProcessing(ClearingResult result, Order order) {
        // 简单判断：如果涉及不同地区的法人体，则需要跨境处理
        // 实际项目中可以根据具体业务规则判断
        return true; // 简化处理
    }
    
    /**
     * 创建手续费记录
     */
    private ClearingResult createHandlingFeeResult(Order order, String transitEntityId, BigDecimal handlingFee) {
        ClearingResult feeResult = new ClearingResult();
        feeResult.setResultId(UUID.randomUUID().toString());
        feeResult.setOrder(order);
        feeResult.setEntityId(transitEntityId);
        feeResult.setAmount(handlingFee);
        feeResult.setCurrency(order.getCurrency());
        feeResult.setTransactionType(ClearingResult.TransactionType.TRANSIT_FEE);
        feeResult.setAccountType(ClearingResult.AccountType.INTERNAL_RECEIVABLE);
        feeResult.setClearingMode(order.getClearingMode());
        
        return feeResult;
    }
    
    /**
     * 创建净额记录
     */
    private ClearingResult createNettingResult(Order order, String entityId, BigDecimal netAmount) {
        ClearingResult nettingResult = new ClearingResult();
        nettingResult.setResultId(UUID.randomUUID().toString());
        nettingResult.setOrder(order);
        nettingResult.setEntityId(entityId);
        nettingResult.setAmount(netAmount);
        nettingResult.setCurrency(order.getCurrency());
        nettingResult.setTransactionType(ClearingResult.TransactionType.NETTING);
        nettingResult.setAccountType(
            netAmount.compareTo(BigDecimal.ZERO) > 0 ? 
                ClearingResult.AccountType.INTERNAL_RECEIVABLE : 
                ClearingResult.AccountType.INTERNAL_PAYABLE
        );
        nettingResult.setClearingMode(order.getClearingMode());
        
        return nettingResult;
    }
    
    /**
     * 简单条件评估（实际项目中应使用专业表达式引擎）
     */
    private boolean evaluateSimpleCondition(String condition, Order order) {
        // 这里是简化实现，实际项目中应该使用SpEL等专业表达式引擎
        if (condition.contains("currency")) {
            return condition.contains(order.getCurrency());
        }
        
        if (condition.contains("totalAmount")) {
            // 简单的数值比较
            if (condition.contains(">=")) {
                String[] parts = condition.split(">=");
                if (parts.length == 2) {
                    try {
                        BigDecimal threshold = new BigDecimal(parts[1].trim());
                        return order.getTotalAmount().compareTo(threshold) >= 0;
                    } catch (Exception e) {
                        return false;
                    }
                }
            }
        }
        
        return true; // 默认返回true
    }
}