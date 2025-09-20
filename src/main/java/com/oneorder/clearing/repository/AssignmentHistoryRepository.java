package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.AssignmentHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 派单历史Repository接口
 */
@Repository
public interface AssignmentHistoryRepository extends JpaRepository<AssignmentHistory, Long> {
    
    /**
     * 根据订单ID查询派单历史
     */
    List<AssignmentHistory> findByOrderIdOrderByAssignmentTimeDesc(String orderId);
    
    /**
     * 根据被分配操作员ID查询派单历史
     */
    Page<AssignmentHistory> findByAssignedOperatorIdOrderByAssignmentTimeDesc(
            String assignedOperatorId, Pageable pageable);
    
    /**
     * 根据派单类型查询历史记录
     */
    Page<AssignmentHistory> findByAssignmentTypeOrderByAssignmentTimeDesc(
            String assignmentType, Pageable pageable);
    
    /**
     * 查询指定时间范围内的派单历史
     */
    @Query("SELECT ah FROM AssignmentHistory ah WHERE ah.assignmentTime >= :startTime AND ah.assignmentTime <= :endTime ORDER BY ah.assignmentTime DESC")
    List<AssignmentHistory> findByAssignmentTimeBetween(
            @Param("startTime") LocalDateTime startTime, 
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查询最近的派单历史记录
     */
    @Query("SELECT ah FROM AssignmentHistory ah ORDER BY ah.assignmentTime DESC")
    Page<AssignmentHistory> findRecentAssignments(Pageable pageable);
    
    /**
     * 根据操作员姓名查询派单历史（执行派单的操作员）
     */
    List<AssignmentHistory> findByOperatorNameOrderByAssignmentTimeDesc(String operatorName);
    
    /**
     * 根据协议ID查询使用该协议的派单历史
     */
    List<AssignmentHistory> findByProtocolIdOrderByAssignmentTimeDesc(String protocolId);
    
    /**
     * 查询指定状态的派单记录
     */
    List<AssignmentHistory> findByStatusOrderByAssignmentTimeDesc(String status);
    
    /**
     * 统计不同派单类型的数量
     */
    @Query("SELECT ah.assignmentType, COUNT(ah) FROM AssignmentHistory ah GROUP BY ah.assignmentType")
    List<Object[]> countByAssignmentType();
    
    /**
     * 统计成功和失败的派单数量
     */
    @Query("SELECT ah.status, COUNT(ah) FROM AssignmentHistory ah GROUP BY ah.status")
    List<Object[]> countByStatus();
    
    /**
     * 查询今日派单记录
     */
    @Query("SELECT ah FROM AssignmentHistory ah WHERE DATE(ah.assignmentTime) = CURRENT_DATE ORDER BY ah.assignmentTime DESC")
    List<AssignmentHistory> findTodayAssignments();
    
    /**
     * 根据服务代码查询派单历史
     */
    List<AssignmentHistory> findByServiceCodeOrderByAssignmentTimeDesc(String serviceCode);
}