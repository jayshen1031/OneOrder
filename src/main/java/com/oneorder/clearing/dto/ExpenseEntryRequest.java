package com.oneorder.clearing.dto;

import com.oneorder.clearing.entity.ExpenseEntry;
import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;

/**
 * 费用明细录入请求DTO
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@Data
public class ExpenseEntryRequest {
    
    /**
     * 订单ID
     */
    @NotBlank(message = "订单ID不能为空")
    @Size(max = 50, message = "订单ID长度不能超过50")
    private String orderId;
    
    /**
     * 服务项目编码
     */
    @NotBlank(message = "服务项目编码不能为空")
    @Size(max = 50, message = "服务项目编码长度不能超过50")
    private String serviceCode;
    
    /**
     * 费用科目编码
     */
    @NotBlank(message = "费用科目编码不能为空")
    @Size(max = 50, message = "费用科目编码长度不能超过50")
    private String feeCode;
    
    /**
     * 收付类型：RECEIVABLE（收款）/PAYABLE（付款）
     */
    @NotNull(message = "收付类型不能为空")
    private ExpenseEntry.EntryType entryType;
    
    /**
     * 对方法人公司
     */
    @NotBlank(message = "对方法人公司不能为空")
    @Size(max = 200, message = "对方法人公司长度不能超过200")
    private String counterpartEntity;
    
    /**
     * 对方部门
     */
    @Size(max = 100, message = "对方部门长度不能超过100")
    private String counterpartDepartment;
    
    /**
     * 对方供应商类型（付款时必填）
     */
    @Size(max = 50, message = "对方供应商类型长度不能超过50")
    private String counterpartSupplierType;
    
    /**
     * 我方法人ID
     */
    @NotBlank(message = "我方法人ID不能为空")
    @Size(max = 50, message = "我方法人ID长度不能超过50")
    private String ourEntityId;
    
    /**
     * 我方部门ID
     */
    @NotBlank(message = "我方部门ID不能为空")
    @Size(max = 50, message = "我方部门ID长度不能超过50")
    private String ourDepartmentId;
    
    /**
     * 金额
     */
    @NotNull(message = "金额不能为空")
    @DecimalMin(value = "0.01", message = "金额必须大于0")
    @Digits(integer = 13, fraction = 2, message = "金额格式不正确，最多13位整数和2位小数")
    private BigDecimal amount;
    
    /**
     * 币种
     */
    @NotBlank(message = "币种不能为空")
    @Size(max = 10, message = "币种长度不能超过10")
    @Pattern(regexp = "^(CNY|USD|EUR|GBP|JPY|HKD|SGD|AUD|CAD|CHF)$", 
             message = "币种必须是有效的货币代码")
    private String currency = "CNY";
    
    /**
     * 是否借抬头
     */
    private Boolean isTransitEntity = false;
    
    /**
     * 借抬头原因
     */
    @Size(max = 500, message = "借抬头原因长度不能超过500")
    private String transitReason;
    
    /**
     * 备注信息
     */
    @Size(max = 500, message = "备注信息长度不能超过500")
    private String remarks;
    
    /**
     * 录入人
     */
    @NotBlank(message = "录入人不能为空")
    @Size(max = 50, message = "录入人长度不能超过50")
    private String createdBy;
    
    /**
     * 校验付款明细的供应商类型是否必填
     */
    @AssertTrue(message = "付款明细必须填写对方供应商类型")
    public boolean isSupplierTypeValidForPayable() {
        if (entryType == ExpenseEntry.EntryType.PAYABLE) {
            return counterpartSupplierType != null && !counterpartSupplierType.trim().isEmpty();
        }
        return true;
    }
    
    /**
     * 校验借抬头原因
     */
    @AssertTrue(message = "借抬头时必须填写借抬头原因")
    public boolean isTransitReasonValidWhenTransitEntity() {
        if (Boolean.TRUE.equals(isTransitEntity)) {
            return transitReason != null && !transitReason.trim().isEmpty();
        }
        return true;
    }
}