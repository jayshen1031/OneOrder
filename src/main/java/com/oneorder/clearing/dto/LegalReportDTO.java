package com.oneorder.clearing.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 法定报表DTO
 */
@Data
public class LegalReportDTO {
    
    /**
     * 报表标题
     */
    private String reportTitle = "法定报表";
    
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
     * 法人体报表数据
     */
    private List<LegalEntityReport> entityReports;
    
    /**
     * 合并汇总数据
     */
    private ConsolidatedSummary consolidatedSummary;
    
    /**
     * 税务信息
     */
    private TaxInformation taxInformation;
    
    @Data
    public static class LegalEntityReport {
        /**
         * 法人体ID
         */
        private String entityId;
        
        /**
         * 法人体名称
         */
        private String entityName;
        
        /**
         * 税务登记号
         */
        private String taxRegistrationNo;
        
        /**
         * 地区/国家
         */
        private String region;
        private String country;
        
        /**
         * 币种
         */
        private String currency;
        
        /**
         * 营业收入
         */
        private BigDecimal operatingRevenue = BigDecimal.ZERO;
        
        /**
         * 营业成本
         */
        private BigDecimal operatingCost = BigDecimal.ZERO;
        
        /**
         * 营业利润
         */
        private BigDecimal operatingProfit = BigDecimal.ZERO;
        
        /**
         * 应收账款
         */
        private BigDecimal accountsReceivable = BigDecimal.ZERO;
        
        /**
         * 应付账款
         */
        private BigDecimal accountsPayable = BigDecimal.ZERO;
        
        /**
         * 其他应收款
         */
        private BigDecimal otherReceivables = BigDecimal.ZERO;
        
        /**
         * 其他应付款
         */
        private BigDecimal otherPayables = BigDecimal.ZERO;
        
        /**
         * 法人体留存
         */
        private BigDecimal entityRetention = BigDecimal.ZERO;
        
        /**
         * 净资产变动
         */
        private BigDecimal netAssetChange = BigDecimal.ZERO;
        
        /**
         * 资产负债表相关项目
         */
        private BalanceSheetItems balanceSheetItems;
        
        /**
         * 利润表相关项目
         */
        private IncomeStatementItems incomeStatementItems;
    }
    
    @Data
    public static class BalanceSheetItems {
        /**
         * 流动资产
         */
        private BigDecimal currentAssets = BigDecimal.ZERO;
        
        /**
         * 非流动资产
         */
        private BigDecimal nonCurrentAssets = BigDecimal.ZERO;
        
        /**
         * 流动负债
         */
        private BigDecimal currentLiabilities = BigDecimal.ZERO;
        
        /**
         * 非流动负债
         */
        private BigDecimal nonCurrentLiabilities = BigDecimal.ZERO;
        
        /**
         * 所有者权益
         */
        private BigDecimal ownersEquity = BigDecimal.ZERO;
    }
    
    @Data
    public static class IncomeStatementItems {
        /**
         * 主营业务收入
         */
        private BigDecimal primaryBusinessRevenue = BigDecimal.ZERO;
        
        /**
         * 主营业务成本
         */
        private BigDecimal primaryBusinessCost = BigDecimal.ZERO;
        
        /**
         * 营业税金及附加
         */
        private BigDecimal businessTaxAndSurcharges = BigDecimal.ZERO;
        
        /**
         * 销售费用
         */
        private BigDecimal sellingExpenses = BigDecimal.ZERO;
        
        /**
         * 管理费用
         */
        private BigDecimal managementExpenses = BigDecimal.ZERO;
        
        /**
         * 财务费用
         */
        private BigDecimal financialExpenses = BigDecimal.ZERO;
    }
    
    @Data
    public static class ConsolidatedSummary {
        /**
         * 总营业收入
         */
        private BigDecimal totalOperatingRevenue = BigDecimal.ZERO;
        
        /**
         * 总营业成本
         */
        private BigDecimal totalOperatingCost = BigDecimal.ZERO;
        
        /**
         * 总营业利润
         */
        private BigDecimal totalOperatingProfit = BigDecimal.ZERO;
        
        /**
         * 内部交易抵消
         */
        private BigDecimal internalTransactionElimination = BigDecimal.ZERO;
        
        /**
         * 合并净利润
         */
        private BigDecimal consolidatedNetProfit = BigDecimal.ZERO;
        
        /**
         * 合并资产总额
         */
        private BigDecimal consolidatedTotalAssets = BigDecimal.ZERO;
        
        /**
         * 合并负债总额
         */
        private BigDecimal consolidatedTotalLiabilities = BigDecimal.ZERO;
        
        /**
         * 合并净资产
         */
        private BigDecimal consolidatedNetAssets = BigDecimal.ZERO;
    }
    
    @Data
    public static class TaxInformation {
        /**
         * 增值税
         */
        private BigDecimal valueAddedTax = BigDecimal.ZERO;
        
        /**
         * 企业所得税
         */
        private BigDecimal corporateIncomeTax = BigDecimal.ZERO;
        
        /**
         * 其他税费
         */
        private BigDecimal otherTaxes = BigDecimal.ZERO;
        
        /**
         * 税收优惠
         */
        private BigDecimal taxIncentives = BigDecimal.ZERO;
        
        /**
         * 应纳税所得额
         */
        private BigDecimal taxableIncome = BigDecimal.ZERO;
        
        /**
         * 实际税率
         */
        private BigDecimal effectiveTaxRate = BigDecimal.ZERO;
    }
    
    public LegalReportDTO() {
        this.generatedAt = LocalDateTime.now();
        this.consolidatedSummary = new ConsolidatedSummary();
        this.taxInformation = new TaxInformation();
    }
}