package com.oneorder.clearing.config;

import com.oneorder.clearing.controller.NotificationWebSocketController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket配置类
 * 配置实时通知的WebSocket端点
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private NotificationWebSocketController notificationWebSocketController;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 注册通知WebSocket端点
        registry.addHandler(notificationWebSocketController, "/ws/notifications")
                .setAllowedOrigins("*"); // 开发环境允许所有来源，生产环境应该限制
    }
}