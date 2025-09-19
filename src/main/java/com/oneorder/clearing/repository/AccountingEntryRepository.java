package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.AccountingEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 会计分录Repository
 */
@Repository
public interface AccountingEntryRepository extends JpaRepository<AccountingEntry, Long> {
    
    /**
     * 根据凭证ID查询分录
     */
    List<AccountingEntry> findByVoucherId(String voucherId);
    
    /**
     * 根据订单ID查询分录
     */
    List<AccountingEntry> findByOrderId(String orderId);
    
    /**
     * 根据法人体ID查询分录
     */
    List<AccountingEntry> findByEntityId(String entityId);
    
    /**
     * 根据清分结果ID查询分录
     */
    List<AccountingEntry> findByClearingResultId(String clearingResultId);
    
    /**
     * 查询未过账的分录
     */
    List<AccountingEntry> findByIsPostedFalse();
    
    /**
     * 根据报表类型查询分录
     */
    List<AccountingEntry> findByReportType(AccountingEntry.ReportType reportType);
    
    /**
     * 查询科目余额
     */
    @Query("SELECT COALESCE(SUM(e.debitAmount), 0) - COALESCE(SUM(e.creditAmount), 0) " +
           "FROM AccountingEntry e WHERE e.entityId = :entityId " +
           "AND e.accountCode = :accountCode AND e.currency = :currency AND e.isPosted = true")
    BigDecimal getAccountBalance(@Param("entityId") String entityId,
                                @Param("accountCode") String accountCode,
                                @Param("currency") String currency);
    
    /**
     * 根据时间范围查询分录
     */
    @Query("SELECT e FROM AccountingEntry e WHERE e.createdTime BETWEEN :startTime AND :endTime")
    List<AccountingEntry> findByTimePeriod(@Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查询法人体在指定时间范围内的所有科目余额
     */
    @Query("SELECT e.accountCode, e.accountName, e.currency, " +
           "SUM(e.debitAmount) as totalDebit, SUM(e.creditAmount) as totalCredit " +
           "FROM AccountingEntry e WHERE e.entityId = :entityId " +
           "AND e.createdTime BETWEEN :startTime AND :endTime AND e.isPosted = true " +
           "GROUP BY e.accountCode, e.accountName, e.currency")
    List<Object[]> getAccountBalancesByEntity(@Param("entityId") String entityId,
                                             @Param("startTime") LocalDateTime startTime,
                                             @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查询管报与法报有差异的分录
     */
    @Query("SELECT m, l FROM AccountingEntry m, AccountingEntry l " +
           "WHERE m.clearingResultId = l.clearingResultId " +
           "AND m.reportType = 'MANAGEMENT' AND l.reportType = 'LEGAL' " +
           "AND (m.debitAmount != l.debitAmount OR m.creditAmount != l.creditAmount)")
    List<Object[]> findEntriesWithReportingDifferences();
    
    /**
     * 统计指定期间的分录数据
     */
    @Query("SELECT e.reportType, e.entryType, e.currency, " +
           "COUNT(e.id), SUM(e.debitAmount), SUM(e.creditAmount) " +
           "FROM AccountingEntry e WHERE e.createdTime BETWEEN :startTime AND :endTime " +
           "GROUP BY e.reportType, e.entryType, e.currency")
    List<Object[]> getEntryStatistics(@Param("startTime") LocalDateTime startTime,
                                     @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查询最近的未过账凭证
     */
    @Query("SELECT DISTINCT e.voucherId FROM AccountingEntry e WHERE e.isPosted = false " +
           "ORDER BY e.createdTime DESC")
    List<String> findUnpostedVouchers();
}