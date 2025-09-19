package com.oneorder.clearing.controller;

import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.repository.*;
import com.oneorder.clearing.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;

/**
 * 协议管理服务派单控制器
 * 实现完整的内部协议匹配和服务派单功能
 */
@RestController
@RequestMapping("/protocol-assignment")
@CrossOrigin(origins = "*")
public class ProtocolServiceAssignmentController {

    private static final Logger logger = LoggerFactory.getLogger(ProtocolServiceAssignmentController.class);
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderServiceRepository orderServiceRepository;
    
    @Autowired
    private InternalProtocolRepository internalProtocolRepository;
    
    /**
     * 获取可用内部协议 - 智能匹配算法
     */
    @GetMapping("/protocols/match")
    public ResponseEntity<Map<String, Object>> matchProtocols(
            @RequestParam String customerServiceId,
            @RequestParam String operationStaffId,
            @RequestParam(required = false) String serviceCode,
            @RequestParam(required = false) String businessType) {
        
        logger.info("智能匹配内部协议 - 客服: {}, 操作员: {}, 服务: {}, 业务类型: {}", 
                customerServiceId, operationStaffId, serviceCode, businessType);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 模拟部门信息（实际环境中从数据库获取）
            String customerServiceDeptId = "DEPT_SALES_01";  // 客服所属销售部门
            String operationDeptId = getOperationDeptByStaffId(operationStaffId);  // 操作员所属部门
            
            // 智能协议匹配
            List<Map<String, Object>> matchedProtocols = findMatchingProtocols(
                customerServiceDeptId, operationDeptId, serviceCode, businessType);
            
            response.put("code", 200);
            response.put("message", "协议匹配成功");
            response.put("data", Map.of(
                "protocols", matchedProtocols,
                "matchCount", matchedProtocols.size(),
                "customerServiceDept", customerServiceDeptId,
                "operationDept", operationDeptId
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("协议匹配失败", e);
            response.put("code", 500);
            response.put("message", "协议匹配失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 执行协议派单 - 为服务分配操作人员并选择协议
     */
    @PostMapping("/assign-with-protocol")
    public ResponseEntity<Map<String, Object>> assignServiceWithProtocol(@RequestBody Map<String, Object> request) {
        logger.info("执行协议派单: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String orderId = (String) request.get("orderId");
            String serviceCode = (String) request.get("serviceCode");
            String operationStaffId = (String) request.get("operationStaffId");
            String protocolId = (String) request.get("protocolId");
            
            // 验证参数
            if (orderId == null || serviceCode == null || operationStaffId == null || protocolId == null) {
                response.put("code", 400);
                response.put("message", "缺少必要参数");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 执行派单逻辑
            Map<String, Object> assignmentResult = executeProtocolAssignment(
                orderId, serviceCode, operationStaffId, protocolId);
            
            response.put("code", 200);
            response.put("message", "协议派单成功");
            response.put("data", assignmentResult);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("协议派单失败", e);
            response.put("code", 500);
            response.put("message", "协议派单失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取协议详情
     */
    @GetMapping("/protocols/{protocolId}")
    public ResponseEntity<Map<String, Object>> getProtocolDetails(@PathVariable String protocolId) {
        logger.info("获取协议详情: {}", protocolId);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> protocolDetails = getProtocolDetailsById(protocolId);
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", protocolDetails);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("获取协议详情失败", e);
            response.put("code", 500);
            response.put("message", "获取协议详情失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 确认协议并更新服务状态
     */
    @PostMapping("/confirm-protocol")
    public ResponseEntity<Map<String, Object>> confirmProtocol(@RequestBody Map<String, Object> request) {
        logger.info("确认协议: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String orderId = (String) request.get("orderId");
            String serviceCode = (String) request.get("serviceCode");
            String operationStaffId = (String) request.get("operationStaffId");
            String protocolId = (String) request.get("protocolId");
            String confirmAction = (String) request.get("action"); // CONFIRM or REJECT
            
            Map<String, Object> confirmResult = processProtocolConfirmation(
                orderId, serviceCode, operationStaffId, protocolId, confirmAction);
            
            response.put("code", 200);
            response.put("message", "协议确认处理成功");
            response.put("data", confirmResult);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("协议确认失败", e);
            response.put("code", 500);
            response.put("message", "协议确认失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // ==================== 私有辅助方法 ====================
    
    /**
     * 根据操作员ID获取部门ID
     */
    private String getOperationDeptByStaffId(String staffId) {
        // 模拟数据映射（实际环境中从数据库查询）
        Map<String, String> staffDeptMapping = Map.of(
            "OP001", "DEPT_OCEAN_01",      // 海运操作部
            "OP002", "DEPT_AIR_01",        // 空运操作部  
            "OP003", "DEPT_TRUCK_01",      // 陆运操作部
            "OP004", "DEPT_CUSTOMS_01"     // 关务操作部
        );
        return staffDeptMapping.getOrDefault(staffId, "DEPT_OCEAN_01");
    }
    
    /**
     * 智能协议匹配算法
     */
    private List<Map<String, Object>> findMatchingProtocols(
            String salesDeptId, String operationDeptId, String serviceCode, String businessType) {
        
        // 模拟协议数据（实际环境中从数据库查询）
        List<Map<String, Object>> allProtocols = createMockProtocolData();
        
        return allProtocols.stream()
            .filter(protocol -> isProtocolMatching(protocol, salesDeptId, operationDeptId, serviceCode, businessType))
            .sorted((p1, p2) -> {
                // 按优先级排序：精确匹配 > 部分匹配 > 通用协议
                int priority1 = calculateProtocolPriority(p1, serviceCode, businessType);
                int priority2 = calculateProtocolPriority(p2, serviceCode, businessType);
                return Integer.compare(priority2, priority1); // 降序
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 协议匹配逻辑
     */
    private boolean isProtocolMatching(Map<String, Object> protocol, 
            String salesDeptId, String operationDeptId, String serviceCode, String businessType) {
        
        // 部门匹配
        if (!salesDeptId.equals(protocol.get("salesDepartmentId"))) {
            return false;
        }
        if (!operationDeptId.equals(protocol.get("operationDepartmentId"))) {
            return false;
        }
        
        // 服务匹配（NULL表示通用）
        String protocolServiceCode = (String) protocol.get("serviceCode");
        if (protocolServiceCode != null && serviceCode != null && !protocolServiceCode.equals(serviceCode)) {
            return false;
        }
        
        // 业务类型匹配（NULL表示通用）
        String protocolBusinessType = (String) protocol.get("businessType");
        if (protocolBusinessType != null && businessType != null && !protocolBusinessType.equals(businessType)) {
            return false;
        }
        
        // 协议状态检查
        return (Boolean) protocol.get("active");
    }
    
    /**
     * 计算协议优先级
     */
    private int calculateProtocolPriority(Map<String, Object> protocol, String serviceCode, String businessType) {
        int priority = 0;
        
        // 精确服务匹配 +3分
        if (serviceCode != null && serviceCode.equals(protocol.get("serviceCode"))) {
            priority += 3;
        }
        
        // 精确业务类型匹配 +2分
        if (businessType != null && businessType.equals(protocol.get("businessType"))) {
            priority += 2;
        }
        
        // 基础佣金率越高优先级越高 +1分
        BigDecimal commissionRate = (BigDecimal) protocol.get("baseCommissionRate");
        if (commissionRate != null && commissionRate.compareTo(BigDecimal.valueOf(8)) > 0) {
            priority += 1;
        }
        
        return priority;
    }
    
    /**
     * 执行协议派单
     */
    private Map<String, Object> executeProtocolAssignment(
            String orderId, String serviceCode, String operationStaffId, String protocolId) {
        
        // 模拟派单执行过程
        Map<String, Object> result = new HashMap<>();
        result.put("assignmentId", "ASSIGN_" + System.currentTimeMillis());
        result.put("orderId", orderId);
        result.put("serviceCode", serviceCode);
        result.put("operationStaffId", operationStaffId);
        result.put("protocolId", protocolId);
        result.put("status", "ASSIGNED");
        result.put("assignedTime", LocalDateTime.now().toString());
        result.put("message", "服务已成功派单，协议已关联");
        
        logger.info("协议派单执行完成: {}", result);
        return result;
    }
    
    /**
     * 获取协议详细信息
     */
    private Map<String, Object> getProtocolDetailsById(String protocolId) {
        // 模拟协议详情查询
        Map<String, Object> details = new HashMap<>();
        details.put("protocolId", protocolId);
        details.put("protocolName", "海运标准协议");
        details.put("salesDepartmentId", "DEPT_SALES_01");
        details.put("operationDepartmentId", "DEPT_OCEAN_01");
        details.put("serviceCode", "BOOKING");
        details.put("businessType", "OCEAN");
        details.put("baseCommissionRate", new BigDecimal("8.00"));
        details.put("performanceBonusRate", new BigDecimal("2.00"));
        details.put("totalCommissionRate", new BigDecimal("10.00"));
        details.put("description", "适用于海运业务的标准内部协议，包含基础佣金和绩效奖金");
        details.put("effectiveDate", "2025-01-01");
        details.put("expiryDate", "2025-12-31");
        details.put("revenueRules", List.of(
            Map.of("type", "销售佣金", "rate", "60%"),
            Map.of("type", "操作佣金", "rate", "30%"),
            Map.of("type", "管理费用", "rate", "10%")
        ));
        
        return details;
    }
    
    /**
     * 处理协议确认
     */
    private Map<String, Object> processProtocolConfirmation(
            String orderId, String serviceCode, String operationStaffId, String protocolId, String action) {
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", orderId);
        result.put("serviceCode", serviceCode);
        result.put("protocolId", protocolId);
        result.put("action", action);
        result.put("confirmedTime", LocalDateTime.now().toString());
        result.put("operationStaffId", operationStaffId);
        
        if ("CONFIRM".equals(action)) {
            result.put("status", "PROTOCOL_CONFIRMED");
            result.put("message", "协议已确认，服务进入执行阶段");
            result.put("nextStep", "开始服务执行，分润规则已生效");
        } else {
            result.put("status", "PROTOCOL_REJECTED");
            result.put("message", "协议已拒绝，需要重新选择协议");
            result.put("nextStep", "请联系客服重新选择合适的协议");
        }
        
        return result;
    }
    
    /**
     * 创建模拟协议数据
     */
    private List<Map<String, Object>> createMockProtocolData() {
        List<Map<String, Object>> protocols = new ArrayList<>();
        
        // 海运协议
        protocols.add(createProtocol("PROTO_OCEAN_001", "海运标准协议", "DEPT_SALES_01", "DEPT_OCEAN_01", 
            "BOOKING", "OCEAN", new BigDecimal("8.00"), new BigDecimal("2.00"), true));
        protocols.add(createProtocol("PROTO_OCEAN_002", "海运高级协议", "DEPT_SALES_01", "DEPT_OCEAN_01", 
            "MBL_PROCESSING", "OCEAN", new BigDecimal("10.00"), new BigDecimal("3.00"), true));
        
        // 空运协议
        protocols.add(createProtocol("PROTO_AIR_001", "空运标准协议", "DEPT_SALES_01", "DEPT_AIR_01", 
            "AIR_BOOKING", "AIR", new BigDecimal("9.00"), new BigDecimal("2.50"), true));
        
        // 通用协议
        protocols.add(createProtocol("PROTO_GENERAL_001", "销售一部通用协议", "DEPT_SALES_01", "DEPT_OCEAN_01", 
            null, null, new BigDecimal("7.50"), new BigDecimal("1.50"), true));
        
        return protocols;
    }
    
    /**
     * 创建协议对象
     */
    private Map<String, Object> createProtocol(String id, String name, String salesDeptId, String operationDeptId,
            String serviceCode, String businessType, BigDecimal baseRate, BigDecimal bonusRate, boolean active) {
        Map<String, Object> protocol = new HashMap<>();
        protocol.put("protocolId", id);
        protocol.put("protocolName", name);
        protocol.put("salesDepartmentId", salesDeptId);
        protocol.put("operationDepartmentId", operationDeptId);
        protocol.put("serviceCode", serviceCode);
        protocol.put("businessType", businessType);
        protocol.put("baseCommissionRate", baseRate);
        protocol.put("performanceBonusRate", bonusRate);
        protocol.put("totalCommissionRate", baseRate.add(bonusRate));
        protocol.put("active", active);
        protocol.put("description", String.format("%s - 基础佣金%.1f%% + 绩效奖金%.1f%%", 
            name, baseRate.doubleValue(), bonusRate.doubleValue()));
        return protocol;
    }
}