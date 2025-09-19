package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 法人实体
 * 四类法人体：客户、销售站、交付站、供应商
 */
@Entity
@Table(name = "legal_entity")
@Data
@EqualsAndHashCode(callSuper = true)
public class LegalEntity extends BaseEntity {
    
    @Id
    @Column(name = "entity_id", length = 50)
    private String entityId;
    
    @Column(name = "entity_name", nullable = false, length = 200)
    private String entityName;
    
    @Column(name = "entity_code", unique = true, length = 50)
    private String entityCode;
    
    /**
     * 实体类型：CUSTOMER(客户)、SALES(销售站)、DELIVERY(交付站)、SUPPLIER(供应商)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private EntityType entityType;
    
    /**
     * 地区代码
     */
    @Column(name = "region", length = 10)
    private String region;
    
    /**
     * 国家代码
     */
    @Column(name = "country", length = 10)
    private String country;
    
    /**
     * 是否为中转法人体（用于借抬头、过账）
     */
    @Column(name = "is_transit_entity", nullable = false)
    private Boolean isTransitEntity = false;
    
    /**
     * 默认留存比例（用于中转法人体）
     */
    @Column(name = "default_retention_rate", precision = 8, scale = 4)
    private BigDecimal defaultRetentionRate = BigDecimal.ZERO;
    
    /**
     * 税务登记号
     */
    @Column(name = "tax_registration_no", length = 50)
    private String taxRegistrationNo;
    
    /**
     * 银行账户信息（JSON格式）
     */
    @Column(name = "bank_accounts", columnDefinition = "TEXT")
    private String bankAccounts;
    
    /**
     * 是否启用
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    /**
     * 备注
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
    
    public enum EntityType {
        CUSTOMER("客户"),
        SALES("销售站"),
        DELIVERY("交付站"),
        SUPPLIER("供应商");
        
        private final String description;
        
        EntityType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}