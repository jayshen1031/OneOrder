package com.oneorder.clearing.service.impl;

import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.service.TransitEntityService;
import com.oneorder.clearing.repository.TransitEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * 借抬头服务实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransitEntityServiceImpl implements TransitEntityService {
    
    private final TransitEntityRepository transitEntityRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    public Optional<TransitEntity> findTransitEntityByAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.trim().isEmpty()) {
            return Optional.empty();
        }
        
        return transitEntityRepository.findByTransitAccountAndIsActiveTrue(accountNumber.trim());
    }
    
    @Override
    public Optional<TransitEntity> findTransitEntityByLegalEntity(String legalEntityId, TransitEntity.TransitType transitType) {
        if (legalEntityId == null || transitType == null) {
            return Optional.empty();
        }
        
        return transitEntityRepository.findByTransitEntityIdAndTransitTypeAndIsActiveTrue(legalEntityId, transitType);
    }
    
    @Override
    public boolean requiresTransitEntity(Order order) {
        // 1. 检查是否配置了借抬头账号
        if (order.getPaymentAccount() != null) {
            Optional<TransitEntity> transitEntity = findTransitEntityByAccount(order.getPaymentAccount());
            if (transitEntity.isPresent()) {
                log.debug("订单{}通过账号{}匹配到借抬头", order.getOrderId(), order.getPaymentAccount());
                return true;
            }
        }
        
        // 2. 检查收款借抬头
        List<TransitEntity> receivableTransits = getApplicableTransitEntities(order, TransitEntity.TransitType.RECEIVABLE_TRANSIT);
        if (!receivableTransits.isEmpty()) {
            log.debug("订单{}匹配到{}个收款借抬头配置", order.getOrderId(), receivableTransits.size());
            return true;
        }
        
        // 3. 检查付款借抬头
        List<TransitEntity> payableTransits = getApplicableTransitEntities(order, TransitEntity.TransitType.PAYABLE_TRANSIT);
        if (!payableTransits.isEmpty()) {
            log.debug("订单{}匹配到{}个付款借抬头配置", order.getOrderId(), payableTransits.size());
            return true;
        }
        
        return false;
    }
    
    @Override
    public List<ClearingResult> processReceivableTransit(Order order, BigDecimal amount) {
        List<ClearingResult> results = new ArrayList<>();
        
        List<TransitEntity> transitEntities = getApplicableTransitEntities(order, TransitEntity.TransitType.RECEIVABLE_TRANSIT);
        
        for (TransitEntity transitEntity : transitEntities) {
            log.info("处理收款借抬头，订单{}，中间法人{}，金额{}", 
                order.getOrderId(), transitEntity.getTransitEntityId(), amount);
            
            // 1. 客户 → 中间法人（收款）
            ClearingResult customerToTransit = createTransitClearingResult(
                order,
                transitEntity.getTransitEntityId(),
                amount,
                ClearingResult.TransactionType.RECEIVABLE,
                ClearingResult.AccountType.EXTERNAL_RECEIVABLE,
                "客户付款到借抬头法人",
                transitEntity
            );
            results.add(customerToTransit);
            
            // 2. 计算留存金额
            BigDecimal retentionAmount = calculateRetentionAmount(transitEntity, amount);
            BigDecimal transferAmount = amount.subtract(retentionAmount);
            
            // 3. 中间法人 → 销售法人（转付）
            if (transferAmount.compareTo(BigDecimal.ZERO) > 0) {
                ClearingResult transitToSales = createTransitClearingResult(
                    order,
                    transitEntity.getTargetEntityId(),
                    transferAmount,
                    ClearingResult.TransactionType.RECEIVABLE,
                    ClearingResult.AccountType.INTERNAL_RECEIVABLE,
                    "借抬头法人转付给销售法人",
                    transitEntity
                );
                results.add(transitToSales);
                
                // 中间法人对应的付款记录
                ClearingResult transitPayment = createTransitClearingResult(
                    order,
                    transitEntity.getTransitEntityId(),
                    transferAmount.negate(),
                    ClearingResult.TransactionType.PAYABLE,
                    ClearingResult.AccountType.INTERNAL_PAYABLE,
                    "借抬头法人转付给销售法人",
                    transitEntity
                );
                results.add(transitPayment);
            }
            
            // 4. 记录留存（如果有）
            if (retentionAmount.compareTo(BigDecimal.ZERO) > 0) {
                ClearingResult retentionResult = createTransitClearingResult(
                    order,
                    transitEntity.getTransitEntityId(),
                    BigDecimal.ZERO, // 留存不影响清分平衡，仅用于记录
                    ClearingResult.TransactionType.RECEIVABLE,
                    ClearingResult.AccountType.RETENTION,
                    String.format("借抬头留存：%s", 
                        transitEntity.getRetentionType() == TransitEntity.RetentionType.PERCENTAGE ?
                        String.format("%.2f%%", transitEntity.getRetentionRate().multiply(new BigDecimal("100"))) :
                        String.format("¥%s", retentionAmount)),
                    transitEntity
                );
                retentionResult.setIsTransitRetention(true);
                retentionResult.setRetentionAmount(retentionAmount);
                results.add(retentionResult);
            }
        }
        
        return results;
    }
    
    @Override
    public List<ClearingResult> processPayableTransit(Order order, BigDecimal amount) {
        List<ClearingResult> results = new ArrayList<>();
        
        List<TransitEntity> transitEntities = getApplicableTransitEntities(order, TransitEntity.TransitType.PAYABLE_TRANSIT);
        
        for (TransitEntity transitEntity : transitEntities) {
            log.info("处理付款借抬头，订单{}，中间法人{}，金额{}", 
                order.getOrderId(), transitEntity.getTransitEntityId(), amount);
            
            // 1. 销售法人 → 中间法人（付款）
            ClearingResult salesToTransit = createTransitClearingResult(
                order,
                transitEntity.getTransitEntityId(),
                amount,
                ClearingResult.TransactionType.RECEIVABLE,
                ClearingResult.AccountType.INTERNAL_RECEIVABLE,
                "销售法人付款到借抬头法人",
                transitEntity
            );
            results.add(salesToTransit);
            
            // 销售法人对应的付款记录
            ClearingResult salesPayment = createTransitClearingResult(
                order,
                transitEntity.getSourceEntityId(),
                amount.negate(),
                ClearingResult.TransactionType.PAYABLE,
                ClearingResult.AccountType.INTERNAL_PAYABLE,
                "销售法人付款到借抬头法人",
                transitEntity
            );
            results.add(salesPayment);
            
            // 2. 计算留存后的转付金额
            BigDecimal retentionAmount = calculateRetentionAmount(transitEntity, amount);
            BigDecimal transferAmount = amount.subtract(retentionAmount);
            
            // 3. 中间法人 → 供应商（转付）
            if (transferAmount.compareTo(BigDecimal.ZERO) > 0) {
                ClearingResult transitToSupplier = createTransitClearingResult(
                    order,
                    transitEntity.getTargetEntityId(),
                    transferAmount,
                    ClearingResult.TransactionType.RECEIVABLE,
                    ClearingResult.AccountType.EXTERNAL_RECEIVABLE,
                    "借抬头法人付款给供应商",
                    transitEntity
                );
                results.add(transitToSupplier);
                
                // 中间法人对应的付款记录
                ClearingResult transitPayment = createTransitClearingResult(
                    order,
                    transitEntity.getTransitEntityId(),
                    transferAmount.negate(),
                    ClearingResult.TransactionType.PAYABLE,
                    ClearingResult.AccountType.EXTERNAL_PAYABLE,
                    "借抬头法人付款给供应商",
                    transitEntity
                );
                results.add(transitPayment);
            }
            
            // 4. 记录留存（如果有）
            if (retentionAmount.compareTo(BigDecimal.ZERO) > 0) {
                ClearingResult retentionResult = createTransitClearingResult(
                    order,
                    transitEntity.getTransitEntityId(),
                    BigDecimal.ZERO, // 留存不影响清分平衡
                    ClearingResult.TransactionType.RECEIVABLE,
                    ClearingResult.AccountType.RETENTION,
                    String.format("借抬头留存：%s", 
                        transitEntity.getRetentionType() == TransitEntity.RetentionType.PERCENTAGE ?
                        String.format("%.2f%%", transitEntity.getRetentionRate().multiply(new BigDecimal("100"))) :
                        String.format("¥%s", retentionAmount)),
                    transitEntity
                );
                retentionResult.setIsTransitRetention(true);
                retentionResult.setRetentionAmount(retentionAmount);
                results.add(retentionResult);
            }
        }
        
        return results;
    }
    
    @Override
    public BigDecimal calculateRetentionAmount(TransitEntity transitEntity, BigDecimal originalAmount) {
        if (transitEntity.getRetentionType() == null || 
            transitEntity.getRetentionType() == TransitEntity.RetentionType.NO_RETENTION) {
            return BigDecimal.ZERO;
        }
        
        switch (transitEntity.getRetentionType()) {
            case PERCENTAGE:
                if (transitEntity.getRetentionRate() != null) {
                    return originalAmount.multiply(transitEntity.getRetentionRate())
                        .setScale(2, RoundingMode.HALF_UP);
                }
                break;
            case FIXED_AMOUNT:
                if (transitEntity.getFixedRetentionAmount() != null) {
                    // 固定留存不能超过原始金额
                    return transitEntity.getFixedRetentionAmount().min(originalAmount);
                }
                break;
            default:
                break;
        }
        
        return BigDecimal.ZERO;
    }
    
    @Override
    public List<TransitEntity> getApplicableTransitEntities(Order order, TransitEntity.TransitType transitType) {
        List<TransitEntity> allTransitEntities = transitEntityRepository
            .findByTransitTypeAndIsActiveTrueOrderByTransitId(transitType);
        
        List<TransitEntity> applicableEntities = new ArrayList<>();
        
        for (TransitEntity transitEntity : allTransitEntities) {
            if (isTransitEntityApplicable(transitEntity, order)) {
                applicableEntities.add(transitEntity);
            }
        }
        
        return applicableEntities;
    }
    
    /**
     * 判断借抬头是否适用于当前订单
     */
    private boolean isTransitEntityApplicable(TransitEntity transitEntity, Order order) {
        // 如果没有适用条件，默认适用
        if (transitEntity.getApplicableConditions() == null || 
            transitEntity.getApplicableConditions().trim().isEmpty()) {
            return true;
        }
        
        try {
            // 解析适用条件（JSON格式）
            Map<String, Object> conditions = objectMapper.readValue(
                transitEntity.getApplicableConditions(), Map.class);
            
            // 检查业务类型
            if (conditions.containsKey("businessTypes")) {
                List<String> businessTypes = (List<String>) conditions.get("businessTypes");
                if (!businessTypes.contains(order.getBusinessType())) {
                    return false;
                }
            }
            
            // 检查货币
            if (conditions.containsKey("currencies")) {
                List<String> currencies = (List<String>) conditions.get("currencies");
                if (!currencies.contains(order.getCurrency())) {
                    return false;
                }
            }
            
            // 检查金额范围
            if (conditions.containsKey("amountRange")) {
                Map<String, Object> amountRange = (Map<String, Object>) conditions.get("amountRange");
                BigDecimal minAmount = amountRange.containsKey("min") ? 
                    new BigDecimal(amountRange.get("min").toString()) : BigDecimal.ZERO;
                BigDecimal maxAmount = amountRange.containsKey("max") ? 
                    new BigDecimal(amountRange.get("max").toString()) : null;
                
                if (order.getTotalAmount().compareTo(minAmount) < 0) {
                    return false;
                }
                if (maxAmount != null && order.getTotalAmount().compareTo(maxAmount) > 0) {
                    return false;
                }
            }
            
            // 检查客户/供应商
            if (conditions.containsKey("customerIds")) {
                List<String> customerIds = (List<String>) conditions.get("customerIds");
                if (!customerIds.contains(order.getCustomerId())) {
                    return false;
                }
            }
            
            return true;
            
        } catch (Exception e) {
            log.warn("解析借抬头适用条件失败，借抬头ID: {}，条件: {}", 
                transitEntity.getTransitId(), transitEntity.getApplicableConditions(), e);
            return true; // 解析失败时默认适用
        }
    }
    
    /**
     * 创建借抬头清分结果
     */
    private ClearingResult createTransitClearingResult(Order order, String entityId, BigDecimal amount,
                                                     ClearingResult.TransactionType transactionType,
                                                     ClearingResult.AccountType accountType,
                                                     String description, TransitEntity transitEntity) {
        ClearingResult result = new ClearingResult();
        result.setResultId(UUID.randomUUID().toString());
        result.setOrder(order);
        result.setEntityId(entityId);
        result.setAmount(amount);
        result.setCurrency(order.getCurrency());
        result.setTransactionType(transactionType);
        result.setAccountType(accountType);
        result.setClearingMode(order.getClearingMode());
        result.setTransitEntityId(transitEntity.getTransitId());
        result.setIsTransitRetention(false);
        result.setDescription(description);
        
        // 默认管理口径和法定口径相同
        result.setManagementAmount(amount);
        result.setLegalAmount(amount);
        
        return result;
    }
}