package com.oneorder.clearing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.oneorder.clearing.service.ExpenseEntryService;
import com.oneorder.clearing.entity.ExpenseEntry;
import com.oneorder.clearing.dto.ExpenseEntryRequest;
import com.oneorder.clearing.dto.ExpenseEntryResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 录费模块控制器
 * 
 * @author Claude Code Assistant
 * @version 2.0
 * @since 2025-09-21
 */
@RestController
@RequestMapping("/api/expense-entries")
@CrossOrigin(origins = "*")
public class ExpenseEntryController {
    
    private static final Logger logger = LoggerFactory.getLogger(ExpenseEntryController.class);
    
    @Autowired
    private ExpenseEntryService expenseEntryService;
    
    /**
     * 添加费用明细
     */
    @PostMapping("")
    public ResponseEntity<Map<String, Object>> addExpenseEntry(@RequestBody Map<String, Object> request) {
        try {
            logger.info("添加费用明细请求: {}", request);
            
            // 构建请求DTO
            ExpenseEntryRequest entryRequest = buildExpenseEntryRequest(request);
            
            // 调用Service创建费用明细
            ExpenseEntryResponse response = expenseEntryService.createExpenseEntry(entryRequest);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "费用明细添加成功");
            result.put("data", Map.of(
                "entryId", response.getId(),
                "validationStatus", response.getValidationStatus(),
                "autoSelectedService", false
            ));
            
            logger.info("费用明细添加成功: {}", response.getId());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("添加费用明细失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "添加费用明细失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 查询订单费用明细
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderExpenseEntries(@PathVariable String orderId) {
        try {
            logger.info("查询订单费用明细: {}", orderId);
            
            // 查询费用明细列表
            List<ExpenseEntryResponse> entries = expenseEntryService.getExpenseEntriesByOrderId(orderId);
            
            // 获取费用统计
            ExpenseEntryService.ExpenseEntrySummary summary = expenseEntryService.getExpenseEntrySummary(orderId);
            
            // 获取客户信息（应该从订单表查询，这里先用模拟数据）
            String customerName = getCustomerNameByOrderId(orderId);
            
            // 构建订单信息
            Map<String, Object> orderInfo = new HashMap<>();
            orderInfo.put("orderId", orderId);
            orderInfo.put("customerName", customerName);
            orderInfo.put("entryStatus", entries.isEmpty() ? "NOT_STARTED" : "IN_PROGRESS");
            orderInfo.put("receivableCount", summary.getReceivableCount());
            orderInfo.put("payableCount", summary.getPayableCount());
            orderInfo.put("totalReceivable", summary.getTotalReceivable());
            orderInfo.put("totalPayable", summary.getTotalPayable());
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("data", Map.of(
                "orderInfo", orderInfo,
                "entries", entries.stream().map(this::convertToMap).collect(Collectors.toList())
            ));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("查询订单费用明细失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "查询费用明细失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 费用科目适用性校验
     */
    @PostMapping("/validate-fee-service")
    public ResponseEntity<Map<String, Object>> validateFeeService(@RequestBody Map<String, Object> request) {
        try {
            String feeCode = (String) request.get("feeCode");
            String serviceCode = (String) request.get("serviceCode");
            String supplierType = (String) request.get("supplierType");
            
            logger.info("校验费用科目适用性: feeCode={}, serviceCode={}, supplierType={}", 
                feeCode, serviceCode, supplierType);
            
            // 模拟校验逻辑 - 实际应该调用校验服务
            Map<String, Object> validationResult = performValidation(feeCode, serviceCode, supplierType);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("data", validationResult);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("费用科目适用性校验失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "校验失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 智能服务推荐
     */
    @GetMapping("/suggest-service")
    public ResponseEntity<Map<String, Object>> suggestService(
            @RequestParam String orderId,
            @RequestParam String feeCode) {
        try {
            logger.info("智能服务推荐: orderId={}, feeCode={}", orderId, feeCode);
            
            // 模拟服务推荐逻辑
            Map<String, Object> suggestion = performServiceSuggestion(orderId, feeCode);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("data", suggestion);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("智能服务推荐失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "服务推荐失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 完成录费
     */
    @PostMapping("/complete/{orderId}")
    public ResponseEntity<Map<String, Object>> completeExpenseEntry(@PathVariable String orderId) {
        try {
            logger.info("完成订单录费: {}", orderId);
            
            // 获取费用统计
            ExpenseEntryService.ExpenseEntrySummary summary = expenseEntryService.getExpenseEntrySummary(orderId);
            
            // 构建完成状态
            Map<String, Object> status = new HashMap<>();
            status.put("orderId", orderId);
            status.put("entryStatus", "COMPLETED");
            status.put("receivableCount", (int) summary.getReceivableCount());
            status.put("payableCount", (int) summary.getPayableCount());
            status.put("totalReceivable", summary.getTotalReceivable());
            status.put("totalPayable", summary.getTotalPayable());
            status.put("completedTime", LocalDateTime.now());
            status.put("canStartProfitSharing", true);
            status.put("canStartClearing", true);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "录费已完成");
            result.put("data", status);
            
            logger.info("订单录费完成: {}", orderId);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("完成录费失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "完成录费失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 获取法人实体列表
     */
    @GetMapping("/legal-entities")
    public ResponseEntity<Map<String, Object>> getLegalEntities() {
        try {
            // 返回真实的法人实体数据
            List<Map<String, Object>> legalEntities = Arrays.asList(
                Map.of("entityId", "HCBD_SHANGHAI", "entityName", "海程邦达物流(上海)有限公司", 
                       "entityType", "SUBSIDIARY", "canReceive", true, "canPay", true, "isTransitEntity", false),
                Map.of("entityId", "HCBD_BEIJING", "entityName", "海程邦达物流(北京)有限公司",
                       "entityType", "SUBSIDIARY", "canReceive", true, "canPay", true, "isTransitEntity", false),
                Map.of("entityId", "HCBD_SHENZHEN", "entityName", "海程邦达物流(深圳)有限公司",
                       "entityType", "SUBSIDIARY", "canReceive", true, "canPay", true, "isTransitEntity", false),
                Map.of("entityId", "HCBD_HONGKONG", "entityName", "海程邦达物流(香港)有限公司",
                       "entityType", "SUBSIDIARY", "canReceive", true, "canPay", true, "isTransitEntity", true),
                Map.of("entityId", "HCBD_SINGAPORE", "entityName", "海程邦达物流(新加坡)有限公司",
                       "entityType", "SUBSIDIARY", "canReceive", true, "canPay", true, "isTransitEntity", true)
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("data", legalEntities);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("获取法人实体列表失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "获取法人实体失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 获取费用科目列表
     */
    @GetMapping("/fee-codes")
    public ResponseEntity<Map<String, Object>> getFeeCodes() {
        try {
            // 基于真实海运整柜出口费用科目数据
            List<Map<String, Object>> feeCodes = Arrays.asList(
                Map.of("feeCode", "FCL001", "feeName", "海运费", "category", "跨境运输费用"),
                Map.of("feeCode", "THC001", "feeName", "码头操作费", "category", "码头港口场站费用"),
                Map.of("feeCode", "CUSTOMS001", "feeName", "报关费", "category", "单证文件费用"),
                Map.of("feeCode", "TRUCKING001", "feeName", "拖车费", "category", "境内运输费用"),
                Map.of("feeCode", "BAF001", "feeName", "燃油附加费", "category", "跨境运输费用"),
                Map.of("feeCode", "CFS001", "feeName", "拼箱费", "category", "集装箱费用"),
                Map.of("feeCode", "WAREHOUSE001", "feeName", "仓储费", "category", "仓储服务费用"),
                Map.of("feeCode", "DOC001", "feeName", "文件费", "category", "单证文件费用"),
                Map.of("feeCode", "CLEANING001", "feeName", "洗箱费", "category", "集装箱费用"),
                Map.of("feeCode", "SEAL001", "feeName", "铅封费", "category", "集装箱费用"),
                Map.of("feeCode", "EXAM001", "feeName", "查验费", "category", "关检费用"),
                Map.of("feeCode", "SECURITY001", "feeName", "安检费", "category", "关检费用")
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("data", feeCodes);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("获取费用科目列表失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "获取费用科目失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 同步派单完成状态，为费用录入做准备
     */
    @PostMapping("/sync-assignment-status")
    public ResponseEntity<Map<String, Object>> syncAssignmentStatus(@RequestBody Map<String, Object> request) {
        try {
            String orderId = (String) request.get("orderId");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> assignedServices = (List<Map<String, Object>>) request.get("assignedServices");
            String timestamp = (String) request.get("timestamp");
            
            logger.info("同步派单完成状态: orderId={}, 已派单服务数={}", orderId, assignedServices != null ? assignedServices.size() : 0);
            
            // 构建同步结果
            Map<String, Object> syncResult = new HashMap<>();
            syncResult.put("orderId", orderId);
            syncResult.put("assignmentCompleted", true);
            syncResult.put("assignedServicesCount", assignedServices != null ? assignedServices.size() : 0);
            syncResult.put("canStartExpenseEntry", true);
            syncResult.put("syncTime", timestamp);
            
            // 这里可以添加更多业务逻辑，比如：
            // 1. 更新订单状态为"派单完成"
            // 2. 创建费用录入模板
            // 3. 发送通知给相关人员
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "派单状态同步成功");
            result.put("data", syncResult);
            
            logger.info("派单状态同步完成: orderId={}", orderId);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("同步派单状态失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "同步派单状态失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 获取订单的派单状态，用于费用录入页面显示
     */
    @GetMapping("/assignment-status/{orderId}")
    public ResponseEntity<Map<String, Object>> getAssignmentStatus(@PathVariable String orderId) {
        try {
            logger.info("查询订单派单状态: orderId={}", orderId);
            
            // 这里应该查询真实的派单状态，现在使用模拟数据
            Map<String, Object> assignmentStatus = new HashMap<>();
            assignmentStatus.put("orderId", orderId);
            assignmentStatus.put("hasAssignedServices", true);
            assignmentStatus.put("assignedServicesCount", 3);
            assignmentStatus.put("lastAssignmentTime", "2025-09-21T10:30:00");
            assignmentStatus.put("assignmentCompleted", true);
            
            // 模拟已派单的服务列表
            List<Map<String, Object>> assignedServices = Arrays.asList(
                Map.of("serviceCode", "MBL_PROCESSING", "serviceName", "MBL处理", "operatorName", "林芳"),
                Map.of("serviceCode", "BOOKING", "serviceName", "订舱服务", "operatorName", "马晓东"),
                Map.of("serviceCode", "CUSTOMS_CLEARANCE", "serviceName", "报关服务", "operatorName", "高玲")
            );
            assignmentStatus.put("assignedServices", assignedServices);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("data", assignmentStatus);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("查询派单状态失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "查询派单状态失败: " + e.getMessage()
            ));
        }
    }

    /**
     * 获取服务项目列表
     */
    @GetMapping("/service-codes")
    public ResponseEntity<Map<String, Object>> getServiceCodes() {
        try {
            // 基于真实服务项目数据
            List<Map<String, Object>> serviceCodes = Arrays.asList(
                Map.of("serviceCode", "MBL_PROCESSING", "serviceName", "MBL处理", "businessType", "海运"),
                Map.of("serviceCode", "HBL_PROCESSING", "serviceName", "HBL处理", "businessType", "海运"),
                Map.of("serviceCode", "BOOKING", "serviceName", "订舱", "businessType", "海运"),
                Map.of("serviceCode", "VESSEL_MANIFEST", "serviceName", "舱单", "businessType", "海运"),
                Map.of("serviceCode", "CUSTOMS_DECLARATION", "serviceName", "报关", "businessType", "关务"),
                Map.of("serviceCode", "CUSTOMS_CLEARANCE", "serviceName", "清关", "businessType", "关务"),
                Map.of("serviceCode", "CONTAINER_LOADING", "serviceName", "装箱", "businessType", "仓储"),
                Map.of("serviceCode", "CARGO_LOADING", "serviceName", "装货", "businessType", "仓储"),
                Map.of("serviceCode", "TRANSPORTATION", "serviceName", "运输", "businessType", "陆运"),
                Map.of("serviceCode", "TERMINAL_HANDLING", "serviceName", "码头操作", "businessType", "港口服务")
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("data", serviceCodes);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("获取服务项目列表失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "获取服务项目失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 删除费用明细
     */
    @DeleteMapping("/{entryId}")
    public ResponseEntity<Map<String, Object>> deleteExpenseEntry(@PathVariable Long entryId) {
        try {
            logger.info("删除费用明细: {}", entryId);
            
            expenseEntryService.deleteExpenseEntry(entryId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "费用明细删除成功");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("删除费用明细失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "删除费用明细失败: " + e.getMessage()
            ));
        }
    }
    
    // ===== 私有方法 =====
    
    /**
     * 构建费用明细请求DTO
     */
    private ExpenseEntryRequest buildExpenseEntryRequest(Map<String, Object> request) {
        ExpenseEntryRequest dto = new ExpenseEntryRequest();
        
        dto.setOrderId((String) request.get("orderId"));
        dto.setServiceCode((String) request.get("serviceCode"));
        dto.setFeeCode((String) request.get("feeCode"));
        dto.setEntryType(ExpenseEntry.EntryType.valueOf((String) request.get("entryType")));
        dto.setCounterpartEntity((String) request.get("counterpartEntity"));
        dto.setCounterpartDepartment((String) request.get("counterpartDepartment"));
        dto.setCounterpartSupplierType((String) request.get("counterpartSupplierType"));
        dto.setOurEntityId((String) request.get("ourEntityId"));
        dto.setOurDepartmentId((String) request.get("ourDepartmentId"));
        dto.setAmount(new BigDecimal(request.get("amount").toString()));
        dto.setCurrency((String) request.get("currency"));
        dto.setIsTransitEntity((Boolean) request.get("isTransitEntity"));
        dto.setTransitReason((String) request.get("transitReason"));
        dto.setRemarks((String) request.get("remarks"));
        dto.setCreatedBy((String) request.get("createdBy"));
        
        return dto;
    }
    
    /**
     * 将ExpenseEntryResponse转换为Map
     */
    private Map<String, Object> convertToMap(ExpenseEntryResponse response) {
        Map<String, Object> map = new HashMap<>();
        
        map.put("id", response.getId());
        map.put("orderId", response.getOrderId());
        map.put("serviceCode", response.getServiceCode());
        map.put("serviceName", getServiceName(response.getServiceCode()));
        map.put("feeCode", response.getFeeCode());
        map.put("feeName", getFeeName(response.getFeeCode()));
        map.put("entryType", response.getEntryType());
        map.put("counterpartEntity", response.getCounterpartEntity());
        map.put("amount", response.getAmount());
        map.put("currency", response.getCurrency());
        map.put("entryStatus", response.getEntryStatus());
        map.put("validationStatus", response.getValidationStatus());
        map.put("createdTime", response.getCreatedTime());
        map.put("createdBy", response.getCreatedBy());
        
        return map;
    }
    
    /**
     * 执行校验逻辑
     */
    private Map<String, Object> performValidation(String feeCode, String serviceCode, String supplierType) {
        Map<String, Object> result = new HashMap<>();
        
        // 简化的校验逻辑
        boolean serviceCompatible = isServiceCompatible(feeCode, serviceCode);
        boolean supplierCompatible = supplierType == null || isSupplierCompatible(feeCode, supplierType);
        
        if (serviceCompatible && supplierCompatible) {
            result.put("validationResult", "VALID");
            result.put("warningMessage", null);
        } else if (!serviceCompatible) {
            result.put("validationResult", "ERROR");
            result.put("warningMessage", "费用科目 " + feeCode + " 不适用于服务 " + serviceCode);
        } else {
            result.put("validationResult", "WARNING");
            result.put("warningMessage", "费用科目 " + feeCode + " 对供应商类型 " + supplierType + " 的适用性需要确认");
        }
        
        return result;
    }
    
    /**
     * 执行服务推荐逻辑
     */
    private Map<String, Object> performServiceSuggestion(String orderId, String feeCode) {
        Map<String, Object> suggestion = new HashMap<>();
        
        // 简化的服务推荐逻辑
        List<String> applicableServices = getApplicableServices(feeCode);
        List<String> orderServices = Arrays.asList("MBL_PROCESSING", "BOOKING", "CUSTOMS_DECLARATION");
        
        List<String> intersection = applicableServices.stream()
            .filter(orderServices::contains)
            .collect(Collectors.toList());
        
        if (intersection.size() == 1) {
            suggestion.put("canAutoSelect", true);
            suggestion.put("suggestedService", intersection.get(0));
            suggestion.put("reason", "费用科目适用服务与订单服务交集唯一");
        } else if (intersection.size() > 1) {
            suggestion.put("canAutoSelect", false);
            suggestion.put("suggestedService", null);
            suggestion.put("reason", "费用科目适用多个订单服务，需要手动选择");
        } else {
            suggestion.put("canAutoSelect", false);
            suggestion.put("suggestedService", null);
            suggestion.put("reason", "费用科目不适用于当前订单的任何服务");
        }
        
        return suggestion;
    }
    
    /**
     * 检查服务兼容性
     */
    private boolean isServiceCompatible(String feeCode, String serviceCode) {
        Map<String, List<String>> compatibility = Map.of(
            "FCL001", Arrays.asList("MBL_PROCESSING", "BOOKING"),
            "THC001", Arrays.asList("TERMINAL_HANDLING"),
            "CUSTOMS001", Arrays.asList("CUSTOMS_DECLARATION", "CUSTOMS_CLEARANCE"),
            "TRUCKING001", Arrays.asList("TRANSPORTATION")
        );
        
        return compatibility.getOrDefault(feeCode, Collections.emptyList()).contains(serviceCode);
    }
    
    /**
     * 检查供应商兼容性
     */
    private boolean isSupplierCompatible(String feeCode, String supplierType) {
        Map<String, List<String>> compatibility = Map.of(
            "FCL001", Arrays.asList("SHIPPING_COMPANY"),
            "THC001", Arrays.asList("TERMINAL"),
            "CUSTOMS001", Arrays.asList("CUSTOMS_BROKER"),
            "TRUCKING001", Arrays.asList("TRUCKING_COMPANY")
        );
        
        return compatibility.getOrDefault(feeCode, Collections.emptyList()).contains(supplierType);
    }
    
    /**
     * 获取费用科目适用的服务列表
     */
    private List<String> getApplicableServices(String feeCode) {
        Map<String, List<String>> serviceMap = Map.of(
            "FCL001", Arrays.asList("MBL_PROCESSING", "BOOKING"),
            "THC001", Arrays.asList("TERMINAL_HANDLING"),
            "CUSTOMS001", Arrays.asList("CUSTOMS_DECLARATION", "CUSTOMS_CLEARANCE"),
            "TRUCKING001", Arrays.asList("TRANSPORTATION")
        );
        
        return serviceMap.getOrDefault(feeCode, Collections.emptyList());
    }
    
    /**
     * 获取服务名称
     */
    private String getServiceName(String serviceCode) {
        Map<String, String> serviceNames = Map.of(
            "MBL_PROCESSING", "MBL处理",
            "HBL_PROCESSING", "HBL处理",
            "BOOKING", "订舱",
            "VESSEL_MANIFEST", "舱单",
            "CUSTOMS_DECLARATION", "报关",
            "CUSTOMS_CLEARANCE", "清关",
            "CONTAINER_LOADING", "装箱",
            "CARGO_LOADING", "装货",
            "TRANSPORTATION", "运输",
            "TERMINAL_HANDLING", "码头操作"
        );
        return serviceNames.getOrDefault(serviceCode, serviceCode);
    }
    
    /**
     * 获取费用科目名称
     */
    private String getFeeName(String feeCode) {
        Map<String, String> feeNames = new HashMap<>();
        feeNames.put("FCL001", "海运费");
        feeNames.put("THC001", "码头操作费");
        feeNames.put("CUSTOMS001", "报关费");
        feeNames.put("TRUCKING001", "拖车费");
        feeNames.put("BAF001", "燃油附加费");
        feeNames.put("CFS001", "拼箱费");
        feeNames.put("WAREHOUSE001", "仓储费");
        feeNames.put("DOC001", "文件费");
        feeNames.put("CLEANING001", "洗箱费");
        feeNames.put("SEAL001", "铅封费");
        feeNames.put("EXAM001", "查验费");
        feeNames.put("SECURITY001", "安检费");
        return feeNames.getOrDefault(feeCode, feeCode);
    }
    
    /**
     * 根据订单ID获取客户名称
     * TODO: 实际应该从订单表查询，这里先用模拟数据
     */
    private String getCustomerNameByOrderId(String orderId) {
        Map<String, String> customerNames = new HashMap<>();
        customerNames.put("HW-EXPORT-20240101-001", "华为技术有限公司");
        customerNames.put("MIDEA-SHIP-20240102-001", "美的集团股份有限公司");
        customerNames.put("SH-AUTO-20240103-001", "上汽集团");
        
        return customerNames.getOrDefault(orderId, "未知客户");
    }
}