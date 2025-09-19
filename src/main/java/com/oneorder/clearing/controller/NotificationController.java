package com.oneorder.clearing.controller;

import com.oneorder.clearing.dto.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 通知管理REST控制器
 * 提供通知的HTTP API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationWebSocketController webSocketController;

    // 简单的内存存储，实际项目应该使用数据库
    private final Map<String, List<Map<String, Object>>> userNotifications = new ConcurrentHashMap<>();
    
    /**
     * 获取用户的最近通知
     */
    @GetMapping("/recent")
    public ResponseDTO<List<Map<String, Object>>> getRecentNotifications(
            @RequestParam(defaultValue = "OP001") String userId,
            @RequestParam(defaultValue = "20") int limit) {
        
        try {
            List<Map<String, Object>> notifications = userNotifications.getOrDefault(userId, new ArrayList<>());
            
            // 返回最新的限制数量的通知
            List<Map<String, Object>> recentNotifications = notifications.size() > limit 
                ? notifications.subList(0, limit) 
                : notifications;
            
            return ResponseDTO.success(recentNotifications);
            
        } catch (Exception e) {
            log.error("获取最近通知失败", e);
            return ResponseDTO.error("获取通知失败: " + e.getMessage());
        }
    }

    /**
     * 标记通知为已读
     */
    @PostMapping("/mark-read")
    public ResponseDTO<String> markNotificationAsRead(@RequestBody Map<String, Object> request) {
        try {
            String notificationId = (String) request.get("notificationId");
            String userId = (String) request.getOrDefault("userId", "OP001");
            String readTime = (String) request.get("readTime");
            
            List<Map<String, Object>> notifications = userNotifications.get(userId);
            if (notifications != null) {
                notifications.stream()
                    .filter(n -> notificationId.equals(n.get("id")))
                    .findFirst()
                    .ifPresent(n -> {
                        n.put("isRead", true);
                        n.put("readTime", readTime);
                    });
            }
            
            log.info("通知 {} 已标记为已读", notificationId);
            return ResponseDTO.success("已标记为已读");
            
        } catch (Exception e) {
            log.error("标记通知为已读失败", e);
            return ResponseDTO.error("操作失败: " + e.getMessage());
        }
    }

    /**
     * 批量标记通知为已读
     */
    @PostMapping("/batch-mark-read")
    public ResponseDTO<String> batchMarkAsRead(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> notificationIds = (List<String>) request.get("notificationIds");
            String userId = (String) request.getOrDefault("userId", "OP001");
            String readTime = (String) request.get("readTime");
            
            List<Map<String, Object>> notifications = userNotifications.get(userId);
            if (notifications != null) {
                int markedCount = 0;
                for (Map<String, Object> notification : notifications) {
                    if (notificationIds.contains(notification.get("id"))) {
                        notification.put("isRead", true);
                        notification.put("readTime", readTime);
                        markedCount++;
                    }
                }
                log.info("批量标记 {} 个通知为已读", markedCount);
            }
            
            return ResponseDTO.success("批量标记完成");
            
        } catch (Exception e) {
            log.error("批量标记通知为已读失败", e);
            return ResponseDTO.error("操作失败: " + e.getMessage());
        }
    }

    /**
     * 发送通知
     */
    @PostMapping("/send")
    public ResponseDTO<String> sendNotification(@RequestBody Map<String, Object> notification) {
        try {
            String type = (String) notification.get("type");
            String targetUserId = (String) notification.get("operatorId");
            
            // 添加服务器时间戳
            notification.put("serverTimestamp", Instant.now().toString());
            
            // 保存到内存存储
            if (targetUserId != null) {
                userNotifications.computeIfAbsent(targetUserId, k -> new ArrayList<>()).add(0, notification);
                
                // 限制通知数量
                List<Map<String, Object>> userNotifs = userNotifications.get(targetUserId);
                if (userNotifs.size() > 100) {
                    userNotifications.put(targetUserId, userNotifs.subList(0, 100));
                }
            }
            
            // 通过WebSocket发送
            if (targetUserId != null) {
                webSocketController.sendNotificationToUser(targetUserId, notification);
            } else {
                webSocketController.broadcastNotification(notification);
            }
            
            log.info("通知已发送: {} -> {}", type, targetUserId);
            return ResponseDTO.success("通知发送成功");
            
        } catch (Exception e) {
            log.error("发送通知失败", e);
            return ResponseDTO.error("发送失败: " + e.getMessage());
        }
    }

    /**
     * 发送派单通知 (专用接口)
     */
    @PostMapping("/assignment")
    public ResponseDTO<String> sendAssignmentNotification(@RequestBody Map<String, Object> request) {
        try {
            String operatorId = (String) request.get("operatorId");
            String orderNo = (String) request.get("orderNo");
            String serviceName = (String) request.get("serviceName");
            String serviceCode = (String) request.get("serviceCode");
            
            webSocketController.sendAssignmentNotification(operatorId, orderNo, serviceName, serviceCode);
            
            return ResponseDTO.success("派单通知发送成功");
            
        } catch (Exception e) {
            log.error("发送派单通知失败", e);
            return ResponseDTO.error("发送失败: " + e.getMessage());
        }
    }

    /**
     * 发送紧急通知
     */
    @PostMapping("/urgent")
    public ResponseDTO<String> sendUrgentNotification(@RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("userId");
            String message = (String) request.get("message");
            String orderNo = (String) request.get("orderNo");
            
            webSocketController.sendUrgentNotification(userId, message, orderNo);
            
            return ResponseDTO.success("紧急通知发送成功");
            
        } catch (Exception e) {
            log.error("发送紧急通知失败", e);
            return ResponseDTO.error("发送失败: " + e.getMessage());
        }
    }

    /**
     * 发送系统通知
     */
    @PostMapping("/system")
    public ResponseDTO<String> sendSystemNotification(@RequestBody Map<String, Object> request) {
        try {
            String message = (String) request.get("message");
            
            webSocketController.sendSystemNotification(message);
            
            return ResponseDTO.success("系统通知发送成功");
            
        } catch (Exception e) {
            log.error("发送系统通知失败", e);
            return ResponseDTO.error("发送失败: " + e.getMessage());
        }
    }

    /**
     * 获取通知统计
     */
    @GetMapping("/stats")
    public ResponseDTO<Map<String, Object>> getNotificationStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("webSocketConnections", webSocketController.getConnectionStats());
            stats.put("totalUsers", userNotifications.size());
            
            int totalNotifications = userNotifications.values().stream()
                .mapToInt(List::size)
                .sum();
            stats.put("totalNotifications", totalNotifications);
            
            return ResponseDTO.success(stats);
            
        } catch (Exception e) {
            log.error("获取通知统计失败", e);
            return ResponseDTO.error("获取统计失败: " + e.getMessage());
        }
    }

    /**
     * 清空用户通知
     */
    @DeleteMapping("/clear")
    public ResponseDTO<String> clearUserNotifications(
            @RequestParam(defaultValue = "OP001") String userId) {
        
        try {
            userNotifications.remove(userId);
            log.info("已清空用户 {} 的通知", userId);
            return ResponseDTO.success("通知已清空");
            
        } catch (Exception e) {
            log.error("清空通知失败", e);
            return ResponseDTO.error("清空失败: " + e.getMessage());
        }
    }

    /**
     * 测试通知发送
     */
    @PostMapping("/test")
    public ResponseDTO<String> sendTestNotification(@RequestParam(defaultValue = "OP001") String userId) {
        try {
            Map<String, Object> testNotification = Map.of(
                "id", "test_" + System.currentTimeMillis(),
                "type", "system",
                "title", "测试通知",
                "message", "这是一个测试通知，用于验证实时通知系统是否正常工作",
                "timestamp", Instant.now().toString(),
                "priority", "normal",
                "isRead", false
            );
            
            webSocketController.sendNotificationToUser(userId, testNotification);
            
            return ResponseDTO.success("测试通知已发送");
            
        } catch (Exception e) {
            log.error("发送测试通知失败", e);
            return ResponseDTO.error("发送失败: " + e.getMessage());
        }
    }
}