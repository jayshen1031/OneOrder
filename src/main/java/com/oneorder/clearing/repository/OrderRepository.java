package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 订单数据访问层
 * 支持内部协议系统的订单查询需求
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    
    /**
     * 根据订单编号查找订单
     */
    Optional<Order> findByOrderNo(String orderNo);
    
    /**
     * 根据客户ID查找订单
     */
    List<Order> findByCustomerIdOrderByCreatedTimeDesc(String customerId);
    
    /**
     * 根据业务类型查找订单
     */
    List<Order> findByBusinessTypeOrderByCreatedTimeDesc(String businessType);
    
    /**
     * 根据订单状态查找订单
     */
    List<Order> findByOrderStatusOrderByCreatedTimeDesc(String orderStatus);
    
    /**
     * 根据负责客服查找订单
     */
    List<Order> findBySalesStaffIdOrderByCreatedTimeDesc(String salesStaffId);
    
    /**
     * 查找指定时间范围内的订单
     */
    @Query("SELECT o FROM Order o WHERE o.createdTime >= :startTime AND o.createdTime <= :endTime ORDER BY o.createdTime DESC")
    List<Order> findOrdersByTimeRange(@Param("startTime") LocalDateTime startTime, 
                                     @Param("endTime") LocalDateTime endTime);
    
    /**
     * 根据法人体查找订单
     */
    List<Order> findBySalesEntityIdOrderByCreatedTimeDesc(String salesEntityId);
    
    /**
     * 查找待派单的订单（基于订单状态）
     */
    @Query("SELECT o FROM Order o WHERE o.orderStatus = 'CONFIRMED'")
    List<Order> findOrdersWithUnassignedServices();
    
    /**
     * 统计订单数量按状态分组
     */
    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o GROUP BY o.orderStatus")
    List<Object[]> countOrdersByStatus();
    
    /**
     * 统计订单数量按业务类型分组
     */
    @Query("SELECT o.businessType, COUNT(o) FROM Order o GROUP BY o.businessType")
    List<Object[]> countOrdersByBusinessType();
}