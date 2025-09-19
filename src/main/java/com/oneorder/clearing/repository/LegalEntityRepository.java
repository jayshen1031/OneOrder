package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.LegalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 法人实体Repository
 */
@Repository
public interface LegalEntityRepository extends JpaRepository<LegalEntity, String> {
    
    /**
     * 根据实体代码查询
     */
    Optional<LegalEntity> findByEntityCode(String entityCode);
    
    /**
     * 根据实体类型查询启用的法人体
     */
    List<LegalEntity> findByEntityTypeAndIsActiveTrue(LegalEntity.EntityType entityType);
    
    /**
     * 根据地区查询启用的法人体
     */
    List<LegalEntity> findByRegionAndIsActiveTrue(String region);
    
    /**
     * 查询中转法人体
     */
    List<LegalEntity> findByIsTransitEntityTrueAndIsActiveTrue();
    
    /**
     * 根据国家和实体类型查询
     */
    List<LegalEntity> findByCountryAndEntityTypeAndIsActiveTrue(String country, LegalEntity.EntityType entityType);
    
    /**
     * 查询指定地区的销售法人体
     */
    @Query("SELECT e FROM LegalEntity e WHERE e.region = :region " +
           "AND e.entityType = 'SALES' AND e.isActive = true")
    List<LegalEntity> findSalesEntitiesByRegion(@Param("region") String region);
    
    /**
     * 查询可用于清分的法人体（排除客户）
     */
    @Query("SELECT e FROM LegalEntity e WHERE e.entityType != 'CUSTOMER' AND e.isActive = true")
    List<LegalEntity> findClearingEligibleEntities();
    
    /**
     * 根据实体名称模糊查询
     */
    List<LegalEntity> findByEntityNameContainingAndIsActiveTrue(String entityName);
}