package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.ServiceAssignmentNotification;

/**
 * 通知服务接口
 */
public interface NotificationService {
    
    /**
     * 发送派单通知
     */
    void sendAssignmentNotification(ServiceAssignmentNotification notification);
    
    /**
     * 发送接单确认通知
     */
    void sendAcceptanceConfirmation(String orderId, String operationStaffId);
    
    /**
     * 发送状态更新通知
     */
    void sendStatusUpdateNotification(String orderId, String status);
    
    /**
     * 批量发送通知
     */
    void sendBatchNotifications(java.util.List<ServiceAssignmentNotification> notifications);
}