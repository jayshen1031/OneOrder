package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * 订单项实体
 */
@Entity
@Table(name = "order_items")
@Data
@EqualsAndHashCode(callSuper = true)
public class OrderItem extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    /**
     * 订单项ID
     */
    @Column(name = "item_id", nullable = false, unique = true, length = 50)
    private String itemId;
    
    /**
     * 所属订单
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", referencedColumnName = "order_id", nullable = false)
    private Order order;
    
    /**
     * 服务类型
     */
    @Column(name = "service_type", nullable = false, length = 50)
    private String serviceType;
    
    /**
     * 服务名称
     */
    @Column(name = "service_name", nullable = false, length = 200)
    private String serviceName;
    
    /**
     * 服务提供方（法人体ID）
     */
    @Column(name = "service_provider_id", length = 50)
    private String serviceProviderId;
    
    /**
     * 收费金额
     */
    @Column(name = "charge_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal chargeAmount;
    
    /**
     * 成本金额
     */
    @Column(name = "cost_amount", precision = 15, scale = 2)
    private BigDecimal costAmount;
    
    /**
     * 币种
     */
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;
    
    /**
     * 数量
     */
    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity;
    
    /**
     * 单位
     */
    @Column(name = "unit", length = 20)
    private String unit;
    
    /**
     * 单价
     */
    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;
    
    /**
     * 是否需要清分
     */
    @Column(name = "need_clearing", nullable = false)
    private Boolean needClearing = true;
    
    /**
     * 备注
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
}