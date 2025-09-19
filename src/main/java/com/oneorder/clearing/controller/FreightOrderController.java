package com.oneorder.clearing.controller;

import com.oneorder.clearing.dto.*;
import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.repository.*;
import com.oneorder.clearing.service.FreightOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 货代订单控制器 - 模拟完整的货代业务流程
 */
@RestController
@RequestMapping("/freight-orders")
@Tag(name = "货代订单管理", description = "完整的货代订单生命周期管理")
@RequiredArgsConstructor
@Slf4j
public class FreightOrderController {

    private final FreightOrderService freightOrderService;
    private final ServiceConfigRepository serviceConfigRepository;
    private final InternalProtocolRepository internalProtocolRepository;
    private final OrderServiceRepository orderServiceRepository;
    private final StaffRepository staffRepository;
    private final DepartmentRepository departmentRepository;

    @PostMapping
    @Operation(summary = "创建货代订单", description = "客户下单，开始货代业务流程")
    public ResponseEntity<FreightOrderResponse> createOrder(@Valid @RequestBody CreateFreightOrderRequest request) {
        log.info("创建货代订单: {}", request.getOrderNo());
        FreightOrderResponse response = freightOrderService.createOrder(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "查询订单详情", description = "获取订单完整信息和状态")
    public ResponseEntity<FreightOrderResponse> getOrder(@PathVariable String orderId) {
        FreightOrderResponse response = freightOrderService.getOrderById(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "订单列表查询", description = "分页查询订单列表")
    public ResponseEntity<List<FreightOrderResponse>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        List<FreightOrderResponse> orders = freightOrderService.getOrders(page, size, status);
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{orderId}/booking")
    @Operation(summary = "订舱确认", description = "确认船期和舱位，进入操作阶段")
    public ResponseEntity<FreightOrderResponse> confirmBooking(
            @PathVariable String orderId, 
            @Valid @RequestBody BookingRequest request) {
        log.info("订单 {} 确认订舱: {}", orderId, request.getVessel());
        FreightOrderResponse response = freightOrderService.confirmBooking(orderId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/customs")
    @Operation(summary = "报关完成", description = "提交报关单据，完成出口报关")
    public ResponseEntity<FreightOrderResponse> completeCustoms(
            @PathVariable String orderId,
            @Valid @RequestBody CustomsRequest request) {
        log.info("订单 {} 完成报关", orderId);
        FreightOrderResponse response = freightOrderService.completeCustoms(orderId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/shipping")
    @Operation(summary = "开船通知", description = "货物装船，开始海运")
    public ResponseEntity<FreightOrderResponse> startShipping(
            @PathVariable String orderId,
            @Valid @RequestBody ShippingRequest request) {
        log.info("订单 {} 开船通知: ETD={}, ETA={}", orderId, request.getEtd(), request.getEta());
        FreightOrderResponse response = freightOrderService.startShipping(orderId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/arrival")
    @Operation(summary = "到港通知", description = "货物到达目的港")
    public ResponseEntity<FreightOrderResponse> notifyArrival(@PathVariable String orderId) {
        log.info("订单 {} 到港通知", orderId);
        FreightOrderResponse response = freightOrderService.notifyArrival(orderId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/delivery")
    @Operation(summary = "提货完成", description = "客户提货，订单完成")
    public ResponseEntity<FreightOrderResponse> completeDelivery(
            @PathVariable String orderId,
            @Valid @RequestBody DeliveryRequest request) {
        log.info("订单 {} 提货完成", orderId);
        FreightOrderResponse response = freightOrderService.completeDelivery(orderId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/costs")
    @Operation(summary = "费用确认", description = "确认所有费用，触发清分")
    public ResponseEntity<CostConfirmResponse> confirmCosts(
            @PathVariable String orderId,
            @Valid @RequestBody CostConfirmRequest request) {
        log.info("订单 {} 费用确认，触发清分", orderId);
        CostConfirmResponse response = freightOrderService.confirmCosts(orderId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}/timeline")
    @Operation(summary = "订单时间轴", description = "获取订单完整的操作时间轴")
    public ResponseEntity<OrderTimelineResponse> getOrderTimeline(@PathVariable String orderId) {
        OrderTimelineResponse response = freightOrderService.getOrderTimeline(orderId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/demo/create-sample")
    @Operation(summary = "创建演示数据", description = "一键创建完整的演示订单流程")
    public ResponseEntity<List<FreightOrderResponse>> createSampleOrders() {
        log.info("创建演示订单数据");
        List<FreightOrderResponse> orders = freightOrderService.createSampleOrders();
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/calculate-fees")
    @Operation(summary = "计算订单费用", description = "根据订单信息计算详细费用")
    public ResponseEntity<Map<String, Object>> calculateFees(@RequestBody Order order) {
        log.info("计算订单 {} 费用", order.getOrderNo());
        Map<String, Object> feeCalculation = freightOrderService.calculateOrderFees(order);
        return ResponseEntity.ok(feeCalculation);
    }

    @GetMapping("/service-rates")
    @Operation(summary = "获取服务费率", description = "获取各类运输服务费率配置")
    public ResponseEntity<Map<String, Object>> getServiceRates() {
        Map<String, Object> serviceRates = freightOrderService.getServiceRates();
        return ResponseEntity.ok(serviceRates);
    }

    @PostMapping("/batch-clearing")
    @Operation(summary = "批量清分", description = "批量处理已完成订单的清分")
    public ResponseEntity<List<String>> batchClearing(
            @RequestParam(defaultValue = "COMPLETED") String orderStatus,
            @RequestParam(defaultValue = "STAR") String clearingMode) {
        log.info("批量清分，订单状态: {}, 清分模式: {}", orderStatus, clearingMode);
        List<String> results = freightOrderService.batchClearing(orderStatus, clearingMode);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/statistics")
    @Operation(summary = "业务统计", description = "获取货代业务统计数据")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> statistics = freightOrderService.getBusinessStatistics();
        return ResponseEntity.ok(statistics);
    }

    // ==================== 服务配置管理接口 ====================
    
    @GetMapping("/test-service-config")
    @Operation(summary = "测试服务配置", description = "测试ServiceConfig数据库连接")
    public ResponseEntity<Map<String, Object>> testServiceConfig() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "ServiceConfig endpoint works!");
        response.put("timestamp", LocalDateTime.now());
        response.put("status", "OK");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/service-config")
    @Operation(summary = "获取所有服务配置", description = "获取所有启用的服务费率配置")
    public ResponseEntity<Map<String, Object>> getAllServiceConfigs(
            @RequestParam(required = false) String businessType,
            @RequestParam(required = false) String feeCategory,
            @RequestParam(required = false) String keyword) {
        
        try {
            List<ServiceConfig> configs;
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                configs = serviceConfigRepository.searchByKeyword(keyword.trim());
            } else if (businessType != null || feeCategory != null) {
                configs = serviceConfigRepository.findByBusinessTypeAndFeeCategory(businessType, feeCategory);
            } else {
                configs = serviceConfigRepository.findByEnabledTrueOrderByFeeCodeAsc();
            }
            
            // 按费用分类分组
            Map<String, List<ServiceConfig>> groupedConfigs = configs.stream()
                    .collect(Collectors.groupingBy(ServiceConfig::getFeeCategory));
            
            Map<String, Object> response = new HashMap<>();
            response.put("total", configs.size());
            response.put("configs", configs);
            response.put("groupedConfigs", groupedConfigs);
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取服务配置失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "获取服务配置失败: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/service-config/statistics")
    @Operation(summary = "获取配置统计信息", description = "获取费用分类、业务类型等统计数据")
    public ResponseEntity<Map<String, Object>> getServiceConfigStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // 总配置数量
            statistics.put("totalConfigs", serviceConfigRepository.count());
            statistics.put("enabledConfigs", serviceConfigRepository.findByEnabledTrueOrderByFeeCodeAsc().size());
            
            // 费用分类统计
            List<Object[]> feeCategoryStats = serviceConfigRepository.countByFeeCategory();
            Map<String, Long> feeCategoryMap = new HashMap<>();
            for (Object[] stat : feeCategoryStats) {
                feeCategoryMap.put((String) stat[0], (Long) stat[1]);
            }
            statistics.put("feeCategoryStats", feeCategoryMap);
            
            // 业务类型统计
            List<Object[]> businessTypeStats = serviceConfigRepository.countByBusinessType();
            Map<String, Long> businessTypeMap = new HashMap<>();
            for (Object[] stat : businessTypeStats) {
                businessTypeMap.put((String) stat[0], (Long) stat[1]);
            }
            statistics.put("businessTypeStats", businessTypeMap);
            
            // 所有分类列表
            statistics.put("allFeeCategories", serviceConfigRepository.findAllFeeCategoriesEnabled());
            statistics.put("allBusinessTypes", serviceConfigRepository.findAllBusinessTypesEnabled());
            statistics.put("allRelatedServices", serviceConfigRepository.findAllRelatedServicesEnabled());
            statistics.put("allSupplierTypes", serviceConfigRepository.findAllSupplierTypesEnabled());
            
            statistics.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            log.error("获取统计信息失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "获取统计信息失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    // ==================== 内部协议管理接口 ====================
    
    @PostMapping("/protocols/match")
    @Operation(summary = "协议匹配", description = "根据部门和服务信息匹配可用的内部协议")
    public ResponseEntity<Map<String, Object>> matchProtocols(@RequestBody ProtocolMatchRequest request) {
        try {
            log.info("协议匹配请求: 销售部门={}, 操作部门={}, 服务={}, 业务类型={}", 
                    request.getSalesDepartmentId(), request.getOperationDepartmentId(), 
                    request.getServiceCode(), request.getBusinessType());
                    
            List<InternalProtocol> protocols = internalProtocolRepository.findAvailableProtocols(
                    request.getSalesDepartmentId(),
                    request.getOperationDepartmentId(),
                    request.getServiceCode(),
                    request.getBusinessType(),
                    LocalDate.now()
            );
            
            // 转换为DTO并应用过滤条件
            List<InternalProtocolDTO> protocolDTOs = protocols.stream()
                    .map(this::convertToProtocolDTO)
                    .filter(dto -> {
                        if (request.getMinCommissionRate() != null && 
                            dto.getBaseCommissionRate().doubleValue() < request.getMinCommissionRate()) {
                            return false;
                        }
                        if (request.getMaxCommissionRate() != null && 
                            dto.getBaseCommissionRate().doubleValue() > request.getMaxCommissionRate()) {
                            return false;
                        }
                        return true;
                    })
                    .limit(request.getMaxResults() != null ? request.getMaxResults() : 20)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("protocols", protocolDTOs);
            response.put("total", protocolDTOs.size());
            response.put("matchCriteria", request);
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("协议匹配失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "协议匹配失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @PostMapping("/services/assign")
    @Operation(summary = "服务派单", description = "将服务派给操作人员并选择内部协议")
    public ResponseEntity<Map<String, Object>> assignServices(@RequestBody ServiceAssignRequest request) {
        try {
            log.info("服务派单请求: serviceIds={}, operationStaffId={}, protocolId={}", 
                    request.getServiceIds(), request.getOperationStaffId(), request.getInternalProtocolId());
            
            List<Map<String, Object>> results = new ArrayList<>();
            
            for (Long serviceId : request.getServiceIds()) {
                Optional<OrderService> serviceOpt = orderServiceRepository.findById(serviceId);
                if (!serviceOpt.isPresent()) {
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", false,
                        "error", "服务不存在"
                    ));
                    continue;
                }
                
                OrderService service = serviceOpt.get();
                
                // 检查服务状态
                if (service.getStatus() != OrderService.ServiceStatus.PENDING) {
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", false,
                        "error", "服务状态不允许派单，当前状态：" + service.getStatus().getDescription()
                    ));
                    continue;
                }
                
                // 执行派单
                service.setOperationStaffId(request.getOperationStaffId());
                service.setOperationDepartmentId(request.getOperationDepartmentId());
                service.setInternalProtocolId(request.getInternalProtocolId());
                service.setPriority(OrderService.Priority.valueOf(request.getPriority()));
                service.setServiceAmount(request.getServiceAmount());
                service.setRemarks(request.getRemarks());
                
                try {
                    service.assignToOperation();  // 更新状态和时间
                    orderServiceRepository.save(service);
                    
                    // 如果设置了自动确认协议
                    if (request.isAutoConfirmProtocol()) {
                        service.confirmProtocol();
                        orderServiceRepository.save(service);
                    }
                    
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", true,
                        "status", service.getStatus().getDescription(),
                        "assignedTime", service.getAssignedTime()
                    ));
                    
                } catch (Exception e) {
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", false,
                        "error", e.getMessage()
                    ));
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("results", results);
            response.put("totalProcessed", request.getServiceIds().size());
            response.put("successCount", results.stream().mapToInt(r -> (Boolean)r.get("success") ? 1 : 0).sum());
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("服务派单失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "服务派单失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @PostMapping("/services/confirm-protocol")
    @Operation(summary = "确认协议", description = "操作人员确认内部协议")
    public ResponseEntity<Map<String, Object>> confirmProtocol(@RequestBody ProtocolConfirmRequest request) {
        try {
            log.info("确认协议请求: serviceIds={}, protocolId={}", 
                    request.getServiceIds(), request.getInternalProtocolId());
            
            List<Map<String, Object>> results = new ArrayList<>();
            
            for (Long serviceId : request.getServiceIds()) {
                Optional<OrderService> serviceOpt = orderServiceRepository.findById(serviceId);
                if (!serviceOpt.isPresent()) {
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", false,
                        "error", "服务不存在"
                    ));
                    continue;
                }
                
                OrderService service = serviceOpt.get();
                
                // 检查服务状态
                if (service.getStatus() != OrderService.ServiceStatus.ASSIGNED) {
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", false,
                        "error", "服务状态不允许确认协议，当前状态：" + service.getStatus().getDescription()
                    ));
                    continue;
                }
                
                try {
                    // 更新协议ID（如果提供了新的）
                    if (request.getInternalProtocolId() != null) {
                        service.setInternalProtocolId(request.getInternalProtocolId());
                    }
                    
                    if (service.getRemarks() != null) {
                        service.setRemarks(service.getRemarks() + "\n协议确认备注：" + request.getConfirmRemark());
                    } else {
                        service.setRemarks("协议确认备注：" + request.getConfirmRemark());
                    }
                    service.confirmProtocol();  // 更新状态和时间
                    
                    // 如果设置了自动开始
                    if (request.isAutoStart()) {
                        service.start();
                    }
                    
                    orderServiceRepository.save(service);
                    
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", true,
                        "status", service.getStatus().getDescription(),
                        "protocolConfirmedTime", service.getProtocolConfirmedTime()
                    ));
                    
                } catch (Exception e) {
                    results.add(Map.of(
                        "serviceId", serviceId,
                        "success", false,
                        "error", e.getMessage()
                    ));
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("results", results);
            response.put("totalProcessed", request.getServiceIds().size());
            response.put("successCount", results.stream().mapToInt(r -> (Boolean)r.get("success") ? 1 : 0).sum());
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("确认协议失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "确认协议失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/my-tasks/{operationStaffId}")
    @Operation(summary = "我的任务", description = "查询操作人员的任务列表")
    public ResponseEntity<Map<String, Object>> getMyTasks(
            @PathVariable String operationStaffId,
            @RequestParam(required = false) String status) {
        try {
            OrderService.ServiceStatus serviceStatus = null;
            if (status != null) {
                serviceStatus = OrderService.ServiceStatus.valueOf(status.toUpperCase());
            }
            
            List<OrderService> services = orderServiceRepository.findMyTasks(operationStaffId, serviceStatus);
            
            List<OrderServiceDTO> serviceDTOs = services.stream()
                    .map(this::convertToOrderServiceDTO)
                    .collect(Collectors.toList());
            
            // 统计信息
            Map<String, Long> statusStats = services.stream()
                    .collect(Collectors.groupingBy(
                            s -> s.getStatus().name(),
                            Collectors.counting()
                    ));
            
            Map<String, Object> response = new HashMap<>();
            response.put("tasks", serviceDTOs);
            response.put("total", serviceDTOs.size());
            response.put("statusStats", statusStats);
            response.put("operationStaffId", operationStaffId);
            response.put("filterStatus", status);
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("查询我的任务失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "查询我的任务失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/protocols")
    @Operation(summary = "查询协议列表", description = "查询所有有效的内部协议")
    public ResponseEntity<Map<String, Object>> getProtocols(
            @RequestParam(required = false) String salesDepartmentId,
            @RequestParam(required = false) String operationDepartmentId,
            @RequestParam(required = false) String serviceCode,
            @RequestParam(required = false) String businessType) {
        try {
            List<InternalProtocol> protocols;
            
            if (salesDepartmentId != null && operationDepartmentId != null) {
                protocols = internalProtocolRepository.findAvailableProtocols(
                        salesDepartmentId, operationDepartmentId, serviceCode, businessType, LocalDate.now());
            } else {
                protocols = internalProtocolRepository.findAllEffectiveProtocols();
            }
            
            List<InternalProtocolDTO> protocolDTOs = protocols.stream()
                    .map(this::convertToProtocolDTO)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("protocols", protocolDTOs);
            response.put("total", protocolDTOs.size());
            response.put("filterCriteria", Map.of(
                "salesDepartmentId", salesDepartmentId != null ? salesDepartmentId : "",
                "operationDepartmentId", operationDepartmentId != null ? operationDepartmentId : "",
                "serviceCode", serviceCode != null ? serviceCode : "",
                "businessType", businessType != null ? businessType : ""
            ));
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("查询协议失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "查询协议失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/staff")
    @Operation(summary = "查询人员列表", description = "查询操作人员列表")
    public ResponseEntity<Map<String, Object>> getStaff(
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String roleType) {
        try {
            List<Staff> staffList;
            
            if (departmentId != null && roleType != null) {
                staffList = staffRepository.findByDepartmentIdAndRoleTypeAndActiveTrue(
                        departmentId, Staff.RoleType.valueOf(roleType.toUpperCase()));
            } else if (departmentId != null) {
                staffList = staffRepository.findByDepartmentIdAndActiveTrue(departmentId);
            } else if (roleType != null) {
                staffList = staffRepository.findByRoleTypeAndActiveTrue(Staff.RoleType.valueOf(roleType.toUpperCase()));
            } else {
                staffList = staffRepository.findByActiveTrueOrderByStaffName();
            }
            
            List<StaffDTO> staffDTOs = staffList.stream()
                    .map(this::convertToStaffDTO)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("staff", staffDTOs);
            response.put("total", staffDTOs.size());
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("查询人员失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "查询人员失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    // ==================== DTO转换方法 ====================
    
    private InternalProtocolDTO convertToProtocolDTO(InternalProtocol protocol) {
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
        dto.setCreatedBy(protocol.getCreatedBy());
        
        // 计算总佣金率
        dto.setTotalCommissionRate(protocol.getBaseCommissionRate()
                .add(protocol.getPerformanceBonusRate() != null ? protocol.getPerformanceBonusRate() : java.math.BigDecimal.ZERO));
        
        // 设置状态信息
        dto.setEffective(protocol.isEffective());
        dto.setStatus(protocol.isEffective() ? "EFFECTIVE" : "INACTIVE");
        dto.setStatusDescription(protocol.isEffective() ? "有效" : "无效");
        
        return dto;
    }
    
    private OrderServiceDTO convertToOrderServiceDTO(OrderService service) {
        OrderServiceDTO dto = new OrderServiceDTO();
        dto.setServiceId(service.getServiceId());
        dto.setOrderId(service.getOrderId());
        dto.setServiceConfigId(service.getServiceConfigId());
        dto.setServiceAmount(service.getServiceAmount());
        dto.setCurrency(service.getCurrency());
        dto.setPriority(service.getPriority().name());
        dto.setPriorityDescription(service.getPriority().getDescription());
        dto.setStatus(service.getStatus().name());
        dto.setStatusDescription(service.getStatus().getDescription());
        
        dto.setOperationStaffId(service.getOperationStaffId());
        dto.setOperationDepartmentId(service.getOperationDepartmentId());
        dto.setAssignedTime(service.getAssignedTime());
        dto.setAssignedBy(service.getAssignedBy());
        
        dto.setInternalProtocolId(service.getInternalProtocolId());
        dto.setProtocolConfirmedTime(service.getProtocolConfirmedTime());
        
        dto.setStartedTime(service.getStartedTime());
        dto.setCompletedTime(service.getCompletedTime());
        dto.setBlockReason(service.getBlockReason());
        dto.setRemarks(service.getRemarks());
        
        // 设置操作权限
        dto.setCanAssign(service.getStatus() == OrderService.ServiceStatus.PENDING);
        dto.setCanConfirmProtocol(service.getStatus() == OrderService.ServiceStatus.ASSIGNED);
        dto.setCanStart(service.getStatus() == OrderService.ServiceStatus.PROTOCOL_CONFIRMED);
        dto.setCanComplete(service.getStatus() == OrderService.ServiceStatus.IN_PROGRESS);
        dto.setCanBlock(service.getStatus() == OrderService.ServiceStatus.IN_PROGRESS);
        
        return dto;
    }
    
    private StaffDTO convertToStaffDTO(Staff staff) {
        StaffDTO dto = new StaffDTO();
        dto.setStaffId(staff.getStaffId());
        dto.setStaffName(staff.getStaffName());
        dto.setEmail(staff.getEmail());
        dto.setPhone(staff.getPhone());
        dto.setRoleType(staff.getRoleType().name());
        dto.setRoleTypeDescription(staff.getRoleType().getDescription());
        dto.setDepartmentId(staff.getDepartmentId());
        dto.setActive(staff.getActive());
        dto.setEmployeeNo(staff.getEmployeeNo());
        
        // 设置显示信息
        dto.setDisplayName(staff.getStaffName() + "(" + staff.getEmployeeNo() + ")");
        dto.setRoleDisplay(staff.getRoleType().getDescription());
        
        return dto;
    }
}