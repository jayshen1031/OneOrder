package com.oneorder.clearing.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

/**
 * 实时通知WebSocket控制器
 * 处理派单通知的实时推送和消息确认
 */
@Slf4j
@Component
public class NotificationWebSocketController implements WebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 存储所有活跃的WebSocket连接
    private final Set<WebSocketSession> activeSessions = new CopyOnWriteArraySet<>();
    
    // 存储用户ID与WebSocket会话的映射
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket连接建立: {}", session.getId());
        activeSessions.add(session);
        
        // 从会话中获取用户ID (这里简化处理，实际应该从JWT或会话中获取)
        String userId = extractUserIdFromSession(session);
        if (userId != null) {
            userSessions.put(userId, session);
            log.info("用户 {} 的WebSocket会话已建立", userId);
        }
        
        // 发送连接确认消息（已禁用，避免不必要的用户通知）
        // sendWelcomeMessage(session);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        log.info("收到WebSocket消息: {}", message.getPayload());
        
        try {
            if (message instanceof TextMessage) {
                String payload = ((TextMessage) message).getPayload();
                
                // 解析消息
                Map<String, Object> messageData = objectMapper.readValue(payload, Map.class);
                String messageType = (String) messageData.get("type");
                
                switch (messageType) {
                    case "ping":
                        handlePingMessage(session);
                        break;
                    case "notification_read":
                        handleNotificationRead(session, messageData);
                        break;
                    case "subscribe":
                        handleSubscription(session, messageData);
                        break;
                    default:
                        log.warn("未知的消息类型: {}", messageType);
                }
            }
        } catch (Exception e) {
            log.error("处理WebSocket消息失败", e);
            sendErrorMessage(session, "消息处理失败: " + e.getMessage());
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket传输错误: {}", session.getId(), exception);
        activeSessions.remove(session);
        removeUserSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("WebSocket连接关闭: {}, 状态: {}", session.getId(), closeStatus);
        activeSessions.remove(session);
        removeUserSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    /**
     * 向指定用户发送通知
     */
    public void sendNotificationToUser(String userId, Object notification) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String message = objectMapper.writeValueAsString(notification);
                session.sendMessage(new TextMessage(message));
                log.info("向用户 {} 发送通知: {}", userId, notification);
            } catch (IOException e) {
                log.error("发送通知失败", e);
                userSessions.remove(userId);
            }
        } else {
            log.warn("用户 {} 的WebSocket会话不存在或已关闭", userId);
        }
    }

    /**
     * 广播通知给所有连接的用户
     */
    public void broadcastNotification(Object notification) {
        String message;
        try {
            message = objectMapper.writeValueAsString(notification);
        } catch (Exception e) {
            log.error("序列化通知消息失败", e);
            return;
        }

        activeSessions.removeIf(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                    return false;
                } else {
                    return true;
                }
            } catch (IOException e) {
                log.error("广播通知失败: {}", session.getId(), e);
                return true;
            }
        });
        
        log.info("广播通知给 {} 个活跃连接", activeSessions.size());
    }

    /**
     * 发送派单通知
     */
    public void sendAssignmentNotification(String operatorId, String orderNo, String serviceName, String serviceCode) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("id", "assign_" + serviceCode + "_" + System.currentTimeMillis());
        notification.put("type", "assignment");
        notification.put("title", "新的派单任务");
        notification.put("message", "您收到了新的" + serviceName + "任务");
        notification.put("timestamp", java.time.Instant.now().toString());
        notification.put("priority", "normal");
        notification.put("orderNo", orderNo);
        notification.put("serviceCode", serviceCode);
        notification.put("operatorId", operatorId);
        notification.put("actionUrl", "#mytasks");
        notification.put("isRead", false);
        
        sendNotificationToUser(operatorId, notification);
    }

    /**
     * 发送紧急通知
     */
    public void sendUrgentNotification(String userId, String message, String orderNo) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("id", "urgent_" + System.currentTimeMillis());
        notification.put("type", "urgent");
        notification.put("title", "紧急通知");
        notification.put("message", message);
        notification.put("timestamp", java.time.Instant.now().toString());
        notification.put("priority", "high");
        notification.put("orderNo", orderNo != null ? orderNo : "");
        notification.put("isRead", false);
        
        sendNotificationToUser(userId, notification);
    }

    /**
     * 发送系统通知
     */
    public void sendSystemNotification(String message) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("id", "sys_" + System.currentTimeMillis());
        notification.put("type", "system");
        notification.put("title", "系统通知");
        notification.put("message", message);
        notification.put("timestamp", java.time.Instant.now().toString());
        notification.put("priority", "normal");
        notification.put("isRead", false);
        
        broadcastNotification(notification);
    }

    // 私有方法
    private void sendWelcomeMessage(WebSocketSession session) {
        try {
            Map<String, Object> welcome = new HashMap<>();
            welcome.put("type", "system");
            welcome.put("title", "连接状态");
            welcome.put("message", "实时通知连接成功");
            welcome.put("timestamp", java.time.Instant.now().toString());
            welcome.put("connectionId", session.getId());
            welcome.put("priority", "normal");
            welcome.put("isRead", false);
            
            String message = objectMapper.writeValueAsString(welcome);
            session.sendMessage(new TextMessage(message));
        } catch (IOException e) {
            log.error("发送欢迎消息失败", e);
        }
    }

    private void handlePingMessage(WebSocketSession session) {
        try {
            Map<String, Object> pong = new HashMap<>();
            pong.put("type", "pong");
            pong.put("timestamp", java.time.Instant.now().toString());
            
            String message = objectMapper.writeValueAsString(pong);
            session.sendMessage(new TextMessage(message));
        } catch (IOException e) {
            log.error("发送pong消息失败", e);
        }
    }

    private void handleNotificationRead(WebSocketSession session, Map<String, Object> messageData) {
        String notificationId = (String) messageData.get("notificationId");
        log.info("用户标记通知为已读: {}", notificationId);
        
        // 这里可以更新数据库中的通知状态
        // notificationService.markAsRead(notificationId);
        
        // 发送确认消息
        try {
            Map<String, Object> confirmation = new HashMap<>();
            confirmation.put("type", "read_confirmation");
            confirmation.put("notificationId", notificationId);
            confirmation.put("timestamp", java.time.Instant.now().toString());
            
            String message = objectMapper.writeValueAsString(confirmation);
            session.sendMessage(new TextMessage(message));
        } catch (IOException e) {
            log.error("发送已读确认失败", e);
        }
    }

    private void handleSubscription(WebSocketSession session, Map<String, Object> messageData) {
        String userId = (String) messageData.get("userId");
        String topic = (String) messageData.get("topic");
        
        log.info("用户 {} 订阅主题: {}", userId, topic);
        
        // 这里可以实现主题订阅逻辑
        // subscriptionService.subscribe(userId, topic);
    }

    private String extractUserIdFromSession(WebSocketSession session) {
        // 简化实现，实际应该从JWT token或session中获取
        // 这里使用URI参数或headers获取用户ID
        try {
            String query = session.getUri().getQuery();
            if (query != null && query.contains("userId=")) {
                return query.split("userId=")[1].split("&")[0];
            }
        } catch (Exception e) {
            log.warn("提取用户ID失败", e);
        }
        
        // 默认返回一个操作员ID用于演示
        return "OP001";
    }

    private void removeUserSession(WebSocketSession session) {
        userSessions.entrySet().removeIf(entry -> entry.getValue() == session);
    }

    private void sendErrorMessage(WebSocketSession session, String errorMessage) {
        try {
            Map<String, Object> error = new HashMap<>();
            error.put("type", "error");
            error.put("message", errorMessage);
            error.put("timestamp", java.time.Instant.now().toString());
            
            String message = objectMapper.writeValueAsString(error);
            session.sendMessage(new TextMessage(message));
        } catch (IOException e) {
            log.error("发送错误消息失败", e);
        }
    }

    /**
     * 获取活跃连接统计
     */
    public Map<String, Object> getConnectionStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeConnections", activeSessions.size());
        stats.put("userSessions", userSessions.size());
        stats.put("timestamp", java.time.Instant.now().toString());
        return stats;
    }
}