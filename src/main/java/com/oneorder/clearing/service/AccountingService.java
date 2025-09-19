package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.ClearingResult;
import com.oneorder.clearing.entity.AccountingEntry;
import com.oneorder.clearing.dto.VoucherRequest;
import com.oneorder.clearing.dto.VoucherResponse;

import java.util.List;

/**
 * 财务核算服务接口
 */
public interface AccountingService {
    
    /**
     * 生成会计分录
     * @param clearingResults 清分结果列表
     * @return 会计分录列表
     */
    List<AccountingEntry> generateAccountingEntries(List<ClearingResult> clearingResults);
    
    /**
     * 创建凭证
     * @param request 凭证请求
     * @return 凭证响应
     */
    VoucherResponse createVoucher(VoucherRequest request);
    
    /**
     * 过账
     * @param voucherId 凭证ID
     * @return 过账是否成功
     */
    boolean postVoucher(String voucherId);
    
    /**
     * 批量过账
     * @param voucherIds 凭证ID列表
     * @return 过账结果
     */
    List<String> batchPostVouchers(List<String> voucherIds);
    
    /**
     * 生成管理报表分录
     * @param clearingResults 清分结果
     * @return 管理报表分录
     */
    List<AccountingEntry> generateManagementEntries(List<ClearingResult> clearingResults);
    
    /**
     * 生成法定报表分录
     * @param clearingResults 清分结果
     * @return 法定报表分录
     */
    List<AccountingEntry> generateLegalEntries(List<ClearingResult> clearingResults);
    
    /**
     * 验证借贷平衡
     * @param entries 会计分录列表
     * @return 是否平衡
     */
    boolean validateBalance(List<AccountingEntry> entries);
    
    /**
     * 获取科目余额
     * @param entityId 法人体ID
     * @param accountCode 科目代码
     * @param currency 币种
     * @return 余额
     */
    java.math.BigDecimal getAccountBalance(String entityId, String accountCode, String currency);
}