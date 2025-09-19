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
 * 清分处理控制器
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */
@RestController
@RequestMapping("/api/clearing-processing")
@CrossOrigin(origins = "*")
public class ClearingProcessingController {
    
    private static final Logger logger = LoggerFactory.getLogger(ClearingProcessingController.class);
    
    // 模拟数据存储
    private static final Map<String, Map<String, Object>> clearingInstructions = new HashMap<>();
    private static final Map<String, List<Map<String, Object>>> clearingDetails = new HashMap<>();
    private static final Map<String, Map<String, Object>> clearingBatches = new HashMap<>();
    private static final List<Map<String, Object>> clearingRules = new ArrayList<>();
    private static final List<Map<String, Object>> executionLogs = new ArrayList<>();
    
    static {
        // 初始化清分规则数据
        initializeClearingRules();
        // 初始化批次数据
        initializeClearingBatches();
    }
    
    /**
     * 生成清分指令
     */
    @PostMapping("/generate-instruction")
    public ResponseEntity<Map<String, Object>> generateClearingInstruction(@RequestBody Map<String, Object> request) {
        try {
            String orderId = (String) request.get("orderId");
            String calculationId = (String) request.get("calculationId");
            String clearingMode = (String) request.getOrDefault("clearingMode", "STAR");
            String createdBy = (String) request.getOrDefault("createdBy", "system");
            
            logger.info("生成清分指令: orderId={}, calculationId={}, clearingMode={}", orderId, calculationId, clearingMode);
            
            // 检查是否已存在清分指令
            boolean exists = clearingInstructions.values().stream()
                .anyMatch(instruction -> orderId.equals(instruction.get("orderId")) && 
                         calculationId.equals(instruction.get("calculationId")));
            
            if (exists) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 400);
                response.put("message", "该订单的分润计算批次已存在清分指令");
                return ResponseEntity.ok(response);
            }
            
            // 生成清分指令
            Map<String, Object> result = performInstructionGeneration(orderId, calculationId, clearingMode, createdBy);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "清分指令生成成功");
            response.put("data", result);
            
            logger.info("清分指令生成完成: instructionId={}", result.get("instructionId"));
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("生成清分指令失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "生成清分指令失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 查询清分指令
     */
    @GetMapping("/instruction/{orderId}")
    public ResponseEntity<Map<String, Object>> getClearingInstruction(@PathVariable String orderId) {
        try {
            logger.info("查询清分指令: {}", orderId);
            
            Map<String, Object> instruction = clearingInstructions.values().stream()
                .filter(inst -> orderId.equals(inst.get("orderId")))
                .findFirst()
                .orElse(null);
            
            if (instruction == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "清分指令不存在");
                return ResponseEntity.ok(response);
            }
            
            // 获取清分明细
            String instructionId = (String) instruction.get("instructionId");
            List<Map<String, Object>> details = clearingDetails.get(instructionId);
            
            Map<String, Object> data = new HashMap<>();
            data.put("instruction", instruction);
            data.put("details", details != null ? details : new ArrayList<>());
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("查询清分指令失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "查询清分指令失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 执行清分指令
     */
    @PostMapping("/execute/{instructionId}")
    public ResponseEntity<Map<String, Object>> executeClearingInstruction(
            @PathVariable String instructionId,
            @RequestParam(required = false, defaultValue = "false") boolean dryRun) {
        try {
            logger.info("执行清分指令: instructionId={}, dryRun={}", instructionId, dryRun);
            
            Map<String, Object> instruction = clearingInstructions.get(instructionId);
            if (instruction == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "清分指令不存在");
                return ResponseEntity.ok(response);
            }
            
            String currentStatus = (String) instruction.get("instructionStatus");
            if ("COMPLETED".equals(currentStatus)) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 400);
                response.put("message", "清分指令已执行完成");
                return ResponseEntity.ok(response);
            }
            
            // 执行清分指令
            Map<String, Object> result = performInstructionExecution(instructionId, dryRun);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", dryRun ? "清分试算完成" : "清分指令执行完成");
            response.put("data", result);
            
            logger.info("清分指令执行完成: instructionId={}, dryRun={}", instructionId, dryRun);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("执行清分指令失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "执行清分指令失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 获取清分批次列表
     */
    @GetMapping("/batches")
    public ResponseEntity<Map<String, Object>> getClearingBatches(
            @RequestParam(required = false) String batchType,
            @RequestParam(required = false) String batchStatus,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            logger.info("查询清分批次: batchType={}, batchStatus={}, limit={}", batchType, batchStatus, limit);
            
            List<Map<String, Object>> batches = clearingBatches.values().stream()
                .filter(batch -> batchType == null || batchType.equals(batch.get("batchType")))
                .filter(batch -> batchStatus == null || batchStatus.equals(batch.get("batchStatus")))
                .sorted((a, b) -> ((LocalDateTime) b.get("createdTime")).compareTo((LocalDateTime) a.get("createdTime")))
                .limit(limit)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", batches);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("查询清分批次失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "查询清分批次失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 执行批次清分
     */
    @PostMapping("/execute-batch/{batchId}")
    public ResponseEntity<Map<String, Object>> executeBatchClearing(
            @PathVariable String batchId,
            @RequestParam(required = false, defaultValue = "false") boolean dryRun) {
        try {
            logger.info("执行批次清分: batchId={}, dryRun={}", batchId, dryRun);
            
            Map<String, Object> batch = clearingBatches.get(batchId);
            if (batch == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "清分批次不存在");
                return ResponseEntity.ok(response);
            }
            
            // 执行批次清分
            Map<String, Object> result = performBatchExecution(batchId, dryRun);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", dryRun ? "批次试算完成" : "批次清分执行完成");
            response.put("data", result);
            
            logger.info("批次清分执行完成: batchId={}, dryRun={}", batchId, dryRun);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("执行批次清分失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "执行批次清分失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 查询清分统计
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getClearingStatistics(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            logger.info("查询清分统计: dateFrom={}, dateTo={}", dateFrom, dateTo);
            
            // 计算统计数据
            Map<String, Object> statistics = calculateClearingStatistics(dateFrom, dateTo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", statistics);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("查询清分统计失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "查询清分统计失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 获取清分规则列表
     */
    @GetMapping("/rules")
    public ResponseEntity<Map<String, Object>> getClearingRules() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", clearingRules);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("获取清分规则失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取清分规则失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 获取执行日志
     */
    @GetMapping("/logs/{instructionId}")
    public ResponseEntity<Map<String, Object>> getExecutionLogs(@PathVariable String instructionId) {
        try {
            List<Map<String, Object>> logs = executionLogs.stream()
                .filter(log -> instructionId.equals(log.get("instructionId")))
                .sorted((a, b) -> ((LocalDateTime) b.get("createdTime")).compareTo((LocalDateTime) a.get("createdTime")))
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", logs);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("获取执行日志失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取执行日志失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    // ===== 私有方法 =====
    
    /**
     * 执行清分指令生成
     */
    private Map<String, Object> performInstructionGeneration(String orderId, String calculationId, 
            String clearingMode, String createdBy) {
        
        // 生成指令ID
        String instructionId = "CLEARING_" + orderId + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        
        // 获取或创建批次
        String batchId = getOrCreateDailyBatch(createdBy);
        
        // 模拟获取分润计算结果（实际应从profit_sharing表查询）
        List<Map<String, Object>> profitSharingResults = getMockProfitSharingResults(orderId, calculationId);
        
        // 计算清分总金额
        BigDecimal totalClearingAmount = profitSharingResults.stream()
            .map(result -> new BigDecimal(result.get("profitSharingAmount").toString()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 创建清分指令
        Map<String, Object> instruction = new HashMap<>();
        instruction.put("instructionId", instructionId);
        instruction.put("orderId", orderId);
        instruction.put("calculationId", calculationId);
        instruction.put("clearingBatchId", batchId);
        instruction.put("clearingMode", clearingMode);
        instruction.put("clearingStrategy", "STANDARD");
        instruction.put("clearingAmount", totalClearingAmount);
        instruction.put("primaryEntityId", "HCBD_SHANGHAI");
        instruction.put("instructionStatus", "PENDING");
        instruction.put("executionPriority", 5);
        instruction.put("createdBy", createdBy);
        instruction.put("createdTime", LocalDateTime.now());
        
        clearingInstructions.put(instructionId, instruction);
        
        // 生成清分明细
        List<Map<String, Object>> details = generateClearingDetails(instructionId, profitSharingResults, clearingMode);
        clearingDetails.put(instructionId, details);
        
        // 记录日志
        addExecutionLog(instructionId, batchId, "INFO", "GENERATION", "清分指令生成完成，明细数量: " + details.size());
        
        return Map.of(
            "instructionId", instructionId,
            "batchId", batchId,
            "clearingAmount", totalClearingAmount,
            "detailsCount", details.size(),
            "status", "GENERATED",
            "generatedTime", LocalDateTime.now()
        );
    }
    
    /**
     * 生成清分明细
     */
    private List<Map<String, Object>> generateClearingDetails(String instructionId, 
            List<Map<String, Object>> profitSharingResults, String clearingMode) {
        
        List<Map<String, Object>> details = new ArrayList<>();
        int sequence = 1;
        
        for (Map<String, Object> result : profitSharingResults) {
            String departmentId = (String) result.get("departmentId");
            String departmentName = (String) result.get("departmentName");
            String serviceCode = (String) result.get("serviceCode");
            String serviceName = (String) result.get("serviceName");
            
            BigDecimal externalRevenue = new BigDecimal(result.get("externalRevenue").toString());
            BigDecimal externalCost = new BigDecimal(result.get("externalCost").toString());
            BigDecimal internalPayment = new BigDecimal(result.get("internalPayment").toString());
            
            // 生成应收明细
            if (externalRevenue.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> receivableDetail = new HashMap<>();
                receivableDetail.put("instructionId", instructionId);
                receivableDetail.put("detailSequence", sequence++);
                receivableDetail.put("detailType", "RECEIVABLE");
                receivableDetail.put("fromEntityId", "CUSTOMER_" + result.get("orderId"));
                receivableDetail.put("fromEntityName", "客户");
                receivableDetail.put("toEntityId", departmentId);
                receivableDetail.put("toEntityName", departmentName);
                receivableDetail.put("detailAmount", externalRevenue);
                receivableDetail.put("currencyCode", "CNY");
                receivableDetail.put("serviceCode", serviceCode);
                receivableDetail.put("serviceName", serviceName);
                receivableDetail.put("departmentId", departmentId);
                receivableDetail.put("departmentName", departmentName);
                receivableDetail.put("detailStatus", "PENDING");
                receivableDetail.put("executionOrder", getExecutionOrder(clearingMode, "RECEIVABLE"));
                receivableDetail.put("createdTime", LocalDateTime.now());
                
                details.add(receivableDetail);
            }
            
            // 生成应付明细
            if (externalCost.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> payableDetail = new HashMap<>();
                payableDetail.put("instructionId", instructionId);
                payableDetail.put("detailSequence", sequence++);
                payableDetail.put("detailType", "PAYABLE");
                payableDetail.put("fromEntityId", departmentId);
                payableDetail.put("fromEntityName", departmentName);
                payableDetail.put("toEntityId", "SUPPLIER_" + result.get("orderId"));
                payableDetail.put("toEntityName", "供应商");
                payableDetail.put("detailAmount", externalCost);
                payableDetail.put("currencyCode", "CNY");
                payableDetail.put("serviceCode", serviceCode);
                payableDetail.put("serviceName", serviceName);
                payableDetail.put("departmentId", departmentId);
                payableDetail.put("departmentName", departmentName);
                payableDetail.put("detailStatus", "PENDING");
                payableDetail.put("executionOrder", getExecutionOrder(clearingMode, "PAYABLE"));
                payableDetail.put("createdTime", LocalDateTime.now());
                
                details.add(payableDetail);
            }
            
            // 生成内部流转明细
            if (internalPayment.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> internalDetail = new HashMap<>();
                internalDetail.put("instructionId", instructionId);
                internalDetail.put("detailSequence", sequence++);
                internalDetail.put("detailType", "INTERNAL_TRANSFER");
                internalDetail.put("fromEntityId", departmentId);
                internalDetail.put("fromEntityName", departmentName);
                internalDetail.put("toEntityId", "INTERNAL");
                internalDetail.put("toEntityName", "内部结算");
                internalDetail.put("detailAmount", internalPayment);
                internalDetail.put("currencyCode", "CNY");
                internalDetail.put("serviceCode", serviceCode);
                internalDetail.put("serviceName", serviceName);
                internalDetail.put("departmentId", departmentId);
                internalDetail.put("departmentName", departmentName);
                internalDetail.put("detailStatus", "PENDING");
                internalDetail.put("executionOrder", getExecutionOrder(clearingMode, "INTERNAL_TRANSFER"));
                internalDetail.put("createdTime", LocalDateTime.now());
                
                details.add(internalDetail);
            }
        }
        
        return details;
    }
    
    /**
     * 执行清分指令
     */
    private Map<String, Object> performInstructionExecution(String instructionId, boolean dryRun) {
        Map<String, Object> instruction = clearingInstructions.get(instructionId);
        List<Map<String, Object>> details = clearingDetails.get(instructionId);
        
        if (!dryRun) {
            // 更新指令状态为执行中
            instruction.put("instructionStatus", "PROCESSING");
            instruction.put("executedBy", "system");
            instruction.put("executedTime", LocalDateTime.now());
        }
        
        String batchId = (String) instruction.get("clearingBatchId");
        addExecutionLog(instructionId, batchId, "INFO", "EXECUTION", 
            dryRun ? "开始清分试算" : "开始执行清分指令");
        
        List<Map<String, Object>> executionResults = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;
        BigDecimal totalExecutedAmount = BigDecimal.ZERO;
        
        // 按执行顺序排序明细
        details.sort(Comparator.comparing(d -> (Integer) d.get("executionOrder")));
        
        for (Map<String, Object> detail : details) {
            try {
                // 模拟执行清分明细
                Map<String, Object> result = executeClearingDetail(detail, dryRun);
                executionResults.add(result);
                
                if ("SUCCESS".equals(result.get("status"))) {
                    successCount++;
                    BigDecimal amount = (BigDecimal) detail.get("detailAmount");
                    totalExecutedAmount = totalExecutedAmount.add(amount);
                    
                    if (!dryRun) {
                        detail.put("detailStatus", "COMPLETED");
                        detail.put("executedTime", LocalDateTime.now());
                    }
                } else {
                    failureCount++;
                    if (!dryRun) {
                        detail.put("detailStatus", "FAILED");
                    }
                }
                
            } catch (Exception e) {
                failureCount++;
                addExecutionLog(instructionId, batchId, "ERROR", "EXECUTION", 
                    "明细执行失败: " + e.getMessage());
            }
        }
        
        // 更新指令状态
        if (!dryRun) {
            String finalStatus = (failureCount == 0) ? "COMPLETED" : 
                                (successCount > 0) ? "PARTIALLY_COMPLETED" : "FAILED";
            instruction.put("instructionStatus", finalStatus);
        }
        
        BigDecimal successRate = BigDecimal.valueOf(successCount)
            .divide(BigDecimal.valueOf(details.size()), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
        
        addExecutionLog(instructionId, batchId, "INFO", "EXECUTION", 
            String.format("%s完成，成功%d笔，失败%d笔，成功率%.2f%%", 
                dryRun ? "试算" : "执行", successCount, failureCount, successRate));
        
        return Map.of(
            "instructionId", instructionId,
            "executionMode", dryRun ? "DRY_RUN" : "ACTUAL",
            "totalDetails", details.size(),
            "successCount", successCount,
            "failureCount", failureCount,
            "successRate", successRate,
            "totalExecutedAmount", totalExecutedAmount,
            "executionResults", executionResults,
            "executedTime", LocalDateTime.now()
        );
    }
    
    /**
     * 执行单个清分明细
     */
    private Map<String, Object> executeClearingDetail(Map<String, Object> detail, boolean dryRun) {
        String detailType = (String) detail.get("detailType");
        BigDecimal amount = (BigDecimal) detail.get("detailAmount");
        String fromEntity = (String) detail.get("fromEntityId");
        String toEntity = (String) detail.get("toEntityId");
        
        // 模拟清分执行逻辑
        boolean success = true;
        String message = "";
        
        try {
            switch (detailType) {
                case "RECEIVABLE":
                    message = String.format("%s从%s收款 ¥%.2f", 
                        dryRun ? "模拟" : "实际", detail.get("fromEntityName"), amount);
                    break;
                case "PAYABLE":
                    message = String.format("%s向%s付款 ¥%.2f", 
                        dryRun ? "模拟" : "实际", detail.get("toEntityName"), amount);
                    break;
                case "INTERNAL_TRANSFER":
                    message = String.format("%s内部流转 ¥%.2f", 
                        dryRun ? "模拟" : "实际", amount);
                    break;
                default:
                    message = "未知明细类型: " + detailType;
                    success = false;
            }
            
            // 模拟一些随机失败
            if (Math.random() < 0.05) { // 5%失败率
                success = false;
                message += " - 执行失败：网络超时";
            }
            
        } catch (Exception e) {
            success = false;
            message = "执行异常: " + e.getMessage();
        }
        
        return Map.of(
            "detailSequence", detail.get("detailSequence"),
            "detailType", detailType,
            "amount", amount,
            "status", success ? "SUCCESS" : "FAILURE",
            "message", message,
            "executedTime", LocalDateTime.now()
        );
    }
    
    /**
     * 执行批次清分
     */
    private Map<String, Object> performBatchExecution(String batchId, boolean dryRun) {
        Map<String, Object> batch = clearingBatches.get(batchId);
        
        if (!dryRun) {
            batch.put("batchStatus", "PROCESSING");
            batch.put("actualStartTime", LocalDateTime.now());
        }
        
        // 获取批次下的所有清分指令
        List<Map<String, Object>> batchInstructions = clearingInstructions.values().stream()
            .filter(inst -> batchId.equals(inst.get("clearingBatchId")))
            .filter(inst -> "PENDING".equals(inst.get("instructionStatus")))
            .sorted(Comparator.comparing(inst -> (Integer) inst.get("executionPriority"), Comparator.reverseOrder()))
            .collect(Collectors.toList());
        
        List<Map<String, Object>> instructionResults = new ArrayList<>();
        int totalSuccessCount = 0;
        int totalFailureCount = 0;
        BigDecimal totalBatchAmount = BigDecimal.ZERO;
        
        for (Map<String, Object> instruction : batchInstructions) {
            String instructionId = (String) instruction.get("instructionId");
            try {
                Map<String, Object> result = performInstructionExecution(instructionId, dryRun);
                instructionResults.add(result);
                
                totalSuccessCount += (Integer) result.get("successCount");
                totalFailureCount += (Integer) result.get("failureCount");
                totalBatchAmount = totalBatchAmount.add((BigDecimal) result.get("totalExecutedAmount"));
                
            } catch (Exception e) {
                logger.error("批次指令执行失败: instructionId={}", instructionId, e);
                totalFailureCount++;
            }
        }
        
        // 更新批次状态
        if (!dryRun) {
            String finalStatus = (totalFailureCount == 0) ? "COMPLETED" : 
                                (totalSuccessCount > 0) ? "PARTIALLY_COMPLETED" : "FAILED";
            batch.put("batchStatus", finalStatus);
            batch.put("actualEndTime", LocalDateTime.now());
            batch.put("completedInstructionsCount", 
                (int) instructionResults.stream().filter(r -> (Integer) r.get("failureCount") == 0).count());
            batch.put("totalClearingAmount", totalBatchAmount);
        }
        
        BigDecimal batchSuccessRate = batchInstructions.isEmpty() ? BigDecimal.ZERO :
            BigDecimal.valueOf(instructionResults.size())
                .divide(BigDecimal.valueOf(batchInstructions.size()), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        
        return Map.of(
            "batchId", batchId,
            "executionMode", dryRun ? "DRY_RUN" : "ACTUAL",
            "totalInstructions", batchInstructions.size(),
            "completedInstructions", instructionResults.size(),
            "batchSuccessRate", batchSuccessRate,
            "totalBatchAmount", totalBatchAmount,
            "totalSuccessDetails", totalSuccessCount,
            "totalFailureDetails", totalFailureCount,
            "instructionResults", instructionResults,
            "executedTime", LocalDateTime.now()
        );
    }
    
    /**
     * 计算清分统计
     */
    private Map<String, Object> calculateClearingStatistics(String dateFrom, String dateTo) {
        long totalInstructions = clearingInstructions.size();
        long pendingInstructions = clearingInstructions.values().stream()
            .filter(inst -> "PENDING".equals(inst.get("instructionStatus")))
            .count();
        long completedInstructions = clearingInstructions.values().stream()
            .filter(inst -> "COMPLETED".equals(inst.get("instructionStatus")))
            .count();
        
        BigDecimal totalClearingAmount = clearingInstructions.values().stream()
            .map(inst -> (BigDecimal) inst.get("clearingAmount"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long totalBatches = clearingBatches.size();
        long activeBatches = clearingBatches.values().stream()
            .filter(batch -> !"COMPLETED".equals(batch.get("batchStatus")))
            .count();
        
        // 按清分模式统计
        Map<String, Long> modeStats = clearingInstructions.values().stream()
            .collect(Collectors.groupingBy(
                inst -> (String) inst.get("clearingMode"),
                Collectors.counting()
            ));
        
        return Map.of(
            "totalInstructions", totalInstructions,
            "pendingInstructions", pendingInstructions,
            "completedInstructions", completedInstructions,
            "completionRate", totalInstructions > 0 ? 
                BigDecimal.valueOf(completedInstructions * 100.0 / totalInstructions).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO,
            "totalClearingAmount", totalClearingAmount,
            "totalBatches", totalBatches,
            "activeBatches", activeBatches,
            "clearingModeStats", modeStats,
            "statisticsTime", LocalDateTime.now()
        );
    }
    
    /**
     * 获取执行顺序
     */
    private int getExecutionOrder(String clearingMode, String detailType) {
        if ("STAR".equals(clearingMode)) {
            // 星式清分：先收款，再内部流转，最后付款
            switch (detailType) {
                case "RECEIVABLE": return 1;
                case "INTERNAL_TRANSFER": return 2;
                case "PAYABLE": return 3;
                default: return 5;
            }
        } else { // CHAIN
            // 链式清分：按链条顺序执行
            switch (detailType) {
                case "RECEIVABLE": return 1;
                case "PAYABLE": return 2;
                case "INTERNAL_TRANSFER": return 3;
                default: return 5;
            }
        }
    }
    
    /**
     * 获取或创建日批次
     */
    private String getOrCreateDailyBatch(String createdBy) {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String batchId = "BATCH_" + today + "_001";
        
        if (!clearingBatches.containsKey(batchId)) {
            Map<String, Object> batch = new HashMap<>();
            batch.put("batchId", batchId);
            batch.put("batchName", today + " 日常清分批次");
            batch.put("batchType", "DAILY");
            batch.put("batchDate", today);
            batch.put("batchStatus", "PREPARING");
            batch.put("totalInstructionsCount", 0);
            batch.put("completedInstructionsCount", 0);
            batch.put("totalClearingAmount", BigDecimal.ZERO);
            batch.put("riskLevel", "LOW");
            batch.put("requiresApproval", false);
            batch.put("autoExecution", true);
            batch.put("createdBy", createdBy);
            batch.put("createdTime", LocalDateTime.now());
            
            clearingBatches.put(batchId, batch);
        }
        
        return batchId;
    }
    
    /**
     * 模拟获取分润计算结果
     */
    private List<Map<String, Object>> getMockProfitSharingResults(String orderId, String calculationId) {
        // 模拟数据，实际应从department_profit_sharing表查询
        return Arrays.asList(
            Map.of("orderId", orderId, "calculationId", calculationId,
                  "departmentId", "SALES_DEPT", "departmentName", "销售部门",
                  "serviceCode", "MBL_PROCESSING", "serviceName", "MBL处理",
                  "externalRevenue", new BigDecimal("15000.00"),
                  "externalCost", BigDecimal.ZERO,
                  "internalPayment", new BigDecimal("13200.00"),
                  "profitSharingAmount", new BigDecimal("1800.00")),
            Map.of("orderId", orderId, "calculationId", calculationId,
                  "departmentId", "OPERATION_DEPT", "departmentName", "操作部门",
                  "serviceCode", "MBL_PROCESSING", "serviceName", "MBL处理",
                  "externalRevenue", BigDecimal.ZERO,
                  "externalCost", new BigDecimal("12000.00"),
                  "internalPayment", BigDecimal.ZERO,
                  "profitSharingAmount", new BigDecimal("1200.00"))
        );
    }
    
    /**
     * 添加执行日志
     */
    private void addExecutionLog(String instructionId, String batchId, String level, String type, String message) {
        Map<String, Object> log = new HashMap<>();
        log.put("logId", "LOG_" + System.currentTimeMillis());
        log.put("instructionId", instructionId);
        log.put("batchId", batchId);
        log.put("logLevel", level);
        log.put("logType", type);
        log.put("logMessage", message);
        log.put("createdTime", LocalDateTime.now());
        
        executionLogs.add(log);
        logger.info("[{}] [{}] {}: {}", level, type, instructionId, message);
    }
    
    // ===== 静态初始化方法 =====
    
    private static void initializeClearingRules() {
        clearingRules.addAll(Arrays.asList(
            Map.of("ruleId", "RULE_001", "ruleCode", "STAR_STANDARD", "ruleName", "标准星式清分规则",
                   "ruleCategory", "CLEARING_MODE", "applicableClearingMode", "STAR",
                   "ruleParameters", Map.of("centralEntity", "HCBD_SHANGHAI", "retentionRate", 0.00),
                   "rulePriority", 8, "ruleStatus", "ACTIVE"),
            Map.of("ruleId", "RULE_002", "ruleCode", "CHAIN_STANDARD", "ruleName", "标准链式清分规则",
                   "ruleCategory", "CLEARING_MODE", "applicableClearingMode", "CHAIN",
                   "ruleParameters", Map.of("maxChainLength", 3, "commissionRate", 0.02),
                   "rulePriority", 8, "ruleStatus", "ACTIVE"),
            Map.of("ruleId", "RULE_003", "ruleCode", "TRANSIT_RECEIVABLE", "ruleName", "收款借抬头规则",
                   "ruleCategory", "ENTITY_FLOW", "applicableClearingMode", "",
                   "ruleParameters", Map.of("transitEntity", "HCBD_HONGKONG", "retentionRate", 0.03, "flowType", "RECEIVABLE"),
                   "rulePriority", 9, "ruleStatus", "ACTIVE"),
            Map.of("ruleId", "RULE_004", "ruleCode", "NETTING_DAILY", "ruleName", "日批次抵消规则",
                   "ruleCategory", "NETTING", "applicableClearingMode", "",
                   "ruleParameters", Map.of("nettingThreshold", 10000, "sameEntityOnly", false, "priorityThreshold", 7),
                   "rulePriority", 6, "ruleStatus", "ACTIVE")
        ));
    }
    
    private static void initializeClearingBatches() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String batchId = "BATCH_" + today + "_001";
        
        Map<String, Object> batch = new HashMap<>();
        batch.put("batchId", batchId);
        batch.put("batchName", today + " 日常清分批次");
        batch.put("batchType", "DAILY");
        batch.put("batchDate", today);
        batch.put("plannedExecutionTime", LocalDateTime.now().withHour(18).withMinute(0));
        batch.put("batchStatus", "PREPARING");
        batch.put("totalInstructionsCount", 0);
        batch.put("completedInstructionsCount", 0);
        batch.put("totalClearingAmount", BigDecimal.ZERO);
        batch.put("successRate", BigDecimal.ZERO);
        batch.put("riskLevel", "LOW");
        batch.put("requiresApproval", false);
        batch.put("autoExecution", true);
        batch.put("createdBy", "system");
        batch.put("createdTime", LocalDateTime.now());
        
        clearingBatches.put(batchId, batch);
    }
}