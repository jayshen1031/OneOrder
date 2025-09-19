package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.ClearingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 清分规则Repository
 */
@Repository
public interface ClearingRuleRepository extends JpaRepository<ClearingRule, String> {
    
    /**
     * 根据规则类型查询启用的规则
     */
    List<ClearingRule> findByRuleTypeAndIsActiveTrue(ClearingRule.RuleType ruleType);
    
    /**
     * 根据优先级排序查询启用的规则
     */
    List<ClearingRule> findByIsActiveTrueOrderByPriorityAsc();
    
    /**
     * 查询特定法人体适用的规则
     */
    @Query("SELECT r FROM ClearingRule r WHERE r.isActive = true " +
           "AND (r.applicableScope IS NULL OR r.applicableScope LIKE %:entityId%) " +
           "ORDER BY r.priority ASC")
    List<ClearingRule> findApplicableRulesForEntity(@Param("entityId") String entityId);
    
    /**
     * 根据业务类型查询适用规则
     */
    @Query("SELECT r FROM ClearingRule r WHERE r.isActive = true " +
           "AND (r.applicableScope IS NULL OR r.applicableScope LIKE %:businessType%) " +
           "ORDER BY r.priority ASC")
    List<ClearingRule> findApplicableRulesForBusinessType(@Param("businessType") String businessType);
    
    /**
     * 查询指定规则类型和优先级范围的规则
     */
    List<ClearingRule> findByRuleTypeAndIsActiveTrueAndPriorityBetweenOrderByPriorityAsc(
            ClearingRule.RuleType ruleType, Integer minPriority, Integer maxPriority);
}