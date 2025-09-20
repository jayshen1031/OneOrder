package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.ExpenseEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 费用明细数据访问层
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@Repository
public interface ExpenseEntryRepository extends JpaRepository<ExpenseEntry, Long> {
    
    /**
     * 根据订单ID查询费用明细
     */
    List<ExpenseEntry> findByOrderId(String orderId);
    
    /**
     * 根据订单ID和收付类型查询费用明细
     */
    List<ExpenseEntry> findByOrderIdAndEntryType(String orderId, ExpenseEntry.EntryType entryType);
    
    /**
     * 根据订单ID和服务编码查询费用明细
     */
    List<ExpenseEntry> findByOrderIdAndServiceCode(String orderId, String serviceCode);
    
    /**
     * 根据录入人查询费用明细
     */
    Page<ExpenseEntry> findByCreatedBy(String createdBy, Pageable pageable);
    
    /**
     * 根据明细状态查询费用明细
     */
    List<ExpenseEntry> findByEntryStatus(ExpenseEntry.EntryStatus entryStatus);
    
    /**
     * 根据校验状态查询费用明细
     */
    List<ExpenseEntry> findByValidationStatus(ExpenseEntry.ValidationStatus validationStatus);
    
    /**
     * 查询指定时间范围内的费用明细
     */
    List<ExpenseEntry> findByCreatedTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 统计订单的收款明细数量
     */
    @Query("SELECT COUNT(e) FROM ExpenseEntry e WHERE e.orderId = :orderId AND e.entryType = 'RECEIVABLE'")
    long countReceivablesByOrderId(@Param("orderId") String orderId);
    
    /**
     * 统计订单的付款明细数量
     */
    @Query("SELECT COUNT(e) FROM ExpenseEntry e WHERE e.orderId = :orderId AND e.entryType = 'PAYABLE'")
    long countPayablesByOrderId(@Param("orderId") String orderId);
    
    /**
     * 计算订单的收款总额
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ExpenseEntry e WHERE e.orderId = :orderId AND e.entryType = 'RECEIVABLE' AND e.currency = :currency")
    java.math.BigDecimal sumReceivablesByOrderIdAndCurrency(@Param("orderId") String orderId, @Param("currency") String currency);
    
    /**
     * 计算订单的付款总额
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ExpenseEntry e WHERE e.orderId = :orderId AND e.entryType = 'PAYABLE' AND e.currency = :currency")
    java.math.BigDecimal sumPayablesByOrderIdAndCurrency(@Param("orderId") String orderId, @Param("currency") String currency);
    
    /**
     * 查询订单中使用的费用科目
     */
    @Query("SELECT DISTINCT e.feeCode FROM ExpenseEntry e WHERE e.orderId = :orderId")
    List<String> findDistinctFeeCodesByOrderId(@Param("orderId") String orderId);
    
    /**
     * 查询订单中涉及的服务项目
     */
    @Query("SELECT DISTINCT e.serviceCode FROM ExpenseEntry e WHERE e.orderId = :orderId")
    List<String> findDistinctServiceCodesByOrderId(@Param("orderId") String orderId);
    
    /**
     * 检查费用科目和服务项目的组合是否已存在
     */
    boolean existsByOrderIdAndServiceCodeAndFeeCodeAndEntryType(
        String orderId, String serviceCode, String feeCode, ExpenseEntry.EntryType entryType);
    
    /**
     * 查询借抬头费用明细
     */
    List<ExpenseEntry> findByIsTransitEntityTrue();
    
    /**
     * 查询需要校验的费用明细
     */
    @Query("SELECT e FROM ExpenseEntry e WHERE e.validationStatus IN ('WARNING', 'ERROR')")
    List<ExpenseEntry> findEntriesNeedingValidation();
    
    /**
     * 根据对方法人公司查询费用明细
     */
    List<ExpenseEntry> findByCounterpartEntity(String counterpartEntity);
    
    /**
     * 根据我方法人ID查询费用明细
     */
    List<ExpenseEntry> findByOurEntityId(String ourEntityId);
    
    /**
     * 根据我方部门ID查询费用明细
     */
    List<ExpenseEntry> findByOurDepartmentId(String ourDepartmentId);
    
    /**
     * 查询订单是否有草稿状态的费用明细
     */
    @Query("SELECT COUNT(e) > 0 FROM ExpenseEntry e WHERE e.orderId = :orderId AND e.entryStatus = 'DRAFT'")
    boolean hasOrderDraftEntries(@Param("orderId") String orderId);
    
    /**
     * 查询订单是否有锁定状态的费用明细
     */
    @Query("SELECT COUNT(e) > 0 FROM ExpenseEntry e WHERE e.orderId = :orderId AND e.entryStatus = 'LOCKED'")
    boolean hasOrderLockedEntries(@Param("orderId") String orderId);
    
    /**
     * 根据订单ID和版本号查询费用明细
     */
    Optional<ExpenseEntry> findByOrderIdAndVersionNumber(String orderId, Integer versionNumber);
    
    /**
     * 查询订单的最新版本号
     */
    @Query("SELECT MAX(e.versionNumber) FROM ExpenseEntry e WHERE e.orderId = :orderId")
    Optional<Integer> findMaxVersionByOrderId(@Param("orderId") String orderId);
    
    /**
     * 复杂查询：根据多个条件查询费用明细
     */
    @Query("SELECT e FROM ExpenseEntry e WHERE " +
           "(:orderId IS NULL OR e.orderId = :orderId) AND " +
           "(:serviceCode IS NULL OR e.serviceCode = :serviceCode) AND " +
           "(:feeCode IS NULL OR e.feeCode = :feeCode) AND " +
           "(:entryType IS NULL OR e.entryType = :entryType) AND " +
           "(:entryStatus IS NULL OR e.entryStatus = :entryStatus) AND " +
           "(:validationStatus IS NULL OR e.validationStatus = :validationStatus) AND " +
           "(:createdBy IS NULL OR e.createdBy = :createdBy) AND " +
           "(:ourEntityId IS NULL OR e.ourEntityId = :ourEntityId) AND " +
           "(:ourDepartmentId IS NULL OR e.ourDepartmentId = :ourDepartmentId)")
    Page<ExpenseEntry> findByMultipleConditions(
        @Param("orderId") String orderId,
        @Param("serviceCode") String serviceCode,
        @Param("feeCode") String feeCode,
        @Param("entryType") ExpenseEntry.EntryType entryType,
        @Param("entryStatus") ExpenseEntry.EntryStatus entryStatus,
        @Param("validationStatus") ExpenseEntry.ValidationStatus validationStatus,
        @Param("createdBy") String createdBy,
        @Param("ourEntityId") String ourEntityId,
        @Param("ourDepartmentId") String ourDepartmentId,
        Pageable pageable
    );
}