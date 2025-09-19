package com.oneorder.clearing.controller;

import com.oneorder.clearing.entity.ServiceConfig;
import com.oneorder.clearing.repository.ServiceConfigRepository;
// import io.swagger.v3.oas.annotations.Operation;
// import io.swagger.v3.oas.annotations.Parameter;
// import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 服务配置管理控制器
 * 基于第三版费用科目标准提供动态配置管理
 */
@RestController
@RequestMapping("/service-config")
// @Tag(name = "服务配置管理", description = "动态服务费率配置管理API")
public class ServiceConfigController {
    
    private static final Logger logger = LoggerFactory.getLogger(ServiceConfigController.class);
    
    @Autowired
    private ServiceConfigRepository serviceConfigRepository;
    
    /**
     * 获取所有服务配置
     */
    @GetMapping
    // @Operation(summary = "获取所有服务配置", description = "获取所有启用的服务费率配置")
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
            logger.error("获取服务配置失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "获取服务配置失败: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 获取配置统计信息
     */
    @GetMapping("/statistics")
    // @Operation(summary = "获取配置统计信息", description = "获取费用分类、业务类型等统计数据")
    public ResponseEntity<Map<String, Object>> getStatistics() {
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
            logger.error("获取统计信息失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "获取统计信息失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 根据费用编码获取特定配置
     */
    @GetMapping("/{feeCode}")
    // @Operation(summary = "获取特定费用配置", description = "根据费用编码获取配置详情")
    public ResponseEntity<Map<String, Object>> getServiceConfig(
            @PathVariable String feeCode) {
        
        try {
            Optional<ServiceConfig> configOpt = serviceConfigRepository.findByFeeCode(feeCode);
            
            Map<String, Object> response = new HashMap<>();
            if (configOpt.isPresent()) {
                response.put("config", configOpt.get());
                response.put("found", true);
            } else {
                response.put("found", false);
                response.put("message", "未找到费用编码: " + feeCode);
            }
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("获取配置失败: " + feeCode, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "获取配置失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 更新服务配置
     */
    @PutMapping("/{feeCode}")
    // @Operation(summary = "更新服务配置", description = "更新指定费用编码的配置")
    public ResponseEntity<Map<String, Object>> updateServiceConfig(
            @PathVariable String feeCode,
            @RequestBody Map<String, Object> updateData) {
        
        try {
            Optional<ServiceConfig> configOpt = serviceConfigRepository.findByFeeCode(feeCode);
            
            if (!configOpt.isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "未找到费用编码: " + feeCode);
                return ResponseEntity.notFound().build();
            }
            
            ServiceConfig config = configOpt.get();
            
            // 更新费率相关字段
            if (updateData.containsKey("minRate")) {
                config.setMinRate(new BigDecimal(updateData.get("minRate").toString()));
            }
            if (updateData.containsKey("maxRate")) {
                config.setMaxRate(new BigDecimal(updateData.get("maxRate").toString()));
            }
            if (updateData.containsKey("standardRate")) {
                config.setStandardRate(new BigDecimal(updateData.get("standardRate").toString()));
            }
            if (updateData.containsKey("unit")) {
                config.setUnit(updateData.get("unit").toString());
            }
            if (updateData.containsKey("enabled")) {
                config.setEnabled(Boolean.parseBoolean(updateData.get("enabled").toString()));
            }
            if (updateData.containsKey("defaultCurrency")) {
                config.setDefaultCurrency(updateData.get("defaultCurrency").toString());
            }
            if (updateData.containsKey("description")) {
                config.setDescription(updateData.get("description").toString());
            }
            
            // 增加版本号
            config.setVersion(config.getVersion() + 1);
            config.setUpdatedBy("system"); // 可以从请求中获取用户信息
            
            ServiceConfig savedConfig = serviceConfigRepository.save(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("config", savedConfig);
            response.put("message", "配置更新成功");
            response.put("timestamp", LocalDateTime.now());
            
            logger.info("服务配置更新成功: {} - {}", feeCode, config.getChineseName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("更新配置失败: " + feeCode, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "更新配置失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 批量更新服务配置
     */
    @PutMapping("/batch")
    // @Operation(summary = "批量更新服务配置", description = "批量更新多个费用配置")
    public ResponseEntity<Map<String, Object>> batchUpdateServiceConfigs(
            @RequestBody List<Map<String, Object>> updateList) {
        
        try {
            List<ServiceConfig> updatedConfigs = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (Map<String, Object> updateData : updateList) {
                try {
                    String feeCode = updateData.get("feeCode").toString();
                    Optional<ServiceConfig> configOpt = serviceConfigRepository.findByFeeCode(feeCode);
                    
                    if (configOpt.isPresent()) {
                        ServiceConfig config = configOpt.get();
                        
                        // 更新字段（同单个更新逻辑）
                        if (updateData.containsKey("minRate")) {
                            config.setMinRate(new BigDecimal(updateData.get("minRate").toString()));
                        }
                        if (updateData.containsKey("maxRate")) {
                            config.setMaxRate(new BigDecimal(updateData.get("maxRate").toString()));
                        }
                        if (updateData.containsKey("standardRate")) {
                            config.setStandardRate(new BigDecimal(updateData.get("standardRate").toString()));
                        }
                        if (updateData.containsKey("enabled")) {
                            config.setEnabled(Boolean.parseBoolean(updateData.get("enabled").toString()));
                        }
                        
                        config.setVersion(config.getVersion() + 1);
                        config.setUpdatedBy("system");
                        
                        updatedConfigs.add(serviceConfigRepository.save(config));
                    } else {
                        errors.add("未找到费用编码: " + feeCode);
                    }
                } catch (Exception e) {
                    errors.add("更新失败: " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", errors.isEmpty());
            response.put("updatedCount", updatedConfigs.size());
            response.put("updatedConfigs", updatedConfigs);
            response.put("errors", errors);
            response.put("timestamp", LocalDateTime.now());
            
            logger.info("批量更新配置完成: 成功{}, 失败{}", updatedConfigs.size(), errors.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("批量更新配置失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "批量更新失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 重置配置为默认值
     */
    @PostMapping("/reset-defaults")
    // @Operation(summary = "重置为默认配置", description = "重置所有配置为第三版费用标准的默认值")
    public ResponseEntity<Map<String, Object>> resetToDefaults() {
        try {
            // 这里可以调用初始化服务来重置为第三版标准
            Map<String, Object> response = new HashMap<>();
            response.put("message", "重置功能开发中，将基于第三版费用科目标准进行重置");
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("重置默认配置失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "重置失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 验证配置数据
     */
    @PostMapping("/validate")
    // @Operation(summary = "验证配置数据", description = "验证费率配置的有效性")
    public ResponseEntity<Map<String, Object>> validateConfig(@RequestBody Map<String, Object> configData) {
        try {
            List<String> validationErrors = new ArrayList<>();
            
            // 验证必要字段
            if (!configData.containsKey("feeCode") || configData.get("feeCode").toString().trim().isEmpty()) {
                validationErrors.add("费用编码不能为空");
            }
            
            // 验证费率范围
            if (configData.containsKey("minRate") && configData.containsKey("maxRate")) {
                try {
                    BigDecimal minRate = new BigDecimal(configData.get("minRate").toString());
                    BigDecimal maxRate = new BigDecimal(configData.get("maxRate").toString());
                    if (minRate.compareTo(maxRate) > 0) {
                        validationErrors.add("最低费率不能大于最高费率");
                    }
                    if (minRate.compareTo(BigDecimal.ZERO) < 0) {
                        validationErrors.add("费率不能为负数");
                    }
                } catch (NumberFormatException e) {
                    validationErrors.add("费率格式不正确");
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", validationErrors.isEmpty());
            response.put("errors", validationErrors);
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("验证配置失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "验证失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}