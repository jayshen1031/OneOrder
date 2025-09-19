package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单服务实体 - 存储订单中的具体服务项和协议信息
 */
@Entity
@Table(name = "order_service")
@Data
@EqualsAndHashCode(callSuper = true)
public class OrderService extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_id")
    private Long serviceId;
    
    /**
     * 订单ID
     */
    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;
    
    /**
     * 服务配置ID
     */
    @Column(name = "service_config_id", length = 20)
    private String serviceConfigId;
    
    /**
     * 服务编码
     */
    @Column(name = "service_code", nullable = false, length = 20)
    private String serviceCode;
    
    /**
     * 操作人员ID
     */
    @Column(name = "operation_staff_id", length = 20)
    private String operationStaffId;
    
    /**
     * 操作部门ID
     */
    @Column(name = "operation_department_id", length = 20)
    private String operationDepartmentId;
    
    /**
     * 内部协议ID
     */
    @Column(name = "internal_protocol_id", length = 20)
    private String internalProtocolId;
    
    /**
     * 服务金额
     */
    @Column(name = "service_amount", precision = 12, scale = 2)
    private BigDecimal serviceAmount;
    
    /**
     * 币种
     */
    @Column(name = "currency", length = 10)
    private String currency = "CNY";
    
    /**
     * 优先级
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.NORMAL;
    
    /**
     * 派单人员ID
     */
    @Column(name = "assigned_by", length = 20)
    private String assignedBy;
    
    /**
     * 受阻原因
     */
    @Column(name = "block_reason")
    private String blockReason;
    
    /**
     * 备注
     */
    @Column(name = "remarks")
    private String remarks;
    
    /**
     * 服务状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ServiceStatus status = ServiceStatus.PENDING;
    
    /**
     * 派单时间
     */
    @Column(name = "assigned_time")
    private LocalDateTime assignedTime;
    
    /**
     * 协议确认时间
     */
    @Column(name = "protocol_confirmed_time")
    private LocalDateTime protocolConfirmedTime;
    
    /**
     * 开始执行时间
     */
    @Column(name = "started_time")
    private LocalDateTime startedTime;
    
    /**
     * 完成时间
     */
    @Column(name = "completed_time")
    private LocalDateTime completedTime;
    
    /**
     * 备注信息
     */
    @Column(name = "notes")
    private String notes;
    
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
     * 所属订单
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private Order order;
    
    /**
     * 服务配置
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_code", insertable = false, updatable = false)
    private ServiceConfig serviceConfig;
    
    /**
     * 操作人员
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_staff_id", insertable = false, updatable = false)
    private Staff operationStaff;
    
    /**
     * 操作部门
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_department_id", insertable = false, updatable = false)
    private Department operationDepartment;
    
    /**
     * 内部协议
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internal_protocol_id", insertable = false, updatable = false)
    private InternalProtocol internalProtocol;
    
    // ==================== 枚举定义 ====================
    
    public enum Priority {
        LOW("低"),
        NORMAL("普通"),
        HIGH("高"),
        URGENT("紧急");
        
        private final String description;
        
        Priority(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum ServiceStatus {
        PENDING("待派单"),
        ASSIGNED("已派单"),
        PROTOCOL_CONFIRMED("协议已确认"),
        IN_PROGRESS("执行中"),
        COMPLETED("已完成"),
        BLOCKED("受阻");
        
        private final String description;
        
        ServiceStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 派单到操作人员
     */
    public void assignToOperation() {
        if (this.status != ServiceStatus.PENDING) {
            throw new IllegalStateException("只有待派单状态的服务才能派单");
        }
        this.status = ServiceStatus.ASSIGNED;
        this.assignedTime = LocalDateTime.now();
    }
    
    /**
     * 派单
     */
    public void assign(String operationStaffId, String operationDepartmentId, String internalProtocolId) {
        this.operationStaffId = operationStaffId;
        this.operationDepartmentId = operationDepartmentId;
        this.internalProtocolId = internalProtocolId;
        this.status = ServiceStatus.ASSIGNED;
        this.assignedTime = LocalDateTime.now();
    }
    
    /**
     * 确认协议
     */
    public void confirmProtocol() {
        if (this.status != ServiceStatus.ASSIGNED) {
            throw new IllegalStateException("只有已派单状态的服务才能确认协议");
        }
        this.status = ServiceStatus.PROTOCOL_CONFIRMED;
        this.protocolConfirmedTime = LocalDateTime.now();
    }
    
    /**
     * 开始执行
     */
    public void start() {
        if (this.status != ServiceStatus.PROTOCOL_CONFIRMED) {
            throw new IllegalStateException("只有协议已确认状态的服务才能开始执行");
        }
        this.status = ServiceStatus.IN_PROGRESS;
        this.startedTime = LocalDateTime.now();
    }
    
    /**
     * 完成服务
     */
    public void complete() {
        if (this.status != ServiceStatus.IN_PROGRESS) {
            throw new IllegalStateException("只有执行中状态的服务才能完成");
        }
        this.status = ServiceStatus.COMPLETED;
        this.completedTime = LocalDateTime.now();
    }
    
    /**
     * 阻塞服务
     */
    public void block(String reason) {
        this.status = ServiceStatus.BLOCKED;
        this.blockReason = reason;
        this.remarks = (this.remarks == null ? "" : this.remarks + "; ") + "阻塞原因: " + reason;
    }
    
    /**
     * 检查是否可以确认协议
     */
    public boolean canConfirmProtocol() {
        return this.status == ServiceStatus.ASSIGNED && 
               this.internalProtocolId != null;
    }
    
    /**
     * 检查是否已确认协议
     */
    public boolean isProtocolConfirmed() {
        return this.status == ServiceStatus.PROTOCOL_CONFIRMED ||
               this.status == ServiceStatus.IN_PROGRESS ||
               this.status == ServiceStatus.COMPLETED;
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