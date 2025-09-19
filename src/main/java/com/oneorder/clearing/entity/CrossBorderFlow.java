package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * 过账流程实体
 * 管理跨境资金流转，如：宁波付款 → 香港过账 → 泰国收款
 */
@Entity
@Table(name = "cross_border_flows")
@Data
@EqualsAndHashCode(callSuper = true)
public class CrossBorderFlow extends BaseEntity {
    
    @Id
    @Column(name = "flow_id", length = 50)
    private String flowId;
    
    /**
     * 过账类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "flow_type", nullable = false)
    private FlowType flowType;
    
    /**
     * 付款方（起始方）
     */
    @Column(name = "payer_entity_id", nullable = false, length = 50)
    private String payerEntityId;
    
    /**
     * 付款方地区
     */
    @Column(name = "payer_region", length = 50)
    private String payerRegion;
    
    /**
     * 过账方（中间方）
     */
    @Column(name = "transit_entity_id", nullable = false, length = 50)
    private String transitEntityId;
    
    /**
     * 过账方地区
     */
    @Column(name = "transit_region", length = 50)
    private String transitRegion;
    
    /**
     * 收款方（目标方）
     */
    @Column(name = "receiver_entity_id", nullable = false, length = 50)
    private String receiverEntityId;
    
    /**
     * 收款方地区
     */
    @Column(name = "receiver_region", length = 50)
    private String receiverRegion;
    
    /**
     * 过账处理方式
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "processing_type", nullable = false)
    private ProcessingType processingType = ProcessingType.FLAT_TRANSFER;
    
    /**
     * 是否支持抵消
     */
    @Column(name = "netting_enabled", nullable = false)
    private Boolean nettingEnabled = false;
    
    /**
     * 抵消优先级（数值越小优先级越高）
     */
    @Column(name = "netting_priority")
    private Integer nettingPriority;
    
    /**
     * 过账公司留存比例
     */
    @Column(name = "transit_retention_rate", precision = 5, scale = 4)
    private BigDecimal transitRetentionRate;
    
    /**
     * 过账公司固定留存金额
     */
    @Column(name = "transit_fixed_retention", precision = 15, scale = 2)
    private BigDecimal transitFixedRetention;
    
    /**
     * 留存计算方式
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "retention_calculation_type")
    private RetentionCalculationType retentionCalculationType = RetentionCalculationType.NO_RETENTION;
    
    /**
     * 适用条件（JSON格式）
     */
    @Column(name = "applicable_conditions", columnDefinition = "TEXT")
    private String applicableConditions;
    
    /**
     * 是否启用
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    /**
     * 备注说明
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
    
    /**
     * 过账类型枚举
     */
    public enum FlowType {
        /**
         * 标准过账：A付款 → B过账 → C收款
         */
        STANDARD_FLOW("标准过账"),
        
        /**
         * 东南亚特殊过账（特殊玩法）
         */
        SOUTHEAST_ASIA_FLOW("东南亚过账"),
        
        /**
         * 欧美过账
         */
        EUROPE_AMERICA_FLOW("欧美过账"),
        
        /**
         * 内地过账
         */
        MAINLAND_FLOW("内地过账");
        
        private final String description;
        
        FlowType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 过账处理方式枚举
     */
    public enum ProcessingType {
        /**
         * 平收平付：金额不变流转
         */
        FLAT_TRANSFER("平收平付"),
        
        /**
         * 差额处理：按差额流转
         */
        NET_TRANSFER("差额处理"),
        
        /**
         * 分段处理：分多段流转
         */
        SEGMENTED_TRANSFER("分段处理");
        
        private final String description;
        
        ProcessingType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 留存计算方式枚举
     */
    public enum RetentionCalculationType {
        /**
         * 无留存
         */
        NO_RETENTION("无留存"),
        
        /**
         * 按比例留存
         */
        PERCENTAGE_RETENTION("比例留存"),
        
        /**
         * 固定金额留存
         */
        FIXED_AMOUNT_RETENTION("固定金额留存"),
        
        /**
         * 阶梯式留存（根据金额区间不同比例）
         */
        TIERED_RETENTION("阶梯式留存");
        
        private final String description;
        
        RetentionCalculationType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}