package com.oneorder.clearing.dto;

import lombok.Data;
import java.util.List;

/**
 * 部门DTO
 */
@Data
public class DepartmentDTO {
    private String departmentId;
    private String departmentName;
    private String departmentType;
    private String departmentTypeDescription;
    private String legalEntityId;
    private String legalEntityName;
    private String parentDepartmentId;
    private String parentDepartmentName;
    private String managerStaffId;
    private String managerStaffName;
    private Boolean active;
    
    // 统计信息
    private int totalStaff;
    private int activeStaff;
    private int totalProtocols;
    private int activeProtocols;
    
    // 子部门信息
    private List<DepartmentDTO> subDepartments;
    
    // 人员信息
    private List<StaffDTO> staffList;
    
    // 显示信息
    private String displayName;
    private String hierarchyLevel;
    private String fullPath;
}