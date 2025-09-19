package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 服务派单通知实体
 * 记录客服派单给操作人员的通知信息
 */
@Entity
@Table(name = "service_assignment_notification")
@Data
@EqualsAndHashCode(callSuper = true)
public class ServiceAssignmentNotification extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;
    
    /**
     * 订单ID
     */
    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;
    
    /**
     * 服务ID
     */
    @Column(name = "service_id", nullable = false)
    private Long serviceId;
    
    /**
     * 派单人ID (客服)
     */
    @Column(name = "from_staff_id", nullable = false, length = 20)
    private String fromStaffId;
    
    /**
     * 被派单人ID (操作人员)
     */
    @Column(name = "to_staff_id", nullable = false, length = 20)
    private String toStaffId;
    
    /**
     * 选定的内部协议ID
     */
    @Column(name = "protocol_id", nullable = false, length = 50)
    private String protocolId;
    
    /**
     * 派单说明/备注
     */
    @Column(name = "message", length = 1000)
    private String message;
    
    /**
     * 通知状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private NotificationStatus status;
    
    /**
     * 发送时间
     */
    @Column(name = "sent_time", nullable = false)
    private LocalDateTime sentTime;
    
    /**
     * 阅读时间
     */
    @Column(name = "read_time")
    private LocalDateTime readTime;
    
    /**
     * 确认时间 (操作人员接单时间)
     */
    @Column(name = "confirmed_time")
    private LocalDateTime confirmedTime;
    
    /**
     * 通知类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType = NotificationType.SERVICE_ASSIGNMENT;
    
    /**
     * 优先级
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.NORMAL;
    
    /**
     * 通知状态枚举
     */
    public enum NotificationStatus {
        SENT("已发送"),
        READ("已阅读"), 
        CONFIRMED("已确认"),
        EXPIRED("已过期"),
        CANCELLED("已取消");
        
        private final String description;
        
        NotificationStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 通知类型枚举
     */
    public enum NotificationType {
        SERVICE_ASSIGNMENT("服务派单"),
        TASK_REMINDER("任务提醒"),
        STATUS_UPDATE("状态更新"),
        PROTOCOL_CHANGE("协议变更");
        
        private final String description;
        
        NotificationType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 优先级枚举
     */
    public enum Priority {
        LOW("低"),
        NORMAL("普通"),
        HIGH("高"),
        URGENT("紧急");
        
        private final String description;
        
        Priority(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 标记为已阅读
     */
    public void markAsRead() {
        this.status = NotificationStatus.READ;
        this.readTime = LocalDateTime.now();
    }
    
    /**
     * 标记为已确认
     */
    public void markAsConfirmed() {
        this.status = NotificationStatus.CONFIRMED;
        this.confirmedTime = LocalDateTime.now();
    }
    
    /**
     * 检查是否已过期
     */
    public boolean isExpired() {
        if (this.sentTime == null) return false;
        
        // 派单通知48小时未处理则过期
        LocalDateTime expiryTime = this.sentTime.plusHours(48);
        return LocalDateTime.now().isAfter(expiryTime) && 
               !NotificationStatus.CONFIRMED.equals(this.status);
    }
    
    /**
     * 获取通知年龄(小时)
     */
    public long getAgeInHours() {
        if (this.sentTime == null) return 0;
        return java.time.Duration.between(this.sentTime, LocalDateTime.now()).toHours();
    }
}