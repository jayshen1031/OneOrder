package com.oneorder.clearing.service;

import com.oneorder.clearing.dto.ExpenseEntryRequest;
import com.oneorder.clearing.dto.ExpenseEntryResponse;
import com.oneorder.clearing.entity.ExpenseEntry;
import com.oneorder.clearing.exception.ClearingException;
import com.oneorder.clearing.repository.ExpenseEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 费用明细录入服务
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseEntryService {
    
    private final ExpenseEntryRepository expenseEntryRepository;
    private final FeeValidationService feeValidationService;
    private final SmartServiceSuggestionService smartServiceSuggestionService;
    
    /**
     * 创建费用明细
     */
    @Transactional
    public ExpenseEntryResponse createExpenseEntry(ExpenseEntryRequest request) {
        log.info("开始创建费用明细: orderId={}, serviceCode={}, feeCode={}, entryType={}", 
                request.getOrderId(), request.getServiceCode(), request.getFeeCode(), request.getEntryType());
        
        // 1. 检查是否已存在相同的费用明细
        validateUniqueEntry(request);
        
        // 2. 校验费用科目和服务项目的适用性
        var validationResult = feeValidationService.validateFeeServiceConstraint(
            request.getFeeCode(), request.getServiceCode());
        
        // 3. 校验费用科目和供应商类型的适用性（付款时）
        if (request.getEntryType() == ExpenseEntry.EntryType.PAYABLE) {
            var supplierValidationResult = feeValidationService.validateFeeSupplierConstraint(
                request.getFeeCode(), request.getCounterpartSupplierType());
            // 合并校验结果
            if (supplierValidationResult.getLevel().ordinal() > validationResult.getLevel().ordinal()) {
                validationResult = supplierValidationResult;
            }
        }
        
        // 4. 创建费用明细实体
        ExpenseEntry entity = buildExpenseEntry(request, validationResult);
        
        // 5. 保存到数据库
        ExpenseEntry savedEntity = expenseEntryRepository.save(entity);
        
        log.info("费用明细创建成功: id={}, orderId={}", savedEntity.getId(), savedEntity.getOrderId());
        
        // 6. 转换为响应DTO
        return ExpenseEntryResponse.fromEntity(savedEntity);
    }
    
    /**
     * 更新费用明细
     */
    @Transactional
    public ExpenseEntryResponse updateExpenseEntry(Long id, ExpenseEntryRequest request) {
        log.info("开始更新费用明细: id={}, orderId={}", id, request.getOrderId());
        
        // 1. 查找现有费用明细
        ExpenseEntry existingEntity = expenseEntryRepository.findById(id)
            .orElseThrow(() -> new ClearingException("费用明细不存在: " + id));
        
        // 2. 检查是否可以修改
        if (existingEntity.isLocked()) {
            throw new ClearingException("费用明细已锁定，无法修改");
        }
        
        // 3. 校验费用科目和服务项目的适用性
        var validationResult = feeValidationService.validateFeeServiceConstraint(
            request.getFeeCode(), request.getServiceCode());
        
        // 4. 校验费用科目和供应商类型的适用性（付款时）
        if (request.getEntryType() == ExpenseEntry.EntryType.PAYABLE) {
            var supplierValidationResult = feeValidationService.validateFeeSupplierConstraint(
                request.getFeeCode(), request.getCounterpartSupplierType());
            if (supplierValidationResult.getLevel().ordinal() > validationResult.getLevel().ordinal()) {
                validationResult = supplierValidationResult;
            }
        }
        
        // 5. 更新实体字段
        updateEntityFields(existingEntity, request, validationResult);
        
        // 6. 保存更新
        ExpenseEntry savedEntity = expenseEntryRepository.save(existingEntity);
        
        log.info("费用明细更新成功: id={}, orderId={}", savedEntity.getId(), savedEntity.getOrderId());
        
        return ExpenseEntryResponse.fromEntity(savedEntity);
    }
    
    /**
     * 删除费用明细
     */
    @Transactional
    public void deleteExpenseEntry(Long id) {
        log.info("开始删除费用明细: id={}", id);
        
        ExpenseEntry entity = expenseEntryRepository.findById(id)
            .orElseThrow(() -> new ClearingException("费用明细不存在: " + id));
        
        if (entity.isConfirmed()) {
            throw new ClearingException("费用明细已确认，无法删除");
        }
        
        expenseEntryRepository.delete(entity);
        log.info("费用明细删除成功: id={}", id);
    }
    
    /**
     * 查询单个费用明细
     */
    public ExpenseEntryResponse getExpenseEntry(Long id) {
        ExpenseEntry entity = expenseEntryRepository.findById(id)
            .orElseThrow(() -> new ClearingException("费用明细不存在: " + id));
        
        return ExpenseEntryResponse.fromEntity(entity);
    }
    
    /**
     * 根据订单ID查询费用明细列表
     */
    public List<ExpenseEntryResponse> getExpenseEntriesByOrderId(String orderId) {
        List<ExpenseEntry> entities = expenseEntryRepository.findByOrderId(orderId);
        return entities.stream()
            .map(ExpenseEntryResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * 分页查询费用明细
     */
    public Page<ExpenseEntryResponse> getExpenseEntries(
            String orderId, String serviceCode, String feeCode,
            ExpenseEntry.EntryType entryType, ExpenseEntry.EntryStatus entryStatus,
            ExpenseEntry.ValidationStatus validationStatus,
            String createdBy, String ourEntityId, String ourDepartmentId,
            Pageable pageable) {
        
        Page<ExpenseEntry> entities = expenseEntryRepository.findByMultipleConditions(
            orderId, serviceCode, feeCode, entryType, entryStatus, validationStatus,
            createdBy, ourEntityId, ourDepartmentId, pageable);
        
        return entities.map(ExpenseEntryResponse::fromEntity);
    }
    
    /**
     * 确认费用明细
     */
    @Transactional
    public ExpenseEntryResponse confirmExpenseEntry(Long id, String confirmedBy) {
        log.info("开始确认费用明细: id={}, confirmedBy={}", id, confirmedBy);
        
        ExpenseEntry entity = expenseEntryRepository.findById(id)
            .orElseThrow(() -> new ClearingException("费用明细不存在: " + id));
        
        if (entity.isLocked()) {
            throw new ClearingException("费用明细已锁定，无法确认");
        }
        
        if (!entity.isValidationPassed()) {
            throw new ClearingException("费用明细校验未通过，无法确认");
        }
        
        entity.setEntryStatus(ExpenseEntry.EntryStatus.CONFIRMED);
        entity.setUpdatedBy(confirmedBy);
        entity.setUpdatedTime(LocalDateTime.now());
        
        ExpenseEntry savedEntity = expenseEntryRepository.save(entity);
        log.info("费用明细确认成功: id={}", savedEntity.getId());
        
        return ExpenseEntryResponse.fromEntity(savedEntity);
    }
    
    /**
     * 锁定费用明细
     */
    @Transactional
    public ExpenseEntryResponse lockExpenseEntry(Long id, String lockedBy) {
        log.info("开始锁定费用明细: id={}, lockedBy={}", id, lockedBy);
        
        ExpenseEntry entity = expenseEntryRepository.findById(id)
            .orElseThrow(() -> new ClearingException("费用明细不存在: " + id));
        
        if (!entity.isConfirmed()) {
            throw new ClearingException("费用明细未确认，无法锁定");
        }
        
        entity.setEntryStatus(ExpenseEntry.EntryStatus.LOCKED);
        entity.setUpdatedBy(lockedBy);
        entity.setUpdatedTime(LocalDateTime.now());
        
        ExpenseEntry savedEntity = expenseEntryRepository.save(entity);
        log.info("费用明细锁定成功: id={}", savedEntity.getId());
        
        return ExpenseEntryResponse.fromEntity(savedEntity);
    }
    
    /**
     * 批量确认费用明细
     */
    @Transactional
    public List<ExpenseEntryResponse> batchConfirmExpenseEntries(List<Long> ids, String confirmedBy) {
        log.info("开始批量确认费用明细: ids={}, confirmedBy={}", ids, confirmedBy);
        
        List<ExpenseEntry> entities = expenseEntryRepository.findAllById(ids);
        
        for (ExpenseEntry entity : entities) {
            if (!entity.isLocked() && entity.isValidationPassed()) {
                entity.setEntryStatus(ExpenseEntry.EntryStatus.CONFIRMED);
                entity.setUpdatedBy(confirmedBy);
                entity.setUpdatedTime(LocalDateTime.now());
            }
        }
        
        List<ExpenseEntry> savedEntities = expenseEntryRepository.saveAll(entities);
        log.info("批量确认费用明细完成: 处理数量={}", savedEntities.size());
        
        return savedEntities.stream()
            .map(ExpenseEntryResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取订单的费用统计
     */
    public ExpenseEntrySummary getExpenseEntrySummary(String orderId) {
        List<ExpenseEntry> entries = expenseEntryRepository.findByOrderId(orderId);
        
        BigDecimal totalReceivable = entries.stream()
            .filter(e -> e.getEntryType() == ExpenseEntry.EntryType.RECEIVABLE)
            .map(ExpenseEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalPayable = entries.stream()
            .filter(e -> e.getEntryType() == ExpenseEntry.EntryType.PAYABLE)
            .map(ExpenseEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long receivableCount = entries.stream()
            .filter(e -> e.getEntryType() == ExpenseEntry.EntryType.RECEIVABLE)
            .count();
        
        long payableCount = entries.stream()
            .filter(e -> e.getEntryType() == ExpenseEntry.EntryType.PAYABLE)
            .count();
        
        return ExpenseEntrySummary.builder()
            .orderId(orderId)
            .totalReceivable(totalReceivable)
            .totalPayable(totalPayable)
            .netAmount(totalReceivable.subtract(totalPayable))
            .receivableCount(receivableCount)
            .payableCount(payableCount)
            .totalCount(entries.size())
            .build();
    }
    
    /**
     * 校验费用明细的唯一性
     */
    private void validateUniqueEntry(ExpenseEntryRequest request) {
        boolean exists = expenseEntryRepository.existsByOrderIdAndServiceCodeAndFeeCodeAndEntryType(
            request.getOrderId(), request.getServiceCode(), request.getFeeCode(), request.getEntryType());
        
        if (exists) {
            throw new ClearingException(String.format(
                "订单[%s]的服务项目[%s]已存在费用科目[%s]的%s明细",
                request.getOrderId(), request.getServiceCode(), request.getFeeCode(), 
                request.getEntryType().getDescription()));
        }
    }
    
    /**
     * 构建费用明细实体
     */
    private ExpenseEntry buildExpenseEntry(ExpenseEntryRequest request, 
                                         FeeValidationService.ValidationResult validationResult) {
        return ExpenseEntry.builder()
            .orderId(request.getOrderId())
            .serviceCode(request.getServiceCode())
            .feeCode(request.getFeeCode())
            .entryType(request.getEntryType())
            .counterpartEntity(request.getCounterpartEntity())
            .counterpartDepartment(request.getCounterpartDepartment())
            .counterpartSupplierType(request.getCounterpartSupplierType())
            .ourEntityId(request.getOurEntityId())
            .ourDepartmentId(request.getOurDepartmentId())
            .amount(request.getAmount())
            .currency(request.getCurrency())
            .isTransitEntity(request.getIsTransitEntity())
            .transitReason(request.getTransitReason())
            .validationStatus(validationResult.getStatus())
            .validationMessage(validationResult.getMessage())
            .entryStatus(ExpenseEntry.EntryStatus.DRAFT)
            .versionNumber(1)
            .remarks(request.getRemarks())
            // createdBy和createdTime将由BaseEntity的@PrePersist处理
            .build();
    }
    
    /**
     * 更新实体字段
     */
    private void updateEntityFields(ExpenseEntry entity, ExpenseEntryRequest request,
                                  FeeValidationService.ValidationResult validationResult) {
        entity.setServiceCode(request.getServiceCode());
        entity.setFeeCode(request.getFeeCode());
        entity.setEntryType(request.getEntryType());
        entity.setCounterpartEntity(request.getCounterpartEntity());
        entity.setCounterpartDepartment(request.getCounterpartDepartment());
        entity.setCounterpartSupplierType(request.getCounterpartSupplierType());
        entity.setOurEntityId(request.getOurEntityId());
        entity.setOurDepartmentId(request.getOurDepartmentId());
        entity.setAmount(request.getAmount());
        entity.setCurrency(request.getCurrency());
        entity.setIsTransitEntity(request.getIsTransitEntity());
        entity.setTransitReason(request.getTransitReason());
        entity.setValidationStatus(validationResult.getStatus());
        entity.setValidationMessage(validationResult.getMessage());
        entity.setRemarks(request.getRemarks());
        // updatedBy和updatedTime将由BaseEntity的@PreUpdate处理
        entity.setVersionNumber(entity.getVersionNumber() + 1);
    }
    
    /**
     * 费用明细汇总信息
     */
    @lombok.Data
    @lombok.Builder
    public static class ExpenseEntrySummary {
        private String orderId;
        private BigDecimal totalReceivable;
        private BigDecimal totalPayable;
        private BigDecimal netAmount;
        private long receivableCount;
        private long payableCount;
        private long totalCount;
    }
}