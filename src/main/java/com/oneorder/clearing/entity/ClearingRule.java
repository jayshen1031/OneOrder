package com.oneorder.clearing.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

/**
 * 清分规则实体
 */
@Entity
@Table(name = "clearing_rules")
@Data
@EqualsAndHashCode(callSuper = true)
public class ClearingRule extends BaseEntity {
    
    @Id
    @Column(name = "rule_id", length = 50)
    private String ruleId;
    
    /**
     * 规则名称
     */
    @Column(name = "rule_name", nullable = false, length = 200)
    private String ruleName;
    
    /**
     * 规则类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false)
    private RuleType ruleType;
    
    /**
     * 规则配置（JSON格式）
     */
    @Column(name = "rule_config", columnDefinition = "TEXT")
    private String ruleConfig;
    
    /**
     * 优先级（数值越小优先级越高）
     */
    @Column(name = "priority", nullable = false)
    private Integer priority;
    
    /**
     * 是否启用
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    /**
     * 适用范围（JSON格式）
     */
    @Column(name = "applicable_scope", columnDefinition = "TEXT")
    private String applicableScope;
    
    /**
     * 条件表达式
     */
    @Column(name = "condition_expression", columnDefinition = "TEXT")
    private String conditionExpression;
    
    /**
     * 规则描述
     */
    @Column(name = "description", length = 1000)
    private String description;
    
    public enum RuleType {
        CLEARING_MODE("清分模式"),
        PROFIT_SHARING("分润规则"),
        TRANSIT_ENTITY("借抬头规则"),
        CROSS_BORDER("过账规则"),
        NETTING("净额规则"),
        RETENTION("留存规则");
        
        private final String description;
        
        RuleType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}