package com.oneorder.clearing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 管法分离报表控制器
 * 提供管理实体与法人实体分离的财务报表功能
 */
@RestController
@RequestMapping("/api/entity-separation-reports")
@CrossOrigin(origins = "*")
public class EntitySeparationReportsController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ================ 1. 法人实体管理 ================

    @GetMapping("/legal-entities")
    public ResponseEntity<Map<String, Object>> getLegalEntities() {
        try {
            String sql = "SELECT entity_id, entity_name, entity_code, entity_type, country_code, " +
                        "currency_code, tax_id, is_active, created_at " +
                        "FROM legal_entities " +
                        "WHERE is_active = true " +
                        "ORDER BY entity_type, entity_name";
            
            List<Map<String, Object>> entities = jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> entity = new HashMap<>();
                    entity.put("entityId", rs.getString("entity_id"));
                    entity.put("entityName", rs.getString("entity_name"));
                    entity.put("entityCode", rs.getString("entity_code"));
                    entity.put("entityType", rs.getString("entity_type"));
                    entity.put("countryCode", rs.getString("country_code"));
                    entity.put("currencyCode", rs.getString("currency_code"));
                    entity.put("taxId", rs.getString("tax_id"));
                    entity.put("isActive", rs.getBoolean("is_active"));
                    entity.put("createdAt", rs.getTimestamp("created_at"));
                    
                    // 添加实体类型显示名称
                    String entityType = rs.getString("entity_type");
                    String typeDisplayName;
                    switch (entityType) {
                        case "DOMESTIC": typeDisplayName = "境内法人"; break;
                        case "OVERSEAS": typeDisplayName = "境外法人"; break;
                        case "BRANCH": typeDisplayName = "分支机构"; break;
                        default: typeDisplayName = entityType; break;
                    }
                    entity.put("entityTypeDisplay", typeDisplayName);
                    
                    return entity;
                }
            });

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取法人实体列表成功");
            response.put("data", entities);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "获取法人实体列表失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ================ 2. 管理实体管理 ================

    @GetMapping("/management-entities")
    public ResponseEntity<Map<String, Object>> getManagementEntities() {
        try {
            String sql = "SELECT mgmt_entity_id, mgmt_entity_name, mgmt_entity_code, " +
                        "entity_level, entity_path, manager_name, cost_center_code, " +
                        "profit_center_code, is_active " +
                        "FROM management_entities " +
                        "WHERE is_active = true " +
                        "ORDER BY entity_level, entity_path";
            
            List<Map<String, Object>> entities = jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> entity = new HashMap<>();
                    entity.put("mgmtEntityId", rs.getString("mgmt_entity_id"));
                    entity.put("mgmtEntityName", rs.getString("mgmt_entity_name"));
                    entity.put("mgmtEntityCode", rs.getString("mgmt_entity_code"));
                    entity.put("entityLevel", rs.getInt("entity_level"));
                    entity.put("entityPath", rs.getString("entity_path"));
                    entity.put("managerName", rs.getString("manager_name"));
                    entity.put("costCenterCode", rs.getString("cost_center_code"));
                    entity.put("profitCenterCode", rs.getString("profit_center_code"));
                    entity.put("isActive", rs.getBoolean("is_active"));
                    
                    // 添加层级显示名称
                    int level = rs.getInt("entity_level");
                    String levelDisplay;
                    switch (level) {
                        case 1: levelDisplay = "总部"; break;
                        case 2: levelDisplay = "区域"; break;
                        case 3: levelDisplay = "分部"; break;
                        case 4: levelDisplay = "部门"; break;
                        default: levelDisplay = "第" + level + "级"; break;
                    }
                    entity.put("entityLevelDisplay", levelDisplay);
                    
                    return entity;
                }
            });

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取管理实体列表成功");
            response.put("data", entities);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "获取管理实体列表失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ================ 3. 管法对应关系 ================

    @GetMapping("/entity-mappings")
    public ResponseEntity<Map<String, Object>> getEntityMappings() {
        try {
            // 由于可能视图不存在，使用简单的查询作为演示
            String sql = "SELECT em.mapping_id, em.allocation_ratio, em.effective_date, em.expiry_date, " +
                        "em.is_primary, me.mgmt_entity_name, me.mgmt_entity_code, " +
                        "le.entity_name as legal_entity_name, le.entity_code as legal_entity_code, le.entity_type " +
                        "FROM entity_mappings em " +
                        "LEFT JOIN management_entities me ON em.mgmt_entity_id = me.mgmt_entity_id " +
                        "LEFT JOIN legal_entities le ON em.legal_entity_id = le.entity_id " +
                        "WHERE me.is_active = true AND le.is_active = true " +
                        "ORDER BY me.mgmt_entity_name, le.entity_name";
            
            List<Map<String, Object>> mappings = jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> mapping = new HashMap<>();
                    mapping.put("mappingId", rs.getString("mapping_id"));
                    mapping.put("mgmtEntityName", rs.getString("mgmt_entity_name"));
                    mapping.put("mgmtEntityCode", rs.getString("mgmt_entity_code"));
                    mapping.put("legalEntityName", rs.getString("legal_entity_name"));
                    mapping.put("legalEntityCode", rs.getString("legal_entity_code"));
                    mapping.put("entityType", rs.getString("entity_type"));
                    mapping.put("allocationRatio", rs.getBigDecimal("allocation_ratio"));
                    mapping.put("effectiveDate", rs.getDate("effective_date"));
                    mapping.put("expiryDate", rs.getDate("expiry_date"));
                    mapping.put("isPrimary", rs.getBoolean("is_primary"));
                    
                    // 计算分配比例百分比显示
                    BigDecimal ratio = rs.getBigDecimal("allocation_ratio");
                    if (ratio != null) {
                        mapping.put("allocationPercentage", ratio.multiply(new BigDecimal("100")));
                    }
                    
                    // 状态判断
                    java.sql.Date expiryDate = rs.getDate("expiry_date");
                    String mappingStatus = (expiryDate == null || expiryDate.after(new java.sql.Date(System.currentTimeMillis()))) 
                        ? "ACTIVE" : "EXPIRED";
                    mapping.put("mappingStatus", mappingStatus);
                    
                    return mapping;
                }
            });

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取管法对应关系成功");
            response.put("data", mappings);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "获取管法对应关系失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ================ 4. 综合统计仪表盘 ================

    @GetMapping("/dashboard-statistics")
    public ResponseEntity<Map<String, Object>> getDashboardStatistics(
            @RequestParam(required = false) String period) {
        try {
            String currentPeriod = period != null ? period : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            
            Map<String, Object> dashboardData = new HashMap<>();
            dashboardData.put("period", currentPeriod);
            
            // 1. 法人实体统计
            try {
                String entityCountSql = "SELECT entity_type, COUNT(*) as count FROM legal_entities WHERE is_active = true GROUP BY entity_type";
                List<Map<String, Object>> entityCounts = jdbcTemplate.queryForList(entityCountSql);
                dashboardData.put("entityCounts", entityCounts);
            } catch (Exception e) {
                dashboardData.put("entityCounts", new ArrayList<>());
            }
            
            // 2. 默认的统计数据（由于相关表可能不存在，使用默认值）
            dashboardData.put("flowStats", new ArrayList<>());
            
            Map<String, Object> passthroughStats = new HashMap<>();
            passthroughStats.put("total_instructions", 0);
            passthroughStats.put("completed_instructions", 0);
            passthroughStats.put("total_amount", BigDecimal.ZERO);
            dashboardData.put("passthroughStats", passthroughStats);
            
            dashboardData.put("complianceStats", new ArrayList<>());

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取仪表盘统计数据成功");
            response.put("data", dashboardData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "获取仪表盘统计数据失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ================ 5. 占位API接口 ================
    
    @GetMapping("/fund-flow-reports")
    public ResponseEntity<Map<String, Object>> getFundFlowReports(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String flowType) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "资金流向报表功能开发中");
        Map<String, Object> data = new HashMap<>();
        data.put("period", period != null ? period : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
        data.put("summary", new HashMap<String, Object>() {{
            put("totalTransactions", 0);
            put("totalAmount", BigDecimal.ZERO);
            put("reportCount", 0);
        }});
        data.put("details", new ArrayList<>());
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profit-loss-reports")
    public ResponseEntity<Map<String, Object>> getProfitLossReports(
            @RequestParam(required = false) String period) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "损益分析报表功能开发中");
        Map<String, Object> data = new HashMap<>();
        data.put("period", period != null ? period : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
        data.put("reports", new ArrayList<>());
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/passthrough-entity-stats")
    public ResponseEntity<Map<String, Object>> getPassthroughEntityStats(
            @RequestParam(required = false) String period) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "过账统计报表功能开发中");
        Map<String, Object> data = new HashMap<>();
        data.put("period", period != null ? period : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
        data.put("stats", new ArrayList<>());
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/compliance-reports")
    public ResponseEntity<Map<String, Object>> getComplianceReports(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String riskLevel) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "合规检查报表功能开发中");
        Map<String, Object> data = new HashMap<>();
        data.put("period", period != null ? period : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
        data.put("reports", new ArrayList<>());
        response.put("data", data);
        return ResponseEntity.ok(response);
    }
}