package com.oneorder.clearing.dto;

import com.oneorder.clearing.entity.AccountingEntry;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 凭证创建响应DTO
 */
@Data
public class VoucherResponse {
    
    /**
     * 是否成功
     */
    private Boolean success;
    
    /**
     * 凭证ID
     */
    private String voucherId;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 会计分录列表
     */
    private List<AccountingEntry> entries;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 是否已过账
     */
    private Boolean isPosted = false;
    
    /**
     * 分录数量
     */
    private Integer entryCount;
    
    /**
     * 总借方金额
     */
    private java.math.BigDecimal totalDebitAmount;
    
    /**
     * 总贷方金额
     */
    private java.math.BigDecimal totalCreditAmount;
    
    /**
     * 验证信息
     */
    private List<String> validationMessages;
    
    public VoucherResponse() {
        this.createdAt = LocalDateTime.now();
    }
    
    public static VoucherResponse success(String voucherId, List<AccountingEntry> entries) {
        VoucherResponse response = new VoucherResponse();
        response.setSuccess(true);
        response.setVoucherId(voucherId);
        response.setEntries(entries);
        response.setEntryCount(entries.size());
        response.setMessage("凭证创建成功");
        
        // 计算总金额
        java.math.BigDecimal totalDebit = entries.stream()
            .map(AccountingEntry::getDebitAmount)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal totalCredit = entries.stream()
            .map(AccountingEntry::getCreditAmount)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            
        response.setTotalDebitAmount(totalDebit);
        response.setTotalCreditAmount(totalCredit);
        
        return response;
    }
    
    public static VoucherResponse failed(String message) {
        VoucherResponse response = new VoucherResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}