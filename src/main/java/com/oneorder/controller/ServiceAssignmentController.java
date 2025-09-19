package com.oneorder.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;

/**
 * 服务派单控制器
 * 实现接派单流程的核心功能
 */
@RestController
@RequestMapping("/api/service-assignment")
@CrossOrigin(origins = "*")
public class ServiceAssignmentController {

    private static final Logger logger = LoggerFactory.getLogger(ServiceAssignmentController.class);

    // 模拟服务注入，实际项目中应该注入真实的Service
    // @Autowired
    // private ServiceAssignmentService serviceAssignmentService;

    /**
     * 获取订单的服务项目列表
     */
    @GetMapping("/services/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderServices(@PathVariable String orderId) {
        logger.info("获取订单服务项目列表: {}", orderId);
        
        Map<String, Object> response = new HashMap<>();
        try {
            // 模拟获取订单服务项目
            List<Map<String, Object>> services = Arrays.asList(
                createServiceItem("MBL_PROCESSING", "MBL处理", "PENDING", new BigDecimal("1200.00")),
                createServiceItem("CONTAINER_LOADING", "内装", "PENDING", new BigDecimal("350.00")),
                createServiceItem("CUSTOMS_DECLARATION", "报关", "PENDING", new BigDecimal("500.00")),
                createServiceItem("BOOKING", "订舱", "PENDING", new BigDecimal("200.00"))
            );
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", Map.of(
                "orderId", orderId,
                "services", services,
                "totalServices", services.size(),
                "pendingServices", services.size()
            ));
            
        } catch (Exception e) {
            logger.error("获取订单服务项目失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取可用的操作人员列表
     */
    @GetMapping("/available-operators")
    public ResponseEntity<Map<String, Object>> getAvailableOperators(
            @RequestParam(required = false) String businessType,
            @RequestParam(required = false) String serviceCode) {
        
        logger.info("获取可用操作人员: businessType={}, serviceCode={}", businessType, serviceCode);
        
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, Object>> operators = Arrays.asList(
                createOperatorInfo("OP001", "张三", "海运操作部", "MBL_PROCESSING,BOOKING", 4, 5, "AVAILABLE"),
                createOperatorInfo("OP002", "李四", "海运操作部", "MBL_PROCESSING,CONTAINER_LOADING", 3, 8, "AVAILABLE"),
                createOperatorInfo("OP003", "王五", "内装操作部", "CONTAINER_LOADING,WAREHOUSE", 5, 3, "AVAILABLE"),
                createOperatorInfo("OP004", "赵六", "报关部", "CUSTOMS_DECLARATION", 4, 10, "BUSY")
            );
            
            // 根据serviceCode过滤操作人员
            if (serviceCode != null && !serviceCode.isEmpty()) {
                operators = operators.stream()
                    .filter(op -> op.get("serviceCodes").toString().contains(serviceCode))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", Map.of(
                "operators", operators,
                "totalCount", operators.size(),
                "availableCount", operators.stream().mapToInt(op -> "AVAILABLE".equals(op.get("status")) ? 1 : 0).sum()
            ));
            
        } catch (Exception e) {
            logger.error("获取可用操作人员失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 执行服务派单
     */
    @PostMapping("/assign")
    public ResponseEntity<Map<String, Object>> assignService(@RequestBody Map<String, Object> request) {
        logger.info("执行服务派单: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        try {
            String orderId = (String) request.get("orderId");
            String serviceCode = (String) request.get("serviceCode");
            String operatorId = (String) request.get("operatorId");
            String notes = (String) request.get("notes");
            
            // 模拟派单处理
            String assignmentId = "ASG" + System.currentTimeMillis();
            LocalDateTime assignmentTime = LocalDateTime.now();
            
            // 查找匹配的内部协议
            Map<String, Object> protocol = findMatchingProtocol(serviceCode);
            
            // 创建派单记录
            Map<String, Object> assignment = new HashMap<>();
            assignment.put("assignmentId", assignmentId);
            assignment.put("orderId", orderId);
            assignment.put("serviceCode", serviceCode);
            assignment.put("operatorId", operatorId);
            assignment.put("assignmentTime", assignmentTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            assignment.put("status", "ASSIGNED");
            assignment.put("protocol", protocol);
            assignment.put("notes", notes);
            
            // 发送通知
            sendAssignmentNotification(orderId, assignmentId, operatorId, "NEW_ASSIGNMENT");
            
            response.put("code", 200);
            response.put("message", "派单成功");
            response.put("data", assignment);
            
        } catch (Exception e) {
            logger.error("服务派单失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "派单失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 批量派单
     */
    @PostMapping("/batch-assign")
    public ResponseEntity<Map<String, Object>> batchAssignServices(@RequestBody Map<String, Object> request) {
        logger.info("批量服务派单: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        try {
            String orderId = (String) request.get("orderId");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> assignments = (List<Map<String, Object>>) request.get("assignments");
            
            List<Map<String, Object>> results = new ArrayList<>();
            int successCount = 0;
            int failedCount = 0;
            
            for (Map<String, Object> assignment : assignments) {
                try {
                    String serviceCode = (String) assignment.get("serviceCode");
                    String operatorId = (String) assignment.get("operatorId");
                    String notes = (String) assignment.get("notes");
                    
                    // 单个派单处理
                    Map<String, Object> singleRequest = Map.of(
                        "orderId", orderId,
                        "serviceCode", serviceCode,
                        "operatorId", operatorId,
                        "notes", notes != null ? notes : ""
                    );
                    
                    ResponseEntity<Map<String, Object>> singleResult = assignService(singleRequest);
                    
                    if (singleResult.getBody().get("code").equals(200)) {
                        results.add(Map.of(
                            "serviceCode", serviceCode,
                            "operatorId", operatorId,
                            "status", "SUCCESS",
                            "assignmentId", ((Map<String, Object>) singleResult.getBody().get("data")).get("assignmentId")
                        ));
                        successCount++;
                    } else {
                        results.add(Map.of(
                            "serviceCode", serviceCode,
                            "operatorId", operatorId,
                            "status", "FAILED",
                            "error", singleResult.getBody().get("message")
                        ));
                        failedCount++;
                    }
                    
                } catch (Exception e) {
                    results.add(Map.of(
                        "serviceCode", assignment.get("serviceCode"),
                        "operatorId", assignment.get("operatorId"),
                        "status", "FAILED",
                        "error", e.getMessage()
                    ));
                    failedCount++;
                }
            }
            
            response.put("code", 200);
            response.put("message", String.format("批量派单完成: 成功%d个, 失败%d个", successCount, failedCount));
            response.put("data", Map.of(
                "orderId", orderId,
                "results", results,
                "summary", Map.of(
                    "total", assignments.size(),
                    "success", successCount,
                    "failed", failedCount
                )
            ));
            
        } catch (Exception e) {
            logger.error("批量服务派单失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "批量派单失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 操作人员确认接单
     */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmAssignment(@RequestBody Map<String, Object> request) {
        logger.info("操作人员确认接单: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        try {
            String assignmentId = (String) request.get("assignmentId");
            String operatorId = (String) request.get("operatorId");
            String action = (String) request.get("action"); // CONFIRM 或 REJECT
            String notes = (String) request.get("notes");
            
            String newStatus = "CONFIRM".equals(action) ? "CONFIRMED" : "REJECTED";
            LocalDateTime confirmationTime = LocalDateTime.now();
            
            // 更新派单状态
            Map<String, Object> result = Map.of(
                "assignmentId", assignmentId,
                "operatorId", operatorId,
                "previousStatus", "ASSIGNED",
                "newStatus", newStatus,
                "confirmationTime", confirmationTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "notes", notes != null ? notes : ""
            );
            
            // 发送状态更新通知
            sendAssignmentNotification("", assignmentId, operatorId, "STATUS_UPDATE");
            
            response.put("code", 200);
            response.put("message", newStatus.equals("CONFIRMED") ? "接单确认成功" : "拒绝接单成功");
            response.put("data", result);
            
        } catch (Exception e) {
            logger.error("确认接单失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "操作失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取派单状态
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<Map<String, Object>> getAssignmentStatus(@PathVariable String orderId) {
        logger.info("获取派单状态: {}", orderId);
        
        Map<String, Object> response = new HashMap<>();
        try {
            // 模拟获取派单状态
            List<Map<String, Object>> assignments = Arrays.asList(
                createAssignmentStatus("ASG001", "MBL_PROCESSING", "OP001", "张三", "CONFIRMED", "2025-09-16 10:30:00"),
                createAssignmentStatus("ASG002", "CONTAINER_LOADING", "OP003", "王五", "ASSIGNED", "2025-09-16 11:00:00"),
                createAssignmentStatus("ASG003", "CUSTOMS_DECLARATION", "OP004", "赵六", "PENDING", null),
                createAssignmentStatus("ASG004", "BOOKING", null, null, "PENDING", null)
            );
            
            Map<String, Long> statusSummary = Map.of(
                "PENDING", assignments.stream().mapToLong(a -> "PENDING".equals(a.get("status")) ? 1 : 0).sum(),
                "ASSIGNED", assignments.stream().mapToLong(a -> "ASSIGNED".equals(a.get("status")) ? 1 : 0).sum(),
                "CONFIRMED", assignments.stream().mapToLong(a -> "CONFIRMED".equals(a.get("status")) ? 1 : 0).sum(),
                "REJECTED", assignments.stream().mapToLong(a -> "REJECTED".equals(a.get("status")) ? 1 : 0).sum()
            );
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", Map.of(
                "orderId", orderId,
                "assignments", assignments,
                "statusSummary", statusSummary,
                "totalServices", assignments.size(),
                "completionRate", Math.round((statusSummary.get("CONFIRMED") * 100.0) / assignments.size())
            ));
            
        } catch (Exception e) {
            logger.error("获取派单状态失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取操作人员的待处理通知
     */
    @GetMapping("/notifications/{operatorId}")
    public ResponseEntity<Map<String, Object>> getOperatorNotifications(@PathVariable String operatorId) {
        logger.info("获取操作人员通知: {}", operatorId);
        
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, Object>> notifications = Arrays.asList(
                createNotification("HCBD20250916001", "ASG001", "新的派单", "您有一个新的MBL处理任务", "HIGH", "UNREAD"),
                createNotification("HCBD20250916002", "ASG002", "任务提醒", "内装任务即将到期，请尽快处理", "NORMAL", "UNREAD"),
                createNotification("HCBD20250916003", "ASG003", "状态更新", "报关任务已确认完成", "LOW", "READ")
            );
            
            long unreadCount = notifications.stream().mapToLong(n -> "UNREAD".equals(n.get("status")) ? 1 : 0).sum();
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", Map.of(
                "operatorId", operatorId,
                "notifications", notifications,
                "totalCount", notifications.size(),
                "unreadCount", unreadCount
            ));
            
        } catch (Exception e) {
            logger.error("获取操作人员通知失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    // 私有辅助方法

    private Map<String, Object> createServiceItem(String code, String name, String status, BigDecimal fee) {
        Map<String, Object> service = new HashMap<>();
        service.put("serviceCode", code);
        service.put("serviceName", name);
        service.put("status", status);
        service.put("estimatedFee", fee);
        service.put("priority", getPriorityByService(code));
        service.put("estimatedHours", getEstimatedHoursByService(code));
        return service;
    }

    private Map<String, Object> createOperatorInfo(String id, String name, String dept, 
                                                  String serviceCodes, int skillLevel, int currentLoad, String status) {
        Map<String, Object> operator = new HashMap<>();
        operator.put("operatorId", id);
        operator.put("operatorName", name);
        operator.put("department", dept);
        operator.put("serviceCodes", serviceCodes);
        operator.put("skillLevel", skillLevel);
        operator.put("currentOrderCount", currentLoad);
        operator.put("maxConcurrentOrders", 15);
        operator.put("status", status);
        operator.put("workloadPercentage", Math.round((currentLoad * 100.0) / 15));
        return operator;
    }

    private Map<String, Object> createAssignmentStatus(String assignmentId, String serviceCode, 
                                                      String operatorId, String operatorName, 
                                                      String status, String assignmentTime) {
        Map<String, Object> assignment = new HashMap<>();
        assignment.put("assignmentId", assignmentId);
        assignment.put("serviceCode", serviceCode);
        assignment.put("serviceName", getServiceNameByCode(serviceCode));
        assignment.put("operatorId", operatorId);
        assignment.put("operatorName", operatorName);
        assignment.put("status", status);
        assignment.put("assignmentTime", assignmentTime);
        return assignment;
    }

    private Map<String, Object> createNotification(String orderId, String assignmentId, String title, 
                                                  String content, String priority, String status) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("orderId", orderId);
        notification.put("assignmentId", assignmentId);
        notification.put("title", title);
        notification.put("content", content);
        notification.put("priority", priority);
        notification.put("status", status);
        notification.put("sendTime", LocalDateTime.now().minusHours(2).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return notification;
    }

    private Map<String, Object> findMatchingProtocol(String serviceCode) {
        // 模拟查找匹配的内部协议
        Map<String, Object> protocol = new HashMap<>();
        protocol.put("protocolId", 1L);
        protocol.put("protocolName", getProtocolNameByService(serviceCode));
        protocol.put("slaHours", getSlaHoursByService(serviceCode));
        protocol.put("costSharingRatio", 0.7);
        protocol.put("profitSharingRatio", 0.5);
        return protocol;
    }

    private void sendAssignmentNotification(String orderId, String assignmentId, String operatorId, String type) {
        // 模拟发送通知
        logger.info("发送派单通知: orderId={}, assignmentId={}, operatorId={}, type={}", 
                   orderId, assignmentId, operatorId, type);
    }

    private String getServiceNameByCode(String serviceCode) {
        Map<String, String> nameMap = Map.of(
            "MBL_PROCESSING", "MBL处理",
            "CONTAINER_LOADING", "内装",
            "CUSTOMS_DECLARATION", "报关",
            "BOOKING", "订舱"
        );
        return nameMap.getOrDefault(serviceCode, serviceCode);
    }

    private String getProtocolNameByService(String serviceCode) {
        Map<String, String> protocolMap = Map.of(
            "MBL_PROCESSING", "海运MBL处理标准协议",
            "CONTAINER_LOADING", "海运内装服务协议",
            "CUSTOMS_DECLARATION", "报关服务标准协议",
            "BOOKING", "订舱服务协议"
        );
        return protocolMap.getOrDefault(serviceCode, "通用服务协议");
    }

    private int getPriorityByService(String serviceCode) {
        Map<String, Integer> priorityMap = Map.of(
            "MBL_PROCESSING", 5,
            "BOOKING", 4,
            "CUSTOMS_DECLARATION", 3,
            "CONTAINER_LOADING", 2
        );
        return priorityMap.getOrDefault(serviceCode, 1);
    }

    private int getEstimatedHoursByService(String serviceCode) {
        Map<String, Integer> hoursMap = Map.of(
            "MBL_PROCESSING", 48,
            "BOOKING", 24,
            "CUSTOMS_DECLARATION", 12,
            "CONTAINER_LOADING", 8
        );
        return hoursMap.getOrDefault(serviceCode, 24);
    }

    private int getSlaHoursByService(String serviceCode) {
        Map<String, Integer> slaMap = Map.of(
            "MBL_PROCESSING", 48,
            "BOOKING", 24,
            "CUSTOMS_DECLARATION", 12,
            "CONTAINER_LOADING", 24
        );
        return slaMap.getOrDefault(serviceCode, 24);
    }
}