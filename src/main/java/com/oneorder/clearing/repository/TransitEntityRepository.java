package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.TransitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 借抬头实体存储库
 */
@Repository
public interface TransitEntityRepository extends JpaRepository<TransitEntity, String> {
    
    /**
     * 根据借抬头账号查找活跃的借抬头配置
     * @param transitAccount 借抬头账号
     * @return 借抬头实体（如果存在）
     */
    Optional<TransitEntity> findByTransitAccountAndIsActiveTrue(String transitAccount);
    
    /**
     * 根据中间法人ID和借抬头类型查找活跃的借抬头配置
     * @param transitEntityId 中间法人ID
     * @param transitType 借抬头类型
     * @return 借抬头实体（如果存在）
     */
    Optional<TransitEntity> findByTransitEntityIdAndTransitTypeAndIsActiveTrue(String transitEntityId, TransitEntity.TransitType transitType);
    
    /**
     * 根据借抬头类型查找所有活跃的借抬头配置
     * @param transitType 借抬头类型
     * @return 借抬头实体列表
     */
    List<TransitEntity> findByTransitTypeAndIsActiveTrueOrderByTransitId(TransitEntity.TransitType transitType);
    
    /**
     * 查找所有活跃的借抬头配置
     * @return 借抬头实体列表
     */
    List<TransitEntity> findByIsActiveTrueOrderByTransitType();
    
    /**
     * 根据来源法人查找相关的借抬头配置
     * @param sourceEntityId 来源法人ID
     * @return 借抬头实体列表
     */
    List<TransitEntity> findBySourceEntityIdAndIsActiveTrue(String sourceEntityId);
    
    /**
     * 根据目标法人查找相关的借抬头配置
     * @param targetEntityId 目标法人ID
     * @return 借抬头实体列表
     */
    List<TransitEntity> findByTargetEntityIdAndIsActiveTrue(String targetEntityId);
    
    /**
     * 根据中间法人查找相关的借抬头配置
     * @param transitEntityId 中间法人ID
     * @return 借抬头实体列表
     */
    List<TransitEntity> findByTransitEntityIdAndIsActiveTrue(String transitEntityId);
}