package com.oneorder.clearing.controller;

import com.oneorder.clearing.entity.TransitEntity;
import com.oneorder.clearing.entity.CrossBorderFlow;
import com.oneorder.clearing.repository.TransitEntityRepository;
import com.oneorder.clearing.repository.CrossBorderFlowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 简单测试控制器 - 用于初始化基础测试数据
 */
@RestController
@RequestMapping("/api/simple-test")
@RequiredArgsConstructor
@Slf4j
public class SimpleTestController {
    
    private final TransitEntityRepository transitEntityRepository;
    private final CrossBorderFlowRepository crossBorderFlowRepository;
    
    /**
     * 初始化基础测试数据
     */
    @PostMapping("/init-data")
    public ResponseEntity<Map<String, Object>> initTestData() {
        log.info("开始初始化简单测试数据...");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 清理旧数据
            transitEntityRepository.deleteAll();
            crossBorderFlowRepository.deleteAll();
            
            // 创建收款借抬头配置
            TransitEntity receivableTransit = new TransitEntity();
            receivableTransit.setTransitId("TRANSIT_RECEIVABLE_001");
            receivableTransit.setTransitType(TransitEntity.TransitType.RECEIVABLE_TRANSIT);
            receivableTransit.setSourceEntityId("CUSTOMER_001");
            receivableTransit.setTransitEntityId("ENTITY_HK_001");
            receivableTransit.setTargetEntityId("ENTITY_CN_SALES");
            receivableTransit.setTransitAccount("6225881234567890");
            receivableTransit.setRetentionRate(new BigDecimal("0.03"));
            receivableTransit.setRetentionType(TransitEntity.RetentionType.PERCENTAGE);
            receivableTransit.setApplicableConditions("{\"businessTypes\":[\"OCEAN_FREIGHT\",\"AIR_FREIGHT\"],\"currencies\":[\"CNY\",\"USD\"]}");
            receivableTransit.setCreatedTime(LocalDateTime.now());
            receivableTransit.setCreatedBy("SYSTEM");
            transitEntityRepository.save(receivableTransit);
            
            // 创建付款借抬头配置
            TransitEntity payableTransit = new TransitEntity();
            payableTransit.setTransitId("TRANSIT_PAYABLE_001");
            payableTransit.setTransitType(TransitEntity.TransitType.PAYABLE_TRANSIT);
            payableTransit.setSourceEntityId("ENTITY_CN_SALES");
            payableTransit.setTransitEntityId("ENTITY_SG_001");
            payableTransit.setTargetEntityId("SUPPLIER_001");
            payableTransit.setTransitAccount("6225880000000001");
            payableTransit.setFixedRetentionAmount(new BigDecimal("1000"));
            payableTransit.setRetentionType(TransitEntity.RetentionType.FIXED_AMOUNT);
            payableTransit.setApplicableConditions("{\"businessTypes\":[\"TRUCK_FREIGHT\",\"RAIL_FREIGHT\"],\"currencies\":[\"CNY\"]}");
            payableTransit.setCreatedTime(LocalDateTime.now());
            payableTransit.setCreatedBy("SYSTEM");
            transitEntityRepository.save(payableTransit);
            
            // 创建标准过账流程配置
            CrossBorderFlow standardFlow = new CrossBorderFlow();
            standardFlow.setFlowId("FLOW_STANDARD_001");
            standardFlow.setFlowType(CrossBorderFlow.FlowType.STANDARD_FLOW);
            standardFlow.setPayerEntityId("ENTITY_CN_NINGBO");
            standardFlow.setPayerRegion("CN");
            standardFlow.setTransitEntityId("ENTITY_HK_TRANSIT");
            standardFlow.setTransitRegion("HK");
            standardFlow.setReceiverEntityId("ENTITY_TH_RECEIVER");
            standardFlow.setReceiverRegion("TH");
            standardFlow.setProcessingType(CrossBorderFlow.ProcessingType.FLAT_TRANSFER);
            standardFlow.setTransitRetentionRate(new BigDecimal("0.005"));
            standardFlow.setNettingEnabled(true);
            standardFlow.setNettingPriority(1);
            standardFlow.setApplicableConditions("{\"businessTypes\":[\"OCEAN_FREIGHT\"],\"currencies\":[\"CNY\",\"USD\"]}");
            standardFlow.setCreatedTime(LocalDateTime.now());
            standardFlow.setCreatedBy("SYSTEM");
            crossBorderFlowRepository.save(standardFlow);
            
            // 创建东南亚过账流程配置
            CrossBorderFlow seaFlow = new CrossBorderFlow();
            seaFlow.setFlowId("FLOW_SOUTHEAST_001");
            seaFlow.setFlowType(CrossBorderFlow.FlowType.SOUTHEAST_ASIA_FLOW);
            seaFlow.setPayerEntityId("ENTITY_CN_SHENZHEN");
            seaFlow.setPayerRegion("CN");
            seaFlow.setTransitEntityId("ENTITY_SG_TRANSIT");
            seaFlow.setTransitRegion("SG");
            seaFlow.setReceiverEntityId("ENTITY_MY_RECEIVER");
            seaFlow.setReceiverRegion("MY");
            seaFlow.setProcessingType(CrossBorderFlow.ProcessingType.NET_TRANSFER);
            seaFlow.setTransitRetentionRate(new BigDecimal("0.008"));
            seaFlow.setNettingEnabled(true);
            seaFlow.setNettingPriority(2);
            seaFlow.setApplicableConditions("{\"businessTypes\":[\"AIR_FREIGHT\",\"TRUCK_FREIGHT\"],\"currencies\":[\"CNY\",\"USD\"]}");
            seaFlow.setCreatedTime(LocalDateTime.now());
            seaFlow.setCreatedBy("SYSTEM");
            crossBorderFlowRepository.save(seaFlow);
            
            result.put("success", true);
            result.put("message", "测试数据初始化成功");
            result.put("data", Map.of(
                "transitEntities", 2,
                "crossBorderFlows", 2,
                "timestamp", LocalDateTime.now()
            ));
            
            log.info("简单测试数据初始化完成");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("初始化测试数据失败", e);
            result.put("success", false);
            result.put("message", "初始化失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 获取测试数据状态
     */
    @GetMapping("/data-status")
    public ResponseEntity<Map<String, Object>> getDataStatus() {
        Map<String, Object> result = new HashMap<>();
        
        long transitCount = transitEntityRepository.count();
        long flowCount = crossBorderFlowRepository.count();
        
        result.put("success", true);
        result.put("data", Map.of(
            "transitEntityCount", transitCount,
            "crossBorderFlowCount", flowCount,
            "hasTestData", transitCount > 0 && flowCount > 0
        ));
        
        return ResponseEntity.ok(result);
    }
}