package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.OrderService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单服务数据访问接口
 */
@Repository
public interface OrderServiceRepository extends JpaRepository<OrderService, Long> {
    
    /**
     * 根据订单ID查找服务
     */
    List<OrderService> findByOrderId(String orderId);
    
    /**
     * 根据订单ID和状态查找服务
     */
    List<OrderService> findByOrderIdAndStatus(String orderId, OrderService.ServiceStatus status);
    
    /**
     * 根据操作人员ID查找服务
     */
    List<OrderService> findByOperationStaffId(String operationStaffId);
    
    /**
     * 根据操作人员ID和状态查找服务
     */
    List<OrderService> findByOperationStaffIdAndStatus(
        String operationStaffId, OrderService.ServiceStatus status);
    
    /**
     * 根据操作部门ID查找服务
     */
    List<OrderService> findByOperationDepartmentId(String operationDepartmentId);
    
    /**
     * 根据内部协议ID查找服务
     */
    List<OrderService> findByInternalProtocolId(String internalProtocolId);
    
    /**
     * 查找待派单的服务
     */
    @Query("SELECT os FROM OrderService os WHERE os.status = 'PENDING' ORDER BY os.createdTime")
    List<OrderService> findPendingServices();
    
    /**
     * 查找已派单但未确认协议的服务
     */
    @Query("SELECT os FROM OrderService os WHERE os.status = 'ASSIGNED' ORDER BY os.assignedTime")
    List<OrderService> findAssignedServices();
    
    /**
     * 查找协议已确认的服务
     */
    @Query("SELECT os FROM OrderService os WHERE os.status = 'PROTOCOL_CONFIRMED' ORDER BY os.protocolConfirmedTime")
    List<OrderService> findProtocolConfirmedServices();
    
    /**
     * 查找执行中的服务
     */
    @Query("SELECT os FROM OrderService os WHERE os.status = 'IN_PROGRESS' ORDER BY os.startedTime")
    List<OrderService> findInProgressServices();
    
    /**
     * 查找已完成的服务
     */
    @Query("SELECT os FROM OrderService os WHERE os.status = 'COMPLETED' ORDER BY os.completedTime DESC")
    List<OrderService> findCompletedServices();
    
    /**
     * 查找受阻的服务
     */
    @Query("SELECT os FROM OrderService os WHERE os.status = 'BLOCKED' ORDER BY os.updatedTime DESC")
    List<OrderService> findBlockedServices();
    
    /**
     * 查找操作人员的我的任务
     */
    @Query("SELECT os FROM OrderService os " +
           "JOIN os.order o " +
           "JOIN os.serviceConfig sc " +
           "WHERE os.operationStaffId = :operationStaffId " +
           "AND (:status IS NULL OR os.status = :status) " +
           "ORDER BY " +
           "CASE os.status " +
           "  WHEN 'ASSIGNED' THEN 1 " +
           "  WHEN 'PROTOCOL_CONFIRMED' THEN 2 " +
           "  WHEN 'IN_PROGRESS' THEN 3 " +
           "  ELSE 4 " +
           "END, " +
           "os.assignedTime DESC")
    List<OrderService> findMyTasks(
        @Param("operationStaffId") String operationStaffId,
        @Param("status") OrderService.ServiceStatus status);
    
    /**
     * 查找需要确认协议的任务（已派单超过指定时间）
     */
    @Query("SELECT os FROM OrderService os WHERE " +
           "os.status = 'ASSIGNED' AND " +
           "os.assignedTime < :deadlineTime " +
           "ORDER BY os.assignedTime")
    List<OrderService> findOverdueAssignedServices(@Param("deadlineTime") LocalDateTime deadlineTime);
    
    /**
     * 统计各状态的服务数量
     */
    @Query("SELECT os.status, COUNT(os) FROM OrderService os GROUP BY os.status ORDER BY os.status")
    List<Object[]> countServicesByStatus();
    
    /**
     * 统计各操作人员的任务数量
     */
    @Query("SELECT s.staffName, os.status, COUNT(os) FROM OrderService os " +
           "JOIN Staff s ON os.operationStaffId = s.staffId " +
           "WHERE os.operationStaffId IS NOT NULL " +
           "GROUP BY os.operationStaffId, s.staffName, os.status " +
           "ORDER BY s.staffName, os.status")
    List<Object[]> countTasksByStaffAndStatus();
    
    /**
     * 统计各协议的使用情况
     */
    @Query("SELECT p.protocolName, COUNT(os) FROM OrderService os " +
           "JOIN InternalProtocol p ON os.internalProtocolId = p.protocolId " +
           "WHERE os.internalProtocolId IS NOT NULL " +
           "GROUP BY os.internalProtocolId, p.protocolName " +
           "ORDER BY COUNT(os) DESC")
    List<Object[]> countServicesByProtocol();
    
    /**
     * 查找订单的服务执行进度
     */
    @Query("SELECT os.orderId, " +
           "COUNT(os) as totalServices, " +
           "SUM(CASE WHEN os.status = 'COMPLETED' THEN 1 ELSE 0 END) as completedServices, " +
           "SUM(CASE WHEN os.status IN ('ASSIGNED', 'PROTOCOL_CONFIRMED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as activeServices " +
           "FROM OrderService os " +
           "WHERE os.orderId = :orderId " +
           "GROUP BY os.orderId")
    Object[] getOrderServiceProgress(@Param("orderId") String orderId);
    
    /**
     * 查找可以分润计算的服务（已完成且有协议）
     */
    @Query("SELECT os FROM OrderService os " +
           "WHERE os.status = 'COMPLETED' " +
           "AND os.internalProtocolId IS NOT NULL " +
           "AND os.serviceAmount IS NOT NULL " +
           "ORDER BY os.completedTime")
    List<OrderService> findServicesForRevenueCalculation();
}