package com.oneorder.clearing.service;

import com.oneorder.clearing.dto.*;
import com.oneorder.clearing.entity.Order;

import java.util.List;
import java.util.Map;

/**
 * 货代订单服务接口
 */
public interface FreightOrderService {
    
    /**
     * 创建货代订单
     */
    FreightOrderResponse createOrder(CreateFreightOrderRequest request);
    
    /**
     * 根据ID获取订单
     */
    FreightOrderResponse getOrderById(String orderId);
    
    /**
     * 分页查询订单
     */
    List<FreightOrderResponse> getOrders(int page, int size, String status);
    
    /**
     * 确认订舱
     */
    FreightOrderResponse confirmBooking(String orderId, BookingRequest request);
    
    /**
     * 完成报关
     */
    FreightOrderResponse completeCustoms(String orderId, CustomsRequest request);
    
    /**
     * 开船通知
     */
    FreightOrderResponse startShipping(String orderId, ShippingRequest request);
    
    /**
     * 到港通知
     */
    FreightOrderResponse notifyArrival(String orderId);
    
    /**
     * 完成提货
     */
    FreightOrderResponse completeDelivery(String orderId, DeliveryRequest request);
    
    /**
     * 费用确认并触发清分
     */
    CostConfirmResponse confirmCosts(String orderId, CostConfirmRequest request);
    
    /**
     * 获取订单时间轴
     */
    OrderTimelineResponse getOrderTimeline(String orderId);
    
    /**
     * 创建演示数据
     */
    List<FreightOrderResponse> createSampleOrders();
    
    /**
     * 计算订单费用
     */
    Map<String, Object> calculateOrderFees(Order order);
    
    /**
     * 获取服务费率
     */
    Map<String, Object> getServiceRates();
    
    /**
     * 批量清分
     */
    List<String> batchClearing(String orderStatus, String clearingMode);
    
    /**
     * 获取业务统计
     */
    Map<String, Object> getBusinessStatistics();
}