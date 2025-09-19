package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * 会计分录实体
 */
@Entity
@Table(name = "accounting_entries")
@Data
@EqualsAndHashCode(callSuper = true)
public class AccountingEntry extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    /**
     * 分录ID
     */
    @Column(name = "entry_id", nullable = false, unique = true, length = 50)
    private String entryId;
    
    /**
     * 凭证ID
     */
    @Column(name = "voucher_id", nullable = false, length = 50)
    private String voucherId;
    
    /**
     * 关联的清分结果ID
     */
    @Column(name = "clearing_result_id", nullable = false, length = 50)
    private String clearingResultId;
    
    /**
     * 订单ID
     */
    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;
    
    /**
     * 法人体ID
     */
    @Column(name = "entity_id", nullable = false, length = 50)
    private String entityId;
    
    /**
     * 会计科目代码
     */
    @Column(name = "account_code", nullable = false, length = 20)
    private String accountCode;
    
    /**
     * 会计科目名称
     */
    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;
    
    /**
     * 借方金额
     */
    @Column(name = "debit_amount", precision = 15, scale = 2)
    private BigDecimal debitAmount = BigDecimal.ZERO;
    
    /**
     * 贷方金额
     */
    @Column(name = "credit_amount", precision = 15, scale = 2)
    private BigDecimal creditAmount = BigDecimal.ZERO;
    
    /**
     * 币种
     */
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;
    
    /**
     * 分录类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private EntryType entryType;
    
    /**
     * 业务类型
     */
    @Column(name = "business_type", length = 50)
    private String businessType;
    
    /**
     * 摘要
     */
    @Column(name = "summary", length = 200)
    private String summary;
    
    /**
     * 是否已过账
     */
    @Column(name = "is_posted", nullable = false)
    private Boolean isPosted = false;
    
    /**
     * 报表类型：管理报表 | 法定报表
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private ReportType reportType;
    
    /**
     * 备注
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
    
    public enum EntryType {
        RECEIVABLE("应收"),
        PAYABLE("应付"),
        REVENUE("收入"),
        COST("成本"),
        EXPENSE("费用"),
        PROFIT("利润"),
        TRANSIT("中转");
        
        private final String description;
        
        EntryType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum ReportType {
        MANAGEMENT("管理报表"),
        LEGAL("法定报表");
        
        private final String description;
        
        ReportType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}