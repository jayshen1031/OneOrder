package com.oneorder.clearing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

/**
 * 数据库初始化控制器
 */
@RestController
@RequestMapping("/database")
@CrossOrigin(origins = "*")
public class DatabaseInitController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/init-business-tables")
    public ResponseEntity<Map<String, Object>> initBusinessTables() {
        try {
            // 创建5大流程的业务表
            String[] businessTableSqls = {
                // 1. 创建或修改orders表，增加missing的字段
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200)",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(50)",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS origin VARCHAR(100)",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS destination VARCHAR(100)",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS container_type VARCHAR(50)",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(20)",
                // 处理sales_entity_id约束
                "ALTER TABLE orders ALTER COLUMN sales_entity_id DROP NOT NULL",
                // 或者给一个默认的sales_entity_id
                "UPDATE orders SET sales_entity_id = 'SE001' WHERE sales_entity_id IS NULL",

                // 2. 创建接派单表
                "CREATE TABLE IF NOT EXISTS service_assignments (" +
                "assignment_id VARCHAR(50) PRIMARY KEY," +
                "order_id VARCHAR(50) NOT NULL," +
                "staff_name VARCHAR(100) NOT NULL," +
                "staff_type VARCHAR(20) NOT NULL," + // INTERNAL, EXTERNAL_PARTNER, EXTERNAL_CARRIER
                "service_type VARCHAR(100) NOT NULL," +
                "assignment_status VARCHAR(20) NOT NULL," +
                "assignment_date DATE NOT NULL," +
                "estimated_completion DATE," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                // 3. 创建分润计算表
                "CREATE TABLE IF NOT EXISTS profit_sharing_calculations (" +
                "calculation_id VARCHAR(50) PRIMARY KEY," +
                "order_id VARCHAR(50) NOT NULL," +
                "calculation_mode VARCHAR(20) NOT NULL," +
                "total_revenue DECIMAL(15,2) NOT NULL," +
                "total_cost DECIMAL(15,2) NOT NULL," +
                "total_profit DECIMAL(15,2) NOT NULL," +
                "profit_margin DECIMAL(5,2) NOT NULL," +
                "status VARCHAR(20) NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                "CREATE TABLE IF NOT EXISTS profit_sharing_details (" +
                "detail_id VARCHAR(50) PRIMARY KEY," +
                "calculation_id VARCHAR(50) NOT NULL," +
                "department_name VARCHAR(100) NOT NULL," +
                "department_type VARCHAR(30) NOT NULL," +
                "allocation_ratio DECIMAL(6,4) NOT NULL," +
                "allocated_amount DECIMAL(15,2) NOT NULL," +
                "sharing_rule VARCHAR(100)," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                // 4. 创建清分处理表
                "CREATE TABLE IF NOT EXISTS clearing_instructions (" +
                "instruction_id VARCHAR(50) PRIMARY KEY," +
                "order_id VARCHAR(50) NOT NULL," +
                "calculation_id VARCHAR(50)," +
                "clearing_mode VARCHAR(20) NOT NULL," + // STAR, CHAIN
                "original_amount DECIMAL(15,2) NOT NULL," +
                "cleared_amount DECIMAL(15,2) NOT NULL," +
                "clearing_fee DECIMAL(15,2) DEFAULT 0," +
                "status VARCHAR(20) NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                "CREATE TABLE IF NOT EXISTS clearing_details (" +
                "detail_id VARCHAR(50) PRIMARY KEY," +
                "instruction_id VARCHAR(50) NOT NULL," +
                "from_entity VARCHAR(100) NOT NULL," +
                "to_entity VARCHAR(100) NOT NULL," +
                "amount DECIMAL(15,2) NOT NULL," +
                "currency VARCHAR(10) DEFAULT 'CNY'," +
                "detail_type VARCHAR(30) NOT NULL," +
                "status VARCHAR(20) NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                // 5. 创建过账处理表
                "CREATE TABLE IF NOT EXISTS passthrough_instructions (" +
                "instruction_id VARCHAR(50) PRIMARY KEY," +
                "clearing_instruction_id VARCHAR(50) NOT NULL," +
                "passthrough_mode VARCHAR(20) NOT NULL," + // ROUTING, NETTING
                "original_amount DECIMAL(15,2) NOT NULL," +
                "passthrough_amount DECIMAL(15,2) NOT NULL," +
                "retention_amount DECIMAL(15,2) DEFAULT 0," +
                "status VARCHAR(20) NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                "CREATE TABLE IF NOT EXISTS passthrough_details (" +
                "detail_id VARCHAR(50) PRIMARY KEY," +
                "instruction_id VARCHAR(50) NOT NULL," +
                "from_entity VARCHAR(100) NOT NULL," +
                "to_entity VARCHAR(100) NOT NULL," +
                "routing_path VARCHAR(200)," +
                "amount DECIMAL(15,2) NOT NULL," +
                "currency VARCHAR(10) DEFAULT 'CNY'," +
                "detail_type VARCHAR(30) NOT NULL," +
                "status VARCHAR(20) NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")"
            };

            int executedCount = 0;
            for (String sql : businessTableSqls) {
                try {
                    jdbcTemplate.execute(sql);
                    executedCount++;
                } catch (Exception e) {
                    System.out.println("SQL执行失败: " + sql);
                    System.out.println("错误: " + e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "5大流程业务表结构初始化成功");
            response.put("data", Map.of("executedStatements", executedCount, "totalStatements", businessTableSqls.length));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "业务表初始化失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/init-entity-tables")
    public ResponseEntity<Map<String, Object>> initEntityTables() {
        try {
            // 直接执行SQL语句
            String[] sqls = {
                "CREATE TABLE IF NOT EXISTS legal_entities (" +
                "entity_id VARCHAR(50) PRIMARY KEY," +
                "entity_name VARCHAR(200) NOT NULL," +
                "entity_code VARCHAR(50) UNIQUE NOT NULL," +
                "entity_type VARCHAR(20) NOT NULL," +
                "country_code VARCHAR(10)," +
                "currency_code VARCHAR(10) DEFAULT 'CNY'," +
                "tax_id VARCHAR(100)," +
                "is_active BOOLEAN DEFAULT TRUE," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                "CREATE TABLE IF NOT EXISTS management_entities (" +
                "mgmt_entity_id VARCHAR(50) PRIMARY KEY," +
                "mgmt_entity_name VARCHAR(200) NOT NULL," +
                "mgmt_entity_code VARCHAR(50) UNIQUE NOT NULL," +
                "entity_level INTEGER DEFAULT 1," +
                "entity_path VARCHAR(500)," +
                "manager_name VARCHAR(100)," +
                "cost_center_code VARCHAR(50)," +
                "profit_center_code VARCHAR(50)," +
                "is_active BOOLEAN DEFAULT TRUE," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                "CREATE TABLE IF NOT EXISTS entity_mappings (" +
                "mapping_id VARCHAR(50) PRIMARY KEY," +
                "mgmt_entity_id VARCHAR(50) NOT NULL," +
                "legal_entity_id VARCHAR(50) NOT NULL," +
                "allocation_ratio DECIMAL(5,4) DEFAULT 1.0000," +
                "effective_date DATE NOT NULL," +
                "expiry_date DATE," +
                "is_primary BOOLEAN DEFAULT TRUE," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")",

                "INSERT INTO legal_entities (entity_id, entity_name, entity_code, entity_type, country_code, currency_code, tax_id) VALUES " +
                "('LE001', '海程邦达国际物流有限公司', 'HCBD_CN', 'DOMESTIC', 'CN', 'CNY', '91310000123456789A') ON CONFLICT (entity_code) DO NOTHING",

                "INSERT INTO legal_entities (entity_id, entity_name, entity_code, entity_type, country_code, currency_code, tax_id) VALUES " +
                "('LE002', 'HCBD Logistics (HK) Limited', 'HCBD_HK', 'OVERSEAS', 'HK', 'HKD', 'HK123456789') ON CONFLICT (entity_code) DO NOTHING",

                "INSERT INTO legal_entities (entity_id, entity_name, entity_code, entity_type, country_code, currency_code, tax_id) VALUES " +
                "('LE003', 'HCBD USA Inc.', 'HCBD_US', 'OVERSEAS', 'US', 'USD', 'US-123456789') ON CONFLICT (entity_code) DO NOTHING",

                "INSERT INTO management_entities (mgmt_entity_id, mgmt_entity_name, mgmt_entity_code, entity_level, entity_path, cost_center_code) VALUES " +
                "('ME001', '海程邦达集团总部', 'HCBD_HQ', 1, '/HQ', 'CC001') ON CONFLICT (mgmt_entity_code) DO NOTHING",

                "INSERT INTO management_entities (mgmt_entity_id, mgmt_entity_name, mgmt_entity_code, entity_level, entity_path, cost_center_code) VALUES " +
                "('ME002', '中国区域', 'HCBD_CN_REGION', 2, '/HQ/CN', 'CC002') ON CONFLICT (mgmt_entity_code) DO NOTHING",

                "INSERT INTO management_entities (mgmt_entity_id, mgmt_entity_name, mgmt_entity_code, entity_level, entity_path, cost_center_code) VALUES " +
                "('ME003', '海外区域', 'HCBD_OS_REGION', 2, '/HQ/OS', 'CC003') ON CONFLICT (mgmt_entity_code) DO NOTHING",

                "INSERT INTO entity_mappings (mapping_id, mgmt_entity_id, legal_entity_id, allocation_ratio, effective_date) VALUES " +
                "('MAP001', 'ME002', 'LE001', 1.0000, '2025-01-01') ON CONFLICT (mapping_id) DO NOTHING",

                "INSERT INTO entity_mappings (mapping_id, mgmt_entity_id, legal_entity_id, allocation_ratio, effective_date) VALUES " +
                "('MAP002', 'ME003', 'LE002', 0.5000, '2025-01-01') ON CONFLICT (mapping_id) DO NOTHING",

                "INSERT INTO entity_mappings (mapping_id, mgmt_entity_id, legal_entity_id, allocation_ratio, effective_date) VALUES " +
                "('MAP003', 'ME003', 'LE003', 0.5000, '2025-01-01') ON CONFLICT (mapping_id) DO NOTHING"
            };

            int executedCount = 0;
            for (String sql : sqls) {
                try {
                    jdbcTemplate.execute(sql);
                    executedCount++;
                } catch (Exception e) {
                    System.out.println("SQL执行失败: " + sql);
                    System.out.println("错误: " + e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "管法分离报表表结构初始化成功");
            response.put("data", Map.of("executedStatements", executedCount, "totalStatements", sqls.length));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "初始化失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}