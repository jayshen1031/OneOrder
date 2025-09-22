package com.oneorder.clearing.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 默认法人实体服务
 * 负责根据用户角色、部门等信息自动确定默认法人
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-21
 */
@Slf4j
@Service
public class DefaultEntityService {
    
    /**
     * 根据用户ID获取默认法人ID
     * 
     * @param userId 用户ID
     * @return 默认法人ID
     */
    public String getDefaultEntityByUserId(String userId) {
        log.debug("获取用户{}的默认法人", userId);
        
        // 根据用户ID查询用户信息（这里简化处理）
        // 在实际应用中，应该从用户服务或数据库查询用户详细信息
        
        // 模拟用户部门映射
        String departmentId = getUserDepartment(userId);
        return getDefaultEntityByDepartment(departmentId);
    }
    
    /**
     * 根据部门ID获取默认法人ID
     * 
     * @param departmentId 部门ID
     * @return 默认法人ID
     */
    public String getDefaultEntityByDepartment(String departmentId) {
        log.debug("根据部门{}获取默认法人", departmentId);
        
        if (departmentId == null) {
            return getSystemDefaultEntity();
        }
        
        // 部门与法人映射规则
        switch (departmentId) {
            case "DEPT_SALES_SH":
                return "ENTITY_SH_SALES";
            case "DEPT_OPERATION_SH":
                return "ENTITY_SH_OPERATION";
            case "DEPT_SALES_BJ":
                return "ENTITY_BJ_SALES";
            case "DEPT_OPERATION_BJ":
                return "ENTITY_BJ_OPERATION";
            case "DEPT_SALES_GZ":
                return "ENTITY_GZ_SALES";
            case "DEPT_OPERATION_GZ":
                return "ENTITY_GZ_OPERATION";
            case "DEPT_SALES_SZ":
                return "ENTITY_SZ_SALES";
            case "DEPT_OPERATION_SZ":
                return "ENTITY_SZ_OPERATION";
            default:
                // 根据部门名称模糊匹配
                if (departmentId.contains("SALES")) {
                    return "ENTITY_CN_SALES"; // 默认销售法人
                } else if (departmentId.contains("OPERATION")) {
                    return "ENTITY_CN_OPERATION"; // 默认操作法人
                } else {
                    return getSystemDefaultEntity();
                }
        }
    }
    
    /**
     * 获取用户部门（模拟实现）
     * 
     * @param userId 用户ID
     * @return 部门ID
     */
    private String getUserDepartment(String userId) {
        // 这里应该从用户管理系统查询用户所属部门
        // 现在简化为模拟数据
        if (userId == null) {
            return null;
        }
        
        // 模拟用户部门映射
        switch (userId) {
            case "USER_001":
            case "zhangmeihua":
                return "DEPT_SALES_SH";
            case "USER_002":
            case "wangqiang":
                return "DEPT_OPERATION_SH";
            case "USER_003":
                return "DEPT_SALES_BJ";
            case "USER_004":
                return "DEPT_OPERATION_BJ";
            default:
                // 默认为上海销售部
                return "DEPT_SALES_SH";
        }
    }
    
    /**
     * 获取系统默认法人
     * 
     * @return 系统默认法人ID
     */
    private String getSystemDefaultEntity() {
        return "ENTITY_CN_SALES"; // 海程邦达物流(中国)有限公司销售
    }
    
    /**
     * 获取默认法人名称
     * 
     * @param entityId 法人ID
     * @return 法人名称
     */
    public String getEntityName(String entityId) {
        if (entityId == null) {
            return "未知法人";
        }
        
        // 法人ID与名称映射
        switch (entityId) {
            case "ENTITY_SH_SALES":
                return "海程邦达物流(上海)有限公司";
            case "ENTITY_SH_OPERATION":
                return "海程邦达操作(上海)有限公司";
            case "ENTITY_BJ_SALES":
                return "海程邦达物流(北京)有限公司";
            case "ENTITY_BJ_OPERATION":
                return "海程邦达操作(北京)有限公司";
            case "ENTITY_GZ_SALES":
                return "海程邦达物流(广州)有限公司";
            case "ENTITY_GZ_OPERATION":
                return "海程邦达操作(广州)有限公司";
            case "ENTITY_SZ_SALES":
                return "海程邦达物流(深圳)有限公司";
            case "ENTITY_SZ_OPERATION":
                return "海程邦达操作(深圳)有限公司";
            case "ENTITY_CN_SALES":
                return "海程邦达物流(中国)有限公司";
            case "ENTITY_CN_OPERATION":
                return "海程邦达操作(中国)有限公司";
            default:
                return "海程邦达物流有限公司";
        }
    }
    
    /**
     * 检查是否存在法人差异
     * 
     * @param userId 用户ID
     * @param actualEntityId 实际使用的法人ID
     * @return 是否存在差异
     */
    public boolean hasEntityDifference(String userId, String actualEntityId) {
        String defaultEntityId = getDefaultEntityByUserId(userId);
        return !defaultEntityId.equals(actualEntityId);
    }
    
    /**
     * 判断是否需要借抬头审批
     * 
     * @param userId 用户ID
     * @param actualEntityId 实际法人ID
     * @param amount 金额
     * @return 是否需要审批
     */
    public boolean requiresApproval(String userId, String actualEntityId, java.math.BigDecimal amount) {
        // 1. 检查是否使用了借抬头
        if (!hasEntityDifference(userId, actualEntityId)) {
            return false; // 没有使用借抬头，不需要审批
        }
        
        // 2. 检查金额阈值
        if (amount != null && amount.compareTo(new java.math.BigDecimal("50000")) >= 0) {
            return true; // 大额借抬头需要审批
        }
        
        // 3. 检查特殊法人（跨境法人等）
        if (isSpecialEntity(actualEntityId)) {
            return true; // 特殊法人需要审批
        }
        
        return false;
    }
    
    /**
     * 检查是否为特殊法人（如海外法人）
     * 
     * @param entityId 法人ID
     * @return 是否为特殊法人
     */
    private boolean isSpecialEntity(String entityId) {
        // 海外法人需要特殊审批
        return entityId != null && (
            entityId.contains("HK") ||     // 香港法人
            entityId.contains("SG") ||     // 新加坡法人
            entityId.contains("US") ||     // 美国法人
            entityId.contains("OVERSEAS")  // 其他海外法人
        );
    }
    
    /**
     * 获取法人差异说明
     * 
     * @param userId 用户ID
     * @param actualEntityId 实际法人ID
     * @return 差异说明
     */
    public String getEntityDifferenceDescription(String userId, String actualEntityId) {
        if (!hasEntityDifference(userId, actualEntityId)) {
            return "使用默认法人，无差异";
        }
        
        String defaultEntityName = getEntityName(getDefaultEntityByUserId(userId));
        String actualEntityName = getEntityName(actualEntityId);
        
        return String.format("使用借抬头：从 %s 变更为 %s", defaultEntityName, actualEntityName);
    }
}