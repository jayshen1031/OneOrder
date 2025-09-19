package com.oneorder.clearing.controller;

import com.oneorder.clearing.dto.ClearingRequest;
import com.oneorder.clearing.dto.ClearingResponse;
import com.oneorder.clearing.entity.ClearingResult;
import com.oneorder.clearing.entity.Order;
import com.oneorder.clearing.service.ClearingEngine;
import com.oneorder.clearing.service.AccountingService;
import com.oneorder.clearing.dto.VoucherRequest;
import com.oneorder.clearing.dto.VoucherResponse;
import com.oneorder.clearing.entity.TransitEntity;
import com.oneorder.clearing.entity.CrossBorderFlow;
import com.oneorder.clearing.entity.Staff;
import com.oneorder.clearing.entity.Department;
import com.oneorder.clearing.entity.InternalProtocol;
import com.oneorder.clearing.entity.OrderService;
import com.oneorder.clearing.repository.TransitEntityRepository;
import com.oneorder.clearing.repository.CrossBorderFlowRepository;
import com.oneorder.clearing.repository.StaffRepository;
import com.oneorder.clearing.repository.DepartmentRepository;
import com.oneorder.clearing.repository.InternalProtocolRepository;
import com.oneorder.clearing.repository.OrderServiceRepository;
import com.oneorder.clearing.dto.InternalProtocolDTO;
import com.oneorder.clearing.dto.OrderServiceDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 清分控制器
 */
@Tag(name = "清分管理", description = "订单清分相关接口")
@RestController
@RequestMapping("/clearing")
@RequiredArgsConstructor
@Slf4j
public class ClearingController {
    
    private final ClearingEngine clearingEngine;
    private final AccountingService accountingService;
    private final TransitEntityRepository transitEntityRepository;
    private final CrossBorderFlowRepository crossBorderFlowRepository;
    private final StaffRepository staffRepository;
    private final DepartmentRepository departmentRepository;
    private final InternalProtocolRepository internalProtocolRepository;
    private final OrderServiceRepository orderServiceRepository;
    
    @Operation(summary = "执行清分", description = "对指定订单执行清分计算")
    @PostMapping("/execute")
    public ResponseEntity<ClearingResponse> executeClearing(@Valid @RequestBody ClearingRequest request) {
        log.info("收到清分请求，订单ID: {}", request.getOrder().getOrderId());
        
        try {
            ClearingResponse response = clearingEngine.executeClearing(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("清分执行失败", e);
            ClearingResponse errorResponse = ClearingResponse.failed("清分执行失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @Operation(summary = "试算清分", description = "试算清分结果，不入库")
    @PostMapping("/simulate")
    public ResponseEntity<List<ClearingResult>> simulateClearing(@Valid @RequestBody Order order) {
        log.info("收到试算请求，订单ID: {}", order.getOrderId());
        
        try {
            List<ClearingResult> results = clearingEngine.calculateClearing(order);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("试算失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "星式清分", description = "使用星式模式进行清分")
    @PostMapping("/star-mode")
    public ResponseEntity<List<ClearingResult>> starModeClearing(@Valid @RequestBody Order order) {
        log.info("收到星式清分请求，订单ID: {}", order.getOrderId());
        
        try {
            List<ClearingResult> results = clearingEngine.starModeClearing(order);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("星式清分失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "链式清分", description = "使用链式模式进行清分")
    @PostMapping("/chain-mode")
    public ResponseEntity<List<ClearingResult>> chainModeClearing(@Valid @RequestBody Order order) {
        log.info("收到链式清分请求，订单ID: {}", order.getOrderId());
        
        try {
            List<ClearingResult> results = clearingEngine.chainModeClearing(order);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("链式清分失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "创建凭证", description = "根据清分结果创建会计凭证")
    @PostMapping("/voucher")
    public ResponseEntity<VoucherResponse> createVoucher(@Valid @RequestBody VoucherRequest request) {
        log.info("收到创建凭证请求，订单ID: {}", request.getOrderId());
        
        try {
            VoucherResponse response = accountingService.createVoucher(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("创建凭证失败", e);
            VoucherResponse errorResponse = VoucherResponse.failed("创建凭证失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @Operation(summary = "过账凭证", description = "将凭证过账到总账")
    @PostMapping("/voucher/{voucherId}/post")
    public ResponseEntity<String> postVoucher(@PathVariable String voucherId) {
        log.info("收到过账请求，凭证ID: {}", voucherId);
        
        try {
            boolean success = accountingService.postVoucher(voucherId);
            if (success) {
                return ResponseEntity.ok("凭证过账成功");
            } else {
                return ResponseEntity.badRequest().body("凭证过账失败");
            }
        } catch (Exception e) {
            log.error("过账失败", e);
            return ResponseEntity.internalServerError().body("过账失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "批量过账", description = "批量过账多个凭证")
    @PostMapping("/voucher/batch-post")
    public ResponseEntity<List<String>> batchPostVouchers(@RequestBody List<String> voucherIds) {
        log.info("收到批量过账请求，凭证数量: {}", voucherIds.size());
        
        try {
            List<String> successList = accountingService.batchPostVouchers(voucherIds);
            return ResponseEntity.ok(successList);
        } catch (Exception e) {
            log.error("批量过账失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "验证清分结果", description = "验证清分结果的正确性")
    @PostMapping("/validate")
    public ResponseEntity<Boolean> validateClearingResults(@RequestBody List<ClearingResult> results) {
        log.info("收到验证请求，清分结果数量: {}", results.size());
        
        try {
            boolean isValid = clearingEngine.validateClearingResults(results);
            return ResponseEntity.ok(isValid);
        } catch (Exception e) {
            log.error("验证失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "初始化测试数据", description = "初始化借抬头和过账规则的测试数据")
    @PostMapping("/init-test-data")
    public ResponseEntity<Map<String, Object>> initTestData() {
        log.info("开始初始化测试数据...");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 清理旧数据
            transitEntityRepository.deleteAll();
            crossBorderFlowRepository.deleteAll();
            
            // 创建收款借抬头配置
            TransitEntity receivableTransit = new TransitEntity();
            receivableTransit.setTransitId("TRANSIT_RECEIVABLE_001");
            receivableTransit.setTransitType(TransitEntity.TransitType.RECEIVABLE_TRANSIT);
            receivableTransit.setSourceEntityId("CUSTOMER_001");
            receivableTransit.setTransitEntityId("ENTITY_HK_001");
            receivableTransit.setTargetEntityId("ENTITY_CN_SALES");
            receivableTransit.setTransitAccount("6225881234567890");
            receivableTransit.setRetentionRate(new BigDecimal("0.03"));
            receivableTransit.setRetentionType(TransitEntity.RetentionType.PERCENTAGE);
            receivableTransit.setApplicableConditions("{\"businessTypes\":[\"OCEAN_FREIGHT\",\"AIR_FREIGHT\"],\"currencies\":[\"CNY\",\"USD\"]}");
            receivableTransit.setCreatedTime(LocalDateTime.now());
            receivableTransit.setUpdatedTime(LocalDateTime.now());
            receivableTransit.setCreatedBy("SYSTEM");
            receivableTransit.setUpdatedBy("SYSTEM");
            transitEntityRepository.save(receivableTransit);
            
            // 创建付款借抬头配置
            TransitEntity payableTransit = new TransitEntity();
            payableTransit.setTransitId("TRANSIT_PAYABLE_001");
            payableTransit.setTransitType(TransitEntity.TransitType.PAYABLE_TRANSIT);
            payableTransit.setSourceEntityId("ENTITY_CN_SALES");
            payableTransit.setTransitEntityId("ENTITY_SG_001");
            payableTransit.setTargetEntityId("SUPPLIER_001");
            payableTransit.setTransitAccount("6225880000000001");
            payableTransit.setFixedRetentionAmount(new BigDecimal("1000"));
            payableTransit.setRetentionType(TransitEntity.RetentionType.FIXED_AMOUNT);
            payableTransit.setApplicableConditions("{\"businessTypes\":[\"TRUCK_FREIGHT\",\"RAIL_FREIGHT\"],\"currencies\":[\"CNY\"]}");
            payableTransit.setCreatedTime(LocalDateTime.now());
            payableTransit.setCreatedBy("SYSTEM");
            transitEntityRepository.save(payableTransit);
            
            // 创建标准过账流程配置
            CrossBorderFlow standardFlow = new CrossBorderFlow();
            standardFlow.setFlowId("FLOW_STANDARD_001");
            standardFlow.setFlowType(CrossBorderFlow.FlowType.STANDARD_FLOW);
            standardFlow.setPayerEntityId("ENTITY_CN_NINGBO");
            standardFlow.setPayerRegion("CN");
            standardFlow.setTransitEntityId("ENTITY_HK_TRANSIT");
            standardFlow.setTransitRegion("HK");
            standardFlow.setReceiverEntityId("ENTITY_TH_RECEIVER");
            standardFlow.setReceiverRegion("TH");
            standardFlow.setProcessingType(CrossBorderFlow.ProcessingType.FLAT_TRANSFER);
            standardFlow.setTransitRetentionRate(new BigDecimal("0.005"));
            standardFlow.setNettingEnabled(true);
            standardFlow.setNettingPriority(1);
            standardFlow.setApplicableConditions("{\"businessTypes\":[\"OCEAN_FREIGHT\"],\"currencies\":[\"CNY\",\"USD\"]}");
            standardFlow.setCreatedTime(LocalDateTime.now());
            standardFlow.setCreatedBy("SYSTEM");
            crossBorderFlowRepository.save(standardFlow);
            
            result.put("success", true);
            result.put("message", "测试数据初始化成功");
            result.put("data", Map.of(
                "transitEntities", 2,
                "crossBorderFlows", 1,
                "timestamp", LocalDateTime.now()
            ));
            
            log.info("测试数据初始化完成");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("初始化测试数据失败", e);
            result.put("success", false);
            result.put("message", "初始化失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    // ==================== 内部协议管理接口 ====================
    
    @Operation(summary = "匹配可用内部协议", description = "根据销售部门和操作部门匹配可用的内部协议")
    @PostMapping("/protocols/match")
    public ResponseEntity<List<InternalProtocolDTO>> matchAvailableProtocols(
            @RequestParam String salesDepartmentId,
            @RequestParam String operationDepartmentId,
            @RequestParam(required = false) String serviceCode,
            @RequestParam(required = false) String businessType) {
        log.info("匹配内部协议请求 - 销售部门: {}, 操作部门: {}, 服务代码: {}, 业务类型: {}", 
                salesDepartmentId, operationDepartmentId, serviceCode, businessType);
        
        try {
            List<InternalProtocol> protocols = internalProtocolRepository
                .findApplicableProtocols(salesDepartmentId, operationDepartmentId, serviceCode, businessType);
            
            List<InternalProtocolDTO> result = protocols.stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("匹配内部协议失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "服务派单", description = "将服务分配给操作人员并选择内部协议")
    @PostMapping("/services/assign")
    public ResponseEntity<Map<String, Object>> assignService(
            @RequestParam String orderId,
            @RequestParam String serviceCode,
            @RequestParam String operationStaffId,
            @RequestParam String protocolId) {
        log.info("服务派单请求 - 订单: {}, 服务: {}, 操作员: {}, 协议: {}", 
                orderId, serviceCode, operationStaffId, protocolId);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 验证操作员是否存在
            Staff operationStaff = staffRepository.findById(operationStaffId).orElse(null);
            if (operationStaff == null) {
                result.put("success", false);
                result.put("message", "操作员不存在");
                return ResponseEntity.badRequest().body(result);
            }
            
            // 验证内部协议是否存在且有效
            InternalProtocol protocol = internalProtocolRepository.findById(protocolId).orElse(null);
            if (protocol == null || !protocol.getActive()) {
                result.put("success", false);
                result.put("message", "内部协议不存在或已失效");
                return ResponseEntity.badRequest().body(result);
            }
            
            // 创建订单服务记录
            OrderService orderService = new OrderService();
            orderService.setOrderId(orderId);
            orderService.setServiceCode(serviceCode);
            orderService.setOperationStaffId(operationStaffId);
            orderService.setInternalProtocolId(protocolId);
            orderService.setStatus(OrderService.ServiceStatus.ASSIGNED);
            orderService.setAssignedTime(LocalDateTime.now());
            orderService.setCreatedBy("SYSTEM");
            orderService.setUpdatedBy("SYSTEM");
            
            OrderService saved = orderServiceRepository.save(orderService);
            
            result.put("success", true);
            result.put("message", "服务派单成功");
            result.put("data", Map.of(
                "serviceId", saved.getServiceId(),
                "serviceId", saved.getServiceId(),
                "operationStaffName", operationStaff.getStaffName(),
                "protocolName", protocol.getProtocolName(),
                "assignedTime", saved.getAssignedTime()
            ));
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("服务派单失败", e);
            result.put("success", false);
            result.put("message", "派单失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    @Operation(summary = "确认内部协议", description = "操作人员确认内部协议")
    @PostMapping("/services/confirm-protocol")
    public ResponseEntity<Map<String, Object>> confirmProtocol(
            @RequestParam String orderServiceId,
            @RequestParam String operationStaffId) {
        log.info("确认协议请求 - 订单服务: {}, 操作员: {}", orderServiceId, operationStaffId);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            OrderService orderService = orderServiceRepository.findById(Long.valueOf(orderServiceId)).orElse(null);
            if (orderService == null) {
                result.put("success", false);
                result.put("message", "订单服务不存在");
                return ResponseEntity.badRequest().body(result);
            }
            
            // 验证操作员权限
            if (!orderService.getOperationStaffId().equals(operationStaffId)) {
                result.put("success", false);
                result.put("message", "您没有权限操作此服务");
                return ResponseEntity.badRequest().body(result);
            }
            
            // 确认协议
            orderService.confirmProtocol();
            orderService.setUpdatedBy(operationStaffId);
            OrderService saved = orderServiceRepository.save(orderService);
            
            result.put("success", true);
            result.put("message", "协议确认成功");
            result.put("data", Map.of(
                "status", saved.getStatus(),
                "protocolConfirmedTime", saved.getProtocolConfirmedTime()
            ));
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("确认协议失败", e);
            result.put("success", false);
            result.put("message", "确认失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    @Operation(summary = "我的任务列表", description = "查询操作人员的任务列表")
    @GetMapping("/my-tasks/{operationStaffId}")
    public ResponseEntity<List<OrderServiceDTO>> getMyTasks(@PathVariable String operationStaffId) {
        log.info("查询任务列表 - 操作员: {}", operationStaffId);
        
        try {
            List<OrderService> services = orderServiceRepository.findByOperationStaffId(operationStaffId);
            
            List<OrderServiceDTO> result = services.stream()
                .map(this::convertToOrderServiceDTO)
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询任务列表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "查询所有有效协议", description = "查询所有有效的内部协议")
    @GetMapping("/protocols")
    public ResponseEntity<List<InternalProtocolDTO>> getAllActiveProtocols() {
        log.info("查询所有有效协议");
        
        try {
            List<InternalProtocol> protocols = internalProtocolRepository.findAllActive();
            
            List<InternalProtocolDTO> result = protocols.stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询协议列表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "查询操作人员信息", description = "查询所有操作人员信息")
    @GetMapping("/staff")
    public ResponseEntity<List<Map<String, Object>>> getOperationStaff() {
        log.info("查询操作人员信息");
        
        try {
            List<Staff> operationStaff = staffRepository.findByRoleType(Staff.RoleType.OPERATION);
            
            List<Map<String, Object>> result = operationStaff.stream()
                .map(staff -> {
                    Map<String, Object> staffInfo = new HashMap<>();
                    staffInfo.put("staffId", staff.getStaffId());
                    staffInfo.put("staffName", staff.getStaffName());
                    staffInfo.put("departmentId", staff.getDepartmentId());
                    staffInfo.put("roleType", staff.getRoleType());
                    staffInfo.put("active", staff.getActive());
                    return staffInfo;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询操作人员失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "部门列表", description = "查询所有部门信息")
    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> getDepartments() {
        log.info("查询部门列表");
        
        try {
            List<Department> departments = departmentRepository.findAll();
            
            List<Map<String, Object>> result = departments.stream()
                .map(dept -> {
                    Map<String, Object> deptInfo = new HashMap<>();
                    deptInfo.put("departmentId", dept.getDepartmentId());
                    deptInfo.put("departmentName", dept.getDepartmentName());
                    deptInfo.put("departmentType", dept.getDepartmentType());
                    deptInfo.put("active", true); // 默认为true，部门实体没有active字段
                    return deptInfo;
                })
                .collect(java.util.stream.Collectors.toList());
                
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询部门列表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "服务派单", description = "为订单服务分配操作人员")
    @PostMapping("/assign-service")
    public ResponseEntity<Map<String, Object>> assignService(@RequestBody Map<String, Object> request) {
        log.info("服务派单请求: {}", request);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            String orderId = (String) request.get("orderId");
            String serviceCode = (String) request.get("serviceCode");
            String assignedStaffId = (String) request.get("assignedStaffId");
            String protocolId = (String) request.get("protocolId");
            
            // 验证必要参数
            if (orderId == null || serviceCode == null || assignedStaffId == null) {
                result.put("success", false);
                result.put("message", "缺少必要参数");
                return ResponseEntity.badRequest().body(result);
            }
            
            // 查找或创建OrderService记录
            List<OrderService> existingServices = orderServiceRepository.findByOrderId(orderId);
            OrderService orderService = existingServices.stream()
                .filter(os -> serviceCode.equals(os.getServiceCode()))
                .findFirst()
                .orElse(new OrderService());
                
            orderService.setOrderId(orderId);
            orderService.setServiceCode(serviceCode);
            orderService.setOperationStaffId(assignedStaffId);
            orderService.setInternalProtocolId(protocolId);
            orderService.setStatus(OrderService.ServiceStatus.ASSIGNED);
            orderService.setAssignedTime(LocalDateTime.now());
            
            orderServiceRepository.save(orderService);
            
            result.put("success", true);
            result.put("message", "派单成功");
            result.put("serviceId", orderService.getServiceId());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("服务派单失败", e);
            result.put("success", false);
            result.put("message", "派单失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    @Operation(summary = "接单操作", description = "操作人员接受指定任务")
    @PostMapping("/accept-task/{orderId}")
    public ResponseEntity<Map<String, Object>> acceptTask(@PathVariable String orderId, @RequestBody Map<String, String> request) {
        log.info("接单操作 - 订单: {}", orderId);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            String staffId = request.get("staffId");
            
            List<OrderService> services = orderServiceRepository.findByOrderId(orderId);
            
            for (OrderService service : services) {
                if (service.getOperationStaffId().equals(staffId) && 
                    service.getStatus() == OrderService.ServiceStatus.ASSIGNED) {
                    
                    service.setStatus(OrderService.ServiceStatus.PROTOCOL_CONFIRMED);
                    service.setProtocolConfirmedTime(LocalDateTime.now());
                    orderServiceRepository.save(service);
                }
            }
            
            result.put("success", true);
            result.put("message", "接单成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("接单操作失败", e);
            result.put("success", false);
            result.put("message", "接单失败: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    // ==================== 辅助方法 ====================
    
    private InternalProtocolDTO convertToDTO(InternalProtocol protocol) {
        InternalProtocolDTO dto = new InternalProtocolDTO();
        dto.setProtocolId(protocol.getProtocolId());
        dto.setProtocolName(protocol.getProtocolName());
        dto.setSalesDepartmentId(protocol.getSalesDepartmentId());
        dto.setOperationDepartmentId(protocol.getOperationDepartmentId());
        dto.setServiceCode(protocol.getServiceCode());
        dto.setBusinessType(protocol.getBusinessType());
        dto.setBaseCommissionRate(protocol.getBaseCommissionRate());
        dto.setPerformanceBonusRate(protocol.getPerformanceBonusRate());
        dto.setActive(protocol.getActive());
        dto.setEffectiveDate(protocol.getEffectiveDate());
        dto.setExpiryDate(protocol.getExpiryDate());
        return dto;
    }
    
    private OrderServiceDTO convertToOrderServiceDTO(OrderService service) {
        OrderServiceDTO dto = new OrderServiceDTO();
        dto.setServiceId(service.getServiceId());
        dto.setOrderId(service.getOrderId());
        dto.setServiceCode(service.getServiceCode());
        dto.setOperationStaffId(service.getOperationStaffId());
        dto.setInternalProtocolId(service.getInternalProtocolId());
        dto.setStatus(service.getStatus().name());
        dto.setAssignedTime(service.getAssignedTime());
        dto.setProtocolConfirmedTime(service.getProtocolConfirmedTime());
        dto.setStartedTime(service.getStartedTime());
        dto.setCompletedTime(service.getCompletedTime());
        // dto.setCreatedTime(service.getCreatedTime()); // Remove this line as DTO doesn't have this field
        return dto;
    }
}