package com.oneorder.clearing.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 差异对照报表DTO
 */
@Data
public class DifferenceReportDTO {
    
    /**
     * 报表标题
     */
    private String reportTitle = "管报与法报差异对照表";
    
    /**
     * 报表时间范围
     */
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    /**
     * 生成时间
     */
    private LocalDateTime generatedAt;
    
    /**
     * 差异明细
     */
    private List<DifferenceDetail> differenceDetails;
    
    /**
     * 差异汇总
     */
    private DifferenceSummary differenceSummary;
    
    /**
     * 差异分析
     */
    private DifferenceAnalysis differenceAnalysis;
    
    @Data
    public static class DifferenceDetail {
        /**
         * 订单ID
         */
        private String orderId;
        
        /**
         * 订单编号
         */
        private String orderNo;
        
        /**
         * 法人体ID
         */
        private String entityId;
        
        /**
         * 法人体名称
         */
        private String entityName;
        
        /**
         * 币种
         */
        private String currency;
        
        /**
         * 科目代码
         */
        private String accountCode;
        
        /**
         * 科目名称
         */
        private String accountName;
        
        /**
         * 管理口径金额
         */
        private BigDecimal managementAmount = BigDecimal.ZERO;
        
        /**
         * 法定口径金额
         */
        private BigDecimal legalAmount = BigDecimal.ZERO;
        
        /**
         * 差异金额
         */
        private BigDecimal differenceAmount = BigDecimal.ZERO;
        
        /**
         * 差异率
         */
        private BigDecimal differenceRate = BigDecimal.ZERO;
        
        /**
         * 差异类型
         */
        private DifferenceType differenceType;
        
        /**
         * 差异原因
         */
        private String differenceReason;
        
        /**
         * 业务类型
         */
        private String businessType;
        
        /**
         * 清分模式
         */
        private String clearingMode;
        
        /**
         * 创建时间
         */
        private LocalDateTime createdAt;
        
        /**
         * 备注
         */
        private String remarks;
    }
    
    @Data
    public static class DifferenceSummary {
        /**
         * 总差异项目数
         */
        private Integer totalDifferenceCount = 0;
        
        /**
         * 有差异的法人体数量
         */
        private Integer entityWithDifferenceCount = 0;
        
        /**
         * 有差异的订单数量
         */
        private Integer orderWithDifferenceCount = 0;
        
        /**
         * 按币种分组的差异汇总
         */
        private List<CurrencyDifferenceSummary> currencyDifferenceSummaries;
        
        /**
         * 按差异类型分组的汇总
         */
        private List<TypeDifferenceSummary> typeDifferenceSummaries;
        
        /**
         * 按法人体分组的差异汇总
         */
        private List<EntityDifferenceSummary> entityDifferenceSummaries;
    }
    
    @Data
    public static class CurrencyDifferenceSummary {
        private String currency;
        private BigDecimal totalManagementAmount = BigDecimal.ZERO;
        private BigDecimal totalLegalAmount = BigDecimal.ZERO;
        private BigDecimal totalDifferenceAmount = BigDecimal.ZERO;
        private Integer recordCount = 0;
    }
    
    @Data
    public static class TypeDifferenceSummary {
        private DifferenceType differenceType;
        private String differenceTypeDescription;
        private BigDecimal totalDifferenceAmount = BigDecimal.ZERO;
        private Integer recordCount = 0;
        private BigDecimal avgDifferenceAmount = BigDecimal.ZERO;
    }
    
    @Data
    public static class EntityDifferenceSummary {
        private String entityId;
        private String entityName;
        private BigDecimal totalDifferenceAmount = BigDecimal.ZERO;
        private Integer recordCount = 0;
        private BigDecimal maxDifferenceAmount = BigDecimal.ZERO;
        private String mostCommonReason;
    }
    
    @Data
    public static class DifferenceAnalysis {
        /**
         * 主要差异原因分析
         */
        private List<ReasonAnalysis> reasonAnalyses;
        
        /**
         * 差异趋势分析
         */
        private TrendAnalysis trendAnalysis;
        
        /**
         * 风险评估
         */
        private RiskAssessment riskAssessment;
        
        /**
         * 建议措施
         */
        private List<String> recommendations;
    }
    
    @Data
    public static class ReasonAnalysis {
        private String reason;
        private Integer occurrenceCount = 0;
        private BigDecimal totalDifferenceAmount = BigDecimal.ZERO;
        private BigDecimal percentage = BigDecimal.ZERO;
        private String impact; // HIGH, MEDIUM, LOW
    }
    
    @Data
    public static class TrendAnalysis {
        /**
         * 差异金额趋势（增长/减少）
         */
        private String amountTrend;
        
        /**
         * 差异数量趋势
         */
        private String countTrend;
        
        /**
         * 月度差异统计
         */
        private List<MonthlyDifference> monthlyDifferences;
    }
    
    @Data
    public static class MonthlyDifference {
        private String month;
        private BigDecimal differenceAmount = BigDecimal.ZERO;
        private Integer differenceCount = 0;
    }
    
    @Data
    public static class RiskAssessment {
        /**
         * 整体风险等级
         */
        private String riskLevel; // HIGH, MEDIUM, LOW
        
        /**
         * 高风险项目数量
         */
        private Integer highRiskCount = 0;
        
        /**
         * 风险金额
         */
        private BigDecimal riskAmount = BigDecimal.ZERO;
        
        /**
         * 主要风险点
         */
        private List<String> majorRiskPoints;
    }
    
    public enum DifferenceType {
        PROFIT_SHARING("分润差异"),
        RETENTION("留存差异"),
        TAX_ADJUSTMENT("税务调整"),
        POLICY_ADJUSTMENT("政策性调整"),
        ACCOUNTING_STANDARD("会计准则差异"),
        OTHER("其他差异");
        
        private final String description;
        
        DifferenceType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public DifferenceReportDTO() {
        this.generatedAt = LocalDateTime.now();
        this.differenceSummary = new DifferenceSummary();
        this.differenceAnalysis = new DifferenceAnalysis();
    }
}