package com.oneorder.clearing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;

/**
 * 客服接单控制器
 * 实现步骤1的完整客服接单流程
 */
@RestController
@RequestMapping("/api/customer-intake")
@CrossOrigin(origins = "*")
public class CustomerIntakeController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerIntakeController.class);

    /**
     * 搜索客户
     */
    @GetMapping("/customers/search")
    public ResponseEntity<Map<String, Object>> searchCustomers(@RequestParam String query) {
        logger.info("搜索客户: {}", query);
        
        Map<String, Object> response = new HashMap<>();
        try {
            // 模拟客户数据
            List<Map<String, Object>> allCustomers = Arrays.asList(
                createCustomer("CUS001", "ACME", "ACME物流有限公司", "货代公司", "上海", "A级"),
                createCustomer("CUS002", "GLOBE", "环球贸易集团", "贸易公司", "深圳", "B级"),
                createCustomer("CUS003", "SWIFT", "迅捷供应链", "供应链公司", "广州", "A级"),
                createCustomer("CUS004", "OCEAN", "远洋国际货运", "货代公司", "青岛", "A级"),
                createCustomer("CUS005", "SMART", "智慧物流科技", "物流科技公司", "宁波", "B级"),
                createCustomer("CUS006", "GLOBAL", "全球运输集团", "运输公司", "天津", "A级"),
                createCustomer("CUS007", "FAST", "快运物流", "物流公司", "大连", "C级"),
                createCustomer("CUS008", "TRANS", "运通国际", "货代公司", "厦门", "B级")
            );
            
            // 按查询条件过滤
            List<Map<String, Object>> filteredCustomers = allCustomers.stream()
                .filter(customer -> 
                    customer.get("name").toString().toLowerCase().contains(query.toLowerCase()) ||
                    customer.get("code").toString().toLowerCase().contains(query.toLowerCase())
                )
                .collect(java.util.stream.Collectors.toList());
            
            response.put("code", 200);
            response.put("message", "搜索成功");
            response.put("data", Map.of(
                "customers", filteredCustomers,
                "totalCount", filteredCustomers.size()
            ));
            
        } catch (Exception e) {
            logger.error("搜索客户失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "搜索失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取所有业务类型
     */
    @GetMapping("/business-types")
    public ResponseEntity<Map<String, Object>> getBusinessTypes() {
        logger.info("获取业务类型列表");
        
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, Object>> businessTypes = Arrays.asList(
                createBusinessType("OCEAN", "海运", "海上货物运输服务", "bi-water", "#1976d2", true),
                createBusinessType("AIR", "空运", "航空货物运输服务", "bi-airplane", "#7b1fa2", true),
                createBusinessType("TRUCK", "陆运", "公路货物运输服务", "bi-truck", "#388e3c", true),
                createBusinessType("RAIL", "铁运", "铁路货物运输服务", "bi-train-front", "#f57c00", true),
                createBusinessType("CUSTOMS", "关务", "海关清关代理服务", "bi-shield-check", "#d32f2f", true),
                createBusinessType("WAREHOUSE", "仓储", "仓储物流配送服务", "bi-building", "#455a64", true)
            );
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", Map.of(
                "businessTypes", businessTypes,
                "totalCount", businessTypes.size()
            ));
            
        } catch (Exception e) {
            logger.error("获取业务类型失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 根据业务类型获取可用服务项目
     */
    @GetMapping("/services/available/{businessType}")
    public ResponseEntity<Map<String, Object>> getAvailableServices(@PathVariable String businessType) {
        logger.info("获取业务类型 {} 的可用服务", businessType);
        
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, Object>> services = getServicesByBusinessType(businessType);
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", Map.of(
                "businessType", businessType,
                "services", services,
                "totalCount", services.size(),
                "requiredCount", services.stream().mapToInt(s -> (Boolean) s.get("required") ? 1 : 0).sum()
            ));
            
        } catch (Exception e) {
            logger.error("获取可用服务失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 创建新订单
     */
    @PostMapping("/orders/create")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> request) {
        logger.info("创建新订单: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        try {
            String customerId = (String) request.get("customerId");
            String businessType = (String) request.get("businessType");
            String staffId = (String) request.get("staffId");
            @SuppressWarnings("unchecked")
            List<String> selectedServices = (List<String>) request.get("selectedServices");
            
            // 验证必选服务
            List<Map<String, Object>> availableServices = getServicesByBusinessType(businessType);
            List<String> requiredServices = availableServices.stream()
                .filter(s -> (Boolean) s.get("required"))
                .map(s -> (String) s.get("code"))
                .collect(java.util.stream.Collectors.toList());
            
            boolean hasAllRequired = requiredServices.stream().allMatch(selectedServices::contains);
            if (!hasAllRequired) {
                response.put("code", 400);
                response.put("message", "缺少必选服务项目");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 生成订单信息
            String orderId = "ORD" + System.currentTimeMillis();
            String orderNo = "HCBD" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            
            // 计算总金额
            BigDecimal totalAmount = selectedServices.stream()
                .map(serviceCode -> availableServices.stream()
                    .filter(s -> serviceCode.equals(s.get("code")))
                    .findFirst()
                    .map(s -> new BigDecimal(s.get("price").toString()))
                    .orElse(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 创建订单数据
            Map<String, Object> orderData = new HashMap<>();
            orderData.put("orderId", orderId);
            orderData.put("orderNo", orderNo);
            orderData.put("customerId", customerId);
            orderData.put("businessType", businessType);
            orderData.put("responsibleStaffId", staffId);
            orderData.put("totalAmount", totalAmount);
            orderData.put("currency", "CNY");
            orderData.put("status", "CONFIRMED");
            orderData.put("createdTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            orderData.put("selectedServices", selectedServices);
            orderData.put("serviceCount", selectedServices.size());
            
            // 创建服务项目详情
            List<Map<String, Object>> orderServices = selectedServices.stream()
                .map(serviceCode -> {
                    Map<String, Object> serviceDetail = availableServices.stream()
                        .filter(s -> serviceCode.equals(s.get("code")))
                        .findFirst()
                        .orElse(new HashMap<>());
                    
                    Map<String, Object> orderService = new HashMap<>();
                    orderService.put("serviceId", "SVC" + System.currentTimeMillis() + Math.random());
                    orderService.put("serviceCode", serviceCode);
                    orderService.put("serviceName", serviceDetail.get("name"));
                    orderService.put("description", serviceDetail.get("description"));
                    orderService.put("amount", serviceDetail.get("price"));
                    orderService.put("currency", "CNY");
                    orderService.put("status", "PENDING");
                    orderService.put("required", serviceDetail.get("required"));
                    return orderService;
                })
                .collect(java.util.stream.Collectors.toList());
            
            orderData.put("orderServices", orderServices);
            
            response.put("code", 200);
            response.put("message", "订单创建成功");
            response.put("data", orderData);
            
            logger.info("订单创建成功 - 订单号: {}, 客户: {}, 服务数: {}", 
                       orderNo, customerId, selectedServices.size());
            
        } catch (Exception e) {
            logger.error("创建订单失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "创建订单失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取客服的订单列表
     */
    @GetMapping("/orders/staff/{staffId}")
    public ResponseEntity<Map<String, Object>> getStaffOrders(@PathVariable String staffId) {
        logger.info("获取客服 {} 的订单列表", staffId);
        
        Map<String, Object> response = new HashMap<>();
        try {
            // 模拟客服的订单数据
            List<Map<String, Object>> orders = Arrays.asList(
                createOrderSummary("HCBD20250916001", "CUS001", "ACME物流", "OCEAN", "海运", 4, "CONFIRMED", "2025-09-16 09:30:00"),
                createOrderSummary("HCBD20250916002", "CUS002", "环球贸易", "AIR", "空运", 3, "IN_PROGRESS", "2025-09-16 10:15:00"),
                createOrderSummary("HCBD20250916003", "CUS003", "迅捷供应链", "TRUCK", "陆运", 2, "COMPLETED", "2025-09-16 08:45:00")
            );
            
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", Map.of(
                "staffId", staffId,
                "orders", orders,
                "totalCount", orders.size(),
                "statusSummary", Map.of(
                    "CONFIRMED", 1,
                    "IN_PROGRESS", 1,
                    "COMPLETED", 1
                )
            ));
            
        } catch (Exception e) {
            logger.error("获取客服订单失败: {}", e.getMessage());
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    // 私有辅助方法

    private Map<String, Object> createCustomer(String id, String code, String name, String type, String location, String level) {
        Map<String, Object> customer = new HashMap<>();
        customer.put("id", id);
        customer.put("code", code);
        customer.put("name", name);
        customer.put("type", type);
        customer.put("location", location);
        customer.put("level", level);
        customer.put("status", "ACTIVE");
        return customer;
    }

    private Map<String, Object> createBusinessType(String code, String name, String description, String icon, String color, boolean active) {
        Map<String, Object> businessType = new HashMap<>();
        businessType.put("code", code);
        businessType.put("name", name);
        businessType.put("description", description);
        businessType.put("icon", icon);
        businessType.put("color", color);
        businessType.put("active", active);
        return businessType;
    }

    private List<Map<String, Object>> getServicesByBusinessType(String businessType) {
        switch (businessType) {
            case "OCEAN":
                return Arrays.asList(
                    createService("BOOKING", "订舱", "船舶舱位预订", 200, true),
                    createService("MBL_PROCESSING", "MBL处理", "主提单制作处理", 1200, true),
                    createService("CONTAINER_LOADING", "内装", "集装箱装箱服务", 350, false),
                    createService("CUSTOMS_DECLARATION", "报关", "出口报关申报", 500, false),
                    createService("SHIPPING_INSURANCE", "货运保险", "海运货物保险", 150, false),
                    createService("WAREHOUSING", "仓储服务", "货物仓储管理", 300, false)
                );
            case "AIR":
                return Arrays.asList(
                    createService("AIR_BOOKING", "航空订舱", "航空舱位预订", 300, true),
                    createService("HAWB_PROCESSING", "HAWB处理", "分运单制作", 800, true),
                    createService("AIR_CUSTOMS", "空运报关", "航空货物报关", 400, false),
                    createService("CARGO_INSPECTION", "货物查验", "货物安检查验", 200, false)
                );
            case "TRUCK":
                return Arrays.asList(
                    createService("TRUCK_TRANSPORT", "公路运输", "陆路货物运输", 600, true),
                    createService("LOADING_UNLOADING", "装卸服务", "货物装卸作业", 150, false),
                    createService("GPS_TRACKING", "GPS跟踪", "运输过程跟踪", 50, false)
                );
            case "RAIL":
                return Arrays.asList(
                    createService("RAIL_TRANSPORT", "铁路运输", "铁路货物运输", 800, true),
                    createService("RAIL_CUSTOMS", "铁路报关", "铁路口岸报关", 350, false),
                    createService("CONTAINER_RAIL", "集装箱铁运", "集装箱铁路运输", 450, false)
                );
            case "CUSTOMS":
                return Arrays.asList(
                    createService("IMPORT_CUSTOMS", "进口报关", "进口货物报关", 600, true),
                    createService("EXPORT_CUSTOMS", "出口报关", "出口货物报关", 500, true),
                    createService("CUSTOMS_INSPECTION", "海关查验", "配合海关查验", 200, false),
                    createService("TAX_PAYMENT", "关税代缴", "代缴关税费用", 100, false)
                );
            case "WAREHOUSE":
                return Arrays.asList(
                    createService("STORAGE", "货物存储", "仓库货物存储", 250, true),
                    createService("INVENTORY_MANAGEMENT", "库存管理", "货物库存管理", 180, false),
                    createService("DISTRIBUTION", "配送服务", "最后一公里配送", 120, false),
                    createService("PACKAGING", "包装服务", "货物重新包装", 80, false)
                );
            default:
                return new ArrayList<>();
        }
    }

    private Map<String, Object> createService(String code, String name, String description, int price, boolean required) {
        Map<String, Object> service = new HashMap<>();
        service.put("code", code);
        service.put("name", name);
        service.put("description", description);
        service.put("price", price);
        service.put("required", required);
        service.put("estimatedHours", getEstimatedHours(code));
        service.put("category", getServiceCategory(code));
        return service;
    }

    private Map<String, Object> createOrderSummary(String orderNo, String customerId, String customerName, 
                                                  String businessTypeCode, String businessTypeName, 
                                                  int serviceCount, String status, String createdTime) {
        Map<String, Object> order = new HashMap<>();
        order.put("orderNo", orderNo);
        order.put("customerId", customerId);
        order.put("customerName", customerName);
        order.put("businessType", businessTypeCode);
        order.put("businessTypeName", businessTypeName);
        order.put("serviceCount", serviceCount);
        order.put("status", status);
        order.put("createdTime", createdTime);
        return order;
    }

    private int getEstimatedHours(String serviceCode) {
        Map<String, Integer> hoursMap = Map.of(
            "BOOKING", 24,
            "MBL_PROCESSING", 48,
            "CONTAINER_LOADING", 8,
            "CUSTOMS_DECLARATION", 12,
            "AIR_BOOKING", 12,
            "HAWB_PROCESSING", 24,
            "TRUCK_TRANSPORT", 72,
            "RAIL_TRANSPORT", 120
        );
        return hoursMap.getOrDefault(serviceCode, 24);
    }

    private String getServiceCategory(String serviceCode) {
        if (serviceCode.contains("BOOKING")) return "订舱类";
        if (serviceCode.contains("CUSTOMS")) return "报关类";
        if (serviceCode.contains("TRANSPORT")) return "运输类";
        if (serviceCode.contains("PROCESSING")) return "文件类";
        if (serviceCode.contains("LOADING")) return "操作类";
        return "其他";
    }
}