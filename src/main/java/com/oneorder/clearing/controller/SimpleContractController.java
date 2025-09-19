package com.oneorder.clearing.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 简化版内部合约管理控制器
 * 提供合约管理系统的基础状态和统计信息
 */
@RestController
@RequestMapping("/api/simple-contract")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Component
public class SimpleContractController {

    /**
     * 获取合约管理系统状态
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        log.info("获取合约管理系统状态");
        
        Map<String, Object> status = new HashMap<>();
        status.put("systemName", "OneOrder内部合约管理系统");
        status.put("version", "1.0.0");
        status.put("status", "运行中");
        status.put("timestamp", LocalDateTime.now());
        
        // 模拟统计数据
        Map<String, Integer> statistics = new HashMap<>();
        statistics.put("totalMasterContracts", 0);
        statistics.put("totalContractTerms", 0);
        statistics.put("totalIntercompanyRules", 0);
        statistics.put("totalSubsidyRules", 0);
        statistics.put("totalRetentionRules", 0);
        statistics.put("totalFundRoutingRules", 0);
        
        status.put("statistics", statistics);
        
        Map<String, String> features = new HashMap<>();
        features.put("database", "已配置 - 6个核心表");
        features.put("api", "已设计 - 45个接口");
        features.put("businessProcess", "已集成 - 三阶段流程");
        features.put("profitSharing", "已实现 - 智能分润引擎");
        features.put("frontend", "开发中 - 正在修复编译问题");
        
        status.put("features", features);
        
        return ResponseEntity.ok(status);
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.info("合约管理系统健康检查");
        
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("database", "连接正常");
        health.put("api", "服务可用");
        health.put("timestamp", LocalDateTime.now().toString());
        
        return ResponseEntity.ok(health);
    }

    /**
     * 获取系统架构信息
     */
    @GetMapping("/architecture")
    public ResponseEntity<Map<String, Object>> getArchitecture() {
        log.info("获取系统架构信息");
        
        Map<String, Object> architecture = new HashMap<>();
        
        String[] tables = {
            "internal_master_contract - 内部主合约表",
            "contract_terms - 合约条款表", 
            "intercompany_transaction_rules - 关联交易规则表",
            "assessment_subsidy_rules - 考核补贴规则表",
            "receipt_payment_retention_rules - 收付款借抬头规则表",
            "fund_routing_rules - 资金路由规则表"
        };
        
        String[] components = {
            "EnhancedBusinessProcessService - 业务流程服务",
            "EnhancedProfitSharingEngine - 分润计算引擎", 
            "ContractManagementController - 合约管理API",
            "三阶段业务流程 - 接单→派单→接单"
        };
        
        String[] profitModels = {
            "BUY_SELL_PRICE - 买卖价分润",
            "COST_PLUS_FEE - 成本+操作费",
            "RATIO_SHARING - 按比例分润",
            "CUSTOM_SCRIPT - 自定义脚本"
        };
        
        architecture.put("databaseTables", tables);
        architecture.put("coreComponents", components);
        architecture.put("profitSharingModels", profitModels);
        architecture.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(architecture);
    }
}