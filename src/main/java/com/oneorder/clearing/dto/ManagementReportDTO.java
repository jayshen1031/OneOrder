package com.oneorder.clearing.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 管理报表DTO
 */
@Data
public class ManagementReportDTO {
    
    /**
     * 报表标题
     */
    private String reportTitle = "管理报表";
    
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
     * 汇总数据
     */
    private SummaryData summary;
    
    /**
     * 明细数据
     */
    private List<DetailData> details;
    
    /**
     * 统计数据
     */
    private StatisticsData statistics;
    
    @Data
    public static class SummaryData {
        /**
         * 总外收
         */
        private BigDecimal totalExternalReceivable = BigDecimal.ZERO;
        
        /**
         * 总外支
         */
        private BigDecimal totalExternalPayable = BigDecimal.ZERO;
        
        /**
         * 总内收
         */
        private BigDecimal totalInternalReceivable = BigDecimal.ZERO;
        
        /**
         * 总内支
         */
        private BigDecimal totalInternalPayable = BigDecimal.ZERO;
        
        /**
         * 总毛利
         */
        private BigDecimal totalGrossProfit = BigDecimal.ZERO;
        
        /**
         * 毛利率
         */
        private BigDecimal grossProfitRate = BigDecimal.ZERO;
        
        /**
         * 中转留存总额
         */
        private BigDecimal totalTransitRetention = BigDecimal.ZERO;
        
        /**
         * 净额抵消总额
         */
        private BigDecimal totalNetting = BigDecimal.ZERO;
    }
    
    @Data
    public static class DetailData {
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
         * 外收
         */
        private BigDecimal externalReceivable = BigDecimal.ZERO;
        
        /**
         * 外支
         */
        private BigDecimal externalPayable = BigDecimal.ZERO;
        
        /**
         * 内收
         */
        private BigDecimal internalReceivable = BigDecimal.ZERO;
        
        /**
         * 内支
         */
        private BigDecimal internalPayable = BigDecimal.ZERO;
        
        /**
         * 毛利
         */
        private BigDecimal grossProfit = BigDecimal.ZERO;
        
        /**
         * 毛利率
         */
        private BigDecimal grossProfitRate = BigDecimal.ZERO;
        
        /**
         * 净收支
         */
        private BigDecimal netAmount = BigDecimal.ZERO;
        
        /**
         * 订单数量
         */
        private Integer orderCount = 0;
        
        /**
         * 中转留存
         */
        private BigDecimal transitRetention = BigDecimal.ZERO;
    }
    
    @Data
    public static class StatisticsData {
        /**
         * 总订单数
         */
        private Integer totalOrderCount = 0;
        
        /**
         * 涉及法人体数量
         */
        private Integer entityCount = 0;
        
        /**
         * 币种数量
         */
        private Integer currencyCount = 0;
        
        /**
         * 按币种统计
         */
        private List<CurrencyStats> currencyStats;
        
        /**
         * 按业务类型统计
         */
        private List<BusinessTypeStats> businessTypeStats;
    }
    
    @Data
    public static class CurrencyStats {
        private String currency;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private Integer orderCount = 0;
        private BigDecimal percentage = BigDecimal.ZERO;
    }
    
    @Data
    public static class BusinessTypeStats {
        private String businessType;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private Integer orderCount = 0;
        private BigDecimal avgProfit = BigDecimal.ZERO;
    }
    
    public ManagementReportDTO() {
        this.generatedAt = LocalDateTime.now();
        this.summary = new SummaryData();
        this.statistics = new StatisticsData();
    }
}