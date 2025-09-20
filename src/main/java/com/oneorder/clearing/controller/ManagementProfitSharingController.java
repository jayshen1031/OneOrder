package com.oneorder.clearing.controller;

import com.oneorder.clearing.dto.ManagementProfitCalculationResult;
import com.oneorder.clearing.dto.ServiceProfitResult;
import com.oneorder.clearing.dto.DepartmentProfitSummary;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 管理账分润计算控制器
 * 基于PRD实现的管理账分润计算模块
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@RestController
@RequestMapping("/management-profit-sharing")
@CrossOrigin(origins = "*")
public class ManagementProfitSharingController {
    
    private static final Logger logger = LoggerFactory.getLogger(ManagementProfitSharingController.class);
    
    // 模拟数据存储
    private static final Map<String, ManagementProfitCalculationResult> calculationResults = new HashMap<>();
    
    /**
     * 执行管理账分润计算
     * 
     * @param orderId 订单ID
     * @param forceRecalculate 是否强制重新计算
     * @return 计算结果
     */
    @PostMapping("/calculate/{orderId}")
    public ResponseEntity<Map<String, Object>> calculateManagementProfit(
            @PathVariable String orderId,
            @RequestParam(required = false, defaultValue = "false") boolean forceRecalculate) {
        try {
            logger.info("开始管理账分润计算: orderId={}, forceRecalculate={}", orderId, forceRecalculate);
            
            // 模拟计算过程
            Thread.sleep(1000); // 模拟计算时间
            
            // 生成模拟计算结果
            ManagementProfitCalculationResult result = generateMockCalculationResult(orderId);
            
            // 存储结果
            calculationResults.put(orderId, result);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "管理账分润计算完成");
            response.put("data", result);
            
            logger.info("管理账分润计算完成: orderId={}, serviceCount={}, departmentCount={}", 
                    orderId, result.getServiceCount(), result.getDepartmentCount());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("管理账分润计算失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "计算失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 查询管理账分润计算结果
     * 
     * @param orderId 订单ID
     * @return 计算结果
     */
    @GetMapping("/result/{orderId}")
    public ResponseEntity<Map<String, Object>> getManagementProfitResult(@PathVariable String orderId) {
        try {
            logger.info("查询管理账分润结果: {}", orderId);
            
            ManagementProfitCalculationResult result = calculationResults.get(orderId);
            
            if (result == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "订单管理账分润结果不存在");
                return ResponseEntity.ok(response);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("查询管理账分润结果失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 获取部门汇总(五项要素)
     * 
     * @param orderId 订单ID
     * @return 部门汇总数据
     */
    @GetMapping("/department-summary/{orderId}")
    public ResponseEntity<Map<String, Object>> getDepartmentSummary(@PathVariable String orderId) {
        try {
            logger.info("查询部门汇总数据: {}", orderId);
            
            ManagementProfitCalculationResult result = calculationResults.get(orderId);
            
            if (result == null || result.getDepartmentSummaries() == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "部门汇总数据不存在");
                return ResponseEntity.ok(response);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", result.getDepartmentSummaries());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("查询部门汇总失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 删除计算结果
     * 
     * @param orderId 订单ID
     * @return 操作结果
     */
    @DeleteMapping("/result/{orderId}")
    public ResponseEntity<Map<String, Object>> deleteCalculationResult(@PathVariable String orderId) {
        try {
            logger.info("删除管理账分润计算结果: {}", orderId);
            
            ManagementProfitCalculationResult removed = calculationResults.remove(orderId);
            
            Map<String, Object> response = new HashMap<>();
            if (removed != null) {
                response.put("code", 200);
                response.put("message", "计算结果已删除");
            } else {
                response.put("code", 404);
                response.put("message", "计算结果不存在");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("删除计算结果失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "删除失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 健康检查
     * 
     * @return 服务状态
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "管理账分润服务正常运行");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "ManagementProfitSharingService");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 生成模拟计算结果
     */
    private ManagementProfitCalculationResult generateMockCalculationResult(String orderId) {
        // 创建服务分润结果
        List<ServiceProfitResult> serviceProfitResults = Arrays.asList(
            ServiceProfitResult.builder()
                .serviceCode("MBL_PROCESSING")
                .serviceName("MBL处理")
                .salesDepartmentId("OCEAN_SALES")
                .salesDepartmentName("海运销售部")
                .operationDepartmentId("OCEAN_OPERATION")
                .operationDepartmentName("海运操作部")
                .externalRevenue(new BigDecimal("1000.00"))
                .externalCost(new BigDecimal("900.00"))
                .grossProfit(new BigDecimal("100.00"))
                .protocolName("海运MBL处理标准协议")
                .profitSharingRatio("50:50")
                .salesProfitAmount(new BigDecimal("50.00"))
                .operationProfitAmount(new BigDecimal("50.00"))
                .salesInternalPayment(new BigDecimal("950.00"))
                .operationInternalIncome(new BigDecimal("950.00"))
                .build(),
            ServiceProfitResult.builder()
                .serviceCode("CONTAINER_LOADING")
                .serviceName("内装")
                .salesDepartmentId("OCEAN_SALES")
                .salesDepartmentName("海运销售部")
                .operationDepartmentId("CONTAINER_OPERATION")
                .operationDepartmentName("内装操作部")
                .externalRevenue(new BigDecimal("300.00"))
                .externalCost(new BigDecimal("280.00"))
                .grossProfit(new BigDecimal("20.00"))
                .protocolName("内装操作服务协议")
                .profitSharingRatio("50:50")
                .salesProfitAmount(new BigDecimal("10.00"))
                .operationProfitAmount(new BigDecimal("10.00"))
                .salesInternalPayment(new BigDecimal("290.00"))
                .operationInternalIncome(new BigDecimal("290.00"))
                .build(),
            ServiceProfitResult.builder()
                .serviceCode("CUSTOMS_CLEARANCE")
                .serviceName("报关")
                .salesDepartmentId("OCEAN_SALES")
                .salesDepartmentName("海运销售部")
                .operationDepartmentId("CUSTOMS_OPERATION")
                .operationDepartmentName("报关部")
                .externalRevenue(new BigDecimal("80.00"))
                .externalCost(new BigDecimal("60.00"))
                .grossProfit(new BigDecimal("20.00"))
                .protocolName("报关服务标准协议")
                .profitSharingRatio("30:70")
                .salesProfitAmount(new BigDecimal("6.00"))
                .operationProfitAmount(new BigDecimal("14.00"))
                .salesInternalPayment(new BigDecimal("74.00"))
                .operationInternalIncome(new BigDecimal("74.00"))
                .build()
        );
        
        // 创建部门汇总
        List<DepartmentProfitSummary> departmentSummaries = Arrays.asList(
            DepartmentProfitSummary.builder()
                .orderId(orderId)
                .departmentId("OCEAN_SALES")
                .departmentName("海运销售部")
                .departmentType("SALES")
                .externalRevenue(new BigDecimal("1380.00"))
                .internalIncome(new BigDecimal("0.00"))
                .internalPayment(new BigDecimal("1314.00"))
                .externalCost(new BigDecimal("0.00"))
                .departmentProfit(new BigDecimal("66.00"))
                .profitMargin(new BigDecimal("0.0478"))
                .serviceCount(3)
                .calculationTime(LocalDateTime.now())
                .build(),
            DepartmentProfitSummary.builder()
                .orderId(orderId)
                .departmentId("OCEAN_OPERATION")
                .departmentName("海运操作部")
                .departmentType("OPERATION")
                .externalRevenue(new BigDecimal("0.00"))
                .internalIncome(new BigDecimal("950.00"))
                .internalPayment(new BigDecimal("0.00"))
                .externalCost(new BigDecimal("900.00"))
                .departmentProfit(new BigDecimal("50.00"))
                .profitMargin(new BigDecimal("0.0526"))
                .serviceCount(1)
                .calculationTime(LocalDateTime.now())
                .build(),
            DepartmentProfitSummary.builder()
                .orderId(orderId)
                .departmentId("CONTAINER_OPERATION")
                .departmentName("内装操作部")
                .departmentType("OPERATION")
                .externalRevenue(new BigDecimal("0.00"))
                .internalIncome(new BigDecimal("290.00"))
                .internalPayment(new BigDecimal("0.00"))
                .externalCost(new BigDecimal("280.00"))
                .departmentProfit(new BigDecimal("10.00"))
                .profitMargin(new BigDecimal("0.0345"))
                .serviceCount(1)
                .calculationTime(LocalDateTime.now())
                .build(),
            DepartmentProfitSummary.builder()
                .orderId(orderId)
                .departmentId("CUSTOMS_OPERATION")
                .departmentName("报关部")
                .departmentType("OPERATION")
                .externalRevenue(new BigDecimal("0.00"))
                .internalIncome(new BigDecimal("74.00"))
                .internalPayment(new BigDecimal("0.00"))
                .externalCost(new BigDecimal("60.00"))
                .departmentProfit(new BigDecimal("14.00"))
                .profitMargin(new BigDecimal("0.1892"))
                .serviceCount(1)
                .calculationTime(LocalDateTime.now())
                .build()
        );
        
        // 创建验证结果
        ManagementProfitCalculationResult.ValidationResult validationResult = 
            ManagementProfitCalculationResult.ValidationResult.builder()
                .internalBalanced(true)
                .profitConsistent(true)
                .totalInternalIncome(new BigDecimal("1314.00"))
                .totalInternalPayment(new BigDecimal("1314.00"))
                .internalBalance(new BigDecimal("0.00"))
                .validationErrors(new ArrayList<>())
                .build();
        
        // 创建完整结果
        return ManagementProfitCalculationResult.builder()
                .orderId(orderId)
                .calculationTime(LocalDateTime.now())
                .totalGrossProfit(new BigDecimal("140.00"))
                .serviceCount(3)
                .departmentCount(4)
                .calculationVersion(1)
                .serviceProfitResults(serviceProfitResults)
                .departmentSummaries(departmentSummaries)
                .validationResult(validationResult)
                .calculationStatus("COMPLETED")
                .calculationDurationMs(1000L)
                .build();
    }
}