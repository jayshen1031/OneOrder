package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单实体
 */
@Entity
@Table(name = "orders")
@Data
@EqualsAndHashCode(callSuper = true)
public class Order extends BaseEntity {
    
    @Id
    @Column(name = "order_id", length = 50)
    private String orderId;
    
    /**
     * 订单编号（业务编号）
     */
    @Column(name = "order_no", nullable = false, unique = true, length = 100)
    private String orderNo;
    
    /**
     * 客户ID
     */
    @Column(name = "customer_id", nullable = false, length = 50)
    private String customerId;
    
    /**
     * 销售法人体ID
     */
    @Column(name = "sales_entity_id", nullable = false, length = 50)
    private String salesEntityId;
    
    /**
     * 交付法人体ID
     */
    @Column(name = "delivery_entity_id", length = 50)
    private String deliveryEntityId;
    
    /**
     * 付款法人体ID（星式模式下的收款总包）
     */
    @Column(name = "payment_entity_id", length = 50)
    private String paymentEntityId;
    
    /**
     * 付款账号（用于借抬头判定）
     */
    @Column(name = "payment_account", length = 100)
    private String paymentAccount;
    
    /**
     * 订单总金额
     */
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;
    
    /**
     * 总成本
     */
    @Column(name = "total_cost", precision = 15, scale = 2)
    private BigDecimal totalCost;
    
    /**
     * 币种
     */
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;
    
    /**
     * 订单状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    private OrderStatus orderStatus;
    
    /**
     * 清分状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "clearing_status")
    private ClearingStatus clearingStatus;
    
    /**
     * 清分模式：STAR(星式) | CHAIN(链式)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "clearing_mode")
    private ClearingMode clearingMode;
    
    /**
     * 订单日期
     */
    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;
    
    /**
     * 业务类型
     */
    @Column(name = "business_type", length = 50)
    private String businessType;
    
    /**
     * 起运港
     */
    @Column(name = "port_of_loading", length = 100)
    private String portOfLoading;
    
    /**
     * 目的港
     */
    @Column(name = "port_of_discharge", length = 100)
    private String portOfDischarge;
    
    /**
     * 备注
     */
    @Column(name = "remarks", length = 1000)
    private String remarks;
    
    /**
     * 销售人员ID
     */
    @Column(name = "sales_staff_id", length = 20)
    private String salesStaffId;
    
    /**
     * 销售部门ID
     */
    @Column(name = "sales_department_id", length = 20)
    private String salesDepartmentId;
    
    /**
     * 订单项目
     */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;
    
    /**
     * 清分结果
     */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClearingResult> clearingResults;
    
    /**
     * 订单服务项目
     */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderService> orderServices;
    
    // ==================== 关联关系 ====================
    
    /**
     * 销售人员
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_staff_id", insertable = false, updatable = false)
    private Staff salesStaff;
    
    /**
     * 销售部门
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_department_id", insertable = false, updatable = false)
    private Department salesDepartment;
    
    public enum OrderStatus {
        DRAFT("草稿"),
        CONFIRMED("已确认"),
        IN_PROGRESS("执行中"),
        COMPLETED("已完成"),
        CANCELLED("已取消");
        
        private final String description;
        
        OrderStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum ClearingStatus {
        PENDING("待清分"),
        CLEARING("清分中"),
        CLEARED("已清分"),
        FAILED("清分失败");
        
        private final String description;
        
        ClearingStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum ClearingMode {
        STAR("星式"),
        CHAIN("链式");
        
        private final String description;
        
        ClearingMode(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}