package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.ServiceAssignmentNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 服务派单通知数据访问层
 */
@Repository
public interface ServiceAssignmentNotificationRepository extends JpaRepository<ServiceAssignmentNotification, Long> {
    
    /**
     * 根据服务ID和接收人查找通知
     */
    Optional<ServiceAssignmentNotification> findByServiceIdAndToStaffId(Long serviceId, String toStaffId);
    
    /**
     * 查找用户的所有通知 (按发送时间倒序)
     */
    List<ServiceAssignmentNotification> findByToStaffIdOrderBySentTimeDesc(String toStaffId);
    
    /**
     * 查找用户的未读通知
     */
    @Query("SELECT n FROM ServiceAssignmentNotification n WHERE n.toStaffId = :staffId AND n.status = 'SENT' ORDER BY n.sentTime DESC")
    List<ServiceAssignmentNotification> findUnreadNotifications(@Param("staffId") String staffId);
    
    /**
     * 查找用户的待确认通知
     */
    @Query("SELECT n FROM ServiceAssignmentNotification n WHERE n.toStaffId = :staffId AND n.status IN ('SENT', 'READ') ORDER BY n.sentTime DESC")
    List<ServiceAssignmentNotification> findPendingNotifications(@Param("staffId") String staffId);
    
    /**
     * 查找指定状态的通知
     */
    List<ServiceAssignmentNotification> findByStatusOrderBySentTimeDesc(ServiceAssignmentNotification.NotificationStatus status);
    
    /**
     * 查找过期的通知
     */
    @Query("SELECT n FROM ServiceAssignmentNotification n WHERE n.sentTime < :expiryTime AND n.status NOT IN ('CONFIRMED', 'CANCELLED', 'EXPIRED')")
    List<ServiceAssignmentNotification> findExpiredNotifications(@Param("expiryTime") LocalDateTime expiryTime);
    
    /**
     * 统计用户未读通知数量
     */
    @Query("SELECT COUNT(n) FROM ServiceAssignmentNotification n WHERE n.toStaffId = :staffId AND n.status = 'SENT'")
    long countUnreadNotifications(@Param("staffId") String staffId);
    
    /**
     * 统计用户待确认通知数量
     */
    @Query("SELECT COUNT(n) FROM ServiceAssignmentNotification n WHERE n.toStaffId = :staffId AND n.status IN ('SENT', 'READ')")
    long countPendingNotifications(@Param("staffId") String staffId);
    
    /**
     * 查找订单相关的所有通知
     */
    List<ServiceAssignmentNotification> findByOrderIdOrderBySentTimeDesc(String orderId);
    
    /**
     * 查找客服发送的所有通知
     */
    List<ServiceAssignmentNotification> findByFromStaffIdOrderBySentTimeDesc(String fromStaffId);
    
    /**
     * 查找指定时间范围内的通知
     */
    @Query("SELECT n FROM ServiceAssignmentNotification n WHERE n.sentTime BETWEEN :startTime AND :endTime ORDER BY n.sentTime DESC")
    List<ServiceAssignmentNotification> findByTimeRange(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查找高优先级的未处理通知
     */
    @Query("SELECT n FROM ServiceAssignmentNotification n WHERE n.priority IN ('HIGH', 'URGENT') AND n.status IN ('SENT', 'read') ORDER BY n.priority DESC, n.sentTime ASC")
    List<ServiceAssignmentNotification> findHighPriorityPendingNotifications();
    
    /**
     * 批量更新通知状态
     */
    @Query("UPDATE ServiceAssignmentNotification n SET n.status = :newStatus WHERE n.notificationId IN :notificationIds")
    int updateStatusBatch(@Param("notificationIds") List<Long> notificationIds, @Param("newStatus") ServiceAssignmentNotification.NotificationStatus newStatus);
    
    /**
     * 删除过期的已处理通知 (用于数据清理)
     */
    @Query("DELETE FROM ServiceAssignmentNotification n WHERE n.confirmedTime < :cutoffTime AND n.status = 'CONFIRMED'")
    int deleteOldConfirmedNotifications(@Param("cutoffTime") LocalDateTime cutoffTime);
}