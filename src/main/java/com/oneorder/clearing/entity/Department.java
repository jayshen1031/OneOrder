package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 部门实体 - 支持销售部门和操作部门
 */
@Entity
@Table(name = "department")
@Data
@EqualsAndHashCode(callSuper = true)
public class Department extends BaseEntity {
    
    @Id
    @Column(name = "department_id", length = 20)
    private String departmentId;
    
    /**
     * 部门名称
     */
    @Column(name = "department_name", nullable = false, length = 50)
    private String departmentName;
    
    /**
     * 部门类型：SALES(销售), OCEAN_OP(海运操作), AIR_OP(空运操作), 等
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "department_type", nullable = false)
    private DepartmentType departmentType;
    
    /**
     * 法人实体ID
     */
    @Column(name = "legal_entity_id", nullable = false, length = 20)
    private String legalEntityId;
    
    /**
     * 部门主管ID
     */
    @Column(name = "manager_id", length = 20)
    private String managerId;
    
    /**
     * 创建时间
     */
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    // ==================== 关联关系 ====================
    
    /**
     * 所属法人实体
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legal_entity_id", insertable = false, updatable = false)
    private LegalEntity legalEntity;
    
    /**
     * 部门主管
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", insertable = false, updatable = false)
    private Staff manager;
    
    // ==================== 枚举定义 ====================
    
    public enum DepartmentType {
        SALES("销售部门"),
        OCEAN_OP("海运操作部门"),
        AIR_OP("空运操作部门"),
        TRUCK_OP("陆运操作部门"),
        RAIL_OP("铁运操作部门"),
        CUSTOMS_OP("关务操作部门"),
        WAREHOUSE_OP("仓储操作部门");
        
        private final String description;
        
        DepartmentType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== JPA回调 ====================
    
    @PrePersist
    protected void onCreate() {
        this.createdTime = LocalDateTime.now();
    }
}