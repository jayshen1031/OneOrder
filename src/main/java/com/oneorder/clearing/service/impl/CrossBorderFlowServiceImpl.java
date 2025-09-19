package com.oneorder.clearing.service.impl;

import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.service.CrossBorderFlowService;
import com.oneorder.clearing.repository.CrossBorderFlowRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 过账流程服务实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CrossBorderFlowServiceImpl implements CrossBorderFlowService {
    
    private final CrossBorderFlowRepository crossBorderFlowRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    public boolean requiresCrossBorderFlow(Order order) {
        List<CrossBorderFlow> applicableFlows = getApplicableCrossBorderFlows(order);
        boolean required = !applicableFlows.isEmpty();
        
        if (required) {
            log.debug("订单{}匹配到{}个过账流程配置", order.getOrderId(), applicableFlows.size());
        }
        
        return required;
    }
    
    @Override
    public List<CrossBorderFlow> getApplicableCrossBorderFlows(Order order) {
        List<CrossBorderFlow> allFlows = crossBorderFlowRepository.findByIsActiveTrueOrderByFlowId();
        
        return allFlows.stream()
            .filter(flow -> isFlowApplicable(flow, order))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ClearingResult> processCrossBorderFlow(Order order, BigDecimal amount) {
        List<ClearingResult> results = new ArrayList<>();
        
        List<CrossBorderFlow> applicableFlows = getApplicableCrossBorderFlows(order);
        
        for (CrossBorderFlow flow : applicableFlows) {
            log.info("处理过账流程，订单{}，流程{}，类型{}，金额{}", 
                order.getOrderId(), flow.getFlowId(), flow.getProcessingType(), amount);
            
            List<ClearingResult> flowResults;
            switch (flow.getProcessingType()) {
                case FLAT_TRANSFER:
                    flowResults = processFlatTransfer(order, flow, amount);
                    break;
                case NET_TRANSFER:
                    flowResults = processNetTransfer(order, flow, amount);
                    break;
                case SEGMENTED_TRANSFER:
                    flowResults = processSegmentedTransfer(order, flow, amount);
                    break;
                default:
                    log.warn("未支持的过账处理方式: {}", flow.getProcessingType());
                    continue;
            }
            
            results.addAll(flowResults);
        }
        
        return results;
    }
    
    @Override
    public List<ClearingResult> processFlatTransfer(Order order, CrossBorderFlow flow, BigDecimal amount) {
        List<ClearingResult> results = new ArrayList<>();
        
        // 1. 付款方 → 过账方
        ClearingResult payerToTransit = createCrossBorderClearingResult(
            order, flow,
            flow.getTransitEntityId(),
            amount,
            ClearingResult.TransactionType.RECEIVABLE,
            ClearingResult.AccountType.CROSS_BORDER_RECEIVABLE,
            String.format("%s付款到%s过账", flow.getPayerRegion(), flow.getTransitRegion())
        );
        results.add(payerToTransit);
        
        // 付款方对应的付款记录
        ClearingResult payerPayment = createCrossBorderClearingResult(
            order, flow,
            flow.getPayerEntityId(),
            amount.negate(),
            ClearingResult.TransactionType.PAYABLE,
            ClearingResult.AccountType.CROSS_BORDER_PAYABLE,
            String.format("%s付款到%s过账", flow.getPayerRegion(), flow.getTransitRegion())
        );
        results.add(payerPayment);
        
        // 2. 计算留存后的转付金额
        BigDecimal retentionAmount = calculateTransitRetention(flow, amount);
        BigDecimal transferAmount = amount.subtract(retentionAmount);
        
        // 3. 过账方 → 收款方（平收平付）
        if (transferAmount.compareTo(BigDecimal.ZERO) > 0) {
            ClearingResult transitToReceiver = createCrossBorderClearingResult(
                order, flow,
                flow.getReceiverEntityId(),
                transferAmount,
                ClearingResult.TransactionType.RECEIVABLE,
                ClearingResult.AccountType.CROSS_BORDER_RECEIVABLE,
                String.format("%s过账到%s收款", flow.getTransitRegion(), flow.getReceiverRegion())
            );
            results.add(transitToReceiver);
            
            // 过账方对应的付款记录
            ClearingResult transitPayment = createCrossBorderClearingResult(
                order, flow,
                flow.getTransitEntityId(),
                transferAmount.negate(),
                ClearingResult.TransactionType.PAYABLE,
                ClearingResult.AccountType.CROSS_BORDER_PAYABLE,
                String.format("%s过账到%s收款", flow.getTransitRegion(), flow.getReceiverRegion())
            );
            results.add(transitPayment);
        }
        
        // 4. 记录过账公司留存（如果有）
        if (retentionAmount.compareTo(BigDecimal.ZERO) > 0) {
            ClearingResult retentionResult = createCrossBorderClearingResult(
                order, flow,
                flow.getTransitEntityId(),
                BigDecimal.ZERO, // 留存不影响清分平衡
                ClearingResult.TransactionType.RECEIVABLE,
                ClearingResult.AccountType.RETENTION,
                String.format("过账公司留存：%s", formatRetentionDescription(flow, retentionAmount)),
                retentionAmount
            );
            results.add(retentionResult);
        }
        
        return results;
    }
    
    @Override
    public List<ClearingResult> processNetTransfer(Order order, CrossBorderFlow flow, BigDecimal amount) {
        List<ClearingResult> results = new ArrayList<>();
        
        // 差额处理：只记录净差额，不记录全额流转
        BigDecimal retentionAmount = calculateTransitRetention(flow, amount);
        BigDecimal netAmount = amount.subtract(retentionAmount);
        
        // 1. 记录净差额流转
        if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
            ClearingResult netTransfer = createCrossBorderClearingResult(
                order, flow,
                flow.getReceiverEntityId(),
                netAmount,
                ClearingResult.TransactionType.RECEIVABLE,
                ClearingResult.AccountType.CROSS_BORDER_RECEIVABLE,
                String.format("净差额过账：%s→%s→%s", flow.getPayerRegion(), flow.getTransitRegion(), flow.getReceiverRegion())
            );
            results.add(netTransfer);
            
            // 付款方净差额付款
            ClearingResult netPayment = createCrossBorderClearingResult(
                order, flow,
                flow.getPayerEntityId(),
                netAmount.negate(),
                ClearingResult.TransactionType.PAYABLE,
                ClearingResult.AccountType.CROSS_BORDER_PAYABLE,
                String.format("净差额过账：%s→%s→%s", flow.getPayerRegion(), flow.getTransitRegion(), flow.getReceiverRegion())
            );
            results.add(netPayment);
        }
        
        // 2. 记录过账公司留存
        if (retentionAmount.compareTo(BigDecimal.ZERO) > 0) {
            ClearingResult retentionResult = createCrossBorderClearingResult(
                order, flow,
                flow.getTransitEntityId(),
                BigDecimal.ZERO,
                ClearingResult.TransactionType.RECEIVABLE,
                ClearingResult.AccountType.RETENTION,
                String.format("过账净差额留存：%s", formatRetentionDescription(flow, retentionAmount)),
                retentionAmount
            );
            results.add(retentionResult);
        }
        
        return results;
    }
    
    @Override
    public Map<String, List<ClearingResult>> processNettingRules(List<Order> orders) {
        Map<String, List<ClearingResult>> nettingResults = new HashMap<>();
        
        // 按过账流程分组
        Map<String, List<Order>> flowGroupedOrders = new HashMap<>();
        
        for (Order order : orders) {
            List<CrossBorderFlow> applicableFlows = getApplicableCrossBorderFlows(order);
            for (CrossBorderFlow flow : applicableFlows) {
                if (flow.getNettingEnabled()) {
                    flowGroupedOrders.computeIfAbsent(flow.getFlowId(), k -> new ArrayList<>()).add(order);
                }
            }
        }
        
        // 对每个流程组进行抵消处理
        for (Map.Entry<String, List<Order>> entry : flowGroupedOrders.entrySet()) {
            String flowId = entry.getKey();
            List<Order> groupOrders = entry.getValue();
            
            if (groupOrders.size() < 2) {
                continue; // 至少需要2个订单才能抵消
            }
            
            CrossBorderFlow flow = crossBorderFlowRepository.findById(flowId).orElse(null);
            if (flow == null || !canApplyNetting(groupOrders, flow)) {
                continue;
            }
            
            List<ClearingResult> nettingResult = performNetting(groupOrders, flow);
            if (!nettingResult.isEmpty()) {
                nettingResults.put(flowId, nettingResult);
                log.info("过账流程{}完成抵消处理，涉及{}个订单，生成{}条抵消记录", 
                    flowId, groupOrders.size(), nettingResult.size());
            }
        }
        
        return nettingResults;
    }
    
    @Override
    public BigDecimal calculateTransitRetention(CrossBorderFlow flow, BigDecimal originalAmount) {
        if (flow.getRetentionCalculationType() == null ||
            flow.getRetentionCalculationType() == CrossBorderFlow.RetentionCalculationType.NO_RETENTION) {
            return BigDecimal.ZERO;
        }
        
        switch (flow.getRetentionCalculationType()) {
            case PERCENTAGE_RETENTION:
                if (flow.getTransitRetentionRate() != null) {
                    return originalAmount.multiply(flow.getTransitRetentionRate())
                        .setScale(2, RoundingMode.HALF_UP);
                }
                break;
            case FIXED_AMOUNT_RETENTION:
                if (flow.getTransitFixedRetention() != null) {
                    return flow.getTransitFixedRetention().min(originalAmount);
                }
                break;
            case TIERED_RETENTION:
                return calculateTieredRetention(flow, originalAmount);
            default:
                break;
        }
        
        return BigDecimal.ZERO;
    }
    
    @Override
    public boolean canApplyNetting(List<Order> orders, CrossBorderFlow flow) {
        if (!flow.getNettingEnabled() || orders.size() < 2) {
            return false;
        }
        
        // 检查订单是否在相同的抵消周期内
        // 这里可以根据业务规则进行更复杂的判断
        String firstOrderDate = orders.get(0).getOrderDate().toLocalDate().toString(); // 取日期部分
        
        return orders.stream()
            .allMatch(order -> order.getOrderDate().toLocalDate().toString().equals(firstOrderDate));
    }
    
    @Override
    public String generateNettingReport(Map<String, List<ClearingResult>> nettingResults) {
        StringBuilder report = new StringBuilder();
        report.append("=== 过账抵消处理报告 ===\n");
        
        for (Map.Entry<String, List<ClearingResult>> entry : nettingResults.entrySet()) {
            String flowId = entry.getKey();
            List<ClearingResult> results = entry.getValue();
            
            report.append(String.format("\n过账流程: %s\n", flowId));
            report.append(String.format("抵消记录数: %d\n", results.size()));
            
            BigDecimal totalAmount = results.stream()
                .map(ClearingResult::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            report.append(String.format("抵消金额: ¥%s\n", totalAmount));
        }
        
        return report.toString();
    }
    
    /**
     * 判断过账流程是否适用于订单
     */
    private boolean isFlowApplicable(CrossBorderFlow flow, Order order) {
        if (flow.getApplicableConditions() == null || flow.getApplicableConditions().trim().isEmpty()) {
            return true;
        }
        
        try {
            Map<String, Object> conditions = objectMapper.readValue(flow.getApplicableConditions(), Map.class);
            
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
            
            // 检查地区
            if (conditions.containsKey("regions")) {
                List<String> regions = (List<String>) conditions.get("regions");
                // 这里可以根据订单的法人实体地区进行判断
            }
            
            return true;
            
        } catch (Exception e) {
            log.warn("解析过账流程适用条件失败，流程ID: {}，条件: {}", 
                flow.getFlowId(), flow.getApplicableConditions(), e);
            return true;
        }
    }
    
    /**
     * 处理分段过账流转
     */
    private List<ClearingResult> processSegmentedTransfer(Order order, CrossBorderFlow flow, BigDecimal amount) {
        List<ClearingResult> results = new ArrayList<>();
        
        // 分段处理：可能分多个阶段或多个中间方
        // 这里简化为两段处理
        BigDecimal halfAmount = amount.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        
        // 第一段：付款方 → 过账方（一半金额）
        results.addAll(processFlatTransfer(order, flow, halfAmount));
        
        // 第二段：延后处理或通过其他途径（另一半金额）
        // 可以根据具体业务规则实现
        
        return results;
    }
    
    /**
     * 执行抵消处理
     */
    private List<ClearingResult> performNetting(List<Order> orders, CrossBorderFlow flow) {
        List<ClearingResult> nettingResults = new ArrayList<>();
        
        // 计算净差额
        BigDecimal totalReceivable = BigDecimal.ZERO;
        BigDecimal totalPayable = BigDecimal.ZERO;
        
        for (Order order : orders) {
            if (isReceivableOrder(order)) {
                totalReceivable = totalReceivable.add(order.getTotalAmount());
            } else {
                totalPayable = totalPayable.add(order.getTotalAmount());
            }
        }
        
        BigDecimal netAmount = totalReceivable.subtract(totalPayable);
        
        // 只有净差额不为零时才生成抵消记录
        if (netAmount.abs().compareTo(BigDecimal.ZERO) > 0) {
            Order representativeOrder = orders.get(0); // 选择代表订单
            
            ClearingResult nettingResult = createCrossBorderClearingResult(
                representativeOrder, flow,
                netAmount.compareTo(BigDecimal.ZERO) > 0 ? flow.getReceiverEntityId() : flow.getPayerEntityId(),
                netAmount,
                netAmount.compareTo(BigDecimal.ZERO) > 0 ? 
                    ClearingResult.TransactionType.RECEIVABLE : ClearingResult.TransactionType.PAYABLE,
                ClearingResult.AccountType.NETTING,
                String.format("过账抵消净差额，涉及%d个订单", orders.size())
            );
            
            nettingResults.add(nettingResult);
        }
        
        return nettingResults;
    }
    
    /**
     * 计算阶梯式留存
     */
    private BigDecimal calculateTieredRetention(CrossBorderFlow flow, BigDecimal originalAmount) {
        // 简化的阶梯式留存计算
        // 实际应用中可以配置在applicableConditions中
        
        if (originalAmount.compareTo(new BigDecimal("10000")) <= 0) {
            return originalAmount.multiply(new BigDecimal("0.01")); // 1%
        } else if (originalAmount.compareTo(new BigDecimal("100000")) <= 0) {
            return originalAmount.multiply(new BigDecimal("0.02")); // 2%
        } else {
            return originalAmount.multiply(new BigDecimal("0.03")); // 3%
        }
    }
    
    /**
     * 判断订单是否为应收类型
     */
    private boolean isReceivableOrder(Order order) {
        // 简化判断：可以根据订单类型、业务类型等进行判断
        return order.getTotalAmount().compareTo(BigDecimal.ZERO) > 0;
    }
    
    /**
     * 格式化留存描述
     */
    private String formatRetentionDescription(CrossBorderFlow flow, BigDecimal retentionAmount) {
        switch (flow.getRetentionCalculationType()) {
            case PERCENTAGE_RETENTION:
                return String.format("%.2f%% (¥%s)", 
                    flow.getTransitRetentionRate().multiply(new BigDecimal("100")), retentionAmount);
            case FIXED_AMOUNT_RETENTION:
                return String.format("固定¥%s", retentionAmount);
            case TIERED_RETENTION:
                return String.format("阶梯式¥%s", retentionAmount);
            default:
                return String.format("¥%s", retentionAmount);
        }
    }
    
    /**
     * 创建过账清分结果
     */
    private ClearingResult createCrossBorderClearingResult(Order order, CrossBorderFlow flow,
                                                         String entityId, BigDecimal amount,
                                                         ClearingResult.TransactionType transactionType,
                                                         ClearingResult.AccountType accountType,
                                                         String description) {
        return createCrossBorderClearingResult(order, flow, entityId, amount, transactionType, accountType, description, null);
    }
    
    private ClearingResult createCrossBorderClearingResult(Order order, CrossBorderFlow flow,
                                                         String entityId, BigDecimal amount,
                                                         ClearingResult.TransactionType transactionType,
                                                         ClearingResult.AccountType accountType,
                                                         String description, BigDecimal retentionAmount) {
        ClearingResult result = new ClearingResult();
        result.setResultId(UUID.randomUUID().toString());
        result.setOrder(order);
        result.setEntityId(entityId);
        result.setAmount(amount);
        result.setCurrency(order.getCurrency());
        result.setTransactionType(transactionType);
        result.setAccountType(accountType);
        result.setClearingMode(order.getClearingMode());
        result.setCrossBorderFlowId(flow.getFlowId());
        result.setDescription(description);
        
        if (retentionAmount != null) {
            result.setRetentionAmount(retentionAmount);
            result.setIsTransitRetention(true);
        }
        
        // 默认管理口径和法定口径相同
        result.setManagementAmount(amount);
        result.setLegalAmount(amount);
        
        return result;
    }
}