package com.oneorder.clearing.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 费用明细实体
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@Entity
@Table(name = "expense_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseEntry extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 订单ID
     */
    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;
    
    /**
     * 服务项目编码
     */
    @Column(name = "service_code", nullable = false, length = 50)
    private String serviceCode;
    
    /**
     * 费用科目编码
     */
    @Column(name = "fee_code", nullable = false, length = 50)
    private String feeCode;
    
    /**
     * 收付类型：RECEIVABLE（收款）/PAYABLE（付款）
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 10)
    private EntryType entryType;
    
    /**
     * 对方法人公司
     */
    @Column(name = "counterpart_entity", nullable = false, length = 200)
    private String counterpartEntity;
    
    /**
     * 对方部门
     */
    @Column(name = "counterpart_department", length = 100)
    private String counterpartDepartment;
    
    /**
     * 对方供应商类型（付款时）
     */
    @Column(name = "counterpart_supplier_type", length = 50)
    private String counterpartSupplierType;
    
    /**
     * 我方法人ID
     */
    @Column(name = "our_entity_id", nullable = false, length = 50)
    private String ourEntityId;
    
    /**
     * 我方部门ID
     */
    @Column(name = "our_department_id", nullable = false, length = 50)
    private String ourDepartmentId;
    
    /**
     * 金额
     */
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    /**
     * 币种
     */
    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "CNY";
    
    /**
     * 是否借抬头
     */
    @Column(name = "is_transit_entity")
    private Boolean isTransitEntity = false;
    
    /**
     * 借抬头原因
     */
    @Column(name = "transit_reason", length = 500)
    private String transitReason;
    
    /**
     * 校验状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "validation_status", length = 20)
    private ValidationStatus validationStatus = ValidationStatus.VALID;
    
    /**
     * 校验提示信息
     */
    @Column(name = "validation_message", length = 500)
    private String validationMessage;
    
    /**
     * 明细状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entry_status", length = 20)
    private EntryStatus entryStatus = EntryStatus.DRAFT;
    
    /**
     * 版本号
     */
    @Column(name = "version_number")
    private Integer versionNumber = 1;
    
    /**
     * 备注信息
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
    
    /**
     * 收付类型枚举
     */
    public enum EntryType {
        RECEIVABLE("收款"),
        PAYABLE("付款");
        
        private final String description;
        
        EntryType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 校验状态枚举
     */
    public enum ValidationStatus {
        VALID("通过"),
        WARNING("警告"),
        ERROR("错误");
        
        private final String description;
        
        ValidationStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 明细状态枚举
     */
    public enum EntryStatus {
        DRAFT("草稿"),
        CONFIRMED("已确认"),
        LOCKED("已锁定");
        
        private final String description;
        
        EntryStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 获取收付类型描述
     */
    public String getEntryTypeDescription() {
        return entryType != null ? entryType.getDescription() : "";
    }
    
    /**
     * 获取校验状态描述
     */
    public String getValidationStatusDescription() {
        return validationStatus != null ? validationStatus.getDescription() : "";
    }
    
    /**
     * 获取明细状态描述
     */
    public String getEntryStatusDescription() {
        return entryStatus != null ? entryStatus.getDescription() : "";
    }
    
    /**
     * 是否为收款明细
     */
    public boolean isReceivable() {
        return EntryType.RECEIVABLE.equals(entryType);
    }
    
    /**
     * 是否为付款明细
     */
    public boolean isPayable() {
        return EntryType.PAYABLE.equals(entryType);
    }
    
    /**
     * 是否校验通过
     */
    public boolean isValidationPassed() {
        return ValidationStatus.VALID.equals(validationStatus);
    }
    
    /**
     * 是否已确认
     */
    public boolean isConfirmed() {
        return EntryStatus.CONFIRMED.equals(entryStatus) || EntryStatus.LOCKED.equals(entryStatus);
    }
    
    /**
     * 是否已锁定
     */
    public boolean isLocked() {
        return EntryStatus.LOCKED.equals(entryStatus);
    }
}