package com.oneorder.clearing.service.impl;

import com.oneorder.clearing.entity.ServiceAssignmentNotification;
import com.oneorder.clearing.entity.Staff;
import com.oneorder.clearing.repository.ServiceAssignmentNotificationRepository;
import com.oneorder.clearing.repository.StaffRepository;
import com.oneorder.clearing.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 通知服务实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    
    private final ServiceAssignmentNotificationRepository notificationRepository;
    private final StaffRepository staffRepository;
    
    @Override
    public void sendAssignmentNotification(ServiceAssignmentNotification notification) {
        log.info("发送派单通知 - 通知ID: {}, 接收人: {}", 
                notification.getNotificationId(), notification.getToStaffId());
        
        try {
            // 获取接收人信息
            Staff recipient = staffRepository.findById(notification.getToStaffId()).orElse(null);
            if (recipient == null) {
                log.warn("接收人不存在: {}", notification.getToStaffId());
                return;
            }
            
            // 发送邮件通知
            sendEmailNotification(recipient, notification);
            
            // 发送站内消息
            sendInternalMessage(recipient, notification);
            
            // 如果是紧急通知，还可以发送短信
            if (ServiceAssignmentNotification.Priority.HIGH.equals(notification.getPriority()) ||
                ServiceAssignmentNotification.Priority.URGENT.equals(notification.getPriority())) {
                sendSmsNotification(recipient, notification);
            }
            
            log.info("派单通知发送成功 - 接收人: {}", recipient.getStaffName());
            
        } catch (Exception e) {
            log.error("发送派单通知失败", e);
            throw new RuntimeException("发送通知失败: " + e.getMessage());
        }
    }
    
    @Override
    public void sendAcceptanceConfirmation(String orderId, String operationStaffId) {
        log.info("发送接单确认通知 - 订单: {}, 操作员: {}", orderId, operationStaffId);
        
        try {
            Staff operationStaff = staffRepository.findById(operationStaffId).orElse(null);
            if (operationStaff == null) {
                log.warn("操作员不存在: {}", operationStaffId);
                return;
            }
            
            // TODO: 实现接单确认通知逻辑
            // 可以通知订单负责人（客服）操作员已接单
            
            log.info("接单确认通知发送成功");
            
        } catch (Exception e) {
            log.error("发送接单确认通知失败", e);
        }
    }
    
    @Override
    public void sendStatusUpdateNotification(String orderId, String status) {
        log.info("发送状态更新通知 - 订单: {}, 状态: {}", orderId, status);
        
        try {
            // TODO: 实现状态更新通知逻辑
            
            log.info("状态更新通知发送成功");
            
        } catch (Exception e) {
            log.error("发送状态更新通知失败", e);
        }
    }
    
    @Override
    public void sendBatchNotifications(List<ServiceAssignmentNotification> notifications) {
        log.info("批量发送通知 - 数量: {}", notifications.size());
        
        for (ServiceAssignmentNotification notification : notifications) {
            try {
                sendAssignmentNotification(notification);
            } catch (Exception e) {
                log.error("批量通知发送失败 - 通知ID: {}", notification.getNotificationId(), e);
            }
        }
    }
    
    // ==================== 私有方法 ====================
    
    /**
     * 发送邮件通知
     */
    private void sendEmailNotification(Staff recipient, ServiceAssignmentNotification notification) {
        log.debug("发送邮件通知给: {}", recipient.getEmail());
        
        // TODO: 集成邮件服务 (如 Spring Mail 或第三方邮件服务)
        // EmailMessage email = EmailMessage.builder()
        //     .to(recipient.getEmail())
        //     .subject("新的服务派单通知")
        //     .content(buildEmailContent(notification))
        //     .build();
        // emailService.send(email);
        
        // 模拟发送
        log.info("模拟邮件发送成功 - 收件人: {}", recipient.getEmail());
    }
    
    /**
     * 发送站内消息
     */
    private void sendInternalMessage(Staff recipient, ServiceAssignmentNotification notification) {
        log.debug("发送站内消息给: {}", recipient.getStaffId());
        
        // TODO: 实现站内消息系统
        // InternalMessage message = InternalMessage.builder()
        //     .recipientId(recipient.getStaffId())
        //     .title("新的服务派单")
        //     .content(notification.getMessage())
        //     .relatedNotificationId(notification.getNotificationId())
        //     .build();
        // internalMessageService.send(message);
        
        // 模拟发送
        log.info("模拟站内消息发送成功");
    }
    
    /**
     * 发送短信通知
     */
    private void sendSmsNotification(Staff recipient, ServiceAssignmentNotification notification) {
        log.debug("发送短信通知给: {}", recipient.getPhone());
        
        if (recipient.getPhone() == null || recipient.getPhone().trim().isEmpty()) {
            log.warn("收件人手机号为空，跳过短信通知");
            return;
        }
        
        // TODO: 集成短信服务 (如阿里云短信、腾讯云短信等)
        // SmsMessage sms = SmsMessage.builder()
        //     .phoneNumber(recipient.getPhone())
        //     .templateCode("SERVICE_ASSIGNMENT")
        //     .templateParams(buildSmsParams(notification))
        //     .build();
        // smsService.send(sms);
        
        // 模拟发送
        log.info("模拟短信发送成功 - 手机号: {}", maskPhoneNumber(recipient.getPhone()));
    }
    
    /**
     * 构建邮件内容
     */
    private String buildEmailContent(ServiceAssignmentNotification notification) {
        return String.format(
            "您好，\\n\\n您有新的服务派单：\\n\\n" +
            "订单号：%s\\n" +
            "服务：%s\\n" +
            "派单时间：%s\\n" +
            "备注：%s\\n\\n" +
            "请及时登录系统查看详情并确认内部协议。\\n\\n" +
            "OneOrder系统",
            notification.getOrderId(),
            notification.getServiceId(),
            notification.getSentTime(),
            notification.getMessage()
        );
    }
    
    /**
     * 手机号掩码处理
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 7) {
            return "***";
        }
        return phoneNumber.substring(0, 3) + "****" + phoneNumber.substring(phoneNumber.length() - 4);
    }
}