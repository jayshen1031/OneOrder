package com.oneorder.clearing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 业务数据生成器 - 为5大流程生成完整的业务数据
 * 1. 订单管理 2. 接派单管理 3. 分润计算 4. 清分处理 5. 过账处理
 */
@RestController
@RequestMapping("/business-data-generator")
@CrossOrigin(origins = "*")
public class BusinessDataGeneratorController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/generate-complete-business-data")
    public ResponseEntity<Map<String, Object>> generateCompleteBusinessData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 第1步：生成订单数据
            int ordersCreated = generateOrders();
            result.put("ordersCreated", ordersCreated);
            
            // 第2步：生成接派单数据
            int assignmentsCreated = generateServiceAssignments();
            result.put("assignmentsCreated", assignmentsCreated);
            
            // 第3步：生成分润计算数据
            int profitSharingCreated = generateProfitSharing();
            result.put("profitSharingCreated", profitSharingCreated);
            
            // 第4步：生成清分处理数据
            int clearingCreated = generateClearingProcessing();
            result.put("clearingCreated", clearingCreated);
            
            // 第5步：生成过账处理数据
            int passthroughCreated = generatePassthroughProcessing();
            result.put("passthroughCreated", passthroughCreated);
            
            // 第6步：生成管法分离报表的资金流向数据
            int fundFlowCreated = generateFundFlowRecords();
            result.put("fundFlowCreated", fundFlowCreated);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "完整业务数据生成成功");
            response.put("data", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "业务数据生成失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    private int generateOrders() {
        // 生成10个不同类型的货运订单，添加sales_entity_id
        String[] orderSqls = {
            // 海运FCL订单
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916001', 'ORD202509160001', 'CUST001', 'LE001', '2025-09-01', '华为技术有限公司', 'OCEAN_FREIGHT', '上海', '洛杉矶', '40GP', 2, 45000.00, 'CNY', 'PENDING', '2025-09-01 10:00:00') ON CONFLICT (order_id) DO NOTHING",
            
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916002', 'ORD202509160002', 'CUST002', 'LE001', '2025-09-02', '小米科技有限公司', 'OCEAN_FREIGHT', '深圳', '纽约', '20GP', 1, 22000.00, 'CNY', 'CONFIRMED', '2025-09-02 14:30:00') ON CONFLICT (order_id) DO NOTHING",
            
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916003', 'ORD202509160003', 'CUST003', 'LE002', '2025-09-03', 'OPPO广东移动通信有限公司', 'OCEAN_FREIGHT', '东莞', '汉堡', '40HQ', 1, 28000.00, 'CNY', 'DISPATCHED', '2025-09-03 09:15:00') ON CONFLICT (order_id) DO NOTHING",
            
            // 空运订单
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916004', 'ORD202509160004', 'CUST004', 'LE002', '2025-09-04', '字节跳动科技有限公司', 'AIR_FREIGHT', '北京', '法兰克福', 'AIR_CARGO', 500, 15000.00, 'CNY', 'CONFIRMED', '2025-09-04 16:20:00') ON CONFLICT (order_id) DO NOTHING",
            
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916005', 'ORD202509160005', 'CUST005', 'LE003', '2025-09-05', '阿里巴巴集团', 'AIR_FREIGHT', '杭州', '洛杉矶', 'AIR_EXPRESS', 200, 8500.00, 'CNY', 'PENDING', '2025-09-05 11:45:00') ON CONFLICT (order_id) DO NOTHING",
            
            // 陆运订单  
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916006', 'ORD202509160006', 'CUST006', 'LE003', '2025-09-06', '比亚迪股份有限公司', 'TRUCK_FREIGHT', '深圳', '越南胡志明', 'TRUCK_CONTAINER', 3, 12000.00, 'CNY', 'DISPATCHED', '2025-09-06 08:30:00') ON CONFLICT (order_id) DO NOTHING",
            
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916007', 'ORD202509160007', 'CUST007', 'LE001', '2025-09-07', '宁德时代新能源科技股份有限公司', 'TRUCK_FREIGHT', '宁德', '泰国曼谷', 'TRUCK_FLATBED', 2, 9800.00, 'CNY', 'CONFIRMED', '2025-09-07 13:00:00') ON CONFLICT (order_id) DO NOTHING",
            
            // 铁运订单
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916008', 'ORD202509160008', 'CUST008', 'LE002', '2025-09-08', '中国石油化工集团有限公司', 'RAIL_FREIGHT', '西安', '德国杜伊斯堡', 'RAIL_CONTAINER', 5, 35000.00, 'CNY', 'DISPATCHED', '2025-09-08 07:15:00') ON CONFLICT (order_id) DO NOTHING",
            
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916009', 'ORD202509160009', 'CUST009', 'LE003', '2025-09-09', '格力电器股份有限公司', 'RAIL_FREIGHT', '珠海', '波兰马拉舍维奇', 'RAIL_BULK', 4, 26000.00, 'CNY', 'PENDING', '2025-09-09 12:40:00') ON CONFLICT (order_id) DO NOTHING",
            
            // 仓储订单
            "INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, order_date, customer_name, business_type, origin, destination, container_type, quantity, total_amount, currency, order_status, created_at) VALUES " +
            "('HCBD20250916010', 'ORD202509160010', 'CUST010', 'LE001', '2025-09-10', '美团', 'WAREHOUSE', '上海', '上海保税区', 'WAREHOUSE_STORAGE', 1000, 18000.00, 'CNY', 'PENDING', '2025-09-10 15:25:00') ON CONFLICT (order_id) DO NOTHING"
        };
        
        int count = 0;
        for (String sql : orderSqls) {
            try {
                jdbcTemplate.update(sql);
                count++;
            } catch (Exception e) {
                System.out.println("订单数据插入失败: " + e.getMessage());
            }
        }
        return count;
    }
    
    private int generateServiceAssignments() {
        // 为每个订单生成接派单数据
        String[] assignmentSqls = {
            // 海程邦达内部员工接派单
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS001', 'HCBD20250916001', '张海运', 'INTERNAL', '订舱服务', 'COMPLETED', '2025-09-01', '2025-09-05', '2025-09-01 10:00:00') ON CONFLICT (assignment_id) DO NOTHING",
            
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS002', 'HCBD20250916001', '李报关', 'INTERNAL', '报关服务', 'COMPLETED', '2025-09-02', '2025-09-04', '2025-09-01 10:00:00') ON CONFLICT (assignment_id) DO NOTHING",
            
            // 外部合作伙伴接派单
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS003', 'HCBD20250916002', '深圳港务集团', 'EXTERNAL_PARTNER', '码头操作', 'COMPLETED', '2025-09-02', '2025-09-06', '2025-09-02 14:30:00') ON CONFLICT (assignment_id) DO NOTHING",
            
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS004', 'HCBD20250916003', '马士基航运', 'EXTERNAL_CARRIER', '海运承运', 'IN_PROGRESS', '2025-09-03', '2025-09-20', '2025-09-03 09:15:00') ON CONFLICT (assignment_id) DO NOTHING",
            
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS005', 'HCBD20250916004', '王空运', 'INTERNAL', '空运操作', 'COMPLETED', '2025-09-04', '2025-09-06', '2025-09-04 16:20:00') ON CONFLICT (assignment_id) DO NOTHING",
            
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS006', 'HCBD20250916005', '联邦快递', 'EXTERNAL_CARRIER', '航空承运', 'IN_PROGRESS', '2025-09-05', '2025-09-08', '2025-09-05 11:45:00') ON CONFLICT (assignment_id) DO NOTHING",
            
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS007', 'HCBD20250916006', '陈陆运', 'INTERNAL', '陆运跟踪', 'COMPLETED', '2025-09-06', '2025-09-10', '2025-09-06 08:30:00') ON CONFLICT (assignment_id) DO NOTHING",
            
            "INSERT INTO service_assignments (assignment_id, order_id, staff_name, staff_type, service_type, assignment_status, assignment_date, estimated_completion, created_at) VALUES " +
            "('ASS008', 'HCBD20250916008', '中欧班列', 'EXTERNAL_CARRIER', '铁路承运', 'COMPLETED', '2025-09-08', '2025-09-25', '2025-09-08 07:15:00') ON CONFLICT (assignment_id) DO NOTHING"
        };
        
        int count = 0;
        for (String sql : assignmentSqls) {
            try {
                jdbcTemplate.update(sql);
                count++;
            } catch (Exception e) {
                System.out.println("接派单数据插入失败: " + e.getMessage());
            }
        }
        return count;
    }
    
    private int generateProfitSharing() {
        // 生成分润计算数据
        String[] profitSqls = {
            // 为订单生成分润计算记录
            "INSERT INTO profit_sharing_calculations (calculation_id, order_id, calculation_mode, total_revenue, total_cost, total_profit, profit_margin, status, created_at) VALUES " +
            "('CALC_HCBD20250916001', 'HCBD20250916001', 'STANDARD', 45000.00, 38000.00, 7000.00, 15.56, 'COMPLETED', '2025-09-01 18:00:00') ON CONFLICT (calculation_id) DO NOTHING",
            
            "INSERT INTO profit_sharing_calculations (calculation_id, order_id, calculation_mode, total_revenue, total_cost, total_profit, profit_margin, status, created_at) VALUES " +
            "('CALC_HCBD20250916002', 'HCBD20250916002', 'STANDARD', 22000.00, 19500.00, 2500.00, 11.36, 'COMPLETED', '2025-09-02 18:00:00') ON CONFLICT (calculation_id) DO NOTHING",
            
            "INSERT INTO profit_sharing_calculations (calculation_id, order_id, calculation_mode, total_revenue, total_cost, total_profit, profit_margin, status, created_at) VALUES " +
            "('CALC_HCBD20250916004', 'HCBD20250916004', 'PREMIUM', 15000.00, 12000.00, 3000.00, 20.00, 'COMPLETED', '2025-09-04 18:00:00') ON CONFLICT (calculation_id) DO NOTHING",
            
            // 分润明细 - 销售部门
            "INSERT INTO profit_sharing_details (detail_id, calculation_id, department_name, department_type, allocation_ratio, allocated_amount, sharing_rule, created_at) VALUES " +
            "('DETAIL_001_SALES', 'CALC_HCBD20250916001', '华东销售部', 'SALES', 0.4000, 2800.00, '业务开发', '2025-09-01 18:00:00') ON CONFLICT (detail_id) DO NOTHING",
            
            "INSERT INTO profit_sharing_details (detail_id, calculation_id, department_name, department_type, allocation_ratio, allocated_amount, sharing_rule, created_at) VALUES " +
            "('DETAIL_001_OPS', 'CALC_HCBD20250916001', '海运操作部', 'OPERATIONS', 0.3500, 2450.00, '操作执行', '2025-09-01 18:00:00') ON CONFLICT (detail_id) DO NOTHING",
            
            "INSERT INTO profit_sharing_details (detail_id, calculation_id, department_name, department_type, allocation_ratio, allocated_amount, sharing_rule, created_at) VALUES " +
            "('DETAIL_001_CS', 'CALC_HCBD20250916001', '客户服务部', 'CUSTOMER_SERVICE', 0.1500, 1050.00, '客户维护', '2025-09-01 18:00:00') ON CONFLICT (detail_id) DO NOTHING",
            
            "INSERT INTO profit_sharing_details (detail_id, calculation_id, department_name, department_type, allocation_ratio, allocated_amount, sharing_rule, created_at) VALUES " +
            "('DETAIL_001_MGMT', 'CALC_HCBD20250916001', '管理部门', 'MANAGEMENT', 0.1000, 700.00, '管理支持', '2025-09-01 18:00:00') ON CONFLICT (detail_id) DO NOTHING"
        };
        
        int count = 0;
        for (String sql : profitSqls) {
            try {
                jdbcTemplate.update(sql);
                count++;
            } catch (Exception e) {
                System.out.println("分润数据插入失败: " + e.getMessage());
            }
        }
        return count;
    }
    
    private int generateClearingProcessing() {
        // 生成清分处理数据
        String[] clearingSqls = {
            // 清分指令
            "INSERT INTO clearing_instructions (instruction_id, order_id, calculation_id, clearing_mode, original_amount, cleared_amount, clearing_fee, status, created_at) VALUES " +
            "('CLEARING_HCBD20250916001', 'HCBD20250916001', 'CALC_HCBD20250916001', 'STAR', 7000.00, 6825.00, 175.00, 'COMPLETED', '2025-09-01 20:00:00') ON CONFLICT (instruction_id) DO NOTHING",
            
            "INSERT INTO clearing_instructions (instruction_id, order_id, calculation_id, clearing_mode, original_amount, cleared_amount, clearing_fee, status, created_at) VALUES " +
            "('CLEARING_HCBD20250916002', 'HCBD20250916002', 'CALC_HCBD20250916002', 'CHAIN', 2500.00, 2437.50, 62.50, 'COMPLETED', '2025-09-02 20:00:00') ON CONFLICT (instruction_id) DO NOTHING",
            
            // 清分明细
            "INSERT INTO clearing_details (detail_id, instruction_id, from_entity, to_entity, amount, currency, detail_type, status, created_at) VALUES " +
            "('CLEAR_DETAIL_001', 'CLEARING_HCBD20250916001', '海程邦达总公司', '华东销售部', 2800.00, 'CNY', 'PROFIT_SHARING', 'COMPLETED', '2025-09-01 20:00:00') ON CONFLICT (detail_id) DO NOTHING",
            
            "INSERT INTO clearing_details (detail_id, instruction_id, from_entity, to_entity, amount, currency, detail_type, status, created_at) VALUES " +
            "('CLEAR_DETAIL_002', 'CLEARING_HCBD20250916001', '海程邦达总公司', '海运操作部', 2450.00, 'CNY', 'PROFIT_SHARING', 'COMPLETED', '2025-09-01 20:00:00') ON CONFLICT (detail_id) DO NOTHING"
        };
        
        int count = 0;
        for (String sql : clearingSqls) {
            try {
                jdbcTemplate.update(sql);
                count++;
            } catch (Exception e) {
                System.out.println("清分数据插入失败: " + e.getMessage());
            }
        }
        return count;
    }
    
    private int generatePassthroughProcessing() {
        // 生成过账处理数据
        String[] passthroughSqls = {
            // 过账指令
            "INSERT INTO passthrough_instructions (instruction_id, clearing_instruction_id, passthrough_mode, original_amount, passthrough_amount, retention_amount, status, created_at) VALUES " +
            "('PASSTHROUGH_HCBD20250916001', 'CLEARING_HCBD20250916001', 'ROUTING', 6825.00, 6688.45, 136.55, 'COMPLETED', '2025-09-01 21:00:00') ON CONFLICT (instruction_id) DO NOTHING",
            
            "INSERT INTO passthrough_instructions (instruction_id, clearing_instruction_id, passthrough_mode, original_amount, passthrough_amount, retention_amount, status, created_at) VALUES " +
            "('PASSTHROUGH_HCBD20250916002', 'CLEARING_HCBD20250916002', 'NETTING', 2437.50, 2389.13, 48.37, 'COMPLETED', '2025-09-02 21:00:00') ON CONFLICT (instruction_id) DO NOTHING",
            
            // 过账明细
            "INSERT INTO passthrough_details (detail_id, instruction_id, from_entity, to_entity, routing_path, amount, currency, detail_type, status, created_at) VALUES " +
            "('PASS_DETAIL_001', 'PASSTHROUGH_HCBD20250916001', '海程邦达总公司', 'HCBD_HK', 'HCBD_CN->HCBD_HK', 3344.23, 'CNY', 'ROUTING', 'COMPLETED', '2025-09-01 21:00:00') ON CONFLICT (detail_id) DO NOTHING",
            
            "INSERT INTO passthrough_details (detail_id, instruction_id, from_entity, to_entity, routing_path, amount, currency, detail_type, status, created_at) VALUES " +
            "('PASS_DETAIL_002', 'PASSTHROUGH_HCBD20250916001', 'HCBD_HK', 'HCBD_US', 'HCBD_HK->HCBD_US', 3344.22, 'CNY', 'ROUTING', 'COMPLETED', '2025-09-01 21:00:00') ON CONFLICT (detail_id) DO NOTHING"
        };
        
        int count = 0;
        for (String sql : passthroughSqls) {
            try {
                jdbcTemplate.update(sql);
                count++;
            } catch (Exception e) {
                System.out.println("过账数据插入失败: " + e.getMessage());
            }
        }
        return count;
    }
    
    private int generateFundFlowRecords() {
        // 基于实际的清分和过账数据，生成管法分离报表所需的资金流向记录
        String[] fundFlowSqls = {
            // 创建资金流向记录表（如果不存在）
            "CREATE TABLE IF NOT EXISTS fund_flow_records (" +
            "flow_record_id VARCHAR(50) PRIMARY KEY," +
            "source_legal_entity VARCHAR(50) NOT NULL," +
            "target_legal_entity VARCHAR(50) NOT NULL," +
            "mgmt_entity_id VARCHAR(50)," +
            "flow_type VARCHAR(30) NOT NULL," +
            "reference_id VARCHAR(100)," +
            "reference_type VARCHAR(30)," +
            "flow_amount DECIMAL(15,2) NOT NULL," +
            "flow_currency VARCHAR(10) DEFAULT 'CNY'," +
            "flow_date DATE NOT NULL," +
            "business_date DATE NOT NULL," +
            "accounting_period VARCHAR(10) NOT NULL," +
            "flow_direction VARCHAR(10) NOT NULL," +
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
            ")",
            
            // 基于清分结果生成资金流向记录
            "INSERT INTO fund_flow_records (flow_record_id, source_legal_entity, target_legal_entity, mgmt_entity_id, flow_type, reference_id, reference_type, flow_amount, flow_currency, flow_date, business_date, accounting_period, flow_direction) VALUES " +
            "('FLOW_001', 'LE001', 'LE002', 'ME002', 'CLEARING', 'CLEARING_HCBD20250916001', 'CLEARING_INSTRUCTION', 3344.23, 'CNY', '2025-09-01', '2025-09-01', '2025-09', 'OUTBOUND') ON CONFLICT (flow_record_id) DO NOTHING",
            
            "INSERT INTO fund_flow_records (flow_record_id, source_legal_entity, target_legal_entity, mgmt_entity_id, flow_type, reference_id, reference_type, flow_amount, flow_currency, flow_date, business_date, accounting_period, flow_direction) VALUES " +
            "('FLOW_002', 'LE002', 'LE003', 'ME003', 'PASSTHROUGH', 'PASSTHROUGH_HCBD20250916001', 'PASSTHROUGH_INSTRUCTION', 3344.22, 'CNY', '2025-09-01', '2025-09-01', '2025-09', 'OUTBOUND') ON CONFLICT (flow_record_id) DO NOTHING",
            
            "INSERT INTO fund_flow_records (flow_record_id, source_legal_entity, target_legal_entity, mgmt_entity_id, flow_type, reference_id, reference_type, flow_amount, flow_currency, flow_date, business_date, accounting_period, flow_direction) VALUES " +
            "('FLOW_003', 'LE001', 'LE002', 'ME002', 'CLEARING', 'CLEARING_HCBD20250916002', 'CLEARING_INSTRUCTION', 1218.75, 'CNY', '2025-09-02', '2025-09-02', '2025-09', 'OUTBOUND') ON CONFLICT (flow_record_id) DO NOTHING",
            
            "INSERT INTO fund_flow_records (flow_record_id, source_legal_entity, target_legal_entity, mgmt_entity_id, flow_type, reference_id, reference_type, flow_amount, flow_currency, flow_date, business_date, accounting_period, flow_direction) VALUES " +
            "('FLOW_004', 'LE001', 'LE003', 'ME003', 'TRANSFER', 'TRANSFER_001', 'MANUAL_TRANSFER', 50000.00, 'CNY', '2025-09-03', '2025-09-03', '2025-09', 'OUTBOUND') ON CONFLICT (flow_record_id) DO NOTHING",
            
            "INSERT INTO fund_flow_records (flow_record_id, source_legal_entity, target_legal_entity, mgmt_entity_id, flow_type, reference_id, reference_type, flow_amount, flow_currency, flow_date, business_date, accounting_period, flow_direction) VALUES " +
            "('FLOW_005', 'LE003', 'LE001', 'ME001', 'SETTLEMENT', 'SETTLEMENT_001', 'PERIOD_SETTLEMENT', 25000.00, 'CNY', '2025-09-15', '2025-09-15', '2025-09', 'INBOUND') ON CONFLICT (flow_record_id) DO NOTHING",
            
            // 生成过账处理统计数据
            "CREATE TABLE IF NOT EXISTS passthrough_entity_stats (" +
            "stat_record_id VARCHAR(50) PRIMARY KEY," +
            "accounting_period VARCHAR(10) NOT NULL," +
            "legal_entity_id VARCHAR(50) NOT NULL," +
            "mgmt_entity_id VARCHAR(50)," +
            "total_instructions INTEGER DEFAULT 0," +
            "completed_instructions INTEGER DEFAULT 0," +
            "failed_instructions INTEGER DEFAULT 0," +
            "total_original_amount DECIMAL(15,2) DEFAULT 0," +
            "total_passthrough_amount DECIMAL(15,2) DEFAULT 0," +
            "total_retention_amount DECIMAL(15,2) DEFAULT 0," +
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
            ")",
            
            "INSERT INTO passthrough_entity_stats (stat_record_id, accounting_period, legal_entity_id, mgmt_entity_id, total_instructions, completed_instructions, failed_instructions, total_original_amount, total_passthrough_amount, total_retention_amount) VALUES " +
            "('STAT_LE001_2025_09', '2025-09', 'LE001', 'ME002', 5, 4, 1, 156250.00, 153126.58, 3123.42) ON CONFLICT (stat_record_id) DO NOTHING",
            
            "INSERT INTO passthrough_entity_stats (stat_record_id, accounting_period, legal_entity_id, mgmt_entity_id, total_instructions, completed_instructions, failed_instructions, total_original_amount, total_passthrough_amount, total_retention_amount) VALUES " +
            "('STAT_LE002_2025_09', '2025-09', 'LE002', 'ME003', 3, 3, 0, 78000.00, 76440.00, 1560.00) ON CONFLICT (stat_record_id) DO NOTHING",
            
            "INSERT INTO passthrough_entity_stats (stat_record_id, accounting_period, legal_entity_id, mgmt_entity_id, total_instructions, completed_instructions, failed_instructions, total_original_amount, total_passthrough_amount, total_retention_amount) VALUES " +
            "('STAT_LE003_2025_09', '2025-09', 'LE003', 'ME003', 2, 2, 0, 45000.00, 44550.00, 450.00) ON CONFLICT (stat_record_id) DO NOTHING"
        };
        
        int count = 0;
        for (String sql : fundFlowSqls) {
            try {
                jdbcTemplate.execute(sql);
                count++;
            } catch (Exception e) {
                System.out.println("资金流向数据插入失败: " + e.getMessage());
            }
        }
        return count;
    }
}