package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 员工数据访问接口
 */
@Repository
public interface StaffRepository extends JpaRepository<Staff, String> {
    
    /**
     * 根据部门ID查找员工
     */
    List<Staff> findByDepartmentIdAndActiveTrue(String departmentId);
    
    /**
     * 根据角色类型查找员工
     */
    List<Staff> findByRoleTypeAndActiveTrue(Staff.RoleType roleType);
    
    /**
     * 根据法人实体ID查找员工
     */
    List<Staff> findByLegalEntityIdAndActiveTrue(String legalEntityId);
    
    /**
     * 根据部门ID和角色类型查找员工
     */
    List<Staff> findByDepartmentIdAndRoleTypeAndActiveTrue(
        String departmentId, Staff.RoleType roleType);
    
    /**
     * 根据邮箱查找员工
     */
    Optional<Staff> findByEmailAndActiveTrue(String email);
    
    /**
     * 查找所有激活的员工，按姓名排序
     */
    List<Staff> findByActiveTrueOrderByStaffName();
    
    /**
     * 查找销售人员
     */
    @Query("SELECT s FROM Staff s WHERE s.roleType = 'SALES' AND s.active = true ORDER BY s.staffName")
    List<Staff> findAllSalesStaff();
    
    /**
     * 查找操作人员
     */
    @Query("SELECT s FROM Staff s WHERE s.roleType = 'OPERATION' AND s.active = true ORDER BY s.staffName")
    List<Staff> findAllOperationStaff();
    
    /**
     * 根据部门类型查找操作人员
     */
    @Query("SELECT s FROM Staff s " +
           "JOIN s.department d " +
           "WHERE s.roleType = 'OPERATION' AND d.departmentType = :departmentType AND s.active = true " +
           "ORDER BY s.staffName")
    List<Staff> findOperationStaffByDepartmentType(
        @Param("departmentType") String departmentType);
    
    /**
     * 查找可以执行指定服务的操作人员
     */
    @Query("SELECT DISTINCT s FROM Staff s " +
           "JOIN s.department d " +
           "JOIN ServiceConfig sc ON sc.relatedService = :relatedService " +
           "WHERE s.roleType = 'OPERATION' AND s.active = true " +
           "AND (" +
           "    (sc.businessType = 'OCEAN' AND d.departmentType = 'OCEAN_OP') OR " +
           "    (sc.businessType = 'AIR' AND d.departmentType = 'AIR_OP') OR " +
           "    (sc.businessType = 'TRUCK' AND d.departmentType = 'TRUCK_OP') OR " +
           "    (sc.businessType = 'RAIL' AND d.departmentType = 'RAIL_OP') OR " +
           "    (sc.businessType = 'CUSTOMS' AND d.departmentType = 'CUSTOMS_OP') OR " +
           "    (sc.businessType = 'WAREHOUSE' AND d.departmentType = 'WAREHOUSE_OP')" +
           ") " +
           "ORDER BY s.staffName")
    List<Staff> findOperationStaffByRelatedService(@Param("relatedService") String relatedService);
    
    /**
     * 统计各部门员工数量
     */
    @Query("SELECT d.departmentName, COUNT(s) FROM Staff s " +
           "JOIN s.department d " +
           "WHERE s.active = true " +
           "GROUP BY d.departmentId, d.departmentName " +
           "ORDER BY d.departmentName")
    List<Object[]> countStaffByDepartment();
    
    /**
     * 根据角色类型查找员工（Controller使用）
     */
    default List<Staff> findByRoleType(Staff.RoleType roleType) {
        return findByRoleTypeAndActiveTrue(roleType);
    }
}