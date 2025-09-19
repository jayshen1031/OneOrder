package com.oneorder.clearing.controller;

import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.service.*;
import com.oneorder.clearing.dto.ClearingRequest;
import com.oneorder.clearing.dto.ClearingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 清分测试控制器
 */
@RestController
@RequestMapping("/api/clearing/test")
@RequiredArgsConstructor
@Slf4j
public class ClearingTestController {
    
    private final TestDataInitService testDataInitService;
    private final TransitEntityService transitEntityService;
    private final CrossBorderFlowService crossBorderFlowService;
    private final ClearingEngine clearingEngine;
    
    /**
     * 初始化所有测试数据
     */
    @PostMapping("/init-all-data")
    public ResponseEntity<Map<String, Object>> initAllTestData() {
        log.info("开始初始化所有测试数据...");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 初始化借抬头数据
            testDataInitService.initTransitEntityTestData();
            
            // 初始化过账规则数据
            testDataInitService.initCrossBorderFlowTestData();
            
            result.put("code", 200);
            result.put("message", "测试数据初始化成功");
            result.put("data", Map.of(
                "transitEntities", 3,
                "crossBorderFlows", 3,
                "initTime", LocalDateTime.now()
            ));
            
            log.info("所有测试数据初始化完成");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("初始化测试数据失败", e);
            result.put("code", 500);
            result.put("message", "初始化测试数据失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 测试借抬头功能 - 收款借抬头
     */
    @PostMapping("/transit-entity/receivable")
    public ResponseEntity<Map<String, Object>> testReceivableTransit(@RequestBody Map<String, Object> request) {
        log.info("测试收款借抬头功能，请求参数：{}", request);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 构造测试订单
            Order testOrder = createTestOrder(
                "TEST_ORDER_001",
                request.getOrDefault("businessType", "OCEAN_FREIGHT").toString(),
                new BigDecimal(request.getOrDefault("amount", "50000").toString()),
                request.getOrDefault("currency", "CNY").toString(),
                request.getOrDefault("customerId", "CUST_001").toString()
            );
            
            // 设置借抬头账号（如果提供）
            if (request.containsKey("paymentAccount")) {
                testOrder.setPaymentAccount(request.get("paymentAccount").toString());
            }
            
            BigDecimal amount = new BigDecimal(request.getOrDefault("amount", "50000").toString());
            
            // 判断是否需要借抬头处理
            boolean requiresTransit = transitEntityService.requiresTransitEntity(testOrder);
            
            if (requiresTransit) {
                // 执行收款借抬头处理
                List<ClearingResult> transitResults = transitEntityService.processReceivableTransit(testOrder, amount);
                
                result.put("code", 200);
                result.put("message", "收款借抬头测试成功");
                result.put("data", Map.of(
                    "requiresTransit", true,
                    "clearingResults", formatClearingResults(transitResults),
                    "summary", createTransitSummary(transitResults)
                ));
            } else {
                result.put("code", 200);
                result.put("message", "当前订单不需要借抬头处理");
                result.put("data", Map.of(
                    "requiresTransit", false,
                    "reason", "未匹配到适用的借抬头配置"
                ));
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("收款借抬头测试失败", e);
            result.put("code", 500);
            result.put("message", "测试失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 测试借抬头功能 - 付款借抬头
     */
    @PostMapping("/transit-entity/payable")
    public ResponseEntity<Map<String, Object>> testPayableTransit(@RequestBody Map<String, Object> request) {
        log.info("测试付款借抬头功能，请求参数：{}", request);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 构造测试订单
            Order testOrder = createTestOrder(
                "TEST_ORDER_002",
                request.getOrDefault("businessType", "TRUCK_FREIGHT").toString(),
                new BigDecimal(request.getOrDefault("totalCost", "30000").toString()),
                request.getOrDefault("currency", "CNY").toString(),
                request.getOrDefault("customerId", "CUST_002").toString()
            );
            
            BigDecimal amount = new BigDecimal(request.getOrDefault("totalCost", "30000").toString());
            testOrder.setTotalCost(amount);
            
            // 执行付款借抬头处理
            List<ClearingResult> transitResults = transitEntityService.processPayableTransit(testOrder, amount);
            
            result.put("code", 200);
            result.put("message", "付款借抬头测试成功");
            result.put("data", Map.of(
                "clearingResults", formatClearingResults(transitResults),
                "summary", createTransitSummary(transitResults)
            ));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("付款借抬头测试失败", e);
            result.put("code", 500);
            result.put("message", "测试失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 测试过账规则 - 标准过账（平收平付）
     */
    @PostMapping("/cross-border/flat-transfer")
    public ResponseEntity<Map<String, Object>> testFlatTransfer(@RequestBody Map<String, Object> request) {
        log.info("测试标准过账功能，请求参数：{}", request);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 构造测试订单
            Order testOrder = createTestOrder(
                "TEST_ORDER_003",
                request.getOrDefault("businessType", "OCEAN_FREIGHT").toString(),
                new BigDecimal(request.getOrDefault("amount", "80000").toString()),
                request.getOrDefault("currency", "CNY").toString(),
                request.getOrDefault("customerId", "CUST_003").toString()
            );
            
            BigDecimal amount = new BigDecimal(request.getOrDefault("amount", "80000").toString());
            
            // 判断是否需要过账处理
            boolean requiresCrossBorder = crossBorderFlowService.requiresCrossBorderFlow(testOrder);
            
            if (requiresCrossBorder) {
                // 执行过账流程处理
                List<ClearingResult> crossBorderResults = crossBorderFlowService.processCrossBorderFlow(testOrder, amount);
                
                result.put("code", 200);
                result.put("message", "标准过账测试成功");
                result.put("data", Map.of(
                    "requiresCrossBorder", true,
                    "clearingResults", formatClearingResults(crossBorderResults),
                    "summary", createCrossBorderSummary(crossBorderResults)
                ));
            } else {
                result.put("code", 200);
                result.put("message", "当前订单不需要过账处理");
                result.put("data", Map.of(
                    "requiresCrossBorder", false,
                    "reason", "未匹配到适用的过账配置"
                ));
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("标准过账测试失败", e);
            result.put("code", 500);
            result.put("message", "测试失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 测试抵消规则
     */
    @PostMapping("/cross-border/netting")
    public ResponseEntity<Map<String, Object>> testNettingRules(@RequestBody Map<String, Object> request) {
        log.info("测试抵消规则功能，请求参数：{}", request);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 构造多个测试订单用于抵消
            List<Order> testOrders = createNettingTestOrders(request);
            
            // 执行抵消处理
            Map<String, List<ClearingResult>> nettingResults = crossBorderFlowService.processNettingRules(testOrders);
            
            if (nettingResults.isEmpty()) {
                result.put("code", 200);
                result.put("message", "当前订单组合不满足抵消条件");
                result.put("data", Map.of(
                    "canNetting", false,
                    "orderCount", testOrders.size(),
                    "reason", "不满足抵消条件或订单数量不足"
                ));
            } else {
                // 生成抵消报告
                String nettingReport = crossBorderFlowService.generateNettingReport(nettingResults);
                
                result.put("code", 200);
                result.put("message", "抵消规则测试成功");
                result.put("data", Map.of(
                    "canNetting", true,
                    "orderCount", testOrders.size(),
                    "nettingFlowCount", nettingResults.size(),
                    "nettingResults", formatNettingResults(nettingResults),
                    "report", nettingReport
                ));
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("抵消规则测试失败", e);
            result.put("code", 500);
            result.put("message", "测试失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 综合清分测试 - 包含借抬头和过账规则
     */
    @PostMapping("/comprehensive")
    public ResponseEntity<Map<String, Object>> testComprehensiveClearing(@RequestBody Map<String, Object> request) {
        log.info("执行综合清分测试，请求参数：{}", request);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 构造测试订单
            Order testOrder = createTestOrder(
                "TEST_ORDER_COMP_001",
                request.getOrDefault("businessType", "OCEAN_FREIGHT").toString(),
                new BigDecimal(request.getOrDefault("amount", "100000").toString()),
                request.getOrDefault("currency", "CNY").toString(),
                request.getOrDefault("customerId", "CUST_001").toString()
            );
            
            // 设置支付账号以触发借抬头
            testOrder.setPaymentAccount("6225881234567890");
            testOrder.setTotalCost(new BigDecimal("60000"));
            
            // 构造清分请求
            ClearingRequest clearingRequest = new ClearingRequest();
            clearingRequest.setOrder(testOrder);
            
            // 执行综合清分
            ClearingResponse clearingResponse = clearingEngine.executeClearing(clearingRequest);
            
            result.put("code", 200);
            result.put("message", "综合清分测试完成");
            result.put("data", Map.of(
                "success", clearingResponse.isSuccess(),
                "clearingResults", formatClearingResults(clearingResponse.getResults()),
                "totalRecords", clearingResponse.getResults().size(),
                "validation", validateComprehensiveResults(clearingResponse.getResults())
            ));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("综合清分测试失败", e);
            result.put("code", 500);
            result.put("message", "测试失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    // 辅助方法
    
    /**
     * 创建测试订单
     */
    private Order createTestOrder(String orderId, String businessType, 
                                BigDecimal amount, String currency, String customerId) {
        Order order = new Order();
        order.setOrderId(orderId);
        order.setBusinessType(businessType);
        order.setTotalAmount(amount);
        order.setCurrency(currency);
        order.setCustomerId(customerId);
        order.setSalesEntityId("ENTITY_CN_SALES");
        order.setDeliveryEntityId("ENTITY_CN_DELIVERY");
        order.setClearingMode(Order.ClearingMode.STAR);
        order.setOrderDate(LocalDateTime.now());
        return order;
    }
    
    /**
     * 创建抵消测试订单组
     */
    private List<Order> createNettingTestOrders(Map<String, Object> request) {
        List<Order> orders = new ArrayList<>();
        
        // 订单1 - 应收
        orders.add(createTestOrder("NETTING_001", "OCEAN_FREIGHT", 
            new BigDecimal("50000"), "USD", "CUST_001"));
        
        // 订单2 - 应付
        Order payableOrder = createTestOrder("NETTING_002", "OCEAN_FREIGHT",
            new BigDecimal("30000"), "USD", "CUST_002");
        payableOrder.setTotalCost(new BigDecimal("30000"));
        orders.add(payableOrder);
        
        // 订单3 - 应收
        orders.add(createTestOrder("NETTING_003", "AIR_FREIGHT",
            new BigDecimal("20000"), "USD", "CUST_003"));
        
        return orders;
    }
    
    /**
     * 格式化清分结果
     */
    private List<Map<String, Object>> formatClearingResults(List<ClearingResult> results) {
        List<Map<String, Object>> formatted = new ArrayList<>();
        
        for (ClearingResult result : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("resultId", result.getResultId());
            item.put("entityId", result.getEntityId());
            item.put("amount", result.getAmount());
            item.put("currency", result.getCurrency());
            item.put("transactionType", result.getTransactionType().getDescription());
            item.put("accountType", result.getAccountType().getDescription());
            item.put("description", result.getDescription());
            item.put("isTransitRetention", result.getIsTransitRetention());
            item.put("retentionAmount", result.getRetentionAmount());
            item.put("transitEntityId", result.getTransitEntityId());
            item.put("crossBorderFlowId", result.getCrossBorderFlowId());
            formatted.add(item);
        }
        
        return formatted;
    }
    
    /**
     * 创建借抬头处理汇总
     */
    private Map<String, Object> createTransitSummary(List<ClearingResult> results) {
        BigDecimal totalAmount = results.stream()
            .map(ClearingResult::getAmount)
            .map(BigDecimal::abs)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRetention = results.stream()
            .filter(r -> r.getRetentionAmount() != null)
            .map(ClearingResult::getRetentionAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long retentionRecords = results.stream()
            .filter(r -> Boolean.TRUE.equals(r.getIsTransitRetention()))
            .count();
        
        return Map.of(
            "totalRecords", results.size(),
            "totalAmount", totalAmount,
            "totalRetention", totalRetention,
            "retentionRecords", retentionRecords
        );
    }
    
    /**
     * 创建过账处理汇总
     */
    private Map<String, Object> createCrossBorderSummary(List<ClearingResult> results) {
        long crossBorderRecords = results.stream()
            .filter(r -> r.getCrossBorderFlowId() != null)
            .count();
        
        BigDecimal totalTransfer = results.stream()
            .filter(r -> ClearingResult.AccountType.CROSS_BORDER_RECEIVABLE.equals(r.getAccountType()) ||
                        ClearingResult.AccountType.CROSS_BORDER_PAYABLE.equals(r.getAccountType()))
            .map(ClearingResult::getAmount)
            .map(BigDecimal::abs)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "totalRecords", results.size(),
            "crossBorderRecords", crossBorderRecords,
            "totalTransfer", totalTransfer
        );
    }
    
    /**
     * 格式化抵消结果
     */
    private Map<String, Object> formatNettingResults(Map<String, List<ClearingResult>> nettingResults) {
        Map<String, Object> formatted = new HashMap<>();
        
        for (Map.Entry<String, List<ClearingResult>> entry : nettingResults.entrySet()) {
            formatted.put(entry.getKey(), formatClearingResults(entry.getValue()));
        }
        
        return formatted;
    }
    
    /**
     * 验证综合清分结果
     */
    private Map<String, Object> validateComprehensiveResults(List<ClearingResult> results) {
        // 验证借贷平衡
        BigDecimal totalDebit = results.stream()
            .filter(r -> r.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .map(ClearingResult::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCredit = results.stream()
            .filter(r -> r.getAmount().compareTo(BigDecimal.ZERO) < 0)
            .map(ClearingResult::getAmount)
            .map(BigDecimal::abs)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        boolean isBalanced = totalDebit.compareTo(totalCredit) == 0;
        
        // 统计各类型记录
        long transitRecords = results.stream().filter(r -> r.getTransitEntityId() != null).count();
        long crossBorderRecords = results.stream().filter(r -> r.getCrossBorderFlowId() != null).count();
        long retentionRecords = results.stream().filter(r -> Boolean.TRUE.equals(r.getIsTransitRetention())).count();
        
        return Map.of(
            "isBalanced", isBalanced,
            "totalDebit", totalDebit,
            "totalCredit", totalCredit,
            "transitRecords", transitRecords,
            "crossBorderRecords", crossBorderRecords,
            "retentionRecords", retentionRecords
        );
    }
}