package com.oneorder.clearing.service.impl;

import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.dto.ClearingRequest;
import com.oneorder.clearing.dto.ClearingResponse;
import com.oneorder.clearing.service.ClearingEngine;
import com.oneorder.clearing.service.RuleEngine;
import com.oneorder.clearing.repository.LegalEntityRepository;
import com.oneorder.clearing.repository.ClearingResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 清分引擎实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClearingEngineImpl implements ClearingEngine {
    
    private final RuleEngine ruleEngine;
    private final LegalEntityRepository legalEntityRepository;
    private final ClearingResultRepository clearingResultRepository;
    
    @Override
    @Transactional
    public ClearingResponse executeClearing(ClearingRequest request) {
        log.info("开始执行清分，订单ID: {}", request.getOrder().getOrderId());
        
        try {
            // 1. 计算清分结果
            List<ClearingResult> results = calculateClearing(request.getOrder());
            
            // 2. 验证清分结果
            if (!validateClearingResults(results)) {
                return ClearingResponse.failed("清分结果验证失败");
            }
            
            // 3. 保存清分结果
            clearingResultRepository.saveAll(results);
            
            // 4. 更新订单状态
            Order order = request.getOrder();
            order.setClearingStatus(Order.ClearingStatus.CLEARED);
            
            log.info("清分执行完成，订单ID: {}，生成{}条清分记录", order.getOrderId(), results.size());
            
            return ClearingResponse.success(results);
            
        } catch (Exception e) {
            log.error("清分执行失败，订单ID: {}", request.getOrder().getOrderId(), e);
            return ClearingResponse.failed("清分执行失败: " + e.getMessage());
        }
    }
    
    @Override
    public List<ClearingResult> calculateClearing(Order order) {
        log.debug("开始计算清分，订单ID: {}，模式: {}", order.getOrderId(), order.getClearingMode());
        
        // 根据清分模式执行不同算法
        List<ClearingResult> results;
        if (Order.ClearingMode.STAR.equals(order.getClearingMode())) {
            results = starModeClearing(order);
        } else {
            results = chainModeClearing(order);
        }
        
        // 应用规则引擎处理借抬头、过账等复杂场景
        results = ruleEngine.applyRules(order, results);
        
        return results;
    }
    
    @Override
    public List<ClearingResult> starModeClearing(Order order) {
        log.debug("执行星式清分，订单ID: {}", order.getOrderId());
        
        List<ClearingResult> results = new ArrayList<>();
        
        // 1. 确定收款总包法人（优先级：paymentEntityId > salesEntityId）
        String receivingEntityId = order.getPaymentEntityId() != null ? 
            order.getPaymentEntityId() : order.getSalesEntityId();
            
        // 2. 创建客户应收记录
        ClearingResult customerReceivable = createClearingResult(
            order, 
            receivingEntityId,
            order.getTotalAmount(),
            ClearingResult.TransactionType.RECEIVABLE,
            ClearingResult.AccountType.EXTERNAL_RECEIVABLE
        );
        results.add(customerReceivable);
        
        // 3. 计算各法人体分润
        Map<String, BigDecimal> profitSharing = calculateProfitSharing(order);
        
        // 4. 生成分润记录
        for (Map.Entry<String, BigDecimal> entry : profitSharing.entrySet()) {
            String entityId = entry.getKey();
            BigDecimal amount = entry.getValue();
            
            if (amount.compareTo(BigDecimal.ZERO) != 0) {
                ClearingResult profitResult = createClearingResult(
                    order,
                    entityId,
                    amount,
                    amount.compareTo(BigDecimal.ZERO) > 0 ? 
                        ClearingResult.TransactionType.RECEIVABLE : 
                        ClearingResult.TransactionType.PAYABLE,
                    amount.compareTo(BigDecimal.ZERO) > 0 ? 
                        ClearingResult.AccountType.INTERNAL_RECEIVABLE : 
                        ClearingResult.AccountType.INTERNAL_PAYABLE
                );
                results.add(profitResult);
            }
        }
        
        // 5. 处理供应商应付
        if (order.getTotalCost() != null && order.getTotalCost().compareTo(BigDecimal.ZERO) > 0) {
            ClearingResult supplierPayable = createClearingResult(
                order,
                receivingEntityId, // 由收款总包支付
                order.getTotalCost().negate(),
                ClearingResult.TransactionType.PAYABLE,
                ClearingResult.AccountType.EXTERNAL_PAYABLE
            );
            results.add(supplierPayable);
        }
        
        log.debug("星式清分完成，生成{}条记录", results.size());
        return results;
    }
    
    @Override
    public List<ClearingResult> chainModeClearing(Order order) {
        log.debug("执行链式清分，订单ID: {}", order.getOrderId());
        
        List<ClearingResult> results = new ArrayList<>();
        
        // 1. 客户 -> 销售法人体
        ClearingResult customerToSales = createClearingResult(
            order,
            order.getSalesEntityId(),
            order.getTotalAmount(),
            ClearingResult.TransactionType.RECEIVABLE,
            ClearingResult.AccountType.EXTERNAL_RECEIVABLE
        );
        results.add(customerToSales);
        
        // 2. 计算分润比例
        BigDecimal totalProfit = order.getTotalAmount().subtract(
            order.getTotalCost() != null ? order.getTotalCost() : BigDecimal.ZERO
        );
        
        // 假设五五开分润
        BigDecimal salesProfit = totalProfit.multiply(new BigDecimal("0.5")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deliveryProfit = totalProfit.subtract(salesProfit);
        
        // 3. 销售法人体 -> 交付法人体（转付+分润）
        if (order.getDeliveryEntityId() != null) {
            BigDecimal transferAmount = order.getTotalAmount().subtract(salesProfit);
            ClearingResult salesToDelivery = createClearingResult(
                order,
                order.getDeliveryEntityId(),
                transferAmount,
                ClearingResult.TransactionType.RECEIVABLE,
                ClearingResult.AccountType.INTERNAL_RECEIVABLE
            );
            results.add(salesToDelivery);
            
            // 销售法人体支付记录
            ClearingResult salesPayment = createClearingResult(
                order,
                order.getSalesEntityId(),
                transferAmount.negate(),
                ClearingResult.TransactionType.PAYABLE,
                ClearingResult.AccountType.INTERNAL_PAYABLE
            );
            results.add(salesPayment);
        }
        
        // 4. 交付法人体 -> 供应商（成本支付）
        if (order.getTotalCost() != null && order.getTotalCost().compareTo(BigDecimal.ZERO) > 0) {
            String payingEntityId = order.getDeliveryEntityId() != null ? 
                order.getDeliveryEntityId() : order.getSalesEntityId();
                
            ClearingResult supplierPayable = createClearingResult(
                order,
                payingEntityId,
                order.getTotalCost().negate(),
                ClearingResult.TransactionType.PAYABLE,
                ClearingResult.AccountType.EXTERNAL_PAYABLE
            );
            results.add(supplierPayable);
        }
        
        log.debug("链式清分完成，生成{}条记录", results.size());
        return results;
    }
    
    @Override
    public boolean validateClearingResults(List<ClearingResult> results) {
        // 1. 验证借贷平衡
        BigDecimal totalDebit = results.stream()
            .filter(r -> r.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .map(ClearingResult::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalCredit = results.stream()
            .filter(r -> r.getAmount().compareTo(BigDecimal.ZERO) < 0)
            .map(ClearingResult::getAmount)
            .map(BigDecimal::abs)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        if (totalDebit.compareTo(totalCredit) != 0) {
            log.error("清分结果借贷不平衡，借方: {}，贷方: {}", totalDebit, totalCredit);
            return false;
        }
        
        // 2. 验证外收外支匹配
        Map<String, BigDecimal> entityBalance = results.stream()
            .collect(Collectors.groupingBy(
                ClearingResult::getEntityId,
                Collectors.reducing(BigDecimal.ZERO, ClearingResult::getAmount, BigDecimal::add)
            ));
            
        // 外收外支应该有对应的内收内支平衡
        // 这里可以根据业务规则进一步验证
        
        return true;
    }
    
    /**
     * 计算分润分配
     */
    private Map<String, BigDecimal> calculateProfitSharing(Order order) {
        Map<String, BigDecimal> profitSharing = new HashMap<>();
        
        BigDecimal totalProfit = order.getTotalAmount().subtract(
            order.getTotalCost() != null ? order.getTotalCost() : BigDecimal.ZERO
        );
        
        // 默认五五开分润（这里可以通过规则引擎动态配置）
        BigDecimal salesProfit = totalProfit.multiply(new BigDecimal("0.5")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deliveryProfit = totalProfit.subtract(salesProfit);
        
        profitSharing.put(order.getSalesEntityId(), salesProfit);
        if (order.getDeliveryEntityId() != null) {
            profitSharing.put(order.getDeliveryEntityId(), deliveryProfit);
        }
        
        return profitSharing;
    }
    
    /**
     * 创建清分结果记录
     */
    private ClearingResult createClearingResult(Order order, String entityId, BigDecimal amount,
                                              ClearingResult.TransactionType transactionType,
                                              ClearingResult.AccountType accountType) {
        ClearingResult result = new ClearingResult();
        result.setResultId(UUID.randomUUID().toString());
        result.setOrder(order);
        result.setEntityId(entityId);
        result.setAmount(amount);
        result.setCurrency(order.getCurrency());
        result.setTransactionType(transactionType);
        result.setAccountType(accountType);
        result.setClearingMode(order.getClearingMode());
        result.setIsTransitRetention(false);
        
        // 默认管理口径和法定口径相同（可通过规则引擎调整）
        result.setManagementAmount(amount);
        result.setLegalAmount(amount);
        
        return result;
    }
}