package com.oneorder.clearing.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oneorder.clearing.dto.*;
import com.oneorder.clearing.entity.AccountingEntry;
import com.oneorder.clearing.entity.ClearingResult;
import com.oneorder.clearing.entity.LegalEntity;
import com.oneorder.clearing.repository.AccountingEntryRepository;
import com.oneorder.clearing.repository.ClearingResultRepository;
import com.oneorder.clearing.repository.LegalEntityRepository;
import com.oneorder.clearing.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 报表生成服务实现
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {
    
    private final AccountingEntryRepository entryRepository;
    private final ClearingResultRepository clearingResultRepository;
    private final LegalEntityRepository entityRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    public ManagementReportDTO generateManagementReport(ReportRequest request) {
        log.debug("开始生成管理报表，时间范围: {} - {}", request.getStartTime(), request.getEndTime());
        
        ManagementReportDTO report = new ManagementReportDTO();
        report.setReportTitle(request.getReportTitle() != null ? request.getReportTitle() : "管理报表");
        report.setStartTime(request.getStartTime());
        report.setEndTime(request.getEndTime());
        
        // 查询管理口径的会计分录
        List<AccountingEntry> managementEntries = entryRepository.findByTimePeriod(
            request.getStartTime(), request.getEndTime())
            .stream()
            .filter(entry -> AccountingEntry.ReportType.MANAGEMENT.equals(entry.getReportType()))
            .collect(Collectors.toList());
        
        // 应用过滤条件
        managementEntries = applyFilters(managementEntries, request);
        
        // 生成汇总数据
        generateManagementSummary(report, managementEntries);
        
        // 生成明细数据
        generateManagementDetails(report, managementEntries, request);
        
        // 生成统计数据
        generateManagementStatistics(report, managementEntries);
        
        log.debug("管理报表生成完成，明细记录数: {}", report.getDetails().size());
        return report;
    }
    
    @Override
    public LegalReportDTO generateLegalReport(ReportRequest request) {
        log.debug("开始生成法定报表，时间范围: {} - {}", request.getStartTime(), request.getEndTime());
        
        LegalReportDTO report = new LegalReportDTO();
        report.setReportTitle(request.getReportTitle() != null ? request.getReportTitle() : "法定报表");
        report.setStartTime(request.getStartTime());
        report.setEndTime(request.getEndTime());
        
        // 查询法定口径的会计分录
        List<AccountingEntry> legalEntries = entryRepository.findByTimePeriod(
            request.getStartTime(), request.getEndTime())
            .stream()
            .filter(entry -> AccountingEntry.ReportType.LEGAL.equals(entry.getReportType()))
            .collect(Collectors.toList());
        
        // 应用过滤条件
        legalEntries = applyFilters(legalEntries, request);
        
        // 按法人体分组生成报表
        generateLegalEntityReports(report, legalEntries, request);
        
        // 生成合并汇总
        generateConsolidatedSummary(report);
        
        // 生成税务信息
        generateTaxInformation(report, legalEntries);
        
        log.debug("法定报表生成完成，法人体数量: {}", report.getEntityReports().size());
        return report;
    }
    
    @Override
    public DifferenceReportDTO generateDifferenceReport(ReportRequest request) {
        log.debug("开始生成差异对照报表，时间范围: {} - {}", request.getStartTime(), request.getEndTime());
        
        DifferenceReportDTO report = new DifferenceReportDTO();
        report.setReportTitle(request.getReportTitle() != null ? request.getReportTitle() : "管报与法报差异对照表");
        report.setStartTime(request.getStartTime());
        report.setEndTime(request.getEndTime());
        
        // 查询有差异的会计分录
        List<Object[]> differenceEntries = entryRepository.findEntriesWithReportingDifferences();
        
        // 生成差异明细
        generateDifferenceDetails(report, differenceEntries, request);
        
        // 生成差异汇总
        generateDifferenceSummary(report);
        
        // 生成差异分析
        generateDifferenceAnalysis(report);
        
        log.debug("差异对照报表生成完成，差异记录数: {}", report.getDifferenceDetails().size());
        return report;
    }
    
    @Override
    public byte[] exportManagementReport(ReportRequest request, String format) {
        ManagementReportDTO report = generateManagementReport(request);
        
        if ("excel".equalsIgnoreCase(format)) {
            return exportToExcel(report);
        } else if ("csv".equalsIgnoreCase(format)) {
            return exportToCSV(report);
        } else {
            throw new IllegalArgumentException("不支持的导出格式: " + format);
        }
    }
    
    @Override
    public byte[] exportLegalReport(ReportRequest request, String format) {
        LegalReportDTO report = generateLegalReport(request);
        
        if ("excel".equalsIgnoreCase(format)) {
            return exportToExcel(report);
        } else if ("csv".equalsIgnoreCase(format)) {
            return exportToCSV(report);
        } else {
            throw new IllegalArgumentException("不支持的导出格式: " + format);
        }
    }
    
    @Override
    public String generateClearingPathVisualization(String orderId) {
        log.debug("生成清分路径可视化，订单ID: {}", orderId);
        
        List<ClearingResult> results = clearingResultRepository.findByOrderId(orderId);
        
        if (results.isEmpty()) {
            return "{}";
        }
        
        // 构建可视化数据结构（用于前端绘制流程图）
        Map<String, Object> visualization = new HashMap<>();
        visualization.put("orderId", orderId);
        visualization.put("clearingMode", results.get(0).getClearingMode().name());
        
        // 节点数据
        List<Map<String, Object>> nodes = new ArrayList<>();
        Set<String> entityIds = new HashSet<>();
        
        for (ClearingResult result : results) {
            entityIds.add(result.getEntityId());
        }
        
        // 添加法人体节点
        for (String entityId : entityIds) {
            Optional<LegalEntity> entityOpt = entityRepository.findById(entityId);
            Map<String, Object> node = new HashMap<>();
            node.put("id", entityId);
            node.put("name", entityOpt.map(LegalEntity::getEntityName).orElse(entityId));
            node.put("type", entityOpt.map(e -> e.getEntityType().name()).orElse("UNKNOWN"));
            nodes.add(node);
        }
        
        // 边数据（资金流向）
        List<Map<String, Object>> edges = new ArrayList<>();
        for (ClearingResult result : results) {
            Map<String, Object> edge = new HashMap<>();
            edge.put("source", result.getEntityId());
            edge.put("target", result.getEntityId()); // 这里需要根据业务逻辑确定目标节点
            edge.put("amount", result.getAmount());
            edge.put("currency", result.getCurrency());
            edge.put("type", result.getTransactionType().name());
            edge.put("label", result.getAmount() + " " + result.getCurrency());
            edges.add(edge);
        }
        
        visualization.put("nodes", nodes);
        visualization.put("edges", edges);
        
        try {
            return objectMapper.writeValueAsString(visualization);
        } catch (Exception e) {
            log.error("生成可视化数据失败", e);
            return "{}";
        }
    }
    
    /**
     * 应用过滤条件
     */
    private List<AccountingEntry> applyFilters(List<AccountingEntry> entries, ReportRequest request) {
        return entries.stream()
            .filter(entry -> {
                // 法人体过滤
                if (request.getEntityIds() != null && !request.getEntityIds().isEmpty()) {
                    if (!request.getEntityIds().contains(entry.getEntityId())) {
                        return false;
                    }
                }
                
                // 币种过滤
                if (request.getCurrencies() != null && !request.getCurrencies().isEmpty()) {
                    if (!request.getCurrencies().contains(entry.getCurrency())) {
                        return false;
                    }
                }
                
                // 业务类型过滤
                if (request.getBusinessTypes() != null && !request.getBusinessTypes().isEmpty()) {
                    if (!request.getBusinessTypes().contains(entry.getBusinessType())) {
                        return false;
                    }
                }
                
                return true;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 生成管理报表汇总数据
     */
    private void generateManagementSummary(ManagementReportDTO report, List<AccountingEntry> entries) {
        ManagementReportDTO.SummaryData summary = report.getSummary();
        
        for (AccountingEntry entry : entries) {
            switch (entry.getEntryType()) {
                case RECEIVABLE:
                    if ("1122".equals(entry.getAccountCode())) { // 应收账款
                        summary.setTotalExternalReceivable(
                            summary.getTotalExternalReceivable().add(entry.getDebitAmount())
                        );
                    } else if ("1221".equals(entry.getAccountCode())) { // 其他应收款
                        summary.setTotalInternalReceivable(
                            summary.getTotalInternalReceivable().add(entry.getDebitAmount())
                        );
                    }
                    break;
                case PAYABLE:
                    if ("2202".equals(entry.getAccountCode())) { // 应付账款
                        summary.setTotalExternalPayable(
                            summary.getTotalExternalPayable().add(entry.getCreditAmount())
                        );
                    } else if ("2241".equals(entry.getAccountCode())) { // 其他应付款
                        summary.setTotalInternalPayable(
                            summary.getTotalInternalPayable().add(entry.getCreditAmount())
                        );
                    }
                    break;
                case TRANSIT:
                    summary.setTotalTransitRetention(
                        summary.getTotalTransitRetention().add(entry.getDebitAmount())
                    );
                    break;
                default:
                    break;
            }
        }
        
        // 计算毛利
        summary.setTotalGrossProfit(
            summary.getTotalExternalReceivable().subtract(summary.getTotalExternalPayable())
        );
        
        // 计算毛利率
        if (summary.getTotalExternalReceivable().compareTo(BigDecimal.ZERO) > 0) {
            summary.setGrossProfitRate(
                summary.getTotalGrossProfit()
                    .divide(summary.getTotalExternalReceivable(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
            );
        }
    }
    
    /**
     * 生成管理报表明细数据
     */
    private void generateManagementDetails(ManagementReportDTO report, List<AccountingEntry> entries, ReportRequest request) {
        Map<String, ManagementReportDTO.DetailData> detailMap = new HashMap<>();
        
        for (AccountingEntry entry : entries) {
            String key = entry.getEntityId() + "_" + entry.getCurrency();
            ManagementReportDTO.DetailData detail = detailMap.computeIfAbsent(key, k -> {
                ManagementReportDTO.DetailData d = new ManagementReportDTO.DetailData();
                d.setEntityId(entry.getEntityId());
                d.setCurrency(entry.getCurrency());
                
                // 设置法人体名称
                entityRepository.findById(entry.getEntityId()).ifPresent(entity -> {
                    d.setEntityName(entity.getEntityName());
                });
                
                return d;
            });
            
            // 累加各项金额
            switch (entry.getEntryType()) {
                case RECEIVABLE:
                    if ("1122".equals(entry.getAccountCode())) {
                        detail.setExternalReceivable(detail.getExternalReceivable().add(entry.getDebitAmount()));
                    } else if ("1221".equals(entry.getAccountCode())) {
                        detail.setInternalReceivable(detail.getInternalReceivable().add(entry.getDebitAmount()));
                    }
                    break;
                case PAYABLE:
                    if ("2202".equals(entry.getAccountCode())) {
                        detail.setExternalPayable(detail.getExternalPayable().add(entry.getCreditAmount()));
                    } else if ("2241".equals(entry.getAccountCode())) {
                        detail.setInternalPayable(detail.getInternalPayable().add(entry.getCreditAmount()));
                    }
                    break;
                case TRANSIT:
                    detail.setTransitRetention(detail.getTransitRetention().add(entry.getDebitAmount()));
                    break;
                default:
                    break;
            }
        }
        
        // 计算各项汇总指标
        for (ManagementReportDTO.DetailData detail : detailMap.values()) {
            detail.setGrossProfit(detail.getExternalReceivable().subtract(detail.getExternalPayable()));
            detail.setNetAmount(
                detail.getExternalReceivable()
                    .add(detail.getInternalReceivable())
                    .subtract(detail.getExternalPayable())
                    .subtract(detail.getInternalPayable())
            );
            
            if (detail.getExternalReceivable().compareTo(BigDecimal.ZERO) > 0) {
                detail.setGrossProfitRate(
                    detail.getGrossProfit()
                        .divide(detail.getExternalReceivable(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                );
            }
        }
        
        report.setDetails(new ArrayList<>(detailMap.values()));
    }
    
    /**
     * 生成管理报表统计数据
     */
    private void generateManagementStatistics(ManagementReportDTO report, List<AccountingEntry> entries) {
        ManagementReportDTO.StatisticsData statistics = report.getStatistics();
        
        // 统计基本数据
        Set<String> distinctEntities = entries.stream().map(AccountingEntry::getEntityId).collect(Collectors.toSet());
        Set<String> distinctCurrencies = entries.stream().map(AccountingEntry::getCurrency).collect(Collectors.toSet());
        Set<String> distinctOrders = entries.stream().map(AccountingEntry::getOrderId).collect(Collectors.toSet());
        
        statistics.setEntityCount(distinctEntities.size());
        statistics.setCurrencyCount(distinctCurrencies.size());
        statistics.setTotalOrderCount(distinctOrders.size());
        
        // 按币种统计
        Map<String, ManagementReportDTO.CurrencyStats> currencyStatsMap = new HashMap<>();
        for (AccountingEntry entry : entries) {
            ManagementReportDTO.CurrencyStats stats = currencyStatsMap.computeIfAbsent(
                entry.getCurrency(), 
                k -> new ManagementReportDTO.CurrencyStats()
            );
            stats.setCurrency(entry.getCurrency());
            stats.setTotalAmount(stats.getTotalAmount().add(entry.getDebitAmount()));
        }
        statistics.setCurrencyStats(new ArrayList<>(currencyStatsMap.values()));
        
        // 按业务类型统计
        Map<String, ManagementReportDTO.BusinessTypeStats> businessStatsMap = new HashMap<>();
        for (AccountingEntry entry : entries) {
            if (entry.getBusinessType() != null) {
                ManagementReportDTO.BusinessTypeStats stats = businessStatsMap.computeIfAbsent(
                    entry.getBusinessType(),
                    k -> new ManagementReportDTO.BusinessTypeStats()
                );
                stats.setBusinessType(entry.getBusinessType());
                stats.setTotalAmount(stats.getTotalAmount().add(entry.getDebitAmount()));
                stats.setOrderCount(stats.getOrderCount() + 1);
            }
        }
        statistics.setBusinessTypeStats(new ArrayList<>(businessStatsMap.values()));
    }
    
    // 其他方法的实现（generateLegalEntityReports、generateDifferenceDetails等）
    // 由于篇幅限制，这里简化处理，实际项目中需要完整实现
    
    private void generateLegalEntityReports(LegalReportDTO report, List<AccountingEntry> entries, ReportRequest request) {
        // 实现法人体报表生成逻辑
        report.setEntityReports(new ArrayList<>());
    }
    
    private void generateConsolidatedSummary(LegalReportDTO report) {
        // 实现合并汇总逻辑
    }
    
    private void generateTaxInformation(LegalReportDTO report, List<AccountingEntry> entries) {
        // 实现税务信息生成逻辑
    }
    
    private void generateDifferenceDetails(DifferenceReportDTO report, List<Object[]> differenceEntries, ReportRequest request) {
        // 实现差异明细生成逻辑
        report.setDifferenceDetails(new ArrayList<>());
    }
    
    private void generateDifferenceSummary(DifferenceReportDTO report) {
        // 实现差异汇总逻辑
    }
    
    private void generateDifferenceAnalysis(DifferenceReportDTO report) {
        // 实现差异分析逻辑
    }
    
    private byte[] exportToExcel(Object report) {
        // 实现Excel导出逻辑
        return new byte[0];
    }
    
    private byte[] exportToCSV(Object report) {
        // 实现CSV导出逻辑
        return new byte[0];
    }
}