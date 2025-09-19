package com.oneorder.clearing.service.impl;

import com.oneorder.clearing.dto.*;
import com.oneorder.clearing.entity.*;
import com.oneorder.clearing.repository.OrderRepository;
import com.oneorder.clearing.service.FreightOrderService;
import com.oneorder.clearing.service.ClearingEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 货代订单服务实现 - 完整模拟货代业务流程
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FreightOrderServiceImpl implements FreightOrderService {

    private final ClearingEngine clearingEngine;
    private final OrderRepository orderRepository;
    
    // 混合存储：内存用于复杂业务对象，数据库用于基础数据
    private final Map<String, FreightOrderData> orderStorage = new ConcurrentHashMap<>();
    private final Map<String, List<FreightOrderData.TimelineEvent>> timelineStorage = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public FreightOrderResponse createOrder(CreateFreightOrderRequest request) {
        String orderId = "ORD" + System.currentTimeMillis();
        
        FreightOrderData orderData = new FreightOrderData();
        orderData.setOrderId(orderId);
        orderData.setOrderNo(request.getOrderNo());
        orderData.setCustomerId(request.getCustomerId());
        orderData.setCustomerName(request.getCustomerName());
        orderData.setSalesEntityId(request.getSalesEntityId());
        orderData.setDeliveryEntityId(request.getDeliveryEntityId());
        orderData.setPaymentEntityId(request.getPaymentEntityId());
        
        orderData.setPortOfLoading(request.getPortOfLoading());
        orderData.setPortOfDischarge(request.getPortOfDischarge());
        orderData.setCommodityDescription(request.getCommodityDescription());
        orderData.setWeight(request.getWeight());
        orderData.setVolume(request.getVolume());
        orderData.setContainers(request.getContainers());
        orderData.setTradeTerms(request.getTradeTerms());
        
        orderData.setTotalAmount(request.getQuotedAmount());
        orderData.setCurrency(request.getCurrency());
        orderData.setClearingMode(request.getClearingMode());
        orderData.setSpecialRequirements(request.getSpecialRequirements());
        
        orderData.setOrderStatus("CONFIRMED");
        orderData.setClearingStatus("PENDING");
        orderData.setCurrentStage("ORDER_CREATED");
        orderData.setNextAction("等待订舱确认");
        
        LocalDateTime now = LocalDateTime.now();
        orderData.setOrderDate(now);
        orderData.setCreatedAt(now);
        orderData.setUpdatedAt(now);
        
        // 计算预估成本和利润
        BigDecimal estimatedCost = calculateEstimatedCost(request);
        orderData.setTotalCost(estimatedCost);
        orderData.setEstimatedProfit(request.getQuotedAmount().subtract(estimatedCost));
        
        // 处理订单项目
        if (request.getOrderItems() != null) {
            List<FreightOrderData.OrderItem> items = request.getOrderItems().stream()
                .map(this::convertToOrderItem)
                .collect(Collectors.toList());
            orderData.setOrderItems(items);
        }
        
        orderStorage.put(orderId, orderData);
        
        // 同时保存到数据库
        Order dbOrder = new Order();
        dbOrder.setOrderId(orderId);
        dbOrder.setOrderNo(request.getOrderNo());
        dbOrder.setCustomerId(request.getCustomerId());
        dbOrder.setSalesEntityId(request.getSalesEntityId());
        dbOrder.setDeliveryEntityId(request.getDeliveryEntityId());
        dbOrder.setPaymentEntityId(request.getPaymentEntityId());
        dbOrder.setPortOfLoading(request.getPortOfLoading());
        dbOrder.setPortOfDischarge(request.getPortOfDischarge());
        dbOrder.setTotalAmount(request.getQuotedAmount());
        dbOrder.setTotalCost(estimatedCost);
        dbOrder.setCurrency(request.getCurrency());
        dbOrder.setOrderStatus(Order.OrderStatus.CONFIRMED);
        dbOrder.setClearingStatus(Order.ClearingStatus.PENDING);
        dbOrder.setClearingMode(Order.ClearingMode.valueOf(request.getClearingMode()));
        dbOrder.setOrderDate(now);
        dbOrder.setBusinessType(determineBusinessType(request));
        dbOrder.setRemarks(request.getSpecialRequirements());
        
        try {
            orderRepository.save(dbOrder);
            log.info("订单已保存到数据库: {} - {}", orderId, request.getOrderNo());
        } catch (Exception e) {
            log.error("保存订单到数据库失败: {} - {}", orderId, e.getMessage());
        }
        
        // 添加时间轴事件
        addTimelineEvent(orderId, "ORDER_CREATED", "订单创建", "系统", now, 
                        "订单已创建，等待订舱确认", "success");
        
        log.info("货代订单创建成功: {} - {}", orderId, request.getOrderNo());
        
        return convertToResponse(orderData);
    }

    @Override
    public FreightOrderResponse getOrderById(String orderId) {
        FreightOrderData orderData = orderStorage.get(orderId);
        if (orderData == null) {
            throw new RuntimeException("订单不存在: " + orderId);
        }
        return convertToResponse(orderData);
    }

    // 数据库Order实体转Response - 完整版本
    private FreightOrderResponse convertOrderToResponse(Order order) {
        FreightOrderResponse response = new FreightOrderResponse();
        response.setOrderId(order.getOrderId());
        response.setOrderNo(order.getOrderNo());
        response.setCustomerId(order.getCustomerId());
        response.setOrderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : null);
        response.setClearingStatus(order.getClearingStatus() != null ? order.getClearingStatus().name() : null);
        response.setPortOfLoading(order.getPortOfLoading());
        response.setPortOfDischarge(order.getPortOfDischarge());
        response.setTotalAmount(order.getTotalAmount());
        response.setTotalCost(order.getTotalCost());
        response.setCurrency(order.getCurrency());
        response.setOrderDate(order.getOrderDate());
        response.setRemarks(order.getRemarks());
        return response;
    }

    @Override
    public List<FreightOrderResponse> getOrders(int page, int size, String status) {
        try {
            List<Order> orders;
            if (status != null && !status.isEmpty()) {
                orders = orderRepository.findByOrderStatusOrderByCreatedTimeDesc(status);
            } else {
                orders = orderRepository.findAll();
            }
            
            return orders.stream()
                    .sorted(Comparator.comparing(Order::getCreatedTime, 
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                    .skip((long) page * size)
                    .limit(size)
                    .map(this::convertOrderToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("获取订单列表失败", e);
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional
    public FreightOrderResponse confirmBooking(String orderId, BookingRequest request) {
        FreightOrderData orderData = getOrderData(orderId);
        
        orderData.setVesselName(request.getVessel());
        orderData.setVoyage(request.getVoyage());
        orderData.setEtd(request.getEtd());
        orderData.setEta(request.getEta());
        orderData.setBookingDate(LocalDateTime.now());
        
        orderData.setOrderStatus("BOOKING_CONFIRMED");
        orderData.setCurrentStage("BOOKING_CONFIRMED");
        orderData.setNextAction("等待报关");
        orderData.setUpdatedAt(LocalDateTime.now());
        
        addTimelineEvent(orderId, "BOOKING_CONFIRMED", "订舱确认", "操作员", 
                        LocalDateTime.now(), 
                        String.format("确认船期：%s 航次：%s", request.getVessel(), request.getVoyage()),
                        "success");
        
        return convertToResponse(orderData);
    }

    @Override
    @Transactional
    public FreightOrderResponse completeCustoms(String orderId, CustomsRequest request) {
        FreightOrderData orderData = getOrderData(orderId);
        
        orderData.setCustomsDeclarationNo(request.getDeclarationNo());
        orderData.setCustomsStatus(request.getCustomsStatus());
        orderData.setCustomsDate(LocalDateTime.now());
        
        orderData.setOrderStatus("CUSTOMS_CLEARED");
        orderData.setCurrentStage("CUSTOMS_CLEARED");
        orderData.setNextAction("等待开船");
        orderData.setUpdatedAt(LocalDateTime.now());
        
        addTimelineEvent(orderId, "CUSTOMS_CLEARED", "报关完成", "报关员", 
                        LocalDateTime.now(), 
                        "报关单号：" + request.getDeclarationNo(),
                        "success");
        
        return convertToResponse(orderData);
    }

    @Override
    @Transactional
    public FreightOrderResponse startShipping(String orderId, ShippingRequest request) {
        FreightOrderData orderData = getOrderData(orderId);
        
        orderData.setActualDeparture(request.getEtd());
        orderData.setEta(request.getEta());
        orderData.setShippingDate(LocalDateTime.now());
        
        orderData.setOrderStatus("IN_TRANSIT");
        orderData.setCurrentStage("IN_TRANSIT");
        orderData.setNextAction("等待到港");
        orderData.setUpdatedAt(LocalDateTime.now());
        
        addTimelineEvent(orderId, "DEPARTED", "开船通知", "船务员", 
                        LocalDateTime.now(), 
                        String.format("实际开船：%s，预计到港：%s", 
                        request.getEtd(), request.getEta()),
                        "info");
        
        return convertToResponse(orderData);
    }

    @Override
    @Transactional
    public FreightOrderResponse notifyArrival(String orderId) {
        FreightOrderData orderData = getOrderData(orderId);
        
        orderData.setActualArrival(LocalDateTime.now());
        orderData.setArrivalDate(LocalDateTime.now());
        
        orderData.setOrderStatus("ARRIVED");
        orderData.setCurrentStage("ARRIVED");
        orderData.setNextAction("等待提货");
        orderData.setUpdatedAt(LocalDateTime.now());
        
        addTimelineEvent(orderId, "ARRIVED", "到港通知", "目的港代理", 
                        LocalDateTime.now(), 
                        "货物已安全到达目的港",
                        "success");
        
        return convertToResponse(orderData);
    }

    @Override
    @Transactional
    public FreightOrderResponse completeDelivery(String orderId, DeliveryRequest request) {
        FreightOrderData orderData = getOrderData(orderId);
        
        orderData.setDeliveryDate(request.getDeliveryTime());
        
        orderData.setOrderStatus("DELIVERED");
        orderData.setCurrentStage("DELIVERED");
        orderData.setNextAction("费用确认");
        orderData.setUpdatedAt(LocalDateTime.now());
        
        addTimelineEvent(orderId, "DELIVERED", "提货完成", "司机", 
                        LocalDateTime.now(), 
                        String.format("收货人：%s，提货时间：%s", 
                        request.getReceiverName(), request.getDeliveryTime()),
                        "success");
        
        return convertToResponse(orderData);
    }

    @Override
    @Transactional
    public CostConfirmResponse confirmCosts(String orderId, CostConfirmRequest request) {
        FreightOrderData orderData = getOrderData(orderId);
        
        // 更新实际费用
        orderData.setTotalAmount(request.getTotalRevenue());
        orderData.setTotalCost(request.getTotalCost());
        orderData.setEstimatedProfit(request.getTotalRevenue().subtract(request.getTotalCost()));
        
        orderData.setOrderStatus("COST_CONFIRMED");
        orderData.setClearingStatus("CLEARING");
        orderData.setCurrentStage("CLEARING");
        orderData.setNextAction("清分处理中");
        orderData.setUpdatedAt(LocalDateTime.now());
        
        // 触发清分
        Order clearingOrder = convertToClearingOrder(orderData);
        ClearingRequest clearingRequest = new ClearingRequest();
        clearingRequest.setOrder(clearingOrder);
        
        ClearingResponse clearingResponse = clearingEngine.executeClearing(clearingRequest);
        
        // 更新清分状态
        if (clearingResponse.isSuccess()) {
            orderData.setClearingStatus("CLEARED");
            orderData.setCurrentStage("COMPLETED");
            orderData.setNextAction("订单完成");
            orderData.setOrderStatus("COMPLETED");
            
            addTimelineEvent(orderId, "CLEARING_COMPLETED", "清分完成", "系统", 
                            LocalDateTime.now(), 
                            "费用清分已完成，生成" + clearingResponse.getResults().size() + "条清分记录",
                            "success");
        } else {
            orderData.setClearingStatus("FAILED");
            addTimelineEvent(orderId, "CLEARING_FAILED", "清分失败", "系统", 
                            LocalDateTime.now(), 
                            clearingResponse.getMessage(),
                            "error");
        }
        
        addTimelineEvent(orderId, "COST_CONFIRMED", "费用确认", "财务", 
                        LocalDateTime.now(), 
                        String.format("总收入：%s，总成本：%s，利润：%s", 
                        request.getTotalRevenue(), request.getTotalCost(), 
                        request.getTotalRevenue().subtract(request.getTotalCost())),
                        "success");
        
        // 构造响应
        CostConfirmResponse response = new CostConfirmResponse();
        response.setOrderId(orderId);
        response.setOrderNo(orderData.getOrderNo());
        response.setTotalRevenue(request.getTotalRevenue());
        response.setTotalCost(request.getTotalCost());
        response.setProfit(request.getTotalRevenue().subtract(request.getTotalCost()));
        response.setProfitMargin(calculateProfitMargin(request.getTotalRevenue(), request.getTotalCost()));
        response.setClearingStatus(orderData.getClearingStatus());
        response.setClearingTime(LocalDateTime.now());
        response.setSuccess(clearingResponse.isSuccess());
        response.setMessage(clearingResponse.getMessage());
        
        if (clearingResponse.isSuccess()) {
            List<CostConfirmResponse.ClearingResultSummary> summaries = clearingResponse.getResults()
                .stream()
                .map(this::convertToClearingResultSummary)
                .collect(Collectors.toList());
            response.setClearingResults(summaries);
        }
        
        return response;
    }

    @Override
    public OrderTimelineResponse getOrderTimeline(String orderId) {
        FreightOrderData orderData = getOrderData(orderId);
        List<FreightOrderData.TimelineEvent> events = timelineStorage.get(orderId);
        
        OrderTimelineResponse response = new OrderTimelineResponse();
        response.setOrderId(orderId);
        response.setOrderNo(orderData.getOrderNo());
        response.setCurrentStatus(orderData.getOrderStatus());
        response.setLastUpdated(orderData.getUpdatedAt());
        
        if (events != null) {
            List<OrderTimelineResponse.TimelineEvent> timelineEvents = events.stream()
                .map(this::convertToTimelineEvent)
                .collect(Collectors.toList());
            response.setEvents(timelineEvents);
        }
        
        return response;
    }

    @Override
    public List<FreightOrderResponse> createSampleOrders() {
        List<FreightOrderResponse> sampleOrders = new ArrayList<>();
        
        // 创建演示订单1 - 上海到洛杉矶
        CreateFreightOrderRequest request1 = createSampleRequest(
            "DEMO001", "ACME Corp", "上海", "洛杉矶", "STAR", new BigDecimal("15000"));
        sampleOrders.add(createOrder(request1));
        
        // 创建演示订单2 - 深圳到汉堡
        CreateFreightOrderRequest request2 = createSampleRequest(
            "DEMO002", "Global Trade Ltd", "深圳", "汉堡", "CHAIN", new BigDecimal("22000"));
        sampleOrders.add(createOrder(request2));
        
        // 创建演示订单3 - 青岛到纽约
        CreateFreightOrderRequest request3 = createSampleRequest(
            "DEMO003", "International Freight Co", "青岛", "纽约", "STAR", new BigDecimal("18500"));
        sampleOrders.add(createOrder(request3));
        
        log.info("创建了 {} 个演示订单", sampleOrders.size());
        return sampleOrders;
    }

    // 私有辅助方法
    private FreightOrderData getOrderData(String orderId) {
        FreightOrderData orderData = orderStorage.get(orderId);
        if (orderData == null) {
            throw new RuntimeException("订单不存在: " + orderId);
        }
        return orderData;
    }

    private BigDecimal calculateEstimatedCost(CreateFreightOrderRequest request) {
        // 简单的成本估算逻辑
        BigDecimal baseCost = request.getQuotedAmount().multiply(new BigDecimal("0.7"));
        return baseCost.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateProfitMargin(BigDecimal revenue, BigDecimal cost) {
        if (revenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return revenue.subtract(cost).divide(revenue, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    private void addTimelineEvent(String orderId, String eventType, String title, 
                                String operator, LocalDateTime timestamp, 
                                String description, String status) {
        FreightOrderData.TimelineEvent event = new FreightOrderData.TimelineEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventType(eventType);
        event.setTitle(title);
        event.setDescription(description);
        event.setOperator(operator);
        event.setTimestamp(timestamp);
        event.setStatus(status);
        
        timelineStorage.computeIfAbsent(orderId, k -> new ArrayList<>()).add(event);
    }

    private FreightOrderData.OrderItem convertToOrderItem(CreateFreightOrderRequest.OrderItemRequest item) {
        FreightOrderData.OrderItem orderItem = new FreightOrderData.OrderItem();
        orderItem.setItemId(UUID.randomUUID().toString());
        orderItem.setCostType(item.getCostType());
        orderItem.setDescription(item.getDescription());
        orderItem.setAmount(item.getAmount());
        orderItem.setCurrency(item.getCurrency());
        orderItem.setSupplier(item.getSupplier());
        orderItem.setStatus("ESTIMATED");
        orderItem.setRemarks(item.getRemarks());
        return orderItem;
    }

    private FreightOrderResponse convertToResponse(FreightOrderData orderData) {
        FreightOrderResponse response = new FreightOrderResponse();
        
        // 基本信息
        response.setOrderId(orderData.getOrderId());
        response.setOrderNo(orderData.getOrderNo());
        response.setCustomerId(orderData.getCustomerId());
        response.setCustomerName(orderData.getCustomerName());
        response.setSalesEntityId(orderData.getSalesEntityId());
        response.setDeliveryEntityId(orderData.getDeliveryEntityId());
        response.setPaymentEntityId(orderData.getPaymentEntityId());
        
        // 货物信息
        response.setPortOfLoading(orderData.getPortOfLoading());
        response.setPortOfDischarge(orderData.getPortOfDischarge());
        response.setCommodityDescription(orderData.getCommodityDescription());
        response.setWeight(orderData.getWeight());
        response.setVolume(orderData.getVolume());
        response.setContainers(orderData.getContainers());
        response.setTradeTerms(orderData.getTradeTerms());
        
        // 财务信息
        response.setTotalAmount(orderData.getTotalAmount());
        response.setTotalCost(orderData.getTotalCost());
        response.setEstimatedProfit(orderData.getEstimatedProfit());
        response.setCurrency(orderData.getCurrency());
        
        // 状态信息
        response.setOrderStatus(orderData.getOrderStatus());
        response.setClearingStatus(orderData.getClearingStatus());
        response.setClearingMode(orderData.getClearingMode());
        response.setCurrentStage(orderData.getCurrentStage());
        response.setNextAction(orderData.getNextAction());
        
        // 时间信息
        response.setOrderDate(orderData.getOrderDate());
        response.setBookingDate(orderData.getBookingDate());
        response.setCustomsDate(orderData.getCustomsDate());
        response.setShippingDate(orderData.getShippingDate());
        response.setArrivalDate(orderData.getArrivalDate());
        response.setDeliveryDate(orderData.getDeliveryDate());
        response.setCreatedAt(orderData.getCreatedAt());
        response.setUpdatedAt(orderData.getUpdatedAt());
        
        // 船期信息
        response.setVesselName(orderData.getVesselName());
        response.setVoyage(orderData.getVoyage());
        response.setEtd(orderData.getEtd());
        response.setEta(orderData.getEta());
        response.setActualDeparture(orderData.getActualDeparture());
        response.setActualArrival(orderData.getActualArrival());
        
        // 报关信息
        response.setCustomsDeclarationNo(orderData.getCustomsDeclarationNo());
        response.setCustomsStatus(orderData.getCustomsStatus());
        
        response.setSpecialRequirements(orderData.getSpecialRequirements());
        response.setRemarks(orderData.getRemarks());
        
        // 订单项目
        if (orderData.getOrderItems() != null) {
            List<FreightOrderResponse.OrderItemResponse> items = orderData.getOrderItems()
                .stream()
                .map(this::convertToOrderItemResponse)
                .collect(Collectors.toList());
            response.setOrderItems(items);
        }
        
        // 时间轴
        List<FreightOrderData.TimelineEvent> timelineEvents = timelineStorage.get(orderData.getOrderId());
        if (timelineEvents != null) {
            List<FreightOrderResponse.OrderEventResponse> events = timelineEvents.stream()
                .map(this::convertToOrderEventResponse)
                .collect(Collectors.toList());
            response.setTimeline(events);
        }
        
        return response;
    }

    private FreightOrderResponse.OrderItemResponse convertToOrderItemResponse(FreightOrderData.OrderItem item) {
        FreightOrderResponse.OrderItemResponse response = new FreightOrderResponse.OrderItemResponse();
        response.setItemId(item.getItemId());
        response.setCostType(item.getCostType());
        response.setDescription(item.getDescription());
        response.setAmount(item.getAmount());
        response.setActualAmount(item.getActualAmount());
        response.setCurrency(item.getCurrency());
        response.setSupplier(item.getSupplier());
        response.setStatus(item.getStatus());
        response.setRemarks(item.getRemarks());
        return response;
    }

    private FreightOrderResponse.OrderEventResponse convertToOrderEventResponse(FreightOrderData.TimelineEvent event) {
        FreightOrderResponse.OrderEventResponse response = new FreightOrderResponse.OrderEventResponse();
        response.setEventId(event.getEventId());
        response.setEventType(event.getEventType());
        response.setDescription(event.getDescription());
        response.setOperator(event.getOperator());
        response.setTimestamp(event.getTimestamp());
        response.setStatus(event.getStatus());
        response.setRemarks(event.getRemarks());
        return response;
    }

    private OrderTimelineResponse.TimelineEvent convertToTimelineEvent(FreightOrderData.TimelineEvent event) {
        OrderTimelineResponse.TimelineEvent response = new OrderTimelineResponse.TimelineEvent();
        response.setEventId(event.getEventId());
        response.setEventType(event.getEventType());
        response.setTitle(event.getTitle());
        response.setDescription(event.getDescription());
        response.setOperator(event.getOperator());
        response.setTimestamp(event.getTimestamp());
        response.setStatus(event.getStatus());
        response.setCompleted("success".equals(event.getStatus()));
        response.setRemarks(event.getRemarks());
        
        // 设置图标和颜色
        switch (event.getEventType()) {
            case "ORDER_CREATED": 
                response.setIcon("fa-plus"); 
                response.setColor("primary"); 
                break;
            case "BOOKING_CONFIRMED": 
                response.setIcon("fa-ship"); 
                response.setColor("info"); 
                break;
            case "CUSTOMS_CLEARED": 
                response.setIcon("fa-check-circle"); 
                response.setColor("success"); 
                break;
            case "DEPARTED": 
                response.setIcon("fa-anchor"); 
                response.setColor("warning"); 
                break;
            case "ARRIVED": 
                response.setIcon("fa-map-marker"); 
                response.setColor("success"); 
                break;
            case "DELIVERED": 
                response.setIcon("fa-truck"); 
                response.setColor("success"); 
                break;
            case "CLEARING_COMPLETED": 
                response.setIcon("fa-calculator"); 
                response.setColor("success"); 
                break;
            default: 
                response.setIcon("fa-info-circle"); 
                response.setColor("secondary");
        }
        
        return response;
    }

    private Order convertToClearingOrder(FreightOrderData orderData) {
        Order order = new Order();
        order.setOrderId(orderData.getOrderId());
        order.setOrderNo(orderData.getOrderNo());
        order.setCustomerId(orderData.getCustomerId());
        order.setSalesEntityId(orderData.getSalesEntityId());
        order.setDeliveryEntityId(orderData.getDeliveryEntityId());
        order.setPaymentEntityId(orderData.getPaymentEntityId());
        order.setTotalAmount(orderData.getTotalAmount());
        order.setTotalCost(orderData.getTotalCost());
        order.setCurrency(orderData.getCurrency());
        order.setPortOfLoading(orderData.getPortOfLoading());
        order.setPortOfDischarge(orderData.getPortOfDischarge());
        order.setOrderDate(orderData.getOrderDate());
        order.setBusinessType("FREIGHT_FORWARDING");
        
        // 设置清分模式
        if ("STAR".equals(orderData.getClearingMode())) {
            order.setClearingMode(Order.ClearingMode.STAR);
        } else {
            order.setClearingMode(Order.ClearingMode.CHAIN);
        }
        
        order.setOrderStatus(Order.OrderStatus.COMPLETED);
        order.setClearingStatus(Order.ClearingStatus.PENDING);
        
        return order;
    }

    private CostConfirmResponse.ClearingResultSummary convertToClearingResultSummary(ClearingResult result) {
        CostConfirmResponse.ClearingResultSummary summary = new CostConfirmResponse.ClearingResultSummary();
        summary.setEntityId(result.getEntityId());
        summary.setEntityName("法人体-" + result.getEntityId()); // 实际应该查询法人体名称
        summary.setAmount(result.getAmount());
        summary.setTransactionType(result.getTransactionType().getDescription());
        summary.setAccountType(result.getAccountType().getDescription());
        summary.setDescription(String.format("%s - %s", 
            result.getAccountType().getDescription(),
            result.getTransactionType().getDescription()));
        return summary;
    }

    private CreateFreightOrderRequest createSampleRequest(String orderNo, String customerName, 
                                                        String pol, String pod, String clearingMode, 
                                                        BigDecimal amount) {
        CreateFreightOrderRequest request = new CreateFreightOrderRequest();
        request.setOrderNo(orderNo);
        request.setCustomerId("CUST_" + System.currentTimeMillis() % 1000);
        request.setCustomerName(customerName);
        request.setSalesEntityId("ENTITY_SALES_001");
        request.setDeliveryEntityId("ENTITY_DELIVERY_001");
        request.setPaymentEntityId("ENTITY_PAYMENT_001");
        request.setPortOfLoading(pol);
        request.setPortOfDischarge(pod);
        request.setCommodityDescription("一般货物");
        request.setWeight(new BigDecimal("1200"));
        request.setVolume(new BigDecimal("68"));
        request.setContainers(1);
        request.setTradeTerms("FOB");
        request.setQuotedAmount(amount);
        request.setCurrency("USD");
        request.setClearingMode(clearingMode);
        request.setSpecialRequirements("无特殊要求");
        
        // 添加订单项目
        List<CreateFreightOrderRequest.OrderItemRequest> items = new ArrayList<>();
        
        CreateFreightOrderRequest.OrderItemRequest oceanFreight = new CreateFreightOrderRequest.OrderItemRequest();
        oceanFreight.setCostType("OCEAN_FREIGHT");
        oceanFreight.setDescription("海运费");
        oceanFreight.setAmount(amount.multiply(new BigDecimal("0.6")));
        oceanFreight.setCurrency("USD");
        oceanFreight.setSupplier("船公司");
        items.add(oceanFreight);
        
        CreateFreightOrderRequest.OrderItemRequest localCharges = new CreateFreightOrderRequest.OrderItemRequest();
        localCharges.setCostType("LOCAL_CHARGES");
        localCharges.setDescription("本地费用");
        localCharges.setAmount(amount.multiply(new BigDecimal("0.1")));
        localCharges.setCurrency("USD");
        localCharges.setSupplier("本地代理");
        items.add(localCharges);
        
        request.setOrderItems(items);
        
        return request;
    }

    @Override
    public Map<String, Object> calculateOrderFees(Order order) {
        Map<String, Object> result = new HashMap<>();
        
        // 根据业务类型计算费用
        String businessType = order.getBusinessType() != null ? order.getBusinessType() : "OCEAN";
        BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        
        Map<String, BigDecimal> feeBreakdown = new HashMap<>();
        
        switch (businessType.toUpperCase()) {
            case "OCEAN":
                feeBreakdown.put("海运费", totalAmount.multiply(new BigDecimal("0.65")));
                feeBreakdown.put("码头操作费", new BigDecimal("480"));
                feeBreakdown.put("文件费", new BigDecimal("300"));
                feeBreakdown.put("其他费用", totalAmount.multiply(new BigDecimal("0.05")));
                break;
            case "AIR":
                feeBreakdown.put("空运费", totalAmount.multiply(new BigDecimal("0.70")));
                feeBreakdown.put("安检费", totalAmount.multiply(new BigDecimal("0.05")));
                feeBreakdown.put("燃油附加费", totalAmount.multiply(new BigDecimal("0.08")));
                feeBreakdown.put("其他费用", totalAmount.multiply(new BigDecimal("0.02")));
                break;
            case "TRUCK":
                feeBreakdown.put("运输费", totalAmount.multiply(new BigDecimal("0.75")));
                feeBreakdown.put("装卸费", totalAmount.multiply(new BigDecimal("0.10")));
                feeBreakdown.put("其他费用", totalAmount.multiply(new BigDecimal("0.05")));
                break;
            default:
                feeBreakdown.put("基本运费", totalAmount.multiply(new BigDecimal("0.80")));
                feeBreakdown.put("附加费用", totalAmount.multiply(new BigDecimal("0.10")));
        }
        
        result.put("businessType", businessType);
        result.put("totalAmount", totalAmount);
        result.put("feeBreakdown", feeBreakdown);
        result.put("calculatedAt", LocalDateTime.now());
        
        return result;
    }

    @Override
    public Map<String, Object> getServiceRates() {
        Map<String, Object> serviceRates = new HashMap<>();
        
        // 海运服务费率
        Map<String, Object> oceanRates = new HashMap<>();
        oceanRates.put("FCL_20GP", Map.of("min", 8000, "max", 15000, "unit", "箱", "currency", "CNY"));
        oceanRates.put("FCL_40GP", Map.of("min", 12000, "max", 25000, "unit", "箱", "currency", "CNY"));
        oceanRates.put("FCL_40HQ", Map.of("min", 13000, "max", 28000, "unit", "箱", "currency", "CNY"));
        oceanRates.put("LCL", Map.of("min", 180, "max", 350, "unit", "CBM", "currency", "CNY"));
        oceanRates.put("附加费用", Map.of(
            "THC", Map.of("rate", 480, "unit", "箱", "currency", "CNY"),
            "文件费", Map.of("rate", 300, "unit", "票", "currency", "CNY"),
            "查验费", Map.of("rate", 800, "unit", "箱", "currency", "CNY")
        ));
        serviceRates.put("OCEAN", oceanRates);
        
        // 空运服务费率
        Map<String, Object> airRates = new HashMap<>();
        airRates.put("普通货物", Map.of("min", 18, "max", 35, "unit", "KG", "currency", "CNY"));
        airRates.put("危险品", Map.of("min", 28, "max", 45, "unit", "KG", "currency", "CNY"));
        airRates.put("活体", Map.of("min", 35, "max", 55, "unit", "KG", "currency", "CNY"));
        airRates.put("附加费用", Map.of(
            "安检费", Map.of("rate", 2.5, "unit", "KG", "currency", "CNY"),
            "燃油附加费", Map.of("rate", 3.2, "unit", "KG", "currency", "CNY"),
            "战险费", Map.of("rate", 0.15, "unit", "KG", "currency", "CNY")
        ));
        serviceRates.put("AIR", airRates);
        
        // 陆运服务费率
        Map<String, Object> truckRates = new HashMap<>();
        truckRates.put("整车运输", Map.of("min", 2.8, "max", 4.5, "unit", "公里", "currency", "CNY"));
        truckRates.put("零担运输", Map.of("min", 180, "max", 280, "unit", "吨", "currency", "CNY"));
        truckRates.put("附加费用", Map.of(
            "装卸费", Map.of("rate", 80, "unit", "吨", "currency", "CNY"),
            "等待费", Map.of("rate", 150, "unit", "小时", "currency", "CNY")
        ));
        serviceRates.put("TRUCK", truckRates);
        
        // 铁运服务费率
        Map<String, Object> railRates = new HashMap<>();
        railRates.put("中欧班列", Map.of("min", 18000, "max", 28000, "unit", "箱", "currency", "CNY"));
        railRates.put("中欧拼箱", Map.of("min", 280, "max", 380, "unit", "CBM", "currency", "CNY"));
        railRates.put("国内铁运", Map.of("min", 0.15, "max", 0.25, "unit", "吨公里", "currency", "CNY"));
        serviceRates.put("RAIL", railRates);
        
        serviceRates.put("updatedAt", LocalDateTime.now());
        serviceRates.put("validUntil", LocalDateTime.now().plusMonths(1));
        
        return serviceRates;
    }

    @Override
    public List<String> batchClearing(String orderStatus, String clearingMode) {
        List<String> results = new ArrayList<>();
        
        // 筛选符合条件的订单
        List<FreightOrderData> eligibleOrders = orderStorage.values().stream()
            .filter(order -> "ALL".equals(orderStatus) || orderStatus.equals(order.getOrderStatus()))
            .filter(order -> !"CLEARED".equals(order.getClearingStatus()))
            .collect(Collectors.toList());
        
        log.info("批量清分：找到 {} 个符合条件的订单", eligibleOrders.size());
        
        for (FreightOrderData orderData : eligibleOrders) {
            try {
                // 构造费用确认请求
                CostConfirmRequest costRequest = new CostConfirmRequest();
                costRequest.setTotalRevenue(orderData.getTotalAmount());
                costRequest.setTotalCost(orderData.getTotalCost() != null ? orderData.getTotalCost() : 
                    orderData.getTotalAmount().multiply(new BigDecimal("0.7")));
                
                // 执行清分
                CostConfirmResponse response = confirmCosts(orderData.getOrderId(), costRequest);
                
                if (response.isSuccess()) {
                    results.add(String.format("订单 %s 清分成功", orderData.getOrderNo()));
                } else {
                    results.add(String.format("订单 %s 清分失败: %s", orderData.getOrderNo(), response.getMessage()));
                }
                
            } catch (Exception e) {
                log.error("订单 {} 清分失败", orderData.getOrderNo(), e);
                results.add(String.format("订单 %s 清分失败: %s", orderData.getOrderNo(), e.getMessage()));
            }
        }
        
        return results;
    }

    @Override
    public Map<String, Object> getBusinessStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        List<FreightOrderData> allOrders = new ArrayList<>(orderStorage.values());
        
        // 基本统计
        statistics.put("totalOrders", allOrders.size());
        statistics.put("completedOrders", allOrders.stream()
            .filter(o -> "COMPLETED".equals(o.getOrderStatus())).count());
        statistics.put("pendingOrders", allOrders.stream()
            .filter(o -> !"COMPLETED".equals(o.getOrderStatus())).count());
        statistics.put("clearedOrders", allOrders.stream()
            .filter(o -> "CLEARED".equals(o.getClearingStatus())).count());
        
        // 业务类型统计（模拟）
        Map<String, Long> businessTypeStats = new HashMap<>();
        businessTypeStats.put("海运", (long) (allOrders.size() * 0.6));
        businessTypeStats.put("空运", (long) (allOrders.size() * 0.2));
        businessTypeStats.put("陆运", (long) (allOrders.size() * 0.15));
        businessTypeStats.put("铁运", (long) (allOrders.size() * 0.05));
        statistics.put("businessTypeStats", businessTypeStats);
        
        // 财务统计
        BigDecimal totalRevenue = allOrders.stream()
            .filter(o -> o.getTotalAmount() != null)
            .map(FreightOrderData::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = allOrders.stream()
            .filter(o -> o.getTotalCost() != null)
            .map(FreightOrderData::getTotalCost)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        statistics.put("totalRevenue", totalRevenue);
        statistics.put("totalCost", totalCost);
        statistics.put("totalProfit", totalRevenue.subtract(totalCost));
        statistics.put("profitMargin", totalRevenue.compareTo(BigDecimal.ZERO) > 0 ? 
            totalRevenue.subtract(totalCost).divide(totalRevenue, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100")) : BigDecimal.ZERO);
        
        // 月度趋势（模拟数据）
        Map<String, Integer> monthlyTrend = new HashMap<>();
        monthlyTrend.put("1月", 120);
        monthlyTrend.put("2月", 135);
        monthlyTrend.put("3月", 150);
        monthlyTrend.put("4月", 165);
        monthlyTrend.put("5月", 180);
        monthlyTrend.put("6月", 195);
        statistics.put("monthlyTrend", monthlyTrend);
        
        statistics.put("calculatedAt", LocalDateTime.now());
        
        return statistics;
    }

    // 内部数据模型
    @lombok.Data
    private static class FreightOrderData {
        private String orderId;
        private String orderNo;
        private String customerId;
        private String customerName;
        private String salesEntityId;
        private String deliveryEntityId;
        private String paymentEntityId;
        
        private String portOfLoading;
        private String portOfDischarge;
        private String commodityDescription;
        private BigDecimal weight;
        private BigDecimal volume;
        private Integer containers;
        private String tradeTerms;
        
        private BigDecimal totalAmount;
        private BigDecimal totalCost;
        private BigDecimal estimatedProfit;
        private String currency;
        
        private String orderStatus;
        private String clearingStatus;
        private String clearingMode;
        private String currentStage;
        private String nextAction;
        
        private LocalDateTime orderDate;
        private LocalDateTime bookingDate;
        private LocalDateTime customsDate;
        private LocalDateTime shippingDate;
        private LocalDateTime arrivalDate;
        private LocalDateTime deliveryDate;
        
        private String vesselName;
        private String voyage;
        private LocalDateTime etd;
        private LocalDateTime eta;
        private LocalDateTime actualDeparture;
        private LocalDateTime actualArrival;
        
        private String customsDeclarationNo;
        private String customsStatus;
        
        private String specialRequirements;
        private String remarks;
        
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        
        private List<OrderItem> orderItems;
        
        @lombok.Data
        public static class OrderItem {
            private String itemId;
            private String costType;
            private String description;
            private BigDecimal amount;
            private BigDecimal actualAmount;
            private String currency;
            private String supplier;
            private String status;
            private String remarks;
        }
        
        @lombok.Data
        public static class TimelineEvent {
            private String eventId;
            private String eventType;
            private String title;
            private String description;
            private String operator;
            private LocalDateTime timestamp;
            private String status;
            private String remarks;
        }
    }
    
    /**
     * 根据请求确定业务类型
     */
    private String determineBusinessType(CreateFreightOrderRequest request) {
        // 根据端口或商品描述推断业务类型
        String portOfLoading = request.getPortOfLoading();
        String portOfDischarge = request.getPortOfDischarge();
        String commodity = request.getCommodityDescription();
        
        // 简单的业务类型判断逻辑
        if (portOfLoading != null && portOfDischarge != null) {
            // 包含港口关键词的认为是海运
            if (portOfLoading.contains("港") || portOfDischarge.contains("港") ||
                portOfLoading.contains("PORT") || portOfDischarge.contains("PORT")) {
                return "SEA_EXPORT";
            }
            // 包含机场关键词的认为是空运
            if (portOfLoading.contains("机场") || portOfDischarge.contains("机场") ||
                portOfLoading.contains("AIRPORT") || portOfDischarge.contains("AIRPORT")) {
                return "AIR_EXPORT";
            }
        }
        
        // 默认为海运出口
        return "SEA_EXPORT";
    }
}