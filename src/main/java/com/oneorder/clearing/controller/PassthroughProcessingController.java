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
 * 过账处理控制器
 * 
 * 功能描述：
 * 1. 过账路由规则管理
 * 2. 过账处理指令执行
 * 3. 轧差结算处理
 * 4. 差异账单处理
 * 5. 过账统计和监控
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */
@RestController
@RequestMapping("/api/passthrough-processing")
@CrossOrigin(origins = "*")
public class PassthroughProcessingController {
    
    private static final Logger logger = LoggerFactory.getLogger(PassthroughProcessingController.class);
    
    // 模拟数据存储
    private static final Map<String, Map<String, Object>> passthroughInstructions = new HashMap<>();
    private static final Map<String, List<Map<String, Object>>> passthroughDetails = new HashMap<>();
    private static final List<Map<String, Object>> routingRules = new ArrayList<>();
    private static final List<Map<String, Object>> nettingRules = new ArrayList<>();
    private static final Map<String, List<Map<String, Object>>> nettingResults = new HashMap<>();
    private static final List<Map<String, Object>> executionLogs = new ArrayList<>();
    
    static {
        // 初始化过账路由规则
        initializeRoutingRules();
        // 初始化轧差规则
        initializeNettingRules();
    }
    
    /**
     * 生成过账处理指令
     */
    @PostMapping("/generate-instruction")
    public ResponseEntity<Map<String, Object>> generatePassthroughInstruction(@RequestBody Map<String, Object> request) {
        try {
            String orderId = (String) request.get("orderId");
            String clearingInstructionId = (String) request.get("clearingInstructionId");
            String passthroughMode = (String) request.get("passthroughMode");
            String createdBy = (String) request.get("createdBy");
            
            logger.info("生成过账处理指令: orderId={}, clearingInstructionId={}, mode={}", 
                       orderId, clearingInstructionId, passthroughMode);
            
            // 生成过账指令ID
            String instructionId = generateInstructionId(orderId);
            String batchId = "BATCH_PASSTHROUGH_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            
            // 从清分结果中获取内部交易数据
            List<Map<String, Object>> clearingDetails = getClearingInternalTransactions(clearingInstructionId);
            if (clearingDetails.isEmpty()) {
                return ResponseEntity.ok(createErrorResponse(404, "未找到可过账的内部交易数据"));
            }
            
            // 应用过账路由规则
            PassthroughProcessor processor = new PassthroughProcessor();
            List<Map<String, Object>> passthroughDetailsList = processor.processRoutingRules(clearingDetails, instructionId);
            
            // 计算过账统计
            BigDecimal originalTotalAmount = calculateOriginalAmount(clearingDetails);
            BigDecimal passthroughTotalAmount = calculatePassthroughAmount(passthroughDetailsList);
            BigDecimal retentionTotalAmount = calculateRetentionAmount(passthroughDetailsList);
            
            // 创建过账处理指令
            Map<String, Object> instruction = new HashMap<>();
            instruction.put("instructionId", instructionId);
            instruction.put("instructionName", "过账处理指令-" + orderId);
            instruction.put("orderId", orderId);
            instruction.put("clearingInstructionId", clearingInstructionId);
            instruction.put("batchId", batchId);
            instruction.put("passthroughMode", passthroughMode);
            instruction.put("processingStrategy", "INCREMENTAL");
            instruction.put("instructionStatus", "PENDING");
            instruction.put("originalTotalAmount", originalTotalAmount);
            instruction.put("passthroughTotalAmount", passthroughTotalAmount);
            instruction.put("retentionTotalAmount", retentionTotalAmount);
            instruction.put("originalTransactionsCount", clearingDetails.size());
            instruction.put("processedTransactionsCount", passthroughDetailsList.size());
            instruction.put("createdBy", createdBy);
            instruction.put("createdTime", LocalDateTime.now());
            
            // 存储过账指令和明细
            passthroughInstructions.put(instructionId, instruction);
            passthroughDetails.put(instructionId, passthroughDetailsList);
            
            // 记录执行日志
            addExecutionLog(instructionId, "INFO", "GENERATION", 
                           String.format("过账处理指令生成完成，原始交易%d笔，过账后%d笔", 
                                       clearingDetails.size(), passthroughDetailsList.size()));
            
            logger.info("过账处理指令生成完成: instructionId={}", instructionId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("instructionId", instructionId);
            result.put("batchId", batchId);
            result.put("originalTransactionsCount", clearingDetails.size());
            result.put("processedTransactionsCount", passthroughDetailsList.size());
            result.put("originalTotalAmount", originalTotalAmount);
            result.put("passthroughTotalAmount", passthroughTotalAmount);
            result.put("retentionTotalAmount", retentionTotalAmount);
            result.put("generatedTime", LocalDateTime.now());
            result.put("status", "GENERATED");
            
            return ResponseEntity.ok(createSuccessResponse(result, "过账处理指令生成成功"));
            
        } catch (Exception e) {
            logger.error("生成过账处理指令失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "生成过账处理指令失败: " + e.getMessage()));
        }
    }
    
    /**
     * 执行过账处理指令
     */
    @PostMapping("/execute/{instructionId}")
    public ResponseEntity<Map<String, Object>> executePassthroughInstruction(
            @PathVariable String instructionId,
            @RequestParam(required = false, defaultValue = "false") boolean dryRun) {
        
        try {
            logger.info("执行过账处理指令: instructionId={}, dryRun={}", instructionId, dryRun);
            
            Map<String, Object> instruction = passthroughInstructions.get(instructionId);
            if (instruction == null) {
                return ResponseEntity.ok(createErrorResponse(404, "过账处理指令不存在"));
            }
            
            List<Map<String, Object>> details = passthroughDetails.get(instructionId);
            if (details == null || details.isEmpty()) {
                return ResponseEntity.ok(createErrorResponse(404, "过账处理明细不存在"));
            }
            
            String executionMode = dryRun ? "SIMULATION" : "ACTUAL";
            
            addExecutionLog(instructionId, "INFO", "EXECUTION", 
                           dryRun ? "开始过账处理试算" : "开始执行过账处理指令");
            
            // 更新指令状态
            if (!dryRun) {
                instruction.put("instructionStatus", "PROCESSING");
                instruction.put("startedTime", LocalDateTime.now());
            }
            
            // 执行过账处理
            PassthroughExecutor executor = new PassthroughExecutor();
            List<Map<String, Object>> executionResults = executor.executePassthroughTransactions(details, dryRun);
            
            // 计算执行统计
            long successCount = executionResults.stream().mapToLong(r -> "SUCCESS".equals(r.get("status")) ? 1 : 0).sum();
            long failureCount = executionResults.size() - successCount;
            BigDecimal totalExecutedAmount = executionResults.stream()
                .map(r -> (BigDecimal) r.get("amount"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 如果是实际执行，应用轧差处理
            List<Map<String, Object>> nettingResultsList = new ArrayList<>();
            if (!dryRun && successCount > 0) {
                NettingProcessor nettingProcessor = new NettingProcessor();
                nettingResultsList = nettingProcessor.processNetting(instructionId, executionResults);
                
                // 更新指令状态为完成
                instruction.put("instructionStatus", "COMPLETED");
                instruction.put("completedTime", LocalDateTime.now());
                instruction.put("processingResult", String.format("成功处理%d笔，失败%d笔", successCount, failureCount));
            }
            
            // 计算执行耗时
            LocalDateTime startTime = (LocalDateTime) instruction.get("startedTime");
            long executionDuration = 0;
            if (startTime != null) {
                executionDuration = java.time.Duration.between(startTime, LocalDateTime.now()).toMillis();
                instruction.put("executionDurationMs", executionDuration);
            }
            
            addExecutionLog(instructionId, "INFO", "EXECUTION", 
                           String.format("%s完成，成功%d笔，失败%d笔，成功率%.2f%%",
                                       dryRun ? "试算" : "执行", 
                                       successCount, failureCount, 
                                       successCount * 100.0 / executionResults.size()));
            
            logger.info("过账处理指令执行完成: instructionId={}, dryRun={}", instructionId, dryRun);
            
            // 构造响应数据
            Map<String, Object> result = new HashMap<>();
            result.put("instructionId", instructionId);
            result.put("executionMode", executionMode);
            result.put("totalDetails", executionResults.size());
            result.put("successCount", (int) successCount);
            result.put("failureCount", (int) failureCount);
            result.put("successRate", new BigDecimal(successCount * 100.0 / executionResults.size()).setScale(4, RoundingMode.HALF_UP));
            result.put("totalExecutedAmount", totalExecutedAmount);
            result.put("executionResults", executionResults);
            result.put("nettingResults", nettingResultsList);
            result.put("executedTime", LocalDateTime.now());
            result.put("executionDurationMs", executionDuration);
            
            return ResponseEntity.ok(createSuccessResponse(result, dryRun ? "过账处理试算完成" : "过账处理指令执行完成"));
            
        } catch (Exception e) {
            logger.error("执行过账处理指令失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "执行过账处理指令失败: " + e.getMessage()));
        }
    }
    
    /**
     * 查询过账处理指令
     */
    @GetMapping("/instruction/{orderId}")
    public ResponseEntity<Map<String, Object>> getPassthroughInstruction(@PathVariable String orderId) {
        try {
            logger.info("查询过账处理指令: {}", orderId);
            
            // 根据订单ID查找过账处理指令
            Optional<Map.Entry<String, Map<String, Object>>> instructionEntry = 
                passthroughInstructions.entrySet().stream()
                    .filter(entry -> orderId.equals(entry.getValue().get("orderId")))
                    .findFirst();
            
            if (!instructionEntry.isPresent()) {
                return ResponseEntity.ok(createErrorResponse(404, "过账处理指令不存在"));
            }
            
            String instructionId = instructionEntry.get().getKey();
            Map<String, Object> instruction = instructionEntry.get().getValue();
            List<Map<String, Object>> details = passthroughDetails.get(instructionId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("instruction", instruction);
            result.put("details", details != null ? details : new ArrayList<>());
            
            return ResponseEntity.ok(createSuccessResponse(result, "查询成功"));
            
        } catch (Exception e) {
            logger.error("查询过账处理指令失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "查询过账处理指令失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取过账处理统计
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getPassthroughStatistics(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        try {
            logger.info("查询过账处理统计: dateFrom={}, dateTo={}", dateFrom, dateTo);
            
            long totalInstructions = passthroughInstructions.size();
            long pendingInstructions = passthroughInstructions.values().stream()
                .mapToLong(inst -> "PENDING".equals(inst.get("instructionStatus")) ? 1 : 0).sum();
            long processingInstructions = passthroughInstructions.values().stream()
                .mapToLong(inst -> "PROCESSING".equals(inst.get("instructionStatus")) ? 1 : 0).sum();
            long completedInstructions = passthroughInstructions.values().stream()
                .mapToLong(inst -> "COMPLETED".equals(inst.get("instructionStatus")) ? 1 : 0).sum();
            
            BigDecimal totalOriginalAmount = passthroughInstructions.values().stream()
                .map(inst -> (BigDecimal) inst.get("originalTotalAmount"))
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
            BigDecimal totalPassthroughAmount = passthroughInstructions.values().stream()
                .map(inst -> (BigDecimal) inst.get("passthroughTotalAmount"))
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
            BigDecimal totalRetentionAmount = passthroughInstructions.values().stream()
                .map(inst -> (BigDecimal) inst.get("retentionTotalAmount"))
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 计算轧差节省金额
            BigDecimal totalNettingSavedAmount = nettingResults.values().stream()
                .flatMap(List::stream)
                .map(net -> (BigDecimal) net.get("savedAmount"))
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 按模式统计
            Map<String, Long> modeStats = passthroughInstructions.values().stream()
                .collect(Collectors.groupingBy(
                    inst -> (String) inst.get("passthroughMode"), 
                    Collectors.counting()));
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalInstructions", totalInstructions);
            statistics.put("pendingInstructions", pendingInstructions);
            statistics.put("processingInstructions", processingInstructions);
            statistics.put("completedInstructions", completedInstructions);
            statistics.put("completionRate", totalInstructions > 0 ? 
                new BigDecimal(completedInstructions * 100.0 / totalInstructions).setScale(2, RoundingMode.HALF_UP) : 
                BigDecimal.ZERO);
            statistics.put("totalOriginalAmount", totalOriginalAmount);
            statistics.put("totalPassthroughAmount", totalPassthroughAmount);
            statistics.put("totalRetentionAmount", totalRetentionAmount);
            statistics.put("totalNettingSavedAmount", totalNettingSavedAmount);
            statistics.put("modeStats", modeStats);
            statistics.put("routingRulesCount", routingRules.size());
            statistics.put("nettingRulesCount", nettingRules.size());
            statistics.put("statisticsTime", LocalDateTime.now());
            
            return ResponseEntity.ok(createSuccessResponse(statistics, "查询成功"));
            
        } catch (Exception e) {
            logger.error("获取过账处理统计失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "获取过账处理统计失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取过账路由规则
     */
    @GetMapping("/routing-rules")
    public ResponseEntity<Map<String, Object>> getRoutingRules() {
        try {
            return ResponseEntity.ok(createSuccessResponse(routingRules, "查询成功"));
        } catch (Exception e) {
            logger.error("获取过账路由规则失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "获取过账路由规则失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取轧差规则
     */
    @GetMapping("/netting-rules")
    public ResponseEntity<Map<String, Object>> getNettingRules() {
        try {
            return ResponseEntity.ok(createSuccessResponse(nettingRules, "查询成功"));
        } catch (Exception e) {
            logger.error("获取轧差规则失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "获取轧差规则失败: " + e.getMessage()));
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
                .sorted((a, b) -> ((LocalDateTime) b.get("createdTime"))
                    .compareTo((LocalDateTime) a.get("createdTime")))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(createSuccessResponse(logs, "查询成功"));
        } catch (Exception e) {
            logger.error("获取执行日志失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "获取执行日志失败: " + e.getMessage()));
        }
    }
    
    /**
     * 处理差异账单
     */
    @PostMapping("/process-differential")
    public ResponseEntity<Map<String, Object>> processDifferentialBilling(@RequestBody Map<String, Object> request) {
        try {
            String orderId = (String) request.get("orderId");
            String originalInstructionId = (String) request.get("originalInstructionId");
            String diffType = (String) request.get("diffType");
            String diffReason = (String) request.get("diffReason");
            String processingMode = (String) request.get("processingMode");
            String createdBy = (String) request.get("createdBy");
            
            logger.info("处理差异账单: orderId={}, originalInstructionId={}, diffType={}", 
                       orderId, originalInstructionId, diffType);
            
            // 获取原始过账指令
            Map<String, Object> originalInstruction = passthroughInstructions.get(originalInstructionId);
            if (originalInstruction == null) {
                return ResponseEntity.ok(createErrorResponse(404, "原始过账指令不存在"));
            }
            
            // 重新生成过账指令（基于最新规则和数据）
            String clearingInstructionId = (String) originalInstruction.get("clearingInstructionId");
            String passthroughMode = (String) originalInstruction.get("passthroughMode");
            
            Map<String, Object> generateRequest = new HashMap<>();
            generateRequest.put("orderId", orderId);
            generateRequest.put("clearingInstructionId", clearingInstructionId);
            generateRequest.put("passthroughMode", passthroughMode);
            generateRequest.put("createdBy", createdBy);
            
            ResponseEntity<Map<String, Object>> newInstructionResponse = generatePassthroughInstruction(generateRequest);
            if (newInstructionResponse.getBody().get("code").equals(200) == false) {
                return ResponseEntity.ok(createErrorResponse(500, "重新生成过账指令失败"));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> newInstructionData = (Map<String, Object>) newInstructionResponse.getBody().get("data");
            String newInstructionId = (String) newInstructionData.get("instructionId");
            
            // 计算差异
            BigDecimal originalAmount = (BigDecimal) originalInstruction.get("passthroughTotalAmount");
            BigDecimal newAmount = (BigDecimal) newInstructionData.get("passthroughTotalAmount");
            BigDecimal diffAmount = newAmount.subtract(originalAmount);
            
            // 创建差异账单记录
            DifferentialProcessor diffProcessor = new DifferentialProcessor();
            Map<String, Object> differentialBilling = diffProcessor.createDifferentialBilling(
                orderId, originalInstructionId, newInstructionId, diffType, diffReason,
                originalAmount, newAmount, diffAmount, processingMode, createdBy);
            
            // 根据处理模式执行差异处理
            List<Map<String, Object>> differentialTransactions = new ArrayList<>();
            if ("INCREMENTAL".equals(processingMode)) {
                // 增量模式：只处理差异部分
                differentialTransactions = diffProcessor.generateIncrementalTransactions(
                    originalInstructionId, newInstructionId, diffAmount);
            } else {
                // 全量替换模式：完全替换原有结果
                differentialTransactions = diffProcessor.generateReplacementTransactions(
                    originalInstructionId, newInstructionId);
                
                // 标记原指令为已替换
                originalInstruction.put("instructionStatus", "REPLACED");
                originalInstruction.put("replacedBy", newInstructionId);
                originalInstruction.put("replacedTime", LocalDateTime.now());
            }
            
            addExecutionLog(newInstructionId, "INFO", "DIFFERENTIAL", 
                           String.format("差异账单处理完成，差异金额：¥%.2f，模式：%s", 
                                       diffAmount, processingMode));
            
            Map<String, Object> result = new HashMap<>();
            result.put("differentialId", differentialBilling.get("diffId"));
            result.put("orderId", orderId);
            result.put("originalInstructionId", originalInstructionId);
            result.put("newInstructionId", newInstructionId);
            result.put("diffType", diffType);
            result.put("diffAmount", diffAmount);
            result.put("processingMode", processingMode);
            result.put("differentialTransactions", differentialTransactions);
            result.put("processedTime", LocalDateTime.now());
            
            logger.info("差异账单处理完成: diffId={}", differentialBilling.get("diffId"));
            
            return ResponseEntity.ok(createSuccessResponse(result, "差异账单处理完成"));
            
        } catch (Exception e) {
            logger.error("处理差异账单失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "处理差异账单失败: " + e.getMessage()));
        }
    }
    
    /**
     * 批量执行过账处理
     */
    @PostMapping("/batch-execute")
    public ResponseEntity<Map<String, Object>> batchExecutePassthrough(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> orderIds = (List<String>) request.get("orderIds");
            String passthroughMode = (String) request.get("passthroughMode");
            boolean dryRun = Boolean.parseBoolean(String.valueOf(request.get("dryRun")));
            String createdBy = (String) request.get("createdBy");
            
            logger.info("批量执行过账处理: orderIds={}, mode={}, dryRun={}", orderIds, passthroughMode, dryRun);
            
            String batchId = "BATCH_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            List<Map<String, Object>> batchResults = new ArrayList<>();
            
            int successCount = 0;
            int failureCount = 0;
            BigDecimal totalAmount = BigDecimal.ZERO;
            
            for (String orderId : orderIds) {
                try {
                    // 查找该订单的清分指令ID
                    String clearingInstructionId = "CLEARING_" + orderId + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                    
                    // 生成过账指令
                    Map<String, Object> generateReq = new HashMap<>();
                    generateReq.put("orderId", orderId);
                    generateReq.put("clearingInstructionId", clearingInstructionId);
                    generateReq.put("passthroughMode", passthroughMode);
                    generateReq.put("createdBy", createdBy);
                    
                    ResponseEntity<Map<String, Object>> generateResponse = generatePassthroughInstruction(generateReq);
                    
                    if (generateResponse.getBody().get("code").equals(200)) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> generateData = (Map<String, Object>) generateResponse.getBody().get("data");
                        String instructionId = (String) generateData.get("instructionId");
                        
                        // 执行过账指令
                        ResponseEntity<Map<String, Object>> executeResponse = executePassthroughInstruction(instructionId, dryRun);
                        
                        if (executeResponse.getBody().get("code").equals(200)) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> executeData = (Map<String, Object>) executeResponse.getBody().get("data");
                            
                            successCount++;
                            totalAmount = totalAmount.add((BigDecimal) executeData.get("totalExecutedAmount"));
                            
                            Map<String, Object> orderResult = new HashMap<>();
                            orderResult.put("orderId", orderId);
                            orderResult.put("instructionId", instructionId);
                            orderResult.put("status", "SUCCESS");
                            orderResult.put("amount", executeData.get("totalExecutedAmount"));
                            orderResult.put("message", "过账处理成功");
                            batchResults.add(orderResult);
                            
                        } else {
                            failureCount++;
                            Map<String, Object> orderResult = new HashMap<>();
                            orderResult.put("orderId", orderId);
                            orderResult.put("instructionId", instructionId);
                            orderResult.put("status", "FAILED");
                            orderResult.put("amount", BigDecimal.ZERO);
                            orderResult.put("message", "过账执行失败: " + executeResponse.getBody().get("message"));
                            batchResults.add(orderResult);
                        }
                    } else {
                        failureCount++;
                        Map<String, Object> orderResult = new HashMap<>();
                        orderResult.put("orderId", orderId);
                        orderResult.put("instructionId", null);
                        orderResult.put("status", "FAILED");
                        orderResult.put("amount", BigDecimal.ZERO);
                        orderResult.put("message", "过账指令生成失败: " + generateResponse.getBody().get("message"));
                        batchResults.add(orderResult);
                    }
                    
                } catch (Exception e) {
                    failureCount++;
                    Map<String, Object> orderResult = new HashMap<>();
                    orderResult.put("orderId", orderId);
                    orderResult.put("instructionId", null);
                    orderResult.put("status", "FAILED");
                    orderResult.put("amount", BigDecimal.ZERO);
                    orderResult.put("message", "处理异常: " + e.getMessage());
                    batchResults.add(orderResult);
                }
            }
            
            Map<String, Object> batchSummary = new HashMap<>();
            batchSummary.put("batchId", batchId);
            batchSummary.put("totalOrders", orderIds.size());
            batchSummary.put("successCount", successCount);
            batchSummary.put("failureCount", failureCount);
            batchSummary.put("successRate", orderIds.size() > 0 ? 
                new BigDecimal(successCount * 100.0 / orderIds.size()).setScale(2, RoundingMode.HALF_UP) : 
                BigDecimal.ZERO);
            batchSummary.put("totalAmount", totalAmount);
            batchSummary.put("batchResults", batchResults);
            batchSummary.put("executedTime", LocalDateTime.now());
            
            logger.info("批量过账处理完成: batchId={}, 成功{}笔, 失败{}笔", batchId, successCount, failureCount);
            
            return ResponseEntity.ok(createSuccessResponse(batchSummary, 
                dryRun ? "批量过账试算完成" : "批量过账处理完成"));
            
        } catch (Exception e) {
            logger.error("批量执行过账处理失败", e);
            return ResponseEntity.ok(createErrorResponse(500, "批量执行过账处理失败: " + e.getMessage()));
        }
    }
    
    // =====================================================
    // 核心处理类
    // =====================================================
    
    /**
     * 过账处理器 - 负责应用路由规则
     */
    private static class PassthroughProcessor {
        
        public List<Map<String, Object>> processRoutingRules(List<Map<String, Object>> clearingDetails, String instructionId) {
            List<Map<String, Object>> passthroughDetailsList = new ArrayList<>();
            
            for (int i = 0; i < clearingDetails.size(); i++) {
                Map<String, Object> detail = clearingDetails.get(i);
                String payerId = (String) detail.get("fromEntityId");
                String payeeId = (String) detail.get("toEntityId");
                String currency = (String) detail.get("currencyCode");
                BigDecimal amount = (BigDecimal) detail.get("detailAmount");
                
                // 查找匹配的路由规则
                Map<String, Object> matchedRule = findMatchingRoutingRule(payerId, payeeId, currency);
                
                if (matchedRule != null) {
                    // 应用路由规则，生成过账交易序列
                    List<Map<String, Object>> routingTransactions = generateRoutingTransactions(
                        detail, matchedRule, instructionId, i + 1);
                    passthroughDetailsList.addAll(routingTransactions);
                } else {
                    // 无路由规则，保持原交易
                    Map<String, Object> directTransaction = createDirectTransaction(detail, instructionId, i + 1);
                    passthroughDetailsList.add(directTransaction);
                }
            }
            
            return passthroughDetailsList;
        }
        
        private Map<String, Object> findMatchingRoutingRule(String payerId, String payeeId, String currency) {
            return routingRules.stream()
                .filter(rule -> "ACTIVE".equals(rule.get("ruleStatus")))
                .filter(rule -> payerId.equals(rule.get("payerLegalEntityId")))
                .filter(rule -> payeeId.equals(rule.get("payeeLegalEntityId")))
                .filter(rule -> currency.equals(rule.get("currencyCode")))
                .min(Comparator.comparingInt(rule -> (Integer) rule.get("rulePriority")))
                .orElse(null);
        }
        
        private List<Map<String, Object>> generateRoutingTransactions(
                Map<String, Object> originalDetail, Map<String, Object> rule, String instructionId, int sequence) {
            
            List<Map<String, Object>> transactions = new ArrayList<>();
            
            String originalPayerId = (String) originalDetail.get("fromEntityId");
            String originalPayerName = (String) originalDetail.get("fromEntityName");
            String finalPayeeId = (String) originalDetail.get("toEntityId");
            String finalPayeeName = (String) originalDetail.get("toEntityName");
            BigDecimal originalAmount = (BigDecimal) originalDetail.get("detailAmount");
            
            String routing1Id = (String) rule.get("routingEntity1Id");
            String routing1Name = (String) rule.get("routingEntity1Name");
            String routing2Id = (String) rule.get("routingEntity2Id");
            String routing2Name = (String) rule.get("routingEntity2Name");
            
            BigDecimal retention1Rate = (BigDecimal) rule.get("routing1RetentionRate");
            BigDecimal retention2Rate = (BigDecimal) rule.get("routing2RetentionRate");
            
            String routingPath = originalPayerName + " → " + routing1Name;
            BigDecimal currentAmount = originalAmount;
            int detailSeq = sequence * 10; // 为子序列预留空间
            
            // 第一步：原始付款方 → 路由公司1
            Map<String, Object> transaction1 = createRoutingTransaction(
                instructionId, detailSeq++, originalPayerId, originalPayerName,
                routing1Id, routing1Name, currentAmount, "ROUTING",
                (String) rule.get("ruleId"), 1, routingPath);
            transactions.add(transaction1);
            
            // 计算路由公司1的留存
            BigDecimal retention1Amount = currentAmount.multiply(retention1Rate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal transfer1Amount = currentAmount.subtract(retention1Amount);
            
            if (retention1Amount.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> retentionTx = createRetentionTransaction(
                    instructionId, detailSeq++, routing1Id, routing1Name, retention1Amount);
                transactions.add(retentionTx);
            }
            
            // 如果有第二个路由公司
            if (routing2Id != null && !routing2Id.isEmpty()) {
                routingPath += " → " + routing2Name;
                
                // 路由公司1 → 路由公司2
                Map<String, Object> transaction2 = createRoutingTransaction(
                    instructionId, detailSeq++, routing1Id, routing1Name,
                    routing2Id, routing2Name, transfer1Amount, "ROUTING",
                    (String) rule.get("ruleId"), 2, routingPath);
                transactions.add(transaction2);
                
                // 计算路由公司2的留存
                BigDecimal retention2Amount = transfer1Amount.multiply(retention2Rate).setScale(2, RoundingMode.HALF_UP);
                BigDecimal transfer2Amount = transfer1Amount.subtract(retention2Amount);
                
                if (retention2Amount.compareTo(BigDecimal.ZERO) > 0) {
                    Map<String, Object> retention2Tx = createRetentionTransaction(
                        instructionId, detailSeq++, routing2Id, routing2Name, retention2Amount);
                    transactions.add(retention2Tx);
                }
                
                // 最终：路由公司2 → 最终收款方
                routingPath += " → " + finalPayeeName;
                Map<String, Object> finalTransaction = createRoutingTransaction(
                    instructionId, detailSeq++, routing2Id, routing2Name,
                    finalPayeeId, finalPayeeName, transfer2Amount, "ROUTING",
                    (String) rule.get("ruleId"), 3, routingPath);
                transactions.add(finalTransaction);
            } else {
                // 路由公司1 → 最终收款方
                routingPath += " → " + finalPayeeName;
                Map<String, Object> finalTransaction = createRoutingTransaction(
                    instructionId, detailSeq++, routing1Id, routing1Name,
                    finalPayeeId, finalPayeeName, transfer1Amount, "ROUTING",
                    (String) rule.get("ruleId"), 2, routingPath);
                transactions.add(finalTransaction);
            }
            
            return transactions;
        }
        
        private Map<String, Object> createRoutingTransaction(String instructionId, int sequence,
                String payerId, String payerName, String payeeId, String payeeName, 
                BigDecimal amount, String detailType, String ruleId, int routingLevel, String routingPath) {
            
            Map<String, Object> transaction = new HashMap<>();
            transaction.put("detailId", "PTDETAIL_" + instructionId + "_" + String.format("%03d", sequence));
            transaction.put("instructionId", instructionId);
            transaction.put("detailSequence", sequence);
            transaction.put("originalPayerEntityId", payerId);
            transaction.put("originalPayerEntityName", payerName);
            transaction.put("originalPayeeEntityId", payeeId);
            transaction.put("originalPayeeEntityName", payeeName);
            transaction.put("originalAmount", amount);
            transaction.put("actualPayerEntityId", payerId);
            transaction.put("actualPayerEntityName", payerName);
            transaction.put("actualPayeeEntityId", payeeId);
            transaction.put("actualPayeeEntityName", payeeName);
            transaction.put("actualAmount", amount);
            transaction.put("routingPath", routingPath);
            transaction.put("appliedRuleId", ruleId);
            transaction.put("routingLevel", routingLevel);
            transaction.put("detailType", detailType);
            transaction.put("detailStatus", "PENDING");
            transaction.put("currencyCode", "CNY");
            transaction.put("executionOrder", sequence);
            transaction.put("createdTime", LocalDateTime.now());
            
            return transaction;
        }
        
        private Map<String, Object> createRetentionTransaction(String instructionId, int sequence,
                String entityId, String entityName, BigDecimal retentionAmount) {
            
            Map<String, Object> retention = new HashMap<>();
            retention.put("detailId", "PTDETAIL_" + instructionId + "_" + String.format("%03d", sequence));
            retention.put("instructionId", instructionId);
            retention.put("detailSequence", sequence);
            retention.put("retentionEntityId", entityId);
            retention.put("retentionEntityName", entityName);
            retention.put("retentionAmount", retentionAmount);
            retention.put("detailType", "RETENTION");
            retention.put("detailStatus", "PENDING");
            retention.put("currencyCode", "CNY");
            retention.put("executionOrder", sequence);
            retention.put("createdTime", LocalDateTime.now());
            
            return retention;
        }
        
        private Map<String, Object> createDirectTransaction(Map<String, Object> originalDetail, String instructionId, int sequence) {
            Map<String, Object> transaction = new HashMap<>(originalDetail);
            transaction.put("detailId", "PTDETAIL_" + instructionId + "_" + String.format("%03d", sequence));
            transaction.put("instructionId", instructionId);
            transaction.put("detailSequence", sequence);
            transaction.put("actualPayerEntityId", originalDetail.get("fromEntityId"));
            transaction.put("actualPayerEntityName", originalDetail.get("fromEntityName"));
            transaction.put("actualPayeeEntityId", originalDetail.get("toEntityId"));
            transaction.put("actualPayeeEntityName", originalDetail.get("toEntityName"));
            transaction.put("actualAmount", originalDetail.get("detailAmount"));
            transaction.put("routingPath", originalDetail.get("fromEntityName") + " → " + originalDetail.get("toEntityName"));
            transaction.put("detailType", "PASSTHROUGH");
            transaction.put("detailStatus", "PENDING");
            transaction.put("executionOrder", sequence * 10);
            transaction.put("createdTime", LocalDateTime.now());
            
            return transaction;
        }
    }
    
    /**
     * 过账执行器 - 负责执行过账交易
     */
    private static class PassthroughExecutor {
        
        public List<Map<String, Object>> executePassthroughTransactions(
                List<Map<String, Object>> details, boolean dryRun) {
            
            List<Map<String, Object>> executionResults = new ArrayList<>();
            
            // 按执行顺序排序
            details.sort(Comparator.comparingInt(d -> (Integer) d.get("executionOrder")));
            
            for (Map<String, Object> detail : details) {
                Map<String, Object> result = executeTransactionDetail(detail, dryRun);
                executionResults.add(result);
                
                // 更新明细状态
                detail.put("detailStatus", result.get("status"));
                detail.put("executionResult", result.get("message"));
                detail.put("executedTime", LocalDateTime.now());
            }
            
            return executionResults;
        }
        
        private Map<String, Object> executeTransactionDetail(Map<String, Object> detail, boolean dryRun) {
            Map<String, Object> result = new HashMap<>();
            
            String detailType = (String) detail.get("detailType");
            BigDecimal amount = (BigDecimal) detail.get("actualAmount");
            if (amount == null) {
                amount = (BigDecimal) detail.get("retentionAmount");
            }
            
            result.put("detailId", detail.get("detailId"));
            result.put("detailSequence", detail.get("detailSequence"));
            result.put("detailType", detailType);
            result.put("amount", amount);
            result.put("executedTime", LocalDateTime.now());
            
            try {
                String message;
                switch (detailType) {
                    case "ROUTING":
                        String fromName = (String) detail.get("actualPayerEntityName");
                        String toName = (String) detail.get("actualPayeeEntityName");
                        message = String.format("%s过账交易 %s → %s ¥%.2f", 
                                              dryRun ? "模拟" : "实际", fromName, toName, amount);
                        break;
                    case "RETENTION":
                        String retentionEntity = (String) detail.get("retentionEntityName");
                        message = String.format("%s过账留存 %s ¥%.2f", 
                                              dryRun ? "模拟" : "实际", retentionEntity, amount);
                        break;
                    case "PASSTHROUGH":
                        String payerName = (String) detail.get("actualPayerEntityName");
                        String payeeName = (String) detail.get("actualPayeeEntityName");
                        message = String.format("%s直接过账 %s → %s ¥%.2f", 
                                              dryRun ? "模拟" : "实际", payerName, payeeName, amount);
                        break;
                    default:
                        message = String.format("%s过账处理 ¥%.2f", dryRun ? "模拟" : "实际", amount);
                }
                
                result.put("status", "SUCCESS");
                result.put("message", message);
                
            } catch (Exception e) {
                result.put("status", "FAILED");
                result.put("message", "执行失败: " + e.getMessage());
            }
            
            return result;
        }
    }
    
    /**
     * 差异处理器 - 负责差异账单处理
     */
    private static class DifferentialProcessor {
        
        public Map<String, Object> createDifferentialBilling(String orderId, String originalInstructionId, 
                String newInstructionId, String diffType, String diffReason, 
                BigDecimal originalAmount, BigDecimal newAmount, BigDecimal diffAmount,
                String processingMode, String createdBy) {
            
            String diffId = "DIFF_" + orderId + "_" + System.currentTimeMillis();
            
            Map<String, Object> differentialBilling = new HashMap<>();
            differentialBilling.put("diffId", diffId);
            differentialBilling.put("orderId", orderId);
            differentialBilling.put("originalInstructionId", originalInstructionId);
            differentialBilling.put("newInstructionId", newInstructionId);
            differentialBilling.put("diffType", diffType);
            differentialBilling.put("diffReason", diffReason);
            differentialBilling.put("originalAmount", originalAmount);
            differentialBilling.put("newAmount", newAmount);
            differentialBilling.put("diffAmount", diffAmount);
            differentialBilling.put("currencyCode", "CNY");
            differentialBilling.put("processingMode", processingMode);
            differentialBilling.put("diffStatus", "IDENTIFIED");
            differentialBilling.put("approvalRequired", diffAmount.abs().compareTo(new BigDecimal("10000")) > 0);
            differentialBilling.put("approvalStatus", diffAmount.abs().compareTo(new BigDecimal("10000")) > 0 ? "PENDING" : null);
            differentialBilling.put("createdBy", createdBy);
            differentialBilling.put("createdTime", LocalDateTime.now());
            
            return differentialBilling;
        }
        
        public List<Map<String, Object>> generateIncrementalTransactions(String originalInstructionId, 
                String newInstructionId, BigDecimal diffAmount) {
            
            List<Map<String, Object>> incrementalTransactions = new ArrayList<>();
            
            if (diffAmount.compareTo(BigDecimal.ZERO) == 0) {
                return incrementalTransactions; // 无差异
            }
            
            // 生成增量交易
            Map<String, Object> incrementalTx = new HashMap<>();
            incrementalTx.put("transactionId", "DIFF_TX_" + System.currentTimeMillis());
            incrementalTx.put("originalInstructionId", originalInstructionId);
            incrementalTx.put("newInstructionId", newInstructionId);
            incrementalTx.put("transactionType", diffAmount.compareTo(BigDecimal.ZERO) > 0 ? "INCREASE" : "DECREASE");
            incrementalTx.put("diffAmount", diffAmount.abs());
            incrementalTx.put("currencyCode", "CNY");
            incrementalTx.put("description", String.format("差异调整：%s ¥%.2f", 
                diffAmount.compareTo(BigDecimal.ZERO) > 0 ? "增加" : "减少", diffAmount.abs()));
            incrementalTx.put("createdTime", LocalDateTime.now());
            
            incrementalTransactions.add(incrementalTx);
            
            return incrementalTransactions;
        }
        
        public List<Map<String, Object>> generateReplacementTransactions(String originalInstructionId, 
                String newInstructionId) {
            
            List<Map<String, Object>> replacementTransactions = new ArrayList<>();
            
            // 生成原指令冲回交易
            Map<String, Object> reversalTx = new HashMap<>();
            reversalTx.put("transactionId", "REVERSAL_TX_" + System.currentTimeMillis());
            reversalTx.put("originalInstructionId", originalInstructionId);
            reversalTx.put("transactionType", "REVERSAL");
            reversalTx.put("description", "原指令全额冲回");
            reversalTx.put("createdTime", LocalDateTime.now());
            replacementTransactions.add(reversalTx);
            
            // 生成新指令执行交易
            Map<String, Object> newTx = new HashMap<>();
            newTx.put("transactionId", "NEW_TX_" + System.currentTimeMillis());
            newTx.put("newInstructionId", newInstructionId);
            newTx.put("transactionType", "NEW_EXECUTION");
            newTx.put("description", "新指令全额执行");
            newTx.put("createdTime", LocalDateTime.now());
            replacementTransactions.add(newTx);
            
            return replacementTransactions;
        }
    }
    
    /**
     * 轧差处理器 - 负责轧差结算
     */
    private static class NettingProcessor {
        
        public List<Map<String, Object>> processNetting(String instructionId, List<Map<String, Object>> executionResults) {
            List<Map<String, Object>> nettingResultsList = new ArrayList<>();
            
            // 识别需要轧差的交易对
            Map<String, List<Map<String, Object>>> entityPairTransactions = groupTransactionsByEntityPair(executionResults);
            
            for (Map.Entry<String, List<Map<String, Object>>> entry : entityPairTransactions.entrySet()) {
                String entityPairKey = entry.getKey();
                List<Map<String, Object>> transactions = entry.getValue();
                
                if (transactions.size() >= 2) {
                    // 检查是否有适用的轧差规则
                    Map<String, Object> nettingRule = findApplicableNettingRule(entityPairKey);
                    if (nettingRule != null && "FULL_NETTING".equals(nettingRule.get("nettingMode"))) {
                        Map<String, Object> nettingResult = performNetting(instructionId, entityPairKey, transactions);
                        if (nettingResult != null) {
                            nettingResultsList.add(nettingResult);
                        }
                    }
                }
            }
            
            // 存储轧差结果
            if (!nettingResultsList.isEmpty()) {
                nettingResults.put(instructionId, nettingResultsList);
            }
            
            return nettingResultsList;
        }
        
        private Map<String, List<Map<String, Object>>> groupTransactionsByEntityPair(List<Map<String, Object>> executionResults) {
            Map<String, List<Map<String, Object>>> grouped = new HashMap<>();
            
            for (Map<String, Object> result : executionResults) {
                String detailType = (String) result.get("detailType");
                if (!"ROUTING".equals(detailType) && !"PASSTHROUGH".equals(detailType)) {
                    continue;
                }
                
                // 这里需要从detail中获取实际的付款方和收款方信息
                // 简化处理，假设可以从executionResults中获取
                String entityA = "ENTITY_C"; // 实际应该从交易明细中获取
                String entityB = "ENTITY_B"; // 实际应该从交易明细中获取
                String pairKey = entityA.compareTo(entityB) < 0 ? entityA + "|" + entityB : entityB + "|" + entityA;
                
                grouped.computeIfAbsent(pairKey, k -> new ArrayList<>()).add(result);
            }
            
            return grouped;
        }
        
        private Map<String, Object> findApplicableNettingRule(String entityPairKey) {
            String[] entities = entityPairKey.split("\\|");
            String entityA = entities[0];
            String entityB = entities[1];
            
            return nettingRules.stream()
                .filter(rule -> "ACTIVE".equals(rule.get("ruleStatus")))
                .filter(rule -> {
                    String passthroughEntity = (String) rule.get("passthroughEntityId");
                    String targetEntity = (String) rule.get("targetEntityId");
                    return (entityA.equals(passthroughEntity) && entityB.equals(targetEntity)) ||
                           (entityB.equals(passthroughEntity) && entityA.equals(targetEntity));
                })
                .findFirst()
                .orElse(null);
        }
        
        private Map<String, Object> performNetting(String instructionId, String entityPairKey, 
                List<Map<String, Object>> transactions) {
            
            String[] entities = entityPairKey.split("\\|");
            String entityA = entities[0];
            String entityB = entities[1];
            
            // 计算A付B和B付A的总金额
            BigDecimal aPayB = transactions.stream()
                .filter(tx -> entityA.equals(getPayerFromTransaction(tx)) && entityB.equals(getPayeeFromTransaction(tx)))
                .map(tx -> (BigDecimal) tx.get("amount"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
            BigDecimal bPayA = transactions.stream()
                .filter(tx -> entityB.equals(getPayerFromTransaction(tx)) && entityA.equals(getPayeeFromTransaction(tx)))
                .map(tx -> (BigDecimal) tx.get("amount"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            if (aPayB.compareTo(BigDecimal.ZERO) == 0 || bPayA.compareTo(BigDecimal.ZERO) == 0) {
                return null; // 不需要轧差
            }
            
            // 计算轧差结果
            BigDecimal netAmount = aPayB.subtract(bPayA).abs();
            String netPayer = aPayB.compareTo(bPayA) > 0 ? entityA : entityB;
            String netPayee = aPayB.compareTo(bPayA) > 0 ? entityB : entityA;
            
            BigDecimal savedAmount = aPayB.add(bPayA).subtract(netAmount);
            int savedTransactions = transactions.size() - 1;
            
            String nettingId = "NETTING_" + instructionId + "_" + System.currentTimeMillis();
            
            Map<String, Object> nettingResult = new HashMap<>();
            nettingResult.put("nettingId", nettingId);
            nettingResult.put("instructionId", instructionId);
            nettingResult.put("entityAId", entityA);
            nettingResult.put("entityAName", getEntityName(entityA));
            nettingResult.put("entityBId", entityB);
            nettingResult.put("entityBName", getEntityName(entityB));
            nettingResult.put("currencyCode", "CNY");
            nettingResult.put("entityAPayBAmount", aPayB);
            nettingResult.put("entityBPayAAmount", bPayA);
            nettingResult.put("netAmount", netAmount);
            nettingResult.put("netPayerEntityId", netPayer);
            nettingResult.put("netPayerEntityName", getEntityName(netPayer));
            nettingResult.put("netPayeeEntityId", netPayee);
            nettingResult.put("netPayeeEntityName", getEntityName(netPayee));
            nettingResult.put("savedTransactionsCount", savedTransactions);
            nettingResult.put("savedAmount", savedAmount);
            nettingResult.put("nettingStatus", "COMPLETED");
            nettingResult.put("createdTime", LocalDateTime.now());
            
            return nettingResult;
        }
        
        private String getPayerFromTransaction(Map<String, Object> transaction) {
            // 简化实现，实际应该从交易明细中获取
            return "ENTITY_C";
        }
        
        private String getPayeeFromTransaction(Map<String, Object> transaction) {
            // 简化实现，实际应该从交易明细中获取  
            return "ENTITY_B";
        }
        
        private String getEntityName(String entityId) {
            Map<String, String> entityNames = Map.of(
                "ENTITY_A", "A公司",
                "ENTITY_B", "B公司", 
                "ENTITY_C", "C公司",
                "ENTITY_D", "D公司"
            );
            return entityNames.getOrDefault(entityId, entityId);
        }
    }
    
    // =====================================================
    // 工具方法
    // =====================================================
    
    private String generateInstructionId(String orderId) {
        return "PASSTHROUGH_" + orderId + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
    
    private List<Map<String, Object>> getClearingInternalTransactions(String clearingInstructionId) {
        // 模拟从清分结果中获取内部交易
        List<Map<String, Object>> internalTransactions = new ArrayList<>();
        
        // 创建示例内部交易数据
        Map<String, Object> transaction1 = new HashMap<>();
        transaction1.put("fromEntityId", "ENTITY_A");
        transaction1.put("fromEntityName", "A公司");
        transaction1.put("toEntityId", "ENTITY_B");
        transaction1.put("toEntityName", "B公司");
        transaction1.put("detailAmount", new BigDecimal("1000.00"));
        transaction1.put("currencyCode", "CNY");
        transaction1.put("serviceCode", "PASSTHROUGH_SERVICE");
        transaction1.put("serviceName", "过账服务");
        internalTransactions.add(transaction1);
        
        Map<String, Object> transaction2 = new HashMap<>();
        transaction2.put("fromEntityId", "ENTITY_B");
        transaction2.put("fromEntityName", "B公司");
        transaction2.put("toEntityId", "ENTITY_C");
        transaction2.put("toEntityName", "C公司");
        transaction2.put("detailAmount", new BigDecimal("800.00"));
        transaction2.put("currencyCode", "CNY");
        transaction2.put("serviceCode", "PASSTHROUGH_SERVICE");
        transaction2.put("serviceName", "过账服务");
        internalTransactions.add(transaction2);
        
        return internalTransactions;
    }
    
    private BigDecimal calculateOriginalAmount(List<Map<String, Object>> clearingDetails) {
        return clearingDetails.stream()
            .map(detail -> (BigDecimal) detail.get("detailAmount"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private BigDecimal calculatePassthroughAmount(List<Map<String, Object>> passthroughDetails) {
        return passthroughDetails.stream()
            .filter(detail -> "ROUTING".equals(detail.get("detailType")) || "PASSTHROUGH".equals(detail.get("detailType")))
            .map(detail -> (BigDecimal) detail.get("actualAmount"))
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private BigDecimal calculateRetentionAmount(List<Map<String, Object>> passthroughDetails) {
        return passthroughDetails.stream()
            .filter(detail -> "RETENTION".equals(detail.get("detailType")))
            .map(detail -> (BigDecimal) detail.get("retentionAmount"))
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private void addExecutionLog(String instructionId, String level, String type, String message) {
        Map<String, Object> log = new HashMap<>();
        log.put("logId", "LOG_" + System.currentTimeMillis());
        log.put("instructionId", instructionId);
        log.put("logLevel", level);
        log.put("logType", type);
        log.put("logMessage", message);
        log.put("executionPhase", type);
        log.put("createdTime", LocalDateTime.now());
        
        executionLogs.add(log);
    }
    
    private static void initializeRoutingRules() {
        // 过账路由规则1: A公司到B公司USD通过C公司过账，1%留存
        Map<String, Object> rule1 = new HashMap<>();
        rule1.put("ruleId", "ROUTE_001");
        rule1.put("ruleName", "A公司到B公司USD过账规则");
        rule1.put("ruleDescription", "A公司付B公司USD时通过C公司过账，C公司留存1%");
        rule1.put("payerLegalEntityId", "ENTITY_A");
        rule1.put("payerLegalEntityName", "A公司");
        rule1.put("payeeLegalEntityId", "ENTITY_B");
        rule1.put("payeeLegalEntityName", "B公司");
        rule1.put("currencyCode", "USD");
        rule1.put("routingEntity1Id", "ENTITY_C");
        rule1.put("routingEntity1Name", "C公司");
        rule1.put("routingEntity2Id", null);
        rule1.put("routingEntity2Name", null);
        rule1.put("retentionMode", "PERCENTAGE");
        rule1.put("routing1RetentionRate", new BigDecimal("0.010000"));
        rule1.put("routing2RetentionRate", new BigDecimal("0.000000"));
        rule1.put("rulePriority", 100);
        rule1.put("ruleStatus", "ACTIVE");
        rule1.put("effectiveDate", "2025-01-01");
        rule1.put("createdBy", "system");
        rule1.put("createdTime", LocalDateTime.now());
        routingRules.add(rule1);
        
        // 过账路由规则2: A公司到B公司CNY双路由过账
        Map<String, Object> rule2 = new HashMap<>();
        rule2.put("ruleId", "ROUTE_002");
        rule2.put("ruleName", "A公司到B公司CNY双路由规则");
        rule2.put("ruleDescription", "A公司付B公司CNY时通过C公司和D公司过账");
        rule2.put("payerLegalEntityId", "ENTITY_A");
        rule2.put("payerLegalEntityName", "A公司");
        rule2.put("payeeLegalEntityId", "ENTITY_B");
        rule2.put("payeeLegalEntityName", "B公司");
        rule2.put("currencyCode", "CNY");
        rule2.put("routingEntity1Id", "ENTITY_C");
        rule2.put("routingEntity1Name", "C公司");
        rule2.put("routingEntity2Id", "ENTITY_D");
        rule2.put("routingEntity2Name", "D公司");
        rule2.put("retentionMode", "PERCENTAGE");
        rule2.put("routing1RetentionRate", new BigDecimal("0.010000"));
        rule2.put("routing2RetentionRate", new BigDecimal("0.005000"));
        rule2.put("rulePriority", 200);
        rule2.put("ruleStatus", "ACTIVE");
        rule2.put("effectiveDate", "2025-01-01");
        rule2.put("createdBy", "system");
        rule2.put("createdTime", LocalDateTime.now());
        routingRules.add(rule2);
        
        // 过账路由规则3: E公司到F公司EUR固定金额规则
        Map<String, Object> rule3 = new HashMap<>();
        rule3.put("ruleId", "ROUTE_003");
        rule3.put("ruleName", "E公司到F公司EUR固定金额规则");
        rule3.put("ruleDescription", "E公司付F公司EUR时通过G公司过账，固定留存50EUR");
        rule3.put("payerLegalEntityId", "ENTITY_E");
        rule3.put("payerLegalEntityName", "E公司");
        rule3.put("payeeLegalEntityId", "ENTITY_F");
        rule3.put("payeeLegalEntityName", "F公司");
        rule3.put("currencyCode", "EUR");
        rule3.put("routingEntity1Id", "ENTITY_G");
        rule3.put("routingEntity1Name", "G公司");
        rule3.put("routingEntity2Id", null);
        rule3.put("routingEntity2Name", null);
        rule3.put("retentionMode", "FIXED_AMOUNT");
        rule3.put("routing1RetentionRate", new BigDecimal("0.000000"));
        rule3.put("routing1RetentionAmount", new BigDecimal("50.00"));
        rule3.put("routing2RetentionRate", new BigDecimal("0.000000"));
        rule3.put("rulePriority", 150);
        rule3.put("ruleStatus", "ACTIVE");
        rule3.put("effectiveDate", "2025-01-01");
        rule3.put("createdBy", "system");
        rule3.put("createdTime", LocalDateTime.now());
        routingRules.add(rule3);
    }
    
    private static void initializeNettingRules() {
        // 轧差规则1: C公司与B公司USD轧差处理
        Map<String, Object> nettingRule1 = new HashMap<>();
        nettingRule1.put("ruleId", "NETTING_001");
        nettingRule1.put("ruleName", "C公司与B公司USD轧差规则");
        nettingRule1.put("ruleDescription", "C公司与B公司之间USD交易进行轧差处理");
        nettingRule1.put("passthroughEntityId", "ENTITY_C");
        nettingRule1.put("passthroughEntityName", "C公司");
        nettingRule1.put("targetEntityId", "ENTITY_B");
        nettingRule1.put("targetEntityName", "B公司");
        nettingRule1.put("currencyCode", "USD");
        nettingRule1.put("nettingMode", "FULL_NETTING");
        nettingRule1.put("minNettingAmount", new BigDecimal("100.00"));
        nettingRule1.put("nettingThreshold", new BigDecimal("50.00"));
        nettingRule1.put("ruleStatus", "ACTIVE");
        nettingRule1.put("rulePriority", 100);
        nettingRule1.put("effectiveDate", "2025-01-01");
        nettingRule1.put("createdBy", "system");
        nettingRule1.put("createdTime", LocalDateTime.now());
        nettingRules.add(nettingRule1);
        
        // 轧差规则2: D公司与其他法人CNY分开处理
        Map<String, Object> nettingRule2 = new HashMap<>();
        nettingRule2.put("ruleId", "NETTING_002");
        nettingRule2.put("ruleName", "D公司与其他法人CNY轧差规则");
        nettingRule2.put("ruleDescription", "D公司与其他法人CNY交易分开处理，不进行轧差");
        nettingRule2.put("passthroughEntityId", "ENTITY_D");
        nettingRule2.put("passthroughEntityName", "D公司");
        nettingRule2.put("targetEntityId", "ENTITY_B");
        nettingRule2.put("targetEntityName", "B公司");
        nettingRule2.put("currencyCode", "CNY");
        nettingRule2.put("nettingMode", "SEPARATE_PAYMENTS");
        nettingRule2.put("minNettingAmount", new BigDecimal("0.00"));
        nettingRule2.put("nettingThreshold", new BigDecimal("0.00"));
        nettingRule2.put("ruleStatus", "ACTIVE");
        nettingRule2.put("rulePriority", 200);
        nettingRule2.put("effectiveDate", "2025-01-01");
        nettingRule2.put("createdBy", "system");
        nettingRule2.put("createdTime", LocalDateTime.now());
        nettingRules.add(nettingRule2);
    }
    
    private Map<String, Object> createSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", data);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
    
    private Map<String, Object> createErrorResponse(int code, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", code);
        response.put("data", null);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
}