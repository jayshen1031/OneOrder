package com.oneorder.clearing.dto;

import com.oneorder.clearing.entity.ExpenseEntry;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 费用明细响应DTO
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseEntryResponse {
    
    /**
     * 明细ID
     */
    private Long id;
    
    /**
     * 订单ID
     */
    private String orderId;
    
    /**
     * 服务项目编码
     */
    private String serviceCode;
    
    /**
     * 服务项目名称
     */
    private String serviceName;
    
    /**
     * 费用科目编码
     */
    private String feeCode;
    
    /**
     * 费用科目名称
     */
    private String feeName;
    
    /**
     * 费用类别
     */
    private String feeCategory;
    
    /**
     * 收付类型
     */
    private ExpenseEntry.EntryType entryType;
    
    /**
     * 收付类型描述
     */
    private String entryTypeDescription;
    
    /**
     * 对方法人公司
     */
    private String counterpartEntity;
    
    /**
     * 对方部门
     */
    private String counterpartDepartment;
    
    /**
     * 对方供应商类型
     */
    private String counterpartSupplierType;
    
    /**
     * 我方法人ID
     */
    private String ourEntityId;
    
    /**
     * 我方法人名称
     */
    private String ourEntityName;
    
    /**
     * 我方部门ID
     */
    private String ourDepartmentId;
    
    /**
     * 我方部门名称
     */
    private String ourDepartmentName;
    
    /**
     * 金额
     */
    private BigDecimal amount;
    
    /**
     * 币种
     */
    private String currency;
    
    /**
     * 格式化金额（含币种符号）
     */
    private String formattedAmount;
    
    /**
     * 是否借抬头
     */
    private Boolean isTransitEntity;
    
    /**
     * 借抬头原因
     */
    private String transitReason;
    
    /**
     * 校验状态
     */
    private ExpenseEntry.ValidationStatus validationStatus;
    
    /**
     * 校验状态描述
     */
    private String validationStatusDescription;
    
    /**
     * 校验提示信息
     */
    private String validationMessage;
    
    /**
     * 明细状态
     */
    private ExpenseEntry.EntryStatus entryStatus;
    
    /**
     * 明细状态描述
     */
    private String entryStatusDescription;
    
    /**
     * 版本号
     */
    private Integer versionNumber;
    
    /**
     * 备注信息
     */
    private String remarks;
    
    /**
     * 录入人
     */
    private String createdBy;
    
    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdTime;
    
    /**
     * 更新人
     */
    private String updatedBy;
    
    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedTime;
    
    /**
     * 是否可编辑
     */
    private Boolean editable;
    
    /**
     * 是否可删除
     */
    private Boolean deletable;
    
    /**
     * 从实体对象转换为响应DTO
     */
    public static ExpenseEntryResponse fromEntity(ExpenseEntry entity) {
        return ExpenseEntryResponse.builder()
            .id(entity.getId())
            .orderId(entity.getOrderId())
            .serviceCode(entity.getServiceCode())
            .feeCode(entity.getFeeCode())
            .entryType(entity.getEntryType())
            .entryTypeDescription(entity.getEntryTypeDescription())
            .counterpartEntity(entity.getCounterpartEntity())
            .counterpartDepartment(entity.getCounterpartDepartment())
            .counterpartSupplierType(entity.getCounterpartSupplierType())
            .ourEntityId(entity.getOurEntityId())
            .ourDepartmentId(entity.getOurDepartmentId())
            .amount(entity.getAmount())
            .currency(entity.getCurrency())
            .formattedAmount(formatAmount(entity.getAmount(), entity.getCurrency()))
            .isTransitEntity(entity.getIsTransitEntity())
            .transitReason(entity.getTransitReason())
            .validationStatus(entity.getValidationStatus())
            .validationStatusDescription(entity.getValidationStatusDescription())
            .validationMessage(entity.getValidationMessage())
            .entryStatus(entity.getEntryStatus())
            .entryStatusDescription(entity.getEntryStatusDescription())
            .versionNumber(entity.getVersionNumber())
            .remarks(entity.getRemarks())
            .createdBy(entity.getCreatedBy())
            .createdTime(entity.getCreatedTime())
            .updatedBy(entity.getUpdatedBy())
            .updatedTime(entity.getUpdatedTime())
            .editable(!entity.isLocked())
            .deletable(!entity.isConfirmed())
            .build();
    }
    
    /**
     * 格式化金额显示
     */
    private static String formatAmount(BigDecimal amount, String currency) {
        if (amount == null) {
            return "";
        }
        
        String symbol;
        switch (currency) {
            case "CNY":
                symbol = "¥";
                break;
            case "USD":
                symbol = "$";
                break;
            case "EUR":
                symbol = "€";
                break;
            case "GBP":
                symbol = "£";
                break;
            case "JPY":
                symbol = "¥";
                break;
            case "HKD":
                symbol = "HK$";
                break;
            default:
                symbol = currency + " ";
                break;
        }
        
        return symbol + String.format("%,.2f", amount);
    }
}