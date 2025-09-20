package com.oneorder.clearing.controller;

import com.oneorder.clearing.entity.AssignmentHistory;
import com.oneorder.clearing.repository.AssignmentHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 派单历史Controller
 */
@RestController
@RequestMapping("/assignment-history")
@CrossOrigin(origins = "*")
public class AssignmentHistoryController {
    
    @Autowired
    private AssignmentHistoryRepository assignmentHistoryRepository;
    
    /**
     * 保存派单历史记录
     */
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveAssignmentHistory(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            AssignmentHistory history = new AssignmentHistory();
            
            // 设置基本信息
            history.setOrderId((String) request.get("orderId"));
            history.setOrderNo((String) request.get("orderNo"));
            history.setAssignmentType((String) request.get("assignmentType"));
            history.setOperatorName((String) request.get("operatorName"));
            
            // 设置服务信息
            history.setServiceCode((String) request.get("serviceCode"));
            history.setServiceName((String) request.get("serviceName"));
            
            // 设置被分配操作员信息
            history.setAssignedOperatorId((String) request.get("assignedOperatorId"));
            history.setAssignedOperatorName((String) request.get("assignedOperatorName"));
            
            // 设置协议信息
            history.setProtocolId((String) request.get("protocolId"));
            history.setProtocolName((String) request.get("protocolName"));
            
            // 处理协议佣金
            Object commissionObj = request.get("protocolCommission");
            if (commissionObj != null) {
                if (commissionObj instanceof Number) {
                    history.setProtocolCommission(BigDecimal.valueOf(((Number) commissionObj).doubleValue()));
                } else if (commissionObj instanceof String) {
                    try {
                        history.setProtocolCommission(new BigDecimal((String) commissionObj));
                    } catch (NumberFormatException e) {
                        // 忽略格式错误，设置为null
                    }
                }
            }
            
            // 设置状态和原因
            history.setStatus((String) request.get("status"));
            history.setReason((String) request.get("reason"));
            history.setAssignmentNotes((String) request.get("assignmentNotes"));
            
            // 设置批量派单统计
            Object successCountObj = request.get("successCount");
            if (successCountObj instanceof Number) {
                history.setSuccessCount(((Number) successCountObj).intValue());
            }
            
            Object failedCountObj = request.get("failedCount");
            if (failedCountObj instanceof Number) {
                history.setFailedCount(((Number) failedCountObj).intValue());
            }
            
            // 设置派单时间
            String assignmentTimeStr = (String) request.get("assignmentTime");
            if (assignmentTimeStr != null && !assignmentTimeStr.isEmpty()) {
                try {
                    history.setAssignmentTime(LocalDateTime.parse(assignmentTimeStr, DateTimeFormatter.ISO_DATE_TIME));
                } catch (Exception e) {
                    history.setAssignmentTime(LocalDateTime.now());
                }
            } else {
                history.setAssignmentTime(LocalDateTime.now());
            }
            
            // 保存到数据库
            AssignmentHistory savedHistory = assignmentHistoryRepository.save(history);
            
            response.put("success", true);
            response.put("message", "派单历史保存成功");
            response.put("data", savedHistory);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "保存派单历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 批量保存派单历史记录
     */
    @PostMapping("/save-batch")
    public ResponseEntity<Map<String, Object>> saveBatchAssignmentHistory(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 获取批量派单的基本信息
            String orderId = (String) request.get("orderId");
            String orderNo = (String) request.get("orderNo");
            String assignmentType = (String) request.get("assignmentType");
            String operatorName = (String) request.get("operatorName");
            Integer successCount = (Integer) request.get("successCount");
            Integer failedCount = (Integer) request.get("failedCount");
            
            // 获取派单结果列表
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) request.get("results");
            
            if (results != null && !results.isEmpty()) {
                for (Map<String, Object> result : results) {
                    AssignmentHistory history = new AssignmentHistory();
                    
                    // 设置基本信息
                    history.setOrderId(orderId);
                    history.setOrderNo(orderNo);
                    history.setAssignmentType(assignmentType);
                    history.setOperatorName(operatorName);
                    history.setSuccessCount(successCount);
                    history.setFailedCount(failedCount);
                    
                    // 设置服务信息
                    history.setServiceCode((String) result.get("serviceCode"));
                    history.setServiceName((String) result.get("serviceName"));
                    
                    // 设置被分配操作员信息
                    history.setAssignedOperatorId((String) result.get("operatorId"));
                    history.setAssignedOperatorName((String) result.get("operatorName"));
                    
                    // 设置协议信息
                    history.setProtocolId((String) result.get("protocolId"));
                    history.setProtocolName((String) result.get("protocolName"));
                    
                    // 处理协议佣金
                    Object commissionObj = result.get("protocolCommission");
                    if (commissionObj instanceof Number) {
                        history.setProtocolCommission(BigDecimal.valueOf(((Number) commissionObj).doubleValue()));
                    }
                    
                    // 设置状态和原因
                    history.setStatus((String) result.get("status"));
                    history.setReason((String) result.get("reason"));
                    
                    // 设置派单时间
                    String assignmentTimeStr = (String) request.get("assignmentTime");
                    if (assignmentTimeStr != null && !assignmentTimeStr.isEmpty()) {
                        try {
                            history.setAssignmentTime(LocalDateTime.parse(assignmentTimeStr, DateTimeFormatter.ISO_DATE_TIME));
                        } catch (Exception e) {
                            history.setAssignmentTime(LocalDateTime.now());
                        }
                    } else {
                        history.setAssignmentTime(LocalDateTime.now());
                    }
                    
                    // 保存单条记录
                    assignmentHistoryRepository.save(history);
                }
            }
            
            response.put("success", true);
            response.put("message", "批量派单历史保存成功");
            response.put("savedCount", results != null ? results.size() : 0);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "批量保存派单历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 查询最近的派单历史记录
     */
    @GetMapping("/recent")
    public ResponseEntity<Map<String, Object>> getRecentAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AssignmentHistory> historyPage = assignmentHistoryRepository.findRecentAssignments(pageable);
            
            response.put("success", true);
            response.put("data", historyPage.getContent());
            response.put("totalElements", historyPage.getTotalElements());
            response.put("totalPages", historyPage.getTotalPages());
            response.put("currentPage", page);
            response.put("size", size);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询派单历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 根据订单ID查询派单历史
     */
    @GetMapping("/by-order/{orderId}")
    public ResponseEntity<Map<String, Object>> getAssignmentsByOrderId(@PathVariable String orderId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<AssignmentHistory> histories = assignmentHistoryRepository.findByOrderIdOrderByAssignmentTimeDesc(orderId);
            
            response.put("success", true);
            response.put("data", histories);
            response.put("count", histories.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询订单派单历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 根据操作员ID查询派单历史
     */
    @GetMapping("/by-operator/{operatorId}")
    public ResponseEntity<Map<String, Object>> getAssignmentsByOperatorId(
            @PathVariable String operatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AssignmentHistory> historyPage = assignmentHistoryRepository
                    .findByAssignedOperatorIdOrderByAssignmentTimeDesc(operatorId, pageable);
            
            response.put("success", true);
            response.put("data", historyPage.getContent());
            response.put("totalElements", historyPage.getTotalElements());
            response.put("totalPages", historyPage.getTotalPages());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询操作员派单历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 获取派单统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAssignmentStatistics() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 统计派单类型分布
            List<Object[]> typeStats = assignmentHistoryRepository.countByAssignmentType();
            Map<String, Long> typeDistribution = new HashMap<>();
            for (Object[] stat : typeStats) {
                typeDistribution.put((String) stat[0], (Long) stat[1]);
            }
            
            // 统计成功失败分布
            List<Object[]> statusStats = assignmentHistoryRepository.countByStatus();
            Map<String, Long> statusDistribution = new HashMap<>();
            for (Object[] stat : statusStats) {
                statusDistribution.put((String) stat[0], (Long) stat[1]);
            }
            
            // 获取今日派单记录
            List<AssignmentHistory> todayAssignments = assignmentHistoryRepository.findTodayAssignments();
            
            response.put("success", true);
            response.put("typeDistribution", typeDistribution);
            response.put("statusDistribution", statusDistribution);
            response.put("todayAssignmentsCount", todayAssignments.size());
            response.put("totalAssignments", assignmentHistoryRepository.count());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取派单统计失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}