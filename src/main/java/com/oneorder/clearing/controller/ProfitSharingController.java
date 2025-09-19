package com.oneorder.clearing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 管理账分润计算控制器
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */
@RestController
@RequestMapping("/api/profit-sharing")
@CrossOrigin(origins = "*")
public class ProfitSharingController {
    
    private static final Logger logger = LoggerFactory.getLogger(ProfitSharingController.class);
    
    // 模拟数据存储
    private static final Map<String, List<Map<String, Object>>> departmentProfitSharing = new HashMap<>();
    private static final Map<String, Map<String, Object>> profitSharingSummary = new HashMap<>();
    private static final List<Map<String, Object>> profitSharingRules = new ArrayList<>();
    private static final List<Map<String, Object>> calculationLogs = new ArrayList<>();
    
    static {
        // 初始化分润规则数据
        initializeProfitSharingRules();
    }
    
    /**
     * 计算订单分润
     */
    @PostMapping("/calculate/{orderId}")
    public ResponseEntity<Map<String, Object>> calculateProfitSharing(
            @PathVariable String orderId,
            @RequestParam(required = false, defaultValue = "false") boolean forceRecalculate) {
        try {
            logger.info("开始计算订单分润: orderId={}, forceRecalculate={}", orderId, forceRecalculate);
            
            // 检查是否已存在计算结果
            if (!forceRecalculate && departmentProfitSharing.containsKey(orderId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 200);
                response.put("message", "分润计算结果已存在，如需重新计算请设置forceRecalculate=true");
                response.put("data", Map.of(
                    "calculationId", getExistingCalculationId(orderId),
                    "status", "ALREADY_CALCULATED",
                    "calculatedTime", LocalDateTime.now()
                ));
                return ResponseEntity.ok(response);
            }
            
            // 生成计算批次ID
            String calculationId = generateCalculationId(orderId);
            
            // 模拟获取费用明细数据（实际应从expense_entries表查询）
            List<Map<String, Object>> expenseEntries = getExpenseEntriesByOrderId(orderId);
            
            if (expenseEntries.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 400);
                response.put("message", "订单费用明细不存在，请先录入费用明细");
                return ResponseEntity.ok(response);
            }
            
            // 执行分润计算
            Map<String, Object> calculationResult = performProfitSharingCalculation(orderId, calculationId, expenseEntries);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "分润计算完成");
            response.put("data", calculationResult);
            
            logger.info("订单分润计算完成: orderId={}, calculationId={}", orderId, calculationId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("分润计算失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "分润计算失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 查询订单分润结果
     */
    @GetMapping("/result/{orderId}")
    public ResponseEntity<Map<String, Object>> getProfitSharingResult(@PathVariable String orderId) {
        try {
            logger.info("查询订单分润结果: {}", orderId);
            
            List<Map<String, Object>> departmentResults = departmentProfitSharing.get(orderId);
            Map<String, Object> summaryResult = profitSharingSummary.get(orderId);
            
            if (departmentResults == null || departmentResults.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "订单分润结果不存在");
                return ResponseEntity.ok(response);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("orderInfo", Map.of(
                "orderId", orderId,
                "calculationStatus", "CALCULATED",
                "calculatedTime", LocalDateTime.now()
            ));
            data.put("departmentResults", departmentResults);
            data.put("summary", summaryResult);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("查询分润结果失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "查询分润结果失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 获取分润规则列表
     */
    @GetMapping("/rules")
    public ResponseEntity<Map<String, Object>> getProfitSharingRules() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", profitSharingRules);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("获取分润规则失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取分润规则失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 查询计算日志
     */
    @GetMapping("/logs/{orderId}")
    public ResponseEntity<Map<String, Object>> getCalculationLogs(@PathVariable String orderId) {
        try {
            List<Map<String, Object>> orderLogs = calculationLogs.stream()
                .filter(log -> orderId.equals(log.get("orderId")))
                .sorted((a, b) -> ((LocalDateTime) b.get("createdTime")).compareTo((LocalDateTime) a.get("createdTime")))
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", orderLogs);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("查询计算日志失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "查询计算日志失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 验证分润计算平衡性
     */
    @GetMapping("/validate/{orderId}")
    public ResponseEntity<Map<String, Object>> validateProfitBalance(@PathVariable String orderId) {
        try {
            List<Map<String, Object>> departmentResults = departmentProfitSharing.get(orderId);
            if (departmentResults == null || departmentResults.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "订单分润结果不存在");
                return ResponseEntity.ok(response);
            }
            
            Map<String, Object> balanceCheck = performBalanceValidation(departmentResults);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", balanceCheck);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("平衡校验失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "平衡校验失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 获取部门分润汇总
     */
    @GetMapping("/department-summary/{orderId}")
    public ResponseEntity<Map<String, Object>> getDepartmentSummary(@PathVariable String orderId) {
        try {
            List<Map<String, Object>> departmentResults = departmentProfitSharing.get(orderId);
            if (departmentResults == null || departmentResults.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "订单分润结果不存在");
                return ResponseEntity.ok(response);
            }
            
            // 按部门汇总分润结果
            Map<String, Map<String, Object>> departmentSummary = departmentResults.stream()
                .collect(Collectors.groupingBy(
                    result -> (String) result.get("departmentId"),
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        this::aggregateDepartmentResults
                    )
                ));
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", departmentSummary.values());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("获取部门汇总失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取部门汇总失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    // ===== 私有方法 =====
    
    /**
     * 执行分润计算的核心逻辑
     */
    private Map<String, Object> performProfitSharingCalculation(String orderId, String calculationId, 
            List<Map<String, Object>> expenseEntries) {
        
        addCalculationLog(orderId, calculationId, "INFO", "CALCULATION", "开始执行分润计算");
        
        // 按服务分组费用明细
        Map<String, List<Map<String, Object>>> serviceGroups = expenseEntries.stream()
            .collect(Collectors.groupingBy(entry -> (String) entry.get("serviceCode")));
        
        List<Map<String, Object>> allDepartmentResults = new ArrayList<>();
        BigDecimal totalGrossProfit = BigDecimal.ZERO;
        
        // 遍历每个服务进行计算
        for (Map.Entry<String, List<Map<String, Object>>> serviceGroup : serviceGroups.entrySet()) {
            String serviceCode = serviceGroup.getKey();
            List<Map<String, Object>> serviceEntries = serviceGroup.getValue();
            
            addCalculationLog(orderId, calculationId, "INFO", "CALCULATION", "计算服务: " + serviceCode);
            
            // 计算服务收入和支出
            ServiceProfitInfo serviceProfitInfo = calculateServiceProfit(serviceEntries);
            totalGrossProfit = totalGrossProfit.add(serviceProfitInfo.grossProfit);
            
            // 查找适用的分润规则
            Map<String, Object> applicableRule = findApplicableProfitSharingRule(serviceCode, "SALES_DEPT", "OPERATION_DEPT");
            
            if (applicableRule != null) {
                // 计算分润金额
                BigDecimal salesSharing = serviceProfitInfo.grossProfit.multiply((BigDecimal) applicableRule.get("salesRatio"));
                BigDecimal operationSharing = serviceProfitInfo.grossProfit.multiply((BigDecimal) applicableRule.get("operationRatio"));
                
                // 创建销售部门分润记录
                Map<String, Object> salesDepartmentResult = createDepartmentResult(
                    orderId, calculationId, "SALES_DEPT", "销售部门", "SALES",
                    serviceCode, serviceProfitInfo.revenue, BigDecimal.ZERO,
                    serviceProfitInfo.cost.add(operationSharing), BigDecimal.ZERO,
                    salesSharing, serviceProfitInfo.grossProfit,
                    (BigDecimal) applicableRule.get("salesRatio"), salesSharing, applicableRule
                );
                
                // 创建操作部门分润记录
                Map<String, Object> operationDepartmentResult = createDepartmentResult(
                    orderId, calculationId, "OPERATION_DEPT", "操作部门", "OPERATION",
                    serviceCode, BigDecimal.ZERO, serviceProfitInfo.cost.add(operationSharing),
                    BigDecimal.ZERO, serviceProfitInfo.cost,
                    operationSharing, serviceProfitInfo.grossProfit,
                    (BigDecimal) applicableRule.get("operationRatio"), operationSharing, applicableRule
                );
                
                allDepartmentResults.add(salesDepartmentResult);
                allDepartmentResults.add(operationDepartmentResult);
                
                addCalculationLog(orderId, calculationId, "INFO", "CALCULATION", 
                    String.format("服务%s分润完成: 销售%.2f, 操作%.2f", serviceCode, salesSharing, operationSharing));
            } else {
                addCalculationLog(orderId, calculationId, "WARN", "CALCULATION", "服务 " + serviceCode + " 未找到适用分润规则");
            }
        }
        
        // 保存分润结果
        departmentProfitSharing.put(orderId, allDepartmentResults);
        
        // 创建汇总结果
        Map<String, Object> summary = createProfitSharingSummary(orderId, calculationId, allDepartmentResults, totalGrossProfit);
        profitSharingSummary.put(orderId, summary);
        
        addCalculationLog(orderId, calculationId, "INFO", "CALCULATION", "分润计算完成");
        
        return Map.of(
            "calculationId", calculationId,
            "status", "CALCULATED",
            "departmentResults", allDepartmentResults,
            "summary", summary,
            "calculatedTime", LocalDateTime.now()
        );
    }
    
    /**
     * 计算服务利润信息
     */
    private ServiceProfitInfo calculateServiceProfit(List<Map<String, Object>> serviceEntries) {
        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal cost = BigDecimal.ZERO;
        
        for (Map<String, Object> entry : serviceEntries) {
            String entryType = (String) entry.get("entryType");
            BigDecimal amount = new BigDecimal(entry.get("amount").toString());
            
            if ("RECEIVABLE".equals(entryType)) {
                revenue = revenue.add(amount);
            } else if ("PAYABLE".equals(entryType)) {
                cost = cost.add(amount);
            }
        }
        
        return new ServiceProfitInfo(revenue, cost, revenue.subtract(cost));
    }
    
    /**
     * 查找适用的分润规则
     */
    private Map<String, Object> findApplicableProfitSharingRule(String serviceCode, String salesDepartment, String operationDepartment) {
        // 按优先级查找规则
        return profitSharingRules.stream()
            .filter(rule -> "ACTIVE".equals(rule.get("status")))
            .filter(rule -> {
                String ruleType = (String) rule.get("ruleType");
                switch (ruleType) {
                    case "SERVICE_SPECIFIC":
                        String applicableServices = (String) rule.get("applicableServiceCodes");
                        return applicableServices != null && Arrays.asList(applicableServices.split(",")).contains(serviceCode);
                    case "DEPARTMENT_SPECIFIC":
                        // 可以扩展部门特定规则
                        return false;
                    case "STANDARD":
                    default:
                        return true;
                }
            })
            .max(Comparator.comparing(rule -> (Integer) rule.get("rulePriority")))
            .orElse(null);
    }
    
    /**
     * 创建部门分润结果记录
     */
    private Map<String, Object> createDepartmentResult(String orderId, String calculationId,
            String departmentId, String departmentName, String departmentType,
            String serviceCode, BigDecimal externalRevenue, BigDecimal internalIncome,
            BigDecimal internalPayment, BigDecimal externalCost, BigDecimal departmentProfit,
            BigDecimal serviceGrossProfit, BigDecimal profitSharingRatio, BigDecimal profitSharingAmount,
            Map<String, Object> applicableRule) {
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", orderId);
        result.put("calculationId", calculationId);
        result.put("departmentId", departmentId);
        result.put("departmentName", departmentName);
        result.put("departmentType", departmentType);
        result.put("serviceCode", serviceCode);
        result.put("serviceName", getServiceName(serviceCode));
        
        result.put("externalRevenue", externalRevenue);
        result.put("internalIncome", internalIncome);
        result.put("internalPayment", internalPayment);
        result.put("externalCost", externalCost);
        result.put("departmentProfit", departmentProfit);
        
        result.put("serviceGrossProfit", serviceGrossProfit);
        result.put("profitSharingRatio", profitSharingRatio);
        result.put("profitSharingAmount", profitSharingAmount);
        
        result.put("protocolId", applicableRule.get("id"));
        result.put("protocolName", applicableRule.get("ruleName"));
        result.put("calculationStatus", "CALCULATED");
        result.put("calculatedTime", LocalDateTime.now());
        
        return result;
    }
    
    /**
     * 创建分润汇总结果
     */
    private Map<String, Object> createProfitSharingSummary(String orderId, String calculationId,
            List<Map<String, Object>> departmentResults, BigDecimal totalGrossProfit) {
        
        BigDecimal totalExternalRevenue = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("externalRevenue"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalExternalCost = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("externalCost"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalInternalFlow = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("internalPayment"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long salesDepartmentsCount = departmentResults.stream()
            .filter(r -> "SALES".equals(r.get("departmentType")))
            .map(r -> r.get("departmentId"))
            .distinct()
            .count();
        
        long operationDepartmentsCount = departmentResults.stream()
            .filter(r -> "OPERATION".equals(r.get("departmentType")))
            .map(r -> r.get("departmentId"))
            .distinct()
            .count();
        
        long totalServicesCount = departmentResults.stream()
            .map(r -> r.get("serviceCode"))
            .distinct()
            .count();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("orderId", orderId);
        summary.put("calculationId", calculationId);
        summary.put("totalExternalRevenue", totalExternalRevenue);
        summary.put("totalExternalCost", totalExternalCost);
        summary.put("totalInternalFlow", totalInternalFlow);
        summary.put("totalGrossProfit", totalGrossProfit);
        summary.put("involvedDepartmentsCount", salesDepartmentsCount + operationDepartmentsCount);
        summary.put("salesDepartmentsCount", (int) salesDepartmentsCount);
        summary.put("operationDepartmentsCount", (int) operationDepartmentsCount);
        summary.put("totalServicesCount", (int) totalServicesCount);
        summary.put("calculationStatus", "CALCULATED");
        summary.put("calculatedTime", LocalDateTime.now());
        
        return summary;
    }
    
    /**
     * 执行平衡校验
     */
    private Map<String, Object> performBalanceValidation(List<Map<String, Object>> departmentResults) {
        BigDecimal totalExternalRevenue = BigDecimal.ZERO;
        BigDecimal totalExternalCost = BigDecimal.ZERO;
        BigDecimal totalInternalIncome = BigDecimal.ZERO;
        BigDecimal totalInternalPayment = BigDecimal.ZERO;
        BigDecimal totalDepartmentProfit = BigDecimal.ZERO;
        
        for (Map<String, Object> result : departmentResults) {
            totalExternalRevenue = totalExternalRevenue.add((BigDecimal) result.get("externalRevenue"));
            totalExternalCost = totalExternalCost.add((BigDecimal) result.get("externalCost"));
            totalInternalIncome = totalInternalIncome.add((BigDecimal) result.get("internalIncome"));
            totalInternalPayment = totalInternalPayment.add((BigDecimal) result.get("internalPayment"));
            totalDepartmentProfit = totalDepartmentProfit.add((BigDecimal) result.get("departmentProfit"));
        }
        
        BigDecimal orderGrossProfit = totalExternalRevenue.subtract(totalExternalCost);
        BigDecimal internalBalance = totalInternalIncome.subtract(totalInternalPayment);
        
        boolean internalBalanced = internalBalance.abs().compareTo(new BigDecimal("0.01")) < 0;
        boolean profitBalanced = orderGrossProfit.subtract(totalDepartmentProfit).abs().compareTo(new BigDecimal("0.01")) < 0;
        
        Map<String, Object> balance = new HashMap<>();
        balance.put("totalExternalRevenue", totalExternalRevenue);
        balance.put("totalExternalCost", totalExternalCost);
        balance.put("totalInternalIncome", totalInternalIncome);
        balance.put("totalInternalPayment", totalInternalPayment);
        balance.put("totalDepartmentProfit", totalDepartmentProfit);
        balance.put("orderGrossProfit", orderGrossProfit);
        balance.put("internalBalance", internalBalance);
        balance.put("internalBalanced", internalBalanced);
        balance.put("profitBalanced", profitBalanced);
        balance.put("overallBalanced", internalBalanced && profitBalanced);
        
        return balance;
    }
    
    /**
     * 汇总部门结果
     */
    private Map<String, Object> aggregateDepartmentResults(List<Map<String, Object>> departmentResults) {
        if (departmentResults.isEmpty()) return new HashMap<>();
        
        Map<String, Object> first = departmentResults.get(0);
        
        BigDecimal totalExternalRevenue = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("externalRevenue"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalInternalIncome = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("internalIncome"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalInternalPayment = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("internalPayment"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalExternalCost = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("externalCost"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalDepartmentProfit = departmentResults.stream()
            .map(r -> (BigDecimal) r.get("departmentProfit"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Map<String, Object> aggregated = new HashMap<>();
        aggregated.put("departmentId", first.get("departmentId"));
        aggregated.put("departmentName", first.get("departmentName"));
        aggregated.put("departmentType", first.get("departmentType"));
        aggregated.put("totalExternalRevenue", totalExternalRevenue);
        aggregated.put("totalInternalIncome", totalInternalIncome);
        aggregated.put("totalInternalPayment", totalInternalPayment);
        aggregated.put("totalExternalCost", totalExternalCost);
        aggregated.put("totalDepartmentProfit", totalDepartmentProfit);
        aggregated.put("serviceCount", departmentResults.size());
        
        return aggregated;
    }
    
    /**
     * 添加计算日志
     */
    private void addCalculationLog(String orderId, String calculationId, String logLevel, String logType, String message) {
        Map<String, Object> log = new HashMap<>();
        log.put("orderId", orderId);
        log.put("calculationId", calculationId);
        log.put("logLevel", logLevel);
        log.put("logType", logType);
        log.put("message", message);
        log.put("createdTime", LocalDateTime.now());
        
        calculationLogs.add(log);
        logger.info("[{}] [{}] {}: {}", logLevel, logType, orderId, message);
    }
    
    /**
     * 生成计算批次ID
     */
    private String generateCalculationId(String orderId) {
        return "CALC_" + orderId + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
    
    /**
     * 获取现有计算ID
     */
    private String getExistingCalculationId(String orderId) {
        List<Map<String, Object>> results = departmentProfitSharing.get(orderId);
        if (results != null && !results.isEmpty()) {
            return (String) results.get(0).get("calculationId");
        }
        return null;
    }
    
    /**
     * 获取服务名称
     */
    private String getServiceName(String serviceCode) {
        Map<String, String> serviceNames = Map.of(
            "MBL_PROCESSING", "MBL处理",
            "BOOKING", "订舱",
            "VESSEL_MANIFEST", "舱单",
            "CUSTOMS_DECLARATION", "报关",
            "CUSTOMS_CLEARANCE", "清关",
            "INLAND_TRANSPORT", "境内运输",
            "TERMINAL_HANDLING", "码头操作"
        );
        return serviceNames.getOrDefault(serviceCode, serviceCode);
    }
    
    /**
     * 模拟获取费用明细数据
     */
    private List<Map<String, Object>> getExpenseEntriesByOrderId(String orderId) {
        // 模拟费用明细数据
        return Arrays.asList(
            Map.of("serviceCode", "MBL_PROCESSING", "entryType", "RECEIVABLE", "amount", new BigDecimal("15000.00")),
            Map.of("serviceCode", "MBL_PROCESSING", "entryType", "PAYABLE", "amount", new BigDecimal("12000.00")),
            Map.of("serviceCode", "CUSTOMS_DECLARATION", "entryType", "RECEIVABLE", "amount", new BigDecimal("800.00")),
            Map.of("serviceCode", "CUSTOMS_DECLARATION", "entryType", "PAYABLE", "amount", new BigDecimal("500.00"))
        );
    }
    
    // ===== 静态初始化方法 =====
    
    private static void initializeProfitSharingRules() {
        profitSharingRules.addAll(Arrays.asList(
            Map.of(
                "id", 1,
                "ruleCode", "STANDARD_50_50",
                "ruleName", "标准分润规则(50%-50%)",
                "ruleType", "STANDARD",
                "salesRatio", new BigDecimal("0.5000"),
                "operationRatio", new BigDecimal("0.5000"),
                "rulePriority", 0,
                "status", "ACTIVE"
            ),
            Map.of(
                "id", 2,
                "ruleCode", "OCEAN_60_40",
                "ruleName", "海运业务分润规则(60%-40%)",
                "ruleType", "SERVICE_SPECIFIC",
                "applicableServiceCodes", "MBL_PROCESSING,BOOKING,VESSEL_MANIFEST",
                "salesRatio", new BigDecimal("0.6000"),
                "operationRatio", new BigDecimal("0.4000"),
                "rulePriority", 10,
                "status", "ACTIVE"
            ),
            Map.of(
                "id", 3,
                "ruleCode", "CUSTOMS_40_60",
                "ruleName", "关务业务分润规则(40%-60%)",
                "ruleType", "SERVICE_SPECIFIC",
                "applicableServiceCodes", "CUSTOMS_DECLARATION,CUSTOMS_CLEARANCE,CUSTOMS_INSPECTION",
                "salesRatio", new BigDecimal("0.4000"),
                "operationRatio", new BigDecimal("0.6000"),
                "rulePriority", 10,
                "status", "ACTIVE"
            )
        ));
    }
    
    // ===== 内部辅助类 =====
    
    private static class ServiceProfitInfo {
        public final BigDecimal revenue;
        public final BigDecimal cost;
        public final BigDecimal grossProfit;
        
        public ServiceProfitInfo(BigDecimal revenue, BigDecimal cost, BigDecimal grossProfit) {
            this.revenue = revenue;
            this.cost = cost;
            this.grossProfit = grossProfit;
        }
    }
}