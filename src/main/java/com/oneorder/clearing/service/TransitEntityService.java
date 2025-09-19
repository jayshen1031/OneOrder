package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.TransitEntity;
import com.oneorder.clearing.entity.Order;
import com.oneorder.clearing.entity.ClearingResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * 借抬头服务接口
 */
public interface TransitEntityService {
    
    /**
     * 根据账号判断是否为借抬头
     * @param accountNumber 账号
     * @return 借抬头实体（如果是借抬头）
     */
    Optional<TransitEntity> findTransitEntityByAccount(String accountNumber);
    
    /**
     * 根据法人号判断是否为借抬头
     * @param legalEntityId 法人ID
     * @param transitType 借抬头类型
     * @return 借抬头实体（如果是借抬头）
     */
    Optional<TransitEntity> findTransitEntityByLegalEntity(String legalEntityId, TransitEntity.TransitType transitType);
    
    /**
     * 判断订单是否需要借抬头处理
     * @param order 订单
     * @return 是否需要借抬头处理
     */
    boolean requiresTransitEntity(Order order);
    
    /**
     * 处理收款借抬头流转
     * 客户 → 中间法人 → 销售法人
     * @param order 订单
     * @param amount 金额
     * @return 清分结果列表
     */
    List<ClearingResult> processReceivableTransit(Order order, BigDecimal amount);
    
    /**
     * 处理付款借抬头流转
     * 销售法人 → 中间法人 → 供应商法人
     * @param order 订单
     * @param amount 金额
     * @return 清分结果列表
     */
    List<ClearingResult> processPayableTransit(Order order, BigDecimal amount);
    
    /**
     * 计算借抬头留存金额
     * @param transitEntity 借抬头实体
     * @param originalAmount 原始金额
     * @return 留存金额
     */
    BigDecimal calculateRetentionAmount(TransitEntity transitEntity, BigDecimal originalAmount);
    
    /**
     * 获取适用的借抬头配置
     * @param order 订单
     * @param transitType 借抬头类型
     * @return 借抬头实体列表
     */
    List<TransitEntity> getApplicableTransitEntities(Order order, TransitEntity.TransitType transitType);
}