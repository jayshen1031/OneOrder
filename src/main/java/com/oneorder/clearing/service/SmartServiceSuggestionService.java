package com.oneorder.clearing.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 智能服务建议服务
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmartServiceSuggestionService {
    
    private final JdbcTemplate jdbcTemplate;
    private final FeeValidationService feeValidationService;
    
    /**
     * 根据费用科目智能推荐服务项目
     */
    public ServiceSuggestionResult suggestServiceForFee(String orderId, String feeCode) {
        log.debug("智能推荐服务项目: orderId={}, feeCode={}", orderId, feeCode);
        
        try {
            // 1. 获取费用科目适用的服务列表
            List<String> applicableServices = feeValidationService.getApplicableServices(feeCode);
            
            if (applicableServices.isEmpty()) {
                return ServiceSuggestionResult.builder()
                    .canAutoSelect(false)
                    .suggestedService(null)
                    .reason("费用科目无适用的服务项目定义")
                    .conflictServices(List.of())
                    .allApplicableServices(List.of())
                    .orderServices(getOrderServices(orderId))
                    .build();
            }
            
            // 2. 获取订单的服务项目列表
            List<String> orderServices = getOrderServices(orderId);
            
            if (orderServices.isEmpty()) {
                return ServiceSuggestionResult.builder()
                    .canAutoSelect(false)
                    .suggestedService(null)
                    .reason("订单暂无服务项目，无法推荐")
                    .conflictServices(List.of())
                    .allApplicableServices(applicableServices)
                    .orderServices(List.of())
                    .build();
            }
            
            // 3. 计算交集（费用科目适用的服务 ∩ 订单服务）
            List<String> intersection = applicableServices.stream()
                .filter(orderServices::contains)
                .collect(Collectors.toList());
            
            // 4. 根据交集情况生成建议
            if (intersection.size() == 1) {
                // 唯一匹配，可以自动选择
                String suggestedService = intersection.get(0);
                return ServiceSuggestionResult.builder()
                    .canAutoSelect(true)
                    .suggestedService(suggestedService)
                    .reason(String.format("费用科目[%s]适用服务与订单服务交集唯一: %s", feeCode, getServiceName(suggestedService)))
                    .conflictServices(List.of())
                    .allApplicableServices(applicableServices)
                    .orderServices(orderServices)
                    .build();
                    
            } else if (intersection.size() > 1) {
                // 多个匹配，需要手动选择
                return ServiceSuggestionResult.builder()
                    .canAutoSelect(false)
                    .suggestedService(null)
                    .reason(String.format("费用科目[%s]适用于订单中的多个服务项目，需要手动选择", feeCode))
                    .conflictServices(intersection)
                    .allApplicableServices(applicableServices)
                    .orderServices(orderServices)
                    .build();
                    
            } else {
                // 无交集，费用科目不适用于订单的任何服务
                return ServiceSuggestionResult.builder()
                    .canAutoSelect(false)
                    .suggestedService(null)
                    .reason(String.format("费用科目[%s]不适用于当前订单的任何服务项目", feeCode))
                    .conflictServices(List.of())
                    .allApplicableServices(applicableServices)
                    .orderServices(orderServices)
                    .build();
            }
            
        } catch (Exception e) {
            log.error("智能推荐服务项目失败: orderId={}, feeCode={}", orderId, feeCode, e);
            return ServiceSuggestionResult.builder()
                .canAutoSelect(false)
                .suggestedService(null)
                .reason("推荐服务失败: " + e.getMessage())
                .conflictServices(List.of())
                .allApplicableServices(List.of())
                .orderServices(List.of())
                .build();
        }
    }
    
    /**
     * 根据服务项目推荐适用的费用科目
     */
    public FeeSuggestionResult suggestFeesForService(String serviceCode) {
        log.debug("推荐服务适用费用科目: serviceCode={}", serviceCode);
        
        try {
            String sql = "SELECT fsc.fee_code, fce.fee_name, fce.fee_category, fsc.constraint_type, fsc.priority " +
                "FROM fee_service_constraints fsc " +
                "LEFT JOIN fee_codes_extended fce ON fsc.fee_code = fce.fee_code " +
                "WHERE fsc.service_code = ? AND fsc.constraint_type = 'ALLOWED' AND fsc.is_active = true " +
                "ORDER BY fsc.priority DESC, fce.fee_category, fce.fee_name";
                
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, serviceCode);
            
            List<FeeInfo> recommendedFees = results.stream()
                .map(row -> FeeInfo.builder()
                    .feeCode((String) row.get("fee_code"))
                    .feeName((String) row.get("fee_name"))
                    .feeCategory((String) row.get("fee_category"))
                    .priority((Integer) row.get("priority"))
                    .build())
                .collect(Collectors.toList());
            
            return FeeSuggestionResult.builder()
                .serviceCode(serviceCode)
                .serviceName(getServiceName(serviceCode))
                .recommendedFees(recommendedFees)
                .totalCount(recommendedFees.size())
                .build();
                
        } catch (Exception e) {
            log.error("推荐服务适用费用科目失败: serviceCode={}", serviceCode, e);
            return FeeSuggestionResult.builder()
                .serviceCode(serviceCode)
                .serviceName(getServiceName(serviceCode))
                .recommendedFees(List.of())
                .totalCount(0)
                .build();
        }
    }
    
    /**
     * 批量推荐：为订单的所有服务推荐费用科目
     */
    public List<FeeSuggestionResult> batchSuggestFeesForOrder(String orderId) {
        List<String> orderServices = getOrderServices(orderId);
        
        return orderServices.stream()
            .map(this::suggestFeesForService)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取订单的服务项目列表
     */
    private List<String> getOrderServices(String orderId) {
        try {
            // 查询订单的服务项目配置
            String sql = "SELECT DISTINCT service_code " +
                "FROM order_service_assignments " +
                "WHERE order_id = ? AND status = 'ACTIVE' " +
                "UNION " +
                "SELECT DISTINCT service_code " +
                "FROM service_assignments " +
                "WHERE order_id = ?";
            
            List<String> services = jdbcTemplate.queryForList(sql, String.class, orderId, orderId);
            
            // 如果没有查到，使用默认的海运服务项目
            if (services.isEmpty()) {
                log.debug("订单{}无服务项目记录，使用默认海运服务", orderId);
                return List.of("MBL_PROCESSING", "BOOKING", "CUSTOMS_DECLARATION", "INLAND_TRANSPORT");
            }
            
            return services;
            
        } catch (Exception e) {
            log.error("获取订单服务项目失败: orderId={}", orderId, e);
            // 返回默认服务项目列表
            return List.of("MBL_PROCESSING", "BOOKING", "CUSTOMS_DECLARATION", "INLAND_TRANSPORT");
        }
    }
    
    /**
     * 获取服务项目名称
     */
    private String getServiceName(String serviceCode) {
        try {
            String sql = "SELECT service_name FROM service_config WHERE service_code = ?";
            List<String> names = jdbcTemplate.queryForList(sql, String.class, serviceCode);
            return names.isEmpty() ? serviceCode : names.get(0);
        } catch (Exception e) {
            return serviceCode;
        }
    }
    
    /**
     * 服务推荐结果
     */
    @Data
    @lombok.Builder
    public static class ServiceSuggestionResult {
        private boolean canAutoSelect;          // 是否可以自动选择
        private String suggestedService;        // 推荐的服务项目
        private String reason;                  // 推荐原因
        private List<String> conflictServices;  // 冲突的服务项目（多选时）
        private List<String> allApplicableServices; // 所有适用的服务项目
        private List<String> orderServices;     // 订单的服务项目
    }
    
    /**
     * 费用推荐结果
     */
    @Data
    @lombok.Builder
    public static class FeeSuggestionResult {
        private String serviceCode;            // 服务项目编码
        private String serviceName;            // 服务项目名称
        private List<FeeInfo> recommendedFees; // 推荐的费用科目列表
        private int totalCount;                // 推荐数量
    }
    
    /**
     * 费用信息
     */
    @Data
    @lombok.Builder
    public static class FeeInfo {
        private String feeCode;     // 费用科目编码
        private String feeName;     // 费用科目名称
        private String feeCategory; // 费用类别
        private Integer priority;   // 优先级
    }
}