package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 部门数据访问接口
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {
    
    /**
     * 根据部门类型查找部门
     */
    List<Department> findByDepartmentType(Department.DepartmentType departmentType);
    
    /**
     * 根据法人实体ID查找部门
     */
    List<Department> findByLegalEntityId(String legalEntityId);
    
    /**
     * 根据部门类型和法人实体ID查找部门
     */
    List<Department> findByDepartmentTypeAndLegalEntityId(
        Department.DepartmentType departmentType, String legalEntityId);
    
    /**
     * 查找所有销售部门
     */
    @Query("SELECT d FROM Department d WHERE d.departmentType = 'SALES' ORDER BY d.departmentName")
    List<Department> findAllSalesDepartments();
    
    /**
     * 查找所有操作部门
     */
    @Query("SELECT d FROM Department d WHERE d.departmentType != 'SALES' ORDER BY d.departmentType, d.departmentName")
    List<Department> findAllOperationDepartments();
    
    /**
     * 根据业务类型查找对应的操作部门
     */
    @Query("SELECT d FROM Department d WHERE " +
           "((:businessType = 'OCEAN' AND d.departmentType = 'OCEAN_OP') OR " +
           " (:businessType = 'AIR' AND d.departmentType = 'AIR_OP') OR " +
           " (:businessType = 'TRUCK' AND d.departmentType = 'TRUCK_OP') OR " +
           " (:businessType = 'RAIL' AND d.departmentType = 'RAIL_OP') OR " +
           " (:businessType = 'CUSTOMS' AND d.departmentType = 'CUSTOMS_OP') OR " +
           " (:businessType = 'WAREHOUSE' AND d.departmentType = 'WAREHOUSE_OP')) " +
           "ORDER BY d.departmentName")
    List<Department> findOperationDepartmentsByBusinessType(@Param("businessType") String businessType);
    
    /**
     * 查找有主管的部门
     */
    @Query("SELECT d FROM Department d WHERE d.managerId IS NOT NULL ORDER BY d.departmentName")
    List<Department> findDepartmentsWithManager();
    
    /**
     * 查找指定法人实体的部门层级结构
     */
    @Query("SELECT d.departmentType, d.departmentName, COUNT(s.staffId) as staffCount " +
           "FROM Department d " +
           "LEFT JOIN Staff s ON d.departmentId = s.departmentId AND s.active = true " +
           "WHERE d.legalEntityId = :legalEntityId " +
           "GROUP BY d.departmentId, d.departmentType, d.departmentName " +
           "ORDER BY d.departmentType, d.departmentName")
    List<Object[]> getDepartmentHierarchy(@Param("legalEntityId") String legalEntityId);
}