package com.oneorder.clearing.dto;

import lombok.Data;

/**
 * 人员DTO
 */
@Data
public class StaffDTO {
    private String staffId;
    private String staffName;
    private String email;
    private String phone;
    private String roleType;
    private String roleTypeDescription;
    private String departmentId;
    private String departmentName;
    private Boolean active;
    private String employeeNo;
    
    // 统计信息
    private int totalTasks;
    private int pendingTasks;
    private int inProgressTasks;
    private int completedTasks;
    private int overdueTask;
    
    // 显示信息
    private String displayName;
    private String roleDisplay;
    private String departmentDisplay;
    private String workloadStatus;
}