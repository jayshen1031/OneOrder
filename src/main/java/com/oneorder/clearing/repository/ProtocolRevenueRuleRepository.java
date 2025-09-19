package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.ProtocolRevenueRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 协议分润规则数据访问接口
 */
@Repository
public interface ProtocolRevenueRuleRepository extends JpaRepository<ProtocolRevenueRule, String> {
    
    /**
     * 根据协议ID查找分润规则
     */
    List<ProtocolRevenueRule> findByProtocolIdAndActiveTrue(String protocolId);
    
    /**
     * 根据法人实体ID查找分润规则
     */
    List<ProtocolRevenueRule> findByLegalEntityIdAndActiveTrue(String legalEntityId);
    
    /**
     * 根据协议ID和法人实体ID查找分润规则
     */
    List<ProtocolRevenueRule> findByProtocolIdAndLegalEntityIdAndActiveTrue(
        String protocolId, String legalEntityId);
    
    /**
     * 根据分润方式查找规则
     */
    List<ProtocolRevenueRule> findByRevenueSplitMethodAndActiveTrue(
        ProtocolRevenueRule.RevenueSplitMethod revenueSplitMethod);
    
    /**
     * 查找所有有效的分润规则
     */
    @Query("SELECT r FROM ProtocolRevenueRule r WHERE r.active = true ORDER BY r.protocolId, r.legalEntityId")
    List<ProtocolRevenueRule> findAllActiveRules();
    
    /**
     * 查找协议的完整分润信息
     */
    @Query("SELECT r FROM ProtocolRevenueRule r " +
           "JOIN r.protocol p " +
           "JOIN r.legalEntity le " +
           "WHERE r.protocolId = :protocolId AND r.active = true " +
           "ORDER BY r.legalEntityId")
    List<ProtocolRevenueRule> findProtocolRevenueInfo(@Param("protocolId") String protocolId);
    
    /**
     * 验证分润规则总和是否合理
     */
    @Query("SELECT r.protocolId, SUM(r.salesCommissionRate), SUM(r.operationCommissionRate), SUM(r.managementFeeRate) " +
           "FROM ProtocolRevenueRule r " +
           "WHERE r.active = true AND r.revenueSplitMethod = 'PERCENTAGE' " +
           "GROUP BY r.protocolId " +
           "HAVING (SUM(r.salesCommissionRate) + SUM(r.operationCommissionRate) + SUM(r.managementFeeRate)) > 100")
    List<Object[]> findInvalidRateSums();
    
    /**
     * 统计各法人实体的分润规则数量
     */
    @Query("SELECT le.entityName, COUNT(r) FROM ProtocolRevenueRule r " +
           "JOIN r.legalEntity le " +
           "WHERE r.active = true " +
           "GROUP BY le.entityId, le.entityName " +
           "ORDER BY le.entityName")
    List<Object[]> countRulesByLegalEntity();
    
    /**
     * 查找销售佣金率最高的规则
     */
    @Query("SELECT r FROM ProtocolRevenueRule r WHERE r.active = true ORDER BY r.salesCommissionRate DESC")
    List<ProtocolRevenueRule> findRulesBySalesCommissionDesc();
    
    /**
     * 查找操作佣金率最高的规则
     */
    @Query("SELECT r FROM ProtocolRevenueRule r WHERE r.active = true ORDER BY r.operationCommissionRate DESC")
    List<ProtocolRevenueRule> findRulesByOperationCommissionDesc();
    
    /**
     * 查找指定范围内的销售佣金率规则
     */
    @Query("SELECT r FROM ProtocolRevenueRule r " +
           "WHERE r.active = true AND r.salesCommissionRate BETWEEN :minRate AND :maxRate " +
           "ORDER BY r.salesCommissionRate DESC")
    List<ProtocolRevenueRule> findRulesBySalesCommissionRange(
        @Param("minRate") Double minRate, @Param("maxRate") Double maxRate);
    
    /**
     * 删除协议的所有分润规则
     */
    @Query("UPDATE ProtocolRevenueRule r SET r.active = false WHERE r.protocolId = :protocolId")
    void deactivateRulesByProtocol(@Param("protocolId") String protocolId);
}