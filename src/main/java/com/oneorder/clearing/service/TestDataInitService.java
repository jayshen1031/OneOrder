package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * 测试数据初始化服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TestDataInitService {
    
    private final TransitEntityRepository transitEntityRepository;
    private final CrossBorderFlowRepository crossBorderFlowRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * 初始化借抬头测试数据
     */
    @Transactional
    public void initTransitEntityTestData() {
        log.info("开始初始化借抬头测试数据...");
        
        try {
            // 清除现有数据
            transitEntityRepository.deleteAll();
            
            // 1. 收款借抬头配置 - 中国香港
            TransitEntity receivableTransitHK = createTransitEntity(
                "TRANSIT_001",
                TransitEntity.TransitType.RECEIVABLE_TRANSIT,
                "CUSTOMER", // 客户
                "ENTITY_HK_001", // 香港中间法人
                "ENTITY_CN_SALES", // 中国销售法人
                "6225881234567890", // 借抬头账号
                new BigDecimal("0.03"), // 3%留存
                null,
                TransitEntity.RetentionType.PERCENTAGE,
                createReceivableTransitConditions()
            );
            transitEntityRepository.save(receivableTransitHK);
            
            // 2. 付款借抬头配置 - 新加坡
            TransitEntity payableTransitSG = createTransitEntity(
                "TRANSIT_002", 
                TransitEntity.TransitType.PAYABLE_TRANSIT,
                "ENTITY_CN_SALES", // 中国销售法人
                "ENTITY_SG_001", // 新加坡中间法人
                "SUPPLIER", // 供应商
                "6225889876543210", // 借抬头账号
                new BigDecimal("0.025"), // 2.5%留存
                null,
                TransitEntity.RetentionType.PERCENTAGE,
                createPayableTransitConditions()
            );
            transitEntityRepository.save(payableTransitSG);
            
            // 3. 固定金额留存借抬头 - 美国
            TransitEntity fixedRetentionUS = createTransitEntity(
                "TRANSIT_003",
                TransitEntity.TransitType.RECEIVABLE_TRANSIT,
                "CUSTOMER",
                "ENTITY_US_001", // 美国中间法人
                "ENTITY_CN_SALES",
                "6225887777888899",
                null,
                new BigDecimal("500.00"), // 固定500元留存
                TransitEntity.RetentionType.FIXED_AMOUNT,
                createUSTransitConditions()
            );
            transitEntityRepository.save(fixedRetentionUS);
            
            log.info("借抬头测试数据初始化完成，共创建{}条记录", 3);
            
        } catch (Exception e) {
            log.error("初始化借抬头测试数据失败", e);
            throw new RuntimeException("初始化借抬头测试数据失败: " + e.getMessage());
        }
    }
    
    /**
     * 初始化过账规则测试数据
     */
    @Transactional
    public void initCrossBorderFlowTestData() {
        log.info("开始初始化过账规则测试数据...");
        
        try {
            // 清除现有数据
            crossBorderFlowRepository.deleteAll();
            
            // 1. 标准过账流程：宁波→香港→泰国
            CrossBorderFlow standardFlow = createCrossBorderFlow(
                "FLOW_001",
                CrossBorderFlow.FlowType.STANDARD_FLOW,
                "ENTITY_CN_NINGBO", // 宁波付款方
                "中国大陆",
                "ENTITY_HK_001", // 香港过账方
                "中国香港",
                "ENTITY_TH_001", // 泰国收款方
                "泰国",
                CrossBorderFlow.ProcessingType.FLAT_TRANSFER,
                false, // 不支持抵消
                null,
                new BigDecimal("0.005"), // 0.5%过账费
                null,
                CrossBorderFlow.RetentionCalculationType.PERCENTAGE_RETENTION,
                createStandardFlowConditions()
            );
            crossBorderFlowRepository.save(standardFlow);
            
            // 2. 东南亚抵消过账：新加坡→香港→越南
            CrossBorderFlow nettingFlow = createCrossBorderFlow(
                "FLOW_002",
                CrossBorderFlow.FlowType.SOUTHEAST_ASIA_FLOW,
                "ENTITY_SG_001", // 新加坡付款方
                "新加坡",
                "ENTITY_HK_002", // 香港过账方
                "中国香港",
                "ENTITY_VN_001", // 越南收款方
                "越南",
                CrossBorderFlow.ProcessingType.NET_TRANSFER,
                true, // 支持抵消
                1, // 抵消优先级1
                new BigDecimal("0.003"), // 0.3%过账费
                null,
                CrossBorderFlow.RetentionCalculationType.PERCENTAGE_RETENTION,
                createSEAFlowConditions()
            );
            crossBorderFlowRepository.save(nettingFlow);
            
            // 3. 欧美固定费用过账：上海→伦敦→纽约
            CrossBorderFlow fixedFeeFlow = createCrossBorderFlow(
                "FLOW_003",
                CrossBorderFlow.FlowType.EUROPE_AMERICA_FLOW,
                "ENTITY_CN_SHANGHAI", // 上海付款方
                "中国大陆",
                "ENTITY_UK_001", // 伦敦过账方
                "英国",
                "ENTITY_US_001", // 纽约收款方
                "美国",
                CrossBorderFlow.ProcessingType.SEGMENTED_TRANSFER,
                false,
                null,
                null,
                new BigDecimal("100.00"), // 固定100元过账费
                CrossBorderFlow.RetentionCalculationType.FIXED_AMOUNT_RETENTION,
                createEuropeAmericaFlowConditions()
            );
            crossBorderFlowRepository.save(fixedFeeFlow);
            
            log.info("过账规则测试数据初始化完成，共创建{}条记录", 3);
            
        } catch (Exception e) {
            log.error("初始化过账规则测试数据失败", e);
            throw new RuntimeException("初始化过账规则测试数据失败: " + e.getMessage());
        }
    }
    
    /**
     * 创建借抬头实体
     */
    private TransitEntity createTransitEntity(String transitId, TransitEntity.TransitType transitType,
                                            String sourceEntityId, String transitEntityId, String targetEntityId,
                                            String transitAccount, BigDecimal retentionRate, BigDecimal fixedRetentionAmount,
                                            TransitEntity.RetentionType retentionType, String applicableConditions) {
        TransitEntity entity = new TransitEntity();
        entity.setTransitId(transitId);
        entity.setTransitType(transitType);
        entity.setSourceEntityId(sourceEntityId);
        entity.setTransitEntityId(transitEntityId);
        entity.setTargetEntityId(targetEntityId);
        entity.setTransitAccount(transitAccount);
        entity.setRetentionRate(retentionRate);
        entity.setFixedRetentionAmount(fixedRetentionAmount);
        entity.setRetentionType(retentionType);
        entity.setApplicableConditions(applicableConditions);
        entity.setIsActive(true);
        return entity;
    }
    
    /**
     * 创建过账流程实体
     */
    private CrossBorderFlow createCrossBorderFlow(String flowId, CrossBorderFlow.FlowType flowType,
                                                String payerEntityId, String payerRegion,
                                                String transitEntityId, String transitRegion,
                                                String receiverEntityId, String receiverRegion,
                                                CrossBorderFlow.ProcessingType processingType,
                                                Boolean nettingEnabled, Integer nettingPriority,
                                                BigDecimal transitRetentionRate, BigDecimal transitFixedRetention,
                                                CrossBorderFlow.RetentionCalculationType retentionCalculationType,
                                                String applicableConditions) {
        CrossBorderFlow flow = new CrossBorderFlow();
        flow.setFlowId(flowId);
        flow.setFlowType(flowType);
        flow.setPayerEntityId(payerEntityId);
        flow.setPayerRegion(payerRegion);
        flow.setTransitEntityId(transitEntityId);
        flow.setTransitRegion(transitRegion);
        flow.setReceiverEntityId(receiverEntityId);
        flow.setReceiverRegion(receiverRegion);
        flow.setProcessingType(processingType);
        flow.setNettingEnabled(nettingEnabled);
        flow.setNettingPriority(nettingPriority);
        flow.setTransitRetentionRate(transitRetentionRate);
        flow.setTransitFixedRetention(transitFixedRetention);
        flow.setRetentionCalculationType(retentionCalculationType);
        flow.setApplicableConditions(applicableConditions);
        flow.setIsActive(true);
        return flow;
    }
    
    /**
     * 创建收款借抬头适用条件
     */
    private String createReceivableTransitConditions() {
        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("businessTypes", Arrays.asList("OCEAN_FREIGHT", "AIR_FREIGHT"));
            conditions.put("currencies", Arrays.asList("CNY", "USD"));
            conditions.put("amountRange", Map.of("min", 1000, "max", 100000));
            conditions.put("customerIds", Arrays.asList("CUST_001", "CUST_002"));
            return objectMapper.writeValueAsString(conditions);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    /**
     * 创建付款借抬头适用条件
     */
    private String createPayableTransitConditions() {
        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("businessTypes", Arrays.asList("OCEAN_FREIGHT", "TRUCK_FREIGHT", "RAIL_FREIGHT"));
            conditions.put("currencies", Arrays.asList("CNY", "USD", "SGD"));
            conditions.put("amountRange", Map.of("min", 500, "max", 50000));
            return objectMapper.writeValueAsString(conditions);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    /**
     * 创建美国借抬头适用条件
     */
    private String createUSTransitConditions() {
        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("businessTypes", Arrays.asList("AIR_FREIGHT", "CUSTOMS"));
            conditions.put("currencies", Arrays.asList("USD"));
            conditions.put("amountRange", Map.of("min", 2000));
            return objectMapper.writeValueAsString(conditions);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    /**
     * 创建标准过账流程适用条件
     */
    private String createStandardFlowConditions() {
        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("businessTypes", Arrays.asList("OCEAN_FREIGHT", "TRUCK_FREIGHT"));
            conditions.put("currencies", Arrays.asList("CNY", "THB"));
            conditions.put("regions", Arrays.asList("中国大陆", "泰国"));
            return objectMapper.writeValueAsString(conditions);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    /**
     * 创建东南亚过账流程适用条件
     */
    private String createSEAFlowConditions() {
        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("businessTypes", Arrays.asList("OCEAN_FREIGHT", "AIR_FREIGHT"));
            conditions.put("currencies", Arrays.asList("USD", "SGD", "VND"));
            conditions.put("regions", Arrays.asList("新加坡", "越南"));
            return objectMapper.writeValueAsString(conditions);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    /**
     * 创建欧美过账流程适用条件
     */
    private String createEuropeAmericaFlowConditions() {
        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("businessTypes", Arrays.asList("AIR_FREIGHT", "RAIL_FREIGHT"));
            conditions.put("currencies", Arrays.asList("USD", "EUR", "GBP"));
            conditions.put("regions", Arrays.asList("英国", "美国"));
            return objectMapper.writeValueAsString(conditions);
        } catch (Exception e) {
            return "{}";
        }
    }
}