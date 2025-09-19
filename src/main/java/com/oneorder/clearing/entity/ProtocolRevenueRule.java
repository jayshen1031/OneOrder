package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 协议分润规则实体 - 定义内部协议的分润比例和方式
 */
@Entity
@Table(name = "protocol_revenue_rule")
@Data
@EqualsAndHashCode(callSuper = true)
public class ProtocolRevenueRule extends BaseEntity {
    
    @Id
    @Column(name = "rule_id", length = 20)
    private String ruleId;
    
    /**
     * 协议ID
     */
    @Column(name = "protocol_id", nullable = false, length = 20)
    private String protocolId;
    
    /**
     * 法人实体ID
     */
    @Column(name = "legal_entity_id", nullable = false, length = 20)
    private String legalEntityId;
    
    /**
     * 销售佣金率(%)
     */
    @Column(name = "sales_commission_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal salesCommissionRate;
    
    /**
     * 操作佣金率(%)
     */
    @Column(name = "operation_commission_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal operationCommissionRate;
    
    /**
     * 管理费率(%)
     */
    @Column(name = "management_fee_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal managementFeeRate;
    
    /**
     * 分润方式：PERCENTAGE(百分比), FIXED_AMOUNT(固定金额)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "revenue_split_method")
    private RevenueSplitMethod revenueSplitMethod = RevenueSplitMethod.PERCENTAGE;
    
    /**
     * 是否激活
     */
    @Column(name = "active")
    private Boolean active = true;
    
    /**
     * 创建时间
     */
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    // ==================== 关联关系 ====================
    
    /**
     * 所属协议
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "protocol_id", insertable = false, updatable = false)
    private InternalProtocol protocol;
    
    /**
     * 法人实体
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legal_entity_id", insertable = false, updatable = false)
    private LegalEntity legalEntity;
    
    // ==================== 枚举定义 ====================
    
    public enum RevenueSplitMethod {
        PERCENTAGE("百分比"),
        FIXED_AMOUNT("固定金额");
        
        private final String description;
        
        RevenueSplitMethod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 验证分润比例总和是否合理（不超过100%）
     */
    public boolean isValidRateSum() {
        BigDecimal totalRate = salesCommissionRate
            .add(operationCommissionRate)
            .add(managementFeeRate);
        return totalRate.compareTo(BigDecimal.valueOf(100)) <= 0;
    }
    
    /**
     * 计算销售佣金
     */
    public BigDecimal calculateSalesCommission(BigDecimal serviceAmount) {
        if (revenueSplitMethod == RevenueSplitMethod.PERCENTAGE) {
            return serviceAmount.multiply(salesCommissionRate)
                .divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
        } else {
            // 固定金额模式下，salesCommissionRate直接作为固定金额
            return salesCommissionRate;
        }
    }
    
    /**
     * 计算操作佣金
     */
    public BigDecimal calculateOperationCommission(BigDecimal serviceAmount) {
        if (revenueSplitMethod == RevenueSplitMethod.PERCENTAGE) {
            return serviceAmount.multiply(operationCommissionRate)
                .divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
        } else {
            return operationCommissionRate;
        }
    }
    
    /**
     * 计算管理费
     */
    public BigDecimal calculateManagementFee(BigDecimal serviceAmount) {
        if (revenueSplitMethod == RevenueSplitMethod.PERCENTAGE) {
            return serviceAmount.multiply(managementFeeRate)
                .divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
        } else {
            return managementFeeRate;
        }
    }
    
    // ==================== JPA回调 ====================
    
    @PrePersist
    protected void onCreate() {
        this.createdTime = LocalDateTime.now();
    }
}