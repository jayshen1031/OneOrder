package com.oneorder.clearing.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 派单历史记录实体
 */
@Entity
@Table(name = "assignment_history")
public class AssignmentHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "assignment_time", nullable = false)
    private LocalDateTime assignmentTime;
    
    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;
    
    @Column(name = "order_no", length = 100)
    private String orderNo;
    
    @Column(name = "assignment_type", nullable = false, length = 20)
    private String assignmentType; // MANUAL, AUTO, BATCH, PROTOCOL
    
    @Column(name = "operator_name", length = 100)
    private String operatorName; // 执行派单的操作员
    
    @Column(name = "service_code", length = 50)
    private String serviceCode;
    
    @Column(name = "service_name", length = 200)
    private String serviceName;
    
    @Column(name = "assigned_operator_id", length = 50)
    private String assignedOperatorId; // 被分配的操作员ID
    
    @Column(name = "assigned_operator_name", length = 100)
    private String assignedOperatorName; // 被分配的操作员姓名
    
    @Column(name = "protocol_id", length = 50)
    private String protocolId;
    
    @Column(name = "protocol_name", length = 200)
    private String protocolName;
    
    @Column(name = "protocol_commission", precision = 5, scale = 2)
    private BigDecimal protocolCommission;
    
    @Column(name = "status", length = 20)
    private String status; // SUCCESS, FAILED
    
    @Column(name = "reason", length = 500)
    private String reason; // 派单原因或失败原因
    
    @Column(name = "assignment_notes", length = 1000)
    private String assignmentNotes; // 派单备注
    
    @Column(name = "success_count")
    private Integer successCount; // 批量派单时的成功数量
    
    @Column(name = "failed_count")
    private Integer failedCount; // 批量派单时的失败数量
    
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    // 无参构造函数
    public AssignmentHistory() {
        this.createdTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    // 全参构造函数
    public AssignmentHistory(String orderId, String orderNo, String assignmentType, 
                           String operatorName, String serviceCode, String serviceName,
                           String assignedOperatorId, String assignedOperatorName,
                           String protocolId, String protocolName, BigDecimal protocolCommission,
                           String status, String reason) {
        this();
        this.assignmentTime = LocalDateTime.now();
        this.orderId = orderId;
        this.orderNo = orderNo;
        this.assignmentType = assignmentType;
        this.operatorName = operatorName;
        this.serviceCode = serviceCode;
        this.serviceName = serviceName;
        this.assignedOperatorId = assignedOperatorId;
        this.assignedOperatorName = assignedOperatorName;
        this.protocolId = protocolId;
        this.protocolName = protocolName;
        this.protocolCommission = protocolCommission;
        this.status = status;
        this.reason = reason;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDateTime getAssignmentTime() {
        return assignmentTime;
    }
    
    public void setAssignmentTime(LocalDateTime assignmentTime) {
        this.assignmentTime = assignmentTime;
    }
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public String getOrderNo() {
        return orderNo;
    }
    
    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }
    
    public String getAssignmentType() {
        return assignmentType;
    }
    
    public void setAssignmentType(String assignmentType) {
        this.assignmentType = assignmentType;
    }
    
    public String getOperatorName() {
        return operatorName;
    }
    
    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }
    
    public String getServiceCode() {
        return serviceCode;
    }
    
    public void setServiceCode(String serviceCode) {
        this.serviceCode = serviceCode;
    }
    
    public String getServiceName() {
        return serviceName;
    }
    
    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }
    
    public String getAssignedOperatorId() {
        return assignedOperatorId;
    }
    
    public void setAssignedOperatorId(String assignedOperatorId) {
        this.assignedOperatorId = assignedOperatorId;
    }
    
    public String getAssignedOperatorName() {
        return assignedOperatorName;
    }
    
    public void setAssignedOperatorName(String assignedOperatorName) {
        this.assignedOperatorName = assignedOperatorName;
    }
    
    public String getProtocolId() {
        return protocolId;
    }
    
    public void setProtocolId(String protocolId) {
        this.protocolId = protocolId;
    }
    
    public String getProtocolName() {
        return protocolName;
    }
    
    public void setProtocolName(String protocolName) {
        this.protocolName = protocolName;
    }
    
    public BigDecimal getProtocolCommission() {
        return protocolCommission;
    }
    
    public void setProtocolCommission(BigDecimal protocolCommission) {
        this.protocolCommission = protocolCommission;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public String getAssignmentNotes() {
        return assignmentNotes;
    }
    
    public void setAssignmentNotes(String assignmentNotes) {
        this.assignmentNotes = assignmentNotes;
    }
    
    public Integer getSuccessCount() {
        return successCount;
    }
    
    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }
    
    public Integer getFailedCount() {
        return failedCount;
    }
    
    public void setFailedCount(Integer failedCount) {
        this.failedCount = failedCount;
    }
    
    public LocalDateTime getCreatedTime() {
        return createdTime;
    }
    
    public void setCreatedTime(LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }
    
    public LocalDateTime getUpdatedTime() {
        return updatedTime;
    }
    
    public void setUpdatedTime(LocalDateTime updatedTime) {
        this.updatedTime = updatedTime;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedTime = LocalDateTime.now();
    }
}