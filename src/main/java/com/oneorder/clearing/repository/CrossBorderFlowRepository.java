package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.CrossBorderFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 过账流程存储库
 */
@Repository
public interface CrossBorderFlowRepository extends JpaRepository<CrossBorderFlow, String> {
    
    /**
     * 查找所有活跃的过账流程
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByIsActiveTrueOrderByFlowId();
    
    /**
     * 根据过账类型查找活跃的过账流程
     * @param flowType 过账类型
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByFlowTypeAndIsActiveTrueOrderByFlowId(CrossBorderFlow.FlowType flowType);
    
    /**
     * 根据付款方查找相关的过账流程
     * @param payerEntityId 付款方法人ID
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByPayerEntityIdAndIsActiveTrue(String payerEntityId);
    
    /**
     * 根据收款方查找相关的过账流程
     * @param receiverEntityId 收款方法人ID
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByReceiverEntityIdAndIsActiveTrue(String receiverEntityId);
    
    /**
     * 根据过账方查找相关的过账流程
     * @param transitEntityId 过账方法人ID
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByTransitEntityIdAndIsActiveTrue(String transitEntityId);
    
    /**
     * 查找支持抵消的过账流程
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByNettingEnabledTrueAndIsActiveTrueOrderByNettingPriority();
    
    /**
     * 根据地区组合查找过账流程
     * @param payerRegion 付款方地区
     * @param receiverRegion 收款方地区
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByPayerRegionAndReceiverRegionAndIsActiveTrue(String payerRegion, String receiverRegion);
    
    /**
     * 根据处理方式查找过账流程
     * @param processingType 处理方式
     * @return 过账流程列表
     */
    List<CrossBorderFlow> findByProcessingTypeAndIsActiveTrueOrderByFlowId(CrossBorderFlow.ProcessingType processingType);
}