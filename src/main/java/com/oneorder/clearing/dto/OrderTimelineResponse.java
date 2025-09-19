package com.oneorder.clearing.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单时间轴响应
 */
@Data
public class OrderTimelineResponse {
    
    private String orderId;
    private String orderNo;
    private String currentStatus;
    private LocalDateTime lastUpdated;
    
    private List<TimelineEvent> events;
    
    @Data
    public static class TimelineEvent {
        private String eventId;
        private String eventType;
        private String title;
        private String description;
        private String operator;
        private LocalDateTime timestamp;
        private String status;
        private String icon;
        private String color;
        private boolean completed;
        private String remarks;
    }
}