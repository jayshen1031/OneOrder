package com.oneorder.clearing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * 管法分离报表控制器 - 基于5大流程业务数据生成报表
 */
@RestController
@RequestMapping("/entity-separation")
@CrossOrigin(origins = "*")
public class EntitySeparationController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/management-legal-report")
    public ResponseEntity<Map<String, Object>> generateManagementLegalReport() {
        try {
            Map<String, Object> report = new HashMap<>();
            
            // 1. 报表概览
            Map<String, Object> overview = generateReportOverview();
            report.put("overview", overview);
            
            // 2. 按法人实体汇总
            List<Map<String, Object>> legalEntitySummary = generateLegalEntitySummary();
            report.put("legalEntitySummary", legalEntitySummary);
            
            // 3. 按管理实体汇总
            List<Map<String, Object>> managementEntitySummary = generateManagementEntitySummary();
            report.put("managementEntitySummary", managementEntitySummary);
            
            // 4. 资金流向详细记录
            List<Map<String, Object>> fundFlowDetails = generateFundFlowDetails();
            report.put("fundFlowDetails", fundFlowDetails);
            
            // 5. 过账处理统计
            List<Map<String, Object>> passthroughStats = generatePassthroughStats();
            report.put("passthroughStats", passthroughStats);
            
            // 6. 业务统计数据
            Map<String, Object> businessStats = generateBusinessStats();
            report.put("businessStats", businessStats);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "管法分离报表生成成功");
            response.put("data", report);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "管法分离报表生成失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    private Map<String, Object> generateReportOverview() {
        Map<String, Object> overview = new HashMap<>();
        
        try {
            // 统计订单总数
            String orderCountSql = "SELECT COUNT(*) FROM orders";
            Integer orderCount = jdbcTemplate.queryForObject(orderCountSql, Integer.class);
            overview.put("totalOrders", orderCount != null ? orderCount : 0);
            
            // 统计总营收
            String revenueSql = "SELECT COALESCE(SUM(total_amount), 0) FROM orders";
            BigDecimal totalRevenue = jdbcTemplate.queryForObject(revenueSql, BigDecimal.class);
            overview.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
            
            // 统计分润总额
            String profitSql = "SELECT COALESCE(SUM(total_profit), 0) FROM profit_sharing_calculations";
            BigDecimal totalProfit = jdbcTemplate.queryForObject(profitSql, BigDecimal.class);
            overview.put("totalProfit", totalProfit != null ? totalProfit : BigDecimal.ZERO);
            
            // 统计清分总额
            String clearingSql = "SELECT COALESCE(SUM(cleared_amount), 0) FROM clearing_instructions";
            BigDecimal totalClearing = jdbcTemplate.queryForObject(clearingSql, BigDecimal.class);
            overview.put("totalClearing", totalClearing != null ? totalClearing : BigDecimal.ZERO);
            
            // 统计过账总额
            String passthroughSql = "SELECT COALESCE(SUM(passthrough_amount), 0) FROM passthrough_instructions";
            BigDecimal totalPassthrough = jdbcTemplate.queryForObject(passthroughSql, BigDecimal.class);
            overview.put("totalPassthrough", totalPassthrough != null ? totalPassthrough : BigDecimal.ZERO);
            
            // 统计法人实体数量
            String legalEntitySql = "SELECT COUNT(*) FROM legal_entities WHERE is_active = true";
            Integer legalEntityCount = jdbcTemplate.queryForObject(legalEntitySql, Integer.class);
            overview.put("activeLegalEntities", legalEntityCount != null ? legalEntityCount : 0);
            
            // 统计管理实体数量
            String mgmtEntitySql = "SELECT COUNT(*) FROM management_entities WHERE is_active = true";
            Integer mgmtEntityCount = jdbcTemplate.queryForObject(mgmtEntitySql, Integer.class);
            overview.put("activeManagementEntities", mgmtEntityCount != null ? mgmtEntityCount : 0);
            
            // 生成报表时间
            overview.put("reportGeneratedAt", new java.util.Date().toString());
            overview.put("reportPeriod", "2025-09");
            
        } catch (Exception e) {
            System.out.println("生成报表概览时出错: " + e.getMessage());
        }
        
        return overview;
    }

    private List<Map<String, Object>> generateLegalEntitySummary() {
        List<Map<String, Object>> summary = new ArrayList<>();
        
        try {
            String sql = "SELECT " +
                "le.entity_id, " +
                "le.entity_name, " +
                "le.entity_code, " +
                "le.entity_type, " +
                "le.country_code, " +
                "le.currency_code, " +
                "COALESCE(order_stats.order_count, 0) as order_count, " +
                "COALESCE(order_stats.total_revenue, 0) as total_revenue, " +
                "COALESCE(fund_stats.outbound_flows, 0) as outbound_flows, " +
                "COALESCE(fund_stats.inbound_flows, 0) as inbound_flows, " +
                "COALESCE(fund_stats.net_flows, 0) as net_flows " +
                "FROM legal_entities le " +
                "LEFT JOIN (" +
                "    SELECT " +
                "        sales_entity_id, " +
                "        COUNT(*) as order_count, " +
                "        SUM(total_amount) as total_revenue " +
                "    FROM orders " +
                "    WHERE sales_entity_id IS NOT NULL " +
                "    GROUP BY sales_entity_id " +
                ") order_stats ON le.entity_id = order_stats.sales_entity_id " +
                "LEFT JOIN (" +
                "    SELECT " +
                "        source_legal_entity, " +
                "        SUM(CASE WHEN flow_direction = 'OUTBOUND' THEN flow_amount ELSE 0 END) as outbound_flows, " +
                "        SUM(CASE WHEN flow_direction = 'INBOUND' THEN flow_amount ELSE 0 END) as inbound_flows, " +
                "        SUM(CASE WHEN flow_direction = 'OUTBOUND' THEN -flow_amount ELSE flow_amount END) as net_flows " +
                "    FROM fund_flow_records " +
                "    GROUP BY source_legal_entity " +
                ") fund_stats ON le.entity_id = fund_stats.source_legal_entity " +
                "WHERE le.is_active = true " +
                "ORDER BY le.entity_id";
            
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            for (Map<String, Object> row : rows) {
                summary.add(new HashMap<>(row));
            }
            
        } catch (Exception e) {
            System.out.println("生成法人实体汇总时出错: " + e.getMessage());
        }
        
        return summary;
    }

    private List<Map<String, Object>> generateManagementEntitySummary() {
        List<Map<String, Object>> summary = new ArrayList<>();
        
        try {
            String sql = "SELECT " +
                "me.mgmt_entity_id, " +
                "me.mgmt_entity_name, " +
                "me.mgmt_entity_code, " +
                "me.entity_level, " +
                "me.entity_path, " +
                "me.cost_center_code, " +
                "COALESCE(fund_stats.managed_flows, 0) as managed_flows, " +
                "COALESCE(passthrough_stats.total_instructions, 0) as total_instructions, " +
                "COALESCE(passthrough_stats.total_passthrough_amount, 0) as total_passthrough_amount, " +
                "COALESCE(passthrough_stats.total_retention_amount, 0) as total_retention_amount " +
                "FROM management_entities me " +
                "LEFT JOIN (" +
                "    SELECT " +
                "        mgmt_entity_id, " +
                "        COUNT(*) as managed_flows, " +
                "        SUM(flow_amount) as total_managed_amount " +
                "    FROM fund_flow_records " +
                "    WHERE mgmt_entity_id IS NOT NULL " +
                "    GROUP BY mgmt_entity_id " +
                ") fund_stats ON me.mgmt_entity_id = fund_stats.mgmt_entity_id " +
                "LEFT JOIN passthrough_entity_stats passthrough_stats " +
                "    ON me.mgmt_entity_id = passthrough_stats.mgmt_entity_id " +
                "    AND passthrough_stats.accounting_period = '2025-09' " +
                "WHERE me.is_active = true " +
                "ORDER BY me.entity_level, me.mgmt_entity_id";
            
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            for (Map<String, Object> row : rows) {
                summary.add(new HashMap<>(row));
            }
            
        } catch (Exception e) {
            System.out.println("生成管理实体汇总时出错: " + e.getMessage());
        }
        
        return summary;
    }

    private List<Map<String, Object>> generateFundFlowDetails() {
        List<Map<String, Object>> details = new ArrayList<>();
        
        try {
            String sql = "SELECT " +
                "ffr.flow_record_id, " +
                "ffr.source_legal_entity, " +
                "source_le.entity_name as source_entity_name, " +
                "ffr.target_legal_entity, " +
                "target_le.entity_name as target_entity_name, " +
                "ffr.mgmt_entity_id, " +
                "me.mgmt_entity_name, " +
                "ffr.flow_type, " +
                "ffr.reference_id, " +
                "ffr.reference_type, " +
                "ffr.flow_amount, " +
                "ffr.flow_currency, " +
                "ffr.flow_date, " +
                "ffr.business_date, " +
                "ffr.accounting_period, " +
                "ffr.flow_direction " +
                "FROM fund_flow_records ffr " +
                "LEFT JOIN legal_entities source_le ON ffr.source_legal_entity = source_le.entity_id " +
                "LEFT JOIN legal_entities target_le ON ffr.target_legal_entity = target_le.entity_id " +
                "LEFT JOIN management_entities me ON ffr.mgmt_entity_id = me.mgmt_entity_id " +
                "ORDER BY ffr.flow_date DESC, ffr.flow_record_id";
            
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            for (Map<String, Object> row : rows) {
                details.add(new HashMap<>(row));
            }
            
        } catch (Exception e) {
            System.out.println("生成资金流向详情时出错: " + e.getMessage());
        }
        
        return details;
    }

    private List<Map<String, Object>> generatePassthroughStats() {
        List<Map<String, Object>> stats = new ArrayList<>();
        
        try {
            String sql = "SELECT " +
                "pes.stat_record_id, " +
                "pes.accounting_period, " +
                "pes.legal_entity_id, " +
                "le.entity_name as legal_entity_name, " +
                "pes.mgmt_entity_id, " +
                "me.mgmt_entity_name, " +
                "pes.total_instructions, " +
                "pes.completed_instructions, " +
                "pes.failed_instructions, " +
                "pes.total_original_amount, " +
                "pes.total_passthrough_amount, " +
                "pes.total_retention_amount, " +
                "CASE " +
                "    WHEN pes.total_instructions > 0 " +
                "    THEN ROUND((pes.completed_instructions::DECIMAL / pes.total_instructions * 100), 2) " +
                "    ELSE 0 " +
                "END as success_rate, " +
                "CASE " +
                "    WHEN pes.total_original_amount > 0 " +
                "    THEN ROUND((pes.total_retention_amount / pes.total_original_amount * 100), 2) " +
                "    ELSE 0 " +
                "END as retention_rate " +
                "FROM passthrough_entity_stats pes " +
                "LEFT JOIN legal_entities le ON pes.legal_entity_id = le.entity_id " +
                "LEFT JOIN management_entities me ON pes.mgmt_entity_id = me.mgmt_entity_id " +
                "WHERE pes.accounting_period = '2025-09' " +
                "ORDER BY pes.legal_entity_id";
            
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            for (Map<String, Object> row : rows) {
                stats.add(new HashMap<>(row));
            }
            
        } catch (Exception e) {
            System.out.println("生成过账处理统计时出错: " + e.getMessage());
        }
        
        return stats;
    }

    private Map<String, Object> generateBusinessStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 按业务类型统计订单
            String businessTypeSql = "SELECT " +
                "business_type, " +
                "COUNT(*) as order_count, " +
                "COALESCE(SUM(total_amount), 0) as total_revenue " +
                "FROM orders " +
                "WHERE business_type IS NOT NULL " +
                "GROUP BY business_type " +
                "ORDER BY total_revenue DESC";
            
            List<Map<String, Object>> businessTypeStats = jdbcTemplate.queryForList(businessTypeSql);
            stats.put("businessTypeStats", businessTypeStats);
            
            // 按订单状态统计
            String orderStatusSql = "SELECT " +
                "order_status, " +
                "COUNT(*) as order_count, " +
                "COALESCE(SUM(total_amount), 0) as total_amount " +
                "FROM orders " +
                "WHERE order_status IS NOT NULL " +
                "GROUP BY order_status " +
                "ORDER BY order_count DESC";
            
            List<Map<String, Object>> orderStatusStats = jdbcTemplate.queryForList(orderStatusSql);
            stats.put("orderStatusStats", orderStatusStats);
            
            // 按清分模式统计
            String clearingModeSql = "SELECT " +
                "clearing_mode, " +
                "COUNT(*) as instruction_count, " +
                "COALESCE(SUM(cleared_amount), 0) as total_cleared_amount, " +
                "COALESCE(SUM(clearing_fee), 0) as total_clearing_fee " +
                "FROM clearing_instructions " +
                "GROUP BY clearing_mode " +
                "ORDER BY total_cleared_amount DESC";
            
            List<Map<String, Object>> clearingModeStats = jdbcTemplate.queryForList(clearingModeSql);
            stats.put("clearingModeStats", clearingModeStats);
            
            // 按过账模式统计
            String passthroughModeSql = "SELECT " +
                "passthrough_mode, " +
                "COUNT(*) as instruction_count, " +
                "COALESCE(SUM(passthrough_amount), 0) as total_passthrough_amount, " +
                "COALESCE(SUM(retention_amount), 0) as total_retention_amount " +
                "FROM passthrough_instructions " +
                "GROUP BY passthrough_mode " +
                "ORDER BY total_passthrough_amount DESC";
            
            List<Map<String, Object>> passthroughModeStats = jdbcTemplate.queryForList(passthroughModeSql);
            stats.put("passthroughModeStats", passthroughModeStats);
            
        } catch (Exception e) {
            System.out.println("生成业务统计时出错: " + e.getMessage());
        }
        
        return stats;
    }
}