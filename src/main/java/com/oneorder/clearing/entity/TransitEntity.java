package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * 借抬头实体
 * 管理收付款的中间法人流转
 */
@Entity
@Table(name = "transit_entities")
@Data
@EqualsAndHashCode(callSuper = true)
public class TransitEntity extends BaseEntity {
    
    @Id
    @Column(name = "transit_id", length = 50)
    private String transitId;
    
    /**
     * 借抬头类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transit_type", nullable = false)
    private TransitType transitType;
    
    /**
     * 业务来源法人（收款借抬头：客户；付款借抬头：销售法人）
     */
    @Column(name = "source_entity_id", nullable = false, length = 50)
    private String sourceEntityId;
    
    /**
     * 中间法人（借抬头法人）
     */
    @Column(name = "transit_entity_id", nullable = false, length = 50)
    private String transitEntityId;
    
    /**
     * 目标法人（收款借抬头：销售法人；付款借抬头：供应商法人）
     */
    @Column(name = "target_entity_id", nullable = false, length = 50)
    private String targetEntityId;
    
    /**
     * 借抬头账号
     */
    @Column(name = "transit_account", length = 100)
    private String transitAccount;
    
    /**
     * 留存比例（如3%）
     */
    @Column(name = "retention_rate", precision = 5, scale = 4)
    private BigDecimal retentionRate;
    
    /**
     * 固定留存金额
     */
    @Column(name = "fixed_retention_amount", precision = 15, scale = 2)
    private BigDecimal fixedRetentionAmount;
    
    /**
     * 留存计算方式
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "retention_type")
    private RetentionType retentionType = RetentionType.PERCENTAGE;
    
    /**
     * 是否启用
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    /**
     * 适用条件（JSON格式）
     */
    @Column(name = "applicable_conditions", columnDefinition = "TEXT")
    private String applicableConditions;
    
    /**
     * 备注
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
    
    /**
     * 借抬头类型枚举
     */
    public enum TransitType {
        /**
         * 收款借抬头：客户 → 中间法人 → 销售法人
         */
        RECEIVABLE_TRANSIT("收款借抬头"),
        
        /**
         * 付款借抬头：销售法人 → 中间法人 → 供应商法人
         */
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
     * 留存计算方式枚举
     */
    public enum RetentionType {
        /**
         * 按比例留存
         */
        PERCENTAGE("比例留存"),
        
        /**
         * 固定金额留存
         */
        FIXED_AMOUNT("固定金额留存"),
        
        /**
         * 无留存
         */
        NO_RETENTION("无留存");
        
        private final String description;
        
        RetentionType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}