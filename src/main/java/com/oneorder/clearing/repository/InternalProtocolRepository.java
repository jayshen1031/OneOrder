package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.InternalProtocol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 内部协议数据访问接口
 */
@Repository
public interface InternalProtocolRepository extends JpaRepository<InternalProtocol, String> {
    
    /**
     * 根据销售部门和操作部门查找协议
     */
    List<InternalProtocol> findBySalesDepartmentIdAndOperationDepartmentIdAndActiveTrue(
        String salesDepartmentId, String operationDepartmentId);
    
    /**
     * 根据服务编码查找协议
     */
    List<InternalProtocol> findByServiceCodeAndActiveTrue(String serviceCode);
    
    /**
     * 根据业务类型查找协议
     */
    List<InternalProtocol> findByBusinessTypeAndActiveTrue(String businessType);
    
    /**
     * 查找所有有效的协议
     */
    @Query("SELECT p FROM InternalProtocol p WHERE p.active = true AND " +
           "p.effectiveDate <= CURRENT_DATE AND " +
           "(p.expiryDate IS NULL OR p.expiryDate >= CURRENT_DATE) " +
           "ORDER BY p.protocolName")
    List<InternalProtocol> findAllEffectiveProtocols();
    
    /**
     * 查找可用的协议（根据部门、服务、业务类型和日期）
     */
    @Query("SELECT p FROM InternalProtocol p WHERE " +
           "p.salesDepartmentId = :salesDepartmentId AND " +
           "p.operationDepartmentId = :operationDepartmentId AND " +
           "p.active = true AND " +
           "p.effectiveDate <= :currentDate AND " +
           "(p.expiryDate IS NULL OR p.expiryDate >= :currentDate) AND " +
           "(p.serviceCode IS NULL OR p.serviceCode = :serviceCode) AND " +
           "(p.businessType IS NULL OR p.businessType = :businessType) " +
           "ORDER BY p.serviceCode NULLS LAST, p.businessType NULLS LAST, p.baseCommissionRate DESC")
    List<InternalProtocol> findAvailableProtocols(
        @Param("salesDepartmentId") String salesDepartmentId,
        @Param("operationDepartmentId") String operationDepartmentId,
        @Param("serviceCode") String serviceCode,
        @Param("businessType") String businessType,
        @Param("currentDate") LocalDate currentDate);
    
    /**
     * 查找最佳匹配协议（优先匹配具体服务和业务类型）
     */
    @Query("SELECT p FROM InternalProtocol p WHERE " +
           "p.salesDepartmentId = :salesDepartmentId AND " +
           "p.operationDepartmentId = :operationDepartmentId AND " +
           "p.active = true AND " +
           "p.effectiveDate <= :currentDate AND " +
           "(p.expiryDate IS NULL OR p.expiryDate >= :currentDate) AND " +
           "(p.serviceCode IS NULL OR p.serviceCode = :serviceCode) AND " +
           "(p.businessType IS NULL OR p.businessType = :businessType) " +
           "ORDER BY " +
           "CASE WHEN p.serviceCode = :serviceCode THEN 0 ELSE 1 END, " +
           "CASE WHEN p.businessType = :businessType THEN 0 ELSE 1 END, " +
           "p.baseCommissionRate DESC")
    List<InternalProtocol> findBestMatchProtocolList(
        @Param("salesDepartmentId") String salesDepartmentId,
        @Param("operationDepartmentId") String operationDepartmentId,
        @Param("serviceCode") String serviceCode,
        @Param("businessType") String businessType,
        @Param("currentDate") LocalDate currentDate);
    
    /**
     * 查找最佳匹配协议（返回第一个）
     */
    default Optional<InternalProtocol> findBestMatchProtocol(
            String salesDepartmentId, String operationDepartmentId, 
            String serviceCode, String businessType, LocalDate currentDate) {
        List<InternalProtocol> protocols = findBestMatchProtocolList(
                salesDepartmentId, operationDepartmentId, serviceCode, businessType, currentDate);
        return protocols.isEmpty() ? Optional.empty() : Optional.of(protocols.get(0));
    }
    
    /**
     * 根据销售部门查找协议
     */
    @Query("SELECT p FROM InternalProtocol p WHERE p.salesDepartmentId = :salesDepartmentId AND p.active = true ORDER BY p.protocolName")
    List<InternalProtocol> findBySalesDepartment(@Param("salesDepartmentId") String salesDepartmentId);
    
    /**
     * 根据操作部门查找协议
     */
    @Query("SELECT p FROM InternalProtocol p WHERE p.operationDepartmentId = :operationDepartmentId AND p.active = true ORDER BY p.protocolName")
    List<InternalProtocol> findByOperationDepartment(@Param("operationDepartmentId") String operationDepartmentId);
    
    /**
     * 查找即将过期的协议（30天内）
     */
    @Query("SELECT p FROM InternalProtocol p WHERE " +
           "p.active = true AND p.expiryDate IS NOT NULL AND " +
           "p.expiryDate BETWEEN CURRENT_DATE AND :futureDate " +
           "ORDER BY p.expiryDate")
    List<InternalProtocol> findExpiringProtocols(@Param("futureDate") LocalDate futureDate);
    
    /**
     * 统计协议数量按业务类型
     */
    @Query("SELECT p.businessType, COUNT(p) FROM InternalProtocol p WHERE p.active = true GROUP BY p.businessType")
    List<Object[]> countProtocolsByBusinessType();
    
    /**
     * 统计协议数量按销售部门
     */
    @Query("SELECT sd.departmentName, COUNT(p) FROM InternalProtocol p " +
           "JOIN Department sd ON p.salesDepartmentId = sd.departmentId " +
           "WHERE p.active = true " +
           "GROUP BY sd.departmentId, sd.departmentName " +
           "ORDER BY sd.departmentName")
    List<Object[]> countProtocolsBySalesDepartment();
    
    /**
     * 查找重叠的协议（相同部门、服务、业务类型且日期重叠）
     */
    @Query("SELECT p1, p2 FROM InternalProtocol p1, InternalProtocol p2 WHERE " +
           "p1.protocolId < p2.protocolId AND " +
           "p1.salesDepartmentId = p2.salesDepartmentId AND " +
           "p1.operationDepartmentId = p2.operationDepartmentId AND " +
           "p1.serviceCode = p2.serviceCode AND " +
           "p1.businessType = p2.businessType AND " +
           "p1.active = true AND p2.active = true AND " +
           "(p1.expiryDate IS NULL OR p1.expiryDate >= p2.effectiveDate) AND " +
           "(p2.expiryDate IS NULL OR p2.expiryDate >= p1.effectiveDate)")
    List<Object[]> findOverlappingProtocols();
    
    /**
     * 查找适用的协议（Controller使用）
     */
    default List<InternalProtocol> findApplicableProtocols(
            String salesDepartmentId, String operationDepartmentId, 
            String serviceCode, String businessType) {
        return findAvailableProtocols(salesDepartmentId, operationDepartmentId, 
                serviceCode, businessType, LocalDate.now());
    }
    
    /**
     * 查找所有有效协议（Controller使用）
     */
    default List<InternalProtocol> findAllActive() {
        return findAllEffectiveProtocols();
    }
}