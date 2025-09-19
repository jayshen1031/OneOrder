package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.ClearingResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 清分结果Repository
 */
@Repository
public interface ClearingResultRepository extends JpaRepository<ClearingResult, Long> {
    
    /**
     * 根据订单ID查询清分结果
     */
    @Query("SELECT r FROM ClearingResult r WHERE r.order.orderId = :orderId")
    List<ClearingResult> findByOrderId(@Param("orderId") String orderId);
    
    /**
     * 根据法人体ID查询清分结果
     */
    List<ClearingResult> findByEntityId(String entityId);
    
    /**
     * 根据交易类型查询清分结果
     */
    List<ClearingResult> findByTransactionType(ClearingResult.TransactionType transactionType);
    
    /**
     * 查询中转留存记录
     */
    List<ClearingResult> findByIsTransitRetentionTrue();
    
    /**
     * 根据法人体和时间范围查询清分结果
     */
    @Query("SELECT r FROM ClearingResult r WHERE r.entityId = :entityId " +
           "AND r.createdTime BETWEEN :startTime AND :endTime")
    List<ClearingResult> findByEntityIdAndTimePeriod(@Param("entityId") String entityId,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查询法人体的净额（用于净额抵消计算）
     */
    @Query("SELECT r.entityId, SUM(r.amount) FROM ClearingResult r " +
           "WHERE r.entityId = :entityId AND r.currency = :currency " +
           "AND r.createdTime BETWEEN :startTime AND :endTime " +
           "GROUP BY r.entityId")
    List<Object[]> calculateNetAmountByEntity(@Param("entityId") String entityId,
                                             @Param("currency") String currency,
                                             @Param("startTime") LocalDateTime startTime,
                                             @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查询管报与法报有差异的记录
     */
    @Query("SELECT r FROM ClearingResult r WHERE r.managementAmount != r.legalAmount")
    List<ClearingResult> findRecordsWithReportingDifferences();
    
    /**
     * 根据规则ID查询相关的清分结果
     */
    List<ClearingResult> findByRuleId(String ruleId);
    
    /**
     * 查询指定币种的清分结果统计
     */
    @Query("SELECT r.currency, r.transactionType, SUM(r.amount), COUNT(r.id) " +
           "FROM ClearingResult r WHERE r.currency = :currency " +
           "GROUP BY r.currency, r.transactionType")
    List<Object[]> getClearingStatsByCurrency(@Param("currency") String currency);
    
    /**
     * 查询最近的清分结果
     */
    List<ClearingResult> findTop10ByOrderByCreatedTimeDesc();
}