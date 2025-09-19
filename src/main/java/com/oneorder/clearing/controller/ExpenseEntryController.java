package com.oneorder.clearing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 录费模块控制器
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */
@RestController
@RequestMapping("/api/expense-entries")
@CrossOrigin(origins = "*")
public class ExpenseEntryController {
    
    private static final Logger logger = LoggerFactory.getLogger(ExpenseEntryController.class);
    
    // 模拟数据存储
    private static final Map<String, Map<String, Object>> expenseEntries = new HashMap<>();
    private static final Map<String, Map<String, Object>> entryStatus = new HashMap<>();
    private static final List<Map<String, Object>> legalEntities = new ArrayList<>();
    private static final List<Map<String, Object>> feeServiceConstraints = new ArrayList<>();
    private static final List<Map<String, Object>> feeSupplierConstraints = new ArrayList<>();
    
    static {
        // 初始化法人实体数据
        initializeLegalEntities();
        // 初始化费用科目约束数据
        initializeFeeConstraints();
        // 初始化录费状态数据
        initializeEntryStatus();
    }
    
    /**
     * 添加费用明细
     */
    @PostMapping("")
    public ResponseEntity<Map<String, Object>> addExpenseEntry(@RequestBody Map<String, Object> request) {
        try {
            logger.info("添加费用明细请求: {}", request);
            
            // 生成明细ID
            String entryId = "EE" + System.currentTimeMillis();
            String orderId = (String) request.get("orderId");
            
            // 执行费用科目和服务的校验
            Map<String, Object> validationResult = validateFeeServiceConstraint(
                (String) request.get("feeCode"),
                (String) request.get("serviceCode"),
                (String) request.get("supplierType")
            );
            
            // 构建费用明细对象
            Map<String, Object> entry = new HashMap<>(request);
            entry.put("id", entryId);
            entry.put("createdTime", LocalDateTime.now());
            entry.put("createdBy", "current_user"); // 实际应从session获取
            entry.put("entryStatus", "DRAFT");
            entry.put("validationStatus", validationResult.get("validationResult"));
            entry.put("validationMessage", validationResult.get("warningMessage"));
            
            // 存储明细
            expenseEntries.put(entryId, entry);
            
            // 更新订单录费状态
            updateOrderEntryStatus(orderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "费用明细添加成功");
            response.put("data", Map.of(
                "entryId", entryId,
                "validationStatus", validationResult.get("validationResult"),
                "autoSelectedService", false
            ));
            
            logger.info("费用明细添加成功: {}", entryId);
            return ResponseEntity.ok(response);
            
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
            
            // 查询该订单的所有费用明细
            List<Map<String, Object>> orderEntries = expenseEntries.values().stream()
                .filter(entry -> orderId.equals(entry.get("orderId")))
                .map(this::enrichEntryWithNames)
                .collect(Collectors.toList());
            
            // 获取订单录费状态
            Map<String, Object> orderStatus = entryStatus.get(orderId);
            if (orderStatus == null) {
                orderStatus = Map.of(
                    "orderId", orderId,
                    "entryStatus", "IN_PROGRESS",
                    "receivableCount", 0,
                    "payableCount", 0
                );
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", Map.of(
                "orderInfo", orderStatus,
                "entries", orderEntries
            ));
            
            return ResponseEntity.ok(response);
            
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
            
            Map<String, Object> validationResult = validateFeeServiceConstraint(feeCode, serviceCode, supplierType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", validationResult);
            
            return ResponseEntity.ok(response);
            
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
            
            // 查找费用科目适用的服务
            List<String> applicableServices = feeServiceConstraints.stream()
                .filter(constraint -> feeCode.equals(constraint.get("feeCode")))
                .filter(constraint -> "ALLOWED".equals(constraint.get("constraintType")))
                .map(constraint -> (String) constraint.get("serviceCode"))
                .collect(Collectors.toList());
            
            // 模拟订单服务项目（实际应从订单表查询）
            List<String> orderServices = Arrays.asList("MBL_PROCESSING", "BOOKING", "CUSTOMS_DECLARATION");
            
            // 计算交集
            List<String> intersection = applicableServices.stream()
                .filter(orderServices::contains)
                .collect(Collectors.toList());
            
            Map<String, Object> suggestion = new HashMap<>();
            if (intersection.size() == 1) {
                suggestion.put("canAutoSelect", true);
                suggestion.put("suggestedService", intersection.get(0));
                suggestion.put("reason", "费用科目适用服务与订单服务交集唯一");
                suggestion.put("conflictServices", Collections.emptyList());
            } else if (intersection.size() > 1) {
                suggestion.put("canAutoSelect", false);
                suggestion.put("suggestedService", null);
                suggestion.put("reason", "费用科目适用多个订单服务，需要手动选择");
                suggestion.put("conflictServices", intersection);
            } else {
                suggestion.put("canAutoSelect", false);
                suggestion.put("suggestedService", null);
                suggestion.put("reason", "费用科目不适用于当前订单的任何服务");
                suggestion.put("conflictServices", Collections.emptyList());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", suggestion);
            
            return ResponseEntity.ok(response);
            
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
            
            // 统计收付款明细
            List<Map<String, Object>> orderEntries = expenseEntries.values().stream()
                .filter(entry -> orderId.equals(entry.get("orderId")))
                .collect(Collectors.toList());
            
            long receivableCount = orderEntries.stream()
                .filter(entry -> "RECEIVABLE".equals(entry.get("entryType")))
                .count();
            
            long payableCount = orderEntries.stream()
                .filter(entry -> "PAYABLE".equals(entry.get("entryType")))
                .count();
            
            BigDecimal totalReceivable = orderEntries.stream()
                .filter(entry -> "RECEIVABLE".equals(entry.get("entryType")))
                .map(entry -> new BigDecimal(entry.get("amount").toString()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalPayable = orderEntries.stream()
                .filter(entry -> "PAYABLE".equals(entry.get("entryType")))
                .map(entry -> new BigDecimal(entry.get("amount").toString()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 更新录费状态为已完成
            Map<String, Object> status = new HashMap<>();
            status.put("orderId", orderId);
            status.put("entryStatus", "COMPLETED");
            status.put("receivableCount", (int) receivableCount);
            status.put("payableCount", (int) payableCount);
            status.put("totalReceivable", totalReceivable);
            status.put("totalPayable", totalPayable);
            status.put("completedTime", LocalDateTime.now());
            status.put("canStartProfitSharing", true);
            status.put("canStartClearing", true);
            
            entryStatus.put(orderId, status);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "录费已完成");
            response.put("data", status);
            
            logger.info("订单录费完成: {}", orderId);
            return ResponseEntity.ok(response);
            
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
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", legalEntities);
            
            return ResponseEntity.ok(response);
            
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
            // 模拟费用科目数据
            List<Map<String, Object>> feeCodes = Arrays.asList(
                Map.of("feeCode", "FCL001", "feeName", "海运费", "category", "跨境运输费用"),
                Map.of("feeCode", "THC001", "feeName", "码头操作费", "category", "码头港口场站费用"),
                Map.of("feeCode", "CUSTOMS001", "feeName", "报关费", "category", "单证文件费用"),
                Map.of("feeCode", "TRUCKING001", "feeName", "拖车费", "category", "境内运输费用"),
                Map.of("feeCode", "BAF001", "feeName", "燃油附加费", "category", "跨境运输费用"),
                Map.of("feeCode", "CFS001", "feeName", "拼箱费", "category", "集装箱费用"),
                Map.of("feeCode", "WAREHOUSE001", "feeName", "仓储费", "category", "仓储服务费用")
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", feeCodes);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("获取费用科目列表失败", e);
            return ResponseEntity.ok(Map.of(
                "code", 500,
                "message", "获取费用科目失败: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 获取服务项目列表
     */
    @GetMapping("/service-codes")
    public ResponseEntity<Map<String, Object>> getServiceCodes() {
        try {
            // 模拟服务项目数据
            List<Map<String, Object>> serviceCodes = Arrays.asList(
                Map.of("serviceCode", "MBL_PROCESSING", "serviceName", "MBL处理", "businessType", "海运"),
                Map.of("serviceCode", "BOOKING", "serviceName", "订舱", "businessType", "海运"),
                Map.of("serviceCode", "VESSEL_MANIFEST", "serviceName", "舱单", "businessType", "海运"),
                Map.of("serviceCode", "CUSTOMS_DECLARATION", "serviceName", "报关", "businessType", "关务"),
                Map.of("serviceCode", "CUSTOMS_CLEARANCE", "serviceName", "清关", "businessType", "关务"),
                Map.of("serviceCode", "INLAND_TRANSPORT", "serviceName", "境内运输", "businessType", "陆运"),
                Map.of("serviceCode", "TERMINAL_HANDLING", "serviceName", "码头操作", "businessType", "港口服务")
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", serviceCodes);
            
            return ResponseEntity.ok(response);
            
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
    public ResponseEntity<Map<String, Object>> deleteExpenseEntry(@PathVariable String entryId) {
        try {
            logger.info("删除费用明细: {}", entryId);
            
            Map<String, Object> entry = expenseEntries.remove(entryId);
            if (entry == null) {
                return ResponseEntity.ok(Map.of(
                    "code", 404,
                    "message", "费用明细不存在"
                ));
            }
            
            // 更新订单录费状态
            String orderId = (String) entry.get("orderId");
            updateOrderEntryStatus(orderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "费用明细删除成功");
            
            return ResponseEntity.ok(response);
            
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
     * 校验费用科目和服务约束
     */
    private Map<String, Object> validateFeeServiceConstraint(String feeCode, String serviceCode, String supplierType) {
        Map<String, Object> result = new HashMap<>();
        
        // 查找服务约束
        Optional<Map<String, Object>> serviceConstraint = feeServiceConstraints.stream()
            .filter(c -> feeCode.equals(c.get("feeCode")) && serviceCode.equals(c.get("serviceCode")))
            .findFirst();
        
        // 查找供应商约束
        Optional<Map<String, Object>> supplierConstraint = Optional.empty();
        if (supplierType != null) {
            supplierConstraint = feeSupplierConstraints.stream()
                .filter(c -> feeCode.equals(c.get("feeCode")) && supplierType.equals(c.get("supplierType")))
                .findFirst();
        }
        
        boolean serviceCompatible = serviceConstraint.isPresent() && 
            !"FORBIDDEN".equals(serviceConstraint.get().get("constraintType"));
        
        boolean supplierCompatible = supplierType == null || 
            (supplierConstraint.isPresent() && !"FORBIDDEN".equals(supplierConstraint.get().get("constraintType")));
        
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
        
        result.put("serviceCompatible", serviceCompatible);
        result.put("supplierCompatible", supplierCompatible);
        result.put("autoSuggestedService", null);
        result.put("suggestedFees", Collections.emptyList());
        
        return result;
    }
    
    /**
     * 更新订单录费状态
     */
    private void updateOrderEntryStatus(String orderId) {
        List<Map<String, Object>> orderEntries = expenseEntries.values().stream()
            .filter(entry -> orderId.equals(entry.get("orderId")))
            .collect(Collectors.toList());
        
        long receivableCount = orderEntries.stream()
            .filter(entry -> "RECEIVABLE".equals(entry.get("entryType")))
            .count();
        
        long payableCount = orderEntries.stream()
            .filter(entry -> "PAYABLE".equals(entry.get("entryType")))
            .count();
        
        BigDecimal totalReceivable = orderEntries.stream()
            .filter(entry -> "RECEIVABLE".equals(entry.get("entryType")))
            .map(entry -> new BigDecimal(entry.get("amount").toString()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalPayable = orderEntries.stream()
            .filter(entry -> "PAYABLE".equals(entry.get("entryType")))
            .map(entry -> new BigDecimal(entry.get("amount").toString()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Map<String, Object> status = entryStatus.getOrDefault(orderId, new HashMap<>());
        status.put("orderId", orderId);
        status.put("entryStatus", "IN_PROGRESS");
        status.put("receivableCount", (int) receivableCount);
        status.put("payableCount", (int) payableCount);
        status.put("totalReceivable", totalReceivable);
        status.put("totalPayable", totalPayable);
        status.put("lastModifiedTime", LocalDateTime.now());
        
        entryStatus.put(orderId, status);
    }
    
    /**
     * 丰富明细信息（添加名称等）
     */
    private Map<String, Object> enrichEntryWithNames(Map<String, Object> entry) {
        Map<String, Object> enriched = new HashMap<>(entry);
        
        // 添加服务名称
        String serviceCode = (String) entry.get("serviceCode");
        enriched.put("serviceName", getServiceName(serviceCode));
        
        // 添加费用科目名称
        String feeCode = (String) entry.get("feeCode");
        enriched.put("feeName", getFeeName(feeCode));
        
        // 添加法人实体名称
        String entityId = (String) entry.get("ourEntityId");
        enriched.put("ourEntityName", getEntityName(entityId));
        
        return enriched;
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
     * 获取费用科目名称
     */
    private String getFeeName(String feeCode) {
        Map<String, String> feeNames = Map.of(
            "FCL001", "海运费",
            "THC001", "码头操作费", 
            "CUSTOMS001", "报关费",
            "TRUCKING001", "拖车费",
            "BAF001", "燃油附加费",
            "CFS001", "拼箱费",
            "WAREHOUSE001", "仓储费"
        );
        return feeNames.getOrDefault(feeCode, feeCode);
    }
    
    /**
     * 获取法人实体名称
     */
    private String getEntityName(String entityId) {
        return legalEntities.stream()
            .filter(entity -> entityId.equals(entity.get("entityId")))
            .map(entity -> (String) entity.get("entityName"))
            .findFirst()
            .orElse(entityId);
    }
    
    // ===== 静态初始化方法 =====
    
    private static void initializeLegalEntities() {
        legalEntities.addAll(Arrays.asList(
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
        ));
    }
    
    private static void initializeFeeConstraints() {
        // 费用科目服务约束
        feeServiceConstraints.addAll(Arrays.asList(
            Map.of("feeCode", "FCL001", "serviceCode", "MBL_PROCESSING", "constraintType", "ALLOWED", "priority", 10),
            Map.of("feeCode", "FCL001", "serviceCode", "BOOKING", "constraintType", "ALLOWED", "priority", 9),
            Map.of("feeCode", "THC001", "serviceCode", "TERMINAL_HANDLING", "constraintType", "ALLOWED", "priority", 10),
            Map.of("feeCode", "CUSTOMS001", "serviceCode", "CUSTOMS_DECLARATION", "constraintType", "ALLOWED", "priority", 10),
            Map.of("feeCode", "TRUCKING001", "serviceCode", "INLAND_TRANSPORT", "constraintType", "ALLOWED", "priority", 10)
        ));
        
        // 费用科目供应商约束
        feeSupplierConstraints.addAll(Arrays.asList(
            Map.of("feeCode", "FCL001", "supplierType", "SHIPPING_COMPANY", "constraintType", "ALLOWED", "priority", 10),
            Map.of("feeCode", "THC001", "supplierType", "TERMINAL_OPERATOR", "constraintType", "ALLOWED", "priority", 10),
            Map.of("feeCode", "CUSTOMS001", "supplierType", "CUSTOMS_BROKER", "constraintType", "ALLOWED", "priority", 10),
            Map.of("feeCode", "TRUCKING001", "supplierType", "TRUCKING_COMPANY", "constraintType", "ALLOWED", "priority", 10)
        ));
    }
    
    private static void initializeEntryStatus() {
        entryStatus.put("HCBD20250916001", Map.of(
            "orderId", "HCBD20250916001",
            "entryStatus", "IN_PROGRESS",
            "receivableCount", 0,
            "payableCount", 0,
            "totalReceivable", BigDecimal.ZERO,
            "totalPayable", BigDecimal.ZERO
        ));
        
        entryStatus.put("HCBD20250916002", Map.of(
            "orderId", "HCBD20250916002", 
            "entryStatus", "IN_PROGRESS",
            "receivableCount", 0,
            "payableCount", 0,
            "totalReceivable", BigDecimal.ZERO,
            "totalPayable", BigDecimal.ZERO
        ));
    }
}