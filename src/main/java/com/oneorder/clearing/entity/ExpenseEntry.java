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
     * 默认法人ID（用户角色对应的默认法人，用于记录差异）
     */
    @Column(name = "default_entity_id", length = 50)
    private String defaultEntityId;
    
    /**
     * 借抬头类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transit_type", length = 20)
    private TransitType transitType;
    
    /**
     * 是否需要审批
     */
    @Column(name = "approval_required")
    private Boolean approvalRequired = false;
    
    /**
     * 审批状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 10)
    private ApprovalStatus approvalStatus;
    
    /**
     * 审批人
     */
    @Column(name = "approved_by", length = 50)
    private String approvedBy;
    
    /**
     * 审批时间
     */
    @Column(name = "approved_time")
    private LocalDateTime approvedTime;
    
    /**
     * 审批意见
     */
    @Column(name = "approval_comment", columnDefinition = "TEXT")
    private String approvalComment;
    
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
     * 借抬头类型枚举
     */
    public enum TransitType {
        RECEIVABLE_TRANSIT("收款借抬头"),
        PAYABLE_TRANSIT("付款借抬头");
        
        private final String description;
        
        TransitType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 审批状态枚举
     */
    public enum ApprovalStatus {
        PENDING("待审批"),
        APPROVED("已通过"),
        REJECTED("已拒绝");
        
        private final String description;
        
        ApprovalStatus(String description) {
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
     * 是否使用了借抬头（实际法人与默认法人不同）
     */
    public boolean hasEntityDifference() {
        return defaultEntityId != null && ourEntityId != null && 
               !defaultEntityId.equals(ourEntityId);
    }
    
    /**
     * 是否为收款借抬头
     */
    public boolean isReceivableTransit() {
        return Boolean.TRUE.equals(isTransitEntity) && 
               TransitType.RECEIVABLE_TRANSIT.equals(transitType);
    }
    
    /**
     * 是否为付款借抬头
     */
    public boolean isPayableTransit() {
        return Boolean.TRUE.equals(isTransitEntity) && 
               TransitType.PAYABLE_TRANSIT.equals(transitType);
    }
    
    /**
     * 是否需要审批
     */
    public boolean requiresApproval() {
        return Boolean.TRUE.equals(approvalRequired);
    }
    
    /**
     * 是否已审批通过
     */
    public boolean isApproved() {
        return ApprovalStatus.APPROVED.equals(approvalStatus);
    }
    
    /**
     * 是否审批被拒绝
     */
    public boolean isRejected() {
        return ApprovalStatus.REJECTED.equals(approvalStatus);
    }
    
    /**
     * 是否审批中
     */
    public boolean isPendingApproval() {
        return ApprovalStatus.PENDING.equals(approvalStatus);
    }
    
    /**
     * 获取借抬头类型描述
     */
    public String getTransitTypeDescription() {
        return transitType != null ? transitType.getDescription() : "";
    }
    
    /**
     * 获取审批状态描述
     */
    public String getApprovalStatusDescription() {
        return approvalStatus != null ? approvalStatus.getDescription() : "";
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