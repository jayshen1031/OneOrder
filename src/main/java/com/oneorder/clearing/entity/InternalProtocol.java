package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 内部协议实体 - 定义销售部门与操作部门的协作协议
 */
@Entity
@Table(name = "internal_protocol")
@Data
@EqualsAndHashCode(callSuper = true)
public class InternalProtocol extends BaseEntity {
    
    @Id
    @Column(name = "protocol_id", length = 20)
    private String protocolId;
    
    /**
     * 协议名称
     */
    @Column(name = "protocol_name", nullable = false, length = 100)
    private String protocolName;
    
    /**
     * 销售部门ID
     */
    @Column(name = "sales_department_id", nullable = false, length = 20)
    private String salesDepartmentId;
    
    /**
     * 操作部门ID
     */
    @Column(name = "operation_department_id", nullable = false, length = 20)
    private String operationDepartmentId;
    
    /**
     * 服务编码 - NULL表示适用所有服务
     */
    @Column(name = "service_code", length = 20)
    private String serviceCode;
    
    /**
     * 业务类型 - NULL表示适用所有业务类型
     */
    @Column(name = "business_type", length = 20)
    private String businessType;
    
    /**
     * 基础佣金率(%)
     */
    @Column(name = "base_commission_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal baseCommissionRate;
    
    /**
     * 绩效奖金率(%)
     */
    @Column(name = "performance_bonus_rate", precision = 5, scale = 2)
    private BigDecimal performanceBonusRate = BigDecimal.ZERO;
    
    /**
     * 是否激活
     */
    @Column(name = "active")
    private Boolean active = true;
    
    /**
     * 生效日期
     */
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;
    
    /**
     * 失效日期
     */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;
    
    /**
     * 创建时间
     */
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    /**
     * 更新时间
     */
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    /**
     * 创建人员ID
     */
    @Column(name = "created_by", length = 20)
    private String createdBy;
    
    // ==================== 关联关系 ====================
    
    /**
     * 销售部门
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_department_id", insertable = false, updatable = false)
    private Department salesDepartment;
    
    /**
     * 操作部门
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_department_id", insertable = false, updatable = false)
    private Department operationDepartment;
    
    /**
     * 服务配置
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_code", insertable = false, updatable = false)
    private ServiceConfig serviceConfig;
    
    /**
     * 创建人员
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", insertable = false, updatable = false)
    private Staff creator;
    
    /**
     * 分润规则列表
     */
    @OneToMany(mappedBy = "protocol", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProtocolRevenueRule> revenueRules;
    
    // ==================== 业务方法 ====================
    
    /**
     * 检查协议是否在有效期内
     */
    public boolean isEffective() {
        if (!active) {
            return false;
        }
        
        LocalDate now = LocalDate.now();
        if (effectiveDate.isAfter(now)) {
            return false;
        }
        
        return expiryDate == null || !expiryDate.isBefore(now);
    }
    
    /**
     * 检查协议是否适用于指定的服务和业务类型
     */
    public boolean isApplicable(String targetServiceCode, String targetBusinessType) {
        // 服务编码匹配（NULL表示适用所有服务）
        if (serviceCode != null && !serviceCode.equals(targetServiceCode)) {
            return false;
        }
        
        // 业务类型匹配（NULL表示适用所有业务类型）
        if (businessType != null && !businessType.equals(targetBusinessType)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 获取总佣金率（基础佣金率 + 绩效奖金率）
     */
    public BigDecimal getTotalCommissionRate() {
        return baseCommissionRate.add(performanceBonusRate);
    }
    
    // ==================== JPA回调 ====================
    
    @PrePersist
    protected void onCreate() {
        this.createdTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedTime = LocalDateTime.now();
    }
}