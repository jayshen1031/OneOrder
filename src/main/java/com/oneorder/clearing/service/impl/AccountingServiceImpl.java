package com.oneorder.clearing.service.impl;

import com.oneorder.clearing.entity.ClearingResult;
import com.oneorder.clearing.entity.AccountingEntry;
import com.oneorder.clearing.dto.VoucherRequest;
import com.oneorder.clearing.dto.VoucherResponse;
import com.oneorder.clearing.service.AccountingService;
import com.oneorder.clearing.repository.AccountingEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 财务核算服务实现
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccountingServiceImpl implements AccountingService {
    
    private final AccountingEntryRepository entryRepository;
    
    // 科目映射配置
    private static final Map<String, String> ACCOUNT_MAPPING = new HashMap<>();
    static {
        // 应收应付科目
        ACCOUNT_MAPPING.put("EXTERNAL_RECEIVABLE", "1122"); // 应收账款
        ACCOUNT_MAPPING.put("EXTERNAL_PAYABLE", "2202");    // 应付账款
        ACCOUNT_MAPPING.put("INTERNAL_RECEIVABLE", "1221"); // 其他应收款
        ACCOUNT_MAPPING.put("INTERNAL_PAYABLE", "2241");    // 其他应付款
        
        // 收入成本科目
        ACCOUNT_MAPPING.put("REVENUE", "6001");  // 主营业务收入
        ACCOUNT_MAPPING.put("COST", "5001");     // 主营业务成本
        ACCOUNT_MAPPING.put("EXPENSE", "5101");  // 营业费用
        ACCOUNT_MAPPING.put("PROFIT", "4103");   // 营业利润
        
        // 中转科目
        ACCOUNT_MAPPING.put("TRANSIT_FEE", "1231"); // 中转费
        ACCOUNT_MAPPING.put("NETTING", "1241");     // 净额结算
    }
    
    private static final Map<String, String> ACCOUNT_NAMES = new HashMap<>();
    static {
        ACCOUNT_NAMES.put("1122", "应收账款");
        ACCOUNT_NAMES.put("2202", "应付账款");
        ACCOUNT_NAMES.put("1221", "其他应收款");
        ACCOUNT_NAMES.put("2241", "其他应付款");
        ACCOUNT_NAMES.put("6001", "主营业务收入");
        ACCOUNT_NAMES.put("5001", "主营业务成本");
        ACCOUNT_NAMES.put("5101", "营业费用");
        ACCOUNT_NAMES.put("4103", "营业利润");
        ACCOUNT_NAMES.put("1231", "中转费");
        ACCOUNT_NAMES.put("1241", "净额结算");
    }
    
    @Override
    @Transactional
    public List<AccountingEntry> generateAccountingEntries(List<ClearingResult> clearingResults) {
        log.debug("开始生成会计分录，清分结果数量: {}", clearingResults.size());
        
        List<AccountingEntry> allEntries = new ArrayList<>();
        
        // 生成管理报表分录
        List<AccountingEntry> managementEntries = generateManagementEntries(clearingResults);
        allEntries.addAll(managementEntries);
        
        // 生成法定报表分录
        List<AccountingEntry> legalEntries = generateLegalEntries(clearingResults);
        allEntries.addAll(legalEntries);
        
        // 验证借贷平衡
        if (!validateBalance(allEntries)) {
            throw new RuntimeException("生成的会计分录借贷不平衡");
        }
        
        log.debug("会计分录生成完成，总计{}条", allEntries.size());
        return allEntries;
    }
    
    @Override
    public List<AccountingEntry> generateManagementEntries(List<ClearingResult> clearingResults) {
        log.debug("生成管理报表分录");
        
        List<AccountingEntry> entries = new ArrayList<>();
        
        for (ClearingResult result : clearingResults) {
            AccountingEntry entry = createAccountingEntry(result, AccountingEntry.ReportType.MANAGEMENT);
            
            // 使用管理口径金额
            BigDecimal amount = result.getManagementAmount() != null ? 
                result.getManagementAmount() : result.getAmount();
            
            setEntryAmounts(entry, result, amount);
            entries.add(entry);
        }
        
        return entries;
    }
    
    @Override
    public List<AccountingEntry> generateLegalEntries(List<ClearingResult> clearingResults) {
        log.debug("生成法定报表分录");
        
        List<AccountingEntry> entries = new ArrayList<>();
        
        for (ClearingResult result : clearingResults) {
            AccountingEntry entry = createAccountingEntry(result, AccountingEntry.ReportType.LEGAL);
            
            // 使用法定口径金额
            BigDecimal amount = result.getLegalAmount() != null ? 
                result.getLegalAmount() : result.getAmount();
            
            setEntryAmounts(entry, result, amount);
            entries.add(entry);
        }
        
        return entries;
    }
    
    @Override
    @Transactional
    public VoucherResponse createVoucher(VoucherRequest request) {
        log.debug("创建凭证，订单ID: {}", request.getOrderId());
        
        try {
            String voucherId = UUID.randomUUID().toString();
            
            // 生成会计分录
            List<AccountingEntry> entries = generateAccountingEntries(request.getClearingResults());
            
            // 设置凭证ID
            entries.forEach(entry -> {
                entry.setVoucherId(voucherId);
                entry.setCreatedBy(request.getOperator());
            });
            
            // 保存分录
            entryRepository.saveAll(entries);
            
            VoucherResponse response = new VoucherResponse();
            response.setSuccess(true);
            response.setVoucherId(voucherId);
            response.setEntries(entries);
            response.setMessage("凭证创建成功");
            
            return response;
            
        } catch (Exception e) {
            log.error("创建凭证失败，订单ID: {}", request.getOrderId(), e);
            
            VoucherResponse response = new VoucherResponse();
            response.setSuccess(false);
            response.setMessage("凭证创建失败: " + e.getMessage());
            return response;
        }
    }
    
    @Override
    @Transactional
    public boolean postVoucher(String voucherId) {
        log.debug("过账凭证: {}", voucherId);
        
        try {
            List<AccountingEntry> entries = entryRepository.findByVoucherId(voucherId);
            
            if (entries.isEmpty()) {
                log.warn("未找到凭证: {}", voucherId);
                return false;
            }
            
            // 验证借贷平衡
            if (!validateBalance(entries)) {
                log.error("凭证{}借贷不平衡，无法过账", voucherId);
                return false;
            }
            
            // 标记为已过账
            entries.forEach(entry -> {
                entry.setIsPosted(true);
                entry.setUpdatedBy("SYSTEM");
            });
            
            entryRepository.saveAll(entries);
            
            log.info("凭证{}过账成功，共{}条分录", voucherId, entries.size());
            return true;
            
        } catch (Exception e) {
            log.error("过账失败，凭证ID: {}", voucherId, e);
            return false;
        }
    }
    
    @Override
    public List<String> batchPostVouchers(List<String> voucherIds) {
        List<String> successList = new ArrayList<>();
        
        for (String voucherId : voucherIds) {
            if (postVoucher(voucherId)) {
                successList.add(voucherId);
            }
        }
        
        log.info("批量过账完成，成功: {}/{}", successList.size(), voucherIds.size());
        return successList;
    }
    
    @Override
    public boolean validateBalance(List<AccountingEntry> entries) {
        Map<String, BigDecimal> balanceMap = new HashMap<>();
        
        for (AccountingEntry entry : entries) {
            String key = entry.getCurrency();
            BigDecimal balance = balanceMap.getOrDefault(key, BigDecimal.ZERO);
            
            // 借方为正，贷方为负
            balance = balance.add(entry.getDebitAmount()).subtract(entry.getCreditAmount());
            balanceMap.put(key, balance);
        }
        
        // 检查每个币种是否平衡
        for (Map.Entry<String, BigDecimal> entry : balanceMap.entrySet()) {
            if (entry.getValue().compareTo(BigDecimal.ZERO) != 0) {
                log.error("币种{}借贷不平衡，差额: {}", entry.getKey(), entry.getValue());
                return false;
            }
        }
        
        return true;
    }
    
    @Override
    public BigDecimal getAccountBalance(String entityId, String accountCode, String currency) {
        return entryRepository.getAccountBalance(entityId, accountCode, currency);
    }
    
    /**
     * 创建会计分录基础信息
     */
    private AccountingEntry createAccountingEntry(ClearingResult result, AccountingEntry.ReportType reportType) {
        AccountingEntry entry = new AccountingEntry();
        entry.setEntryId(UUID.randomUUID().toString());
        entry.setClearingResultId(result.getResultId());
        entry.setOrderId(result.getOrder().getOrderId());
        entry.setEntityId(result.getEntityId());
        entry.setCurrency(result.getCurrency());
        entry.setReportType(reportType);
        entry.setBusinessType(result.getOrder().getBusinessType());
        entry.setIsPosted(false);
        
        // 根据清分结果类型确定科目和分录类型
        String accountKey = determineAccountKey(result);
        entry.setAccountCode(ACCOUNT_MAPPING.get(accountKey));
        entry.setAccountName(ACCOUNT_NAMES.get(entry.getAccountCode()));
        entry.setEntryType(determineEntryType(result));
        entry.setSummary(generateSummary(result));
        
        return entry;
    }
    
    /**
     * 设置分录金额（借贷方向）
     */
    private void setEntryAmounts(AccountingEntry entry, ClearingResult result, BigDecimal amount) {
        // 根据交易类型和账务类型确定借贷方向
        boolean isDebit = determineDebitDirection(result);
        
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            // 负数金额需要反向
            amount = amount.abs();
            isDebit = !isDebit;
        }
        
        if (isDebit) {
            entry.setDebitAmount(amount);
            entry.setCreditAmount(BigDecimal.ZERO);
        } else {
            entry.setDebitAmount(BigDecimal.ZERO);
            entry.setCreditAmount(amount);
        }
    }
    
    /**
     * 确定科目映射键
     */
    private String determineAccountKey(ClearingResult result) {
        if (result.getIsTransitRetention()) {
            return "TRANSIT_FEE";
        }
        
        switch (result.getTransactionType()) {
            case RECEIVABLE:
                return result.getAccountType().name();
            case PAYABLE:
                return result.getAccountType().name();
            case TRANSIT_FEE:
                return "TRANSIT_FEE";
            case NETTING:
                return "NETTING";
            case PROFIT_SHARING:
                return "PROFIT";
            default:
                return "EXTERNAL_RECEIVABLE";
        }
    }
    
    /**
     * 确定分录类型
     */
    private AccountingEntry.EntryType determineEntryType(ClearingResult result) {
        switch (result.getTransactionType()) {
            case RECEIVABLE:
                return AccountingEntry.EntryType.RECEIVABLE;
            case PAYABLE:
                return AccountingEntry.EntryType.PAYABLE;
            case PROFIT_SHARING:
                return AccountingEntry.EntryType.PROFIT;
            case TRANSIT_FEE:
                return AccountingEntry.EntryType.TRANSIT;
            default:
                return AccountingEntry.EntryType.RECEIVABLE;
        }
    }
    
    /**
     * 确定借贷方向
     */
    private boolean determineDebitDirection(ClearingResult result) {
        // 应收账款、其他应收款、费用、成本 -> 借方
        // 应付账款、其他应付款、收入、负债 -> 贷方
        
        switch (result.getAccountType()) {
            case EXTERNAL_RECEIVABLE:
            case INTERNAL_RECEIVABLE:
                return true; // 借方
            case EXTERNAL_PAYABLE:
            case INTERNAL_PAYABLE:
                return false; // 贷方
            default:
                return result.getAmount().compareTo(BigDecimal.ZERO) > 0;
        }
    }
    
    /**
     * 生成摘要
     */
    private String generateSummary(ClearingResult result) {
        StringBuilder summary = new StringBuilder();
        summary.append(result.getTransactionType().getDescription());
        
        if (result.getIsTransitRetention()) {
            summary.append("-中转留存");
        }
        
        if (result.getOrder().getOrderNo() != null) {
            summary.append("-").append(result.getOrder().getOrderNo());
        }
        
        return summary.toString();
    }
}