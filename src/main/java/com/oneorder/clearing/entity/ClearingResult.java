package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * 清分结果实体
 */
@Entity
@Table(name = "clearing_results")
@Data
@EqualsAndHashCode(callSuper = true)
public class ClearingResult extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    /**
     * 清分结果ID
     */
    @Column(name = "result_id", nullable = false, unique = true, length = 50)
    private String resultId;
    
    /**
     * 所属订单
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", referencedColumnName = "order_id", nullable = false)
    private Order order;
    
    /**
     * 涉及的法人体ID
     */
    @Column(name = "entity_id", nullable = false, length = 50)
    private String entityId;
    
    /**
     * 金额
     */
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    /**
     * 币种
     */
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;
    
    /**
     * 交易类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;
    
    /**
     * 账务类型：外收、外支、内收、内支
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType;
    
    /**
     * 清分模式
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "clearing_mode", nullable = false)
    private Order.ClearingMode clearingMode;
    
    /**
     * 是否为中转留存
     */
    @Column(name = "is_transit_retention", nullable = false)
    private Boolean isTransitRetention = false;
    
    /**
     * 留存金额
     */
    @Column(name = "retention_amount", precision = 15, scale = 2)
    private BigDecimal retentionAmount;
    
    /**
     * 留存比例
     */
    @Column(name = "retention_rate", precision = 8, scale = 4)
    private BigDecimal retentionRate;
    
    /**
     * 原始金额（留存前）
     */
    @Column(name = "original_amount", precision = 15, scale = 2)
    private BigDecimal originalAmount;
    
    /**
     * 借抬头实体ID
     */
    @Column(name = "transit_entity_id", length = 50)
    private String transitEntityId;
    
    /**
     * 过账流程ID
     */
    @Column(name = "cross_border_flow_id", length = 50)
    private String crossBorderFlowId;
    
    /**
     * 清分描述
     */
    @Column(name = "description", length = 1000)
    private String description;
    
    /**
     * 关联的规则ID
     */
    @Column(name = "rule_id", length = 50)
    private String ruleId;
    
    /**
     * 管理报表口径金额
     */
    @Column(name = "management_amount", precision = 15, scale = 2)
    private BigDecimal managementAmount;
    
    /**
     * 法定报表口径金额
     */
    @Column(name = "legal_amount", precision = 15, scale = 2)
    private BigDecimal legalAmount;
    
    /**
     * 备注
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
    
    public enum TransactionType {
        RECEIVABLE("应收"),
        PAYABLE("应付"),
        PROFIT_SHARING("分润"),
        TRANSIT_FEE("中转费"),
        NETTING("净额");
        
        private final String description;
        
        TransactionType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum AccountType {
        EXTERNAL_RECEIVABLE("外收"),
        EXTERNAL_PAYABLE("外支"),
        INTERNAL_RECEIVABLE("内收"),
        INTERNAL_PAYABLE("内支"),
        CROSS_BORDER_RECEIVABLE("跨境应收"),
        CROSS_BORDER_PAYABLE("跨境应付"),
        RETENTION("留存"),
        NETTING("抵消");
        
        private final String description;
        
        AccountType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}