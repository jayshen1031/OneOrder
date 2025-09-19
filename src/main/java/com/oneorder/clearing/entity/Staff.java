package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 员工实体 - 支持销售和操作人员
 */
@Entity
@Table(name = "staff")
@Data
@EqualsAndHashCode(callSuper = true)
public class Staff extends BaseEntity {
    
    @Id
    @Column(name = "staff_id", length = 20)
    private String staffId;
    
    /**
     * 员工姓名
     */
    @Column(name = "staff_name", nullable = false, length = 50)
    private String staffName;
    
    /**
     * 法人实体ID
     */
    @Column(name = "legal_entity_id", nullable = false, length = 20)
    private String legalEntityId;
    
    /**
     * 部门ID
     */
    @Column(name = "department_id", nullable = false, length = 20)
    private String departmentId;
    
    /**
     * 角色类型：SALES(销售), OPERATION(操作), MANAGER(主管)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false)
    private RoleType roleType;
    
    /**
     * 联系电话
     */
    @Column(name = "phone", length = 20)
    private String phone;
    
    /**
     * 电子邮箱
     */
    @Column(name = "email", length = 100)
    private String email;
    
    /**
     * 员工编号
     */
    @Column(name = "employee_no", length = 20)
    private String employeeNo;
    
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
    
    /**
     * 更新时间
     */
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    // ==================== 关联关系 ====================
    
    /**
     * 所属法人实体
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legal_entity_id", insertable = false, updatable = false)
    private LegalEntity legalEntity;
    
    /**
     * 所属部门
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", insertable = false, updatable = false)
    private Department department;
    
    // ==================== 枚举定义 ====================
    
    public enum RoleType {
        SALES("销售"),
        OPERATION("操作"),
        MANAGER("主管");
        
        private final String description;
        
        RoleType(String description) {
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
        this.updatedTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedTime = LocalDateTime.now();
    }
}