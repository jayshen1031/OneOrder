package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.ExpenseEntry;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 费用校验服务
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeeValidationService {
    
    private final JdbcTemplate jdbcTemplate;
    
    /**
     * 校验费用科目和服务项目的约束关系
     */
    public ValidationResult validateFeeServiceConstraint(String feeCode, String serviceCode) {
        log.debug("校验费用科目服务约束: feeCode={}, serviceCode={}", feeCode, serviceCode);
        
        try {
            String sql = "SELECT constraint_type, constraint_level, description, priority " +
                "FROM fee_service_constraints " +
                "WHERE fee_code = ? AND service_code = ? AND is_active = true " +
                "ORDER BY priority DESC " +
                "LIMIT 1";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, feeCode, serviceCode);
            
            if (results.isEmpty()) {
                return ValidationResult.builder()
                    .status(ExpenseEntry.ValidationStatus.WARNING)
                    .message(String.format("费用科目[%s]与服务项目[%s]无明确约束关系，建议确认适用性", feeCode, serviceCode))
                    .level(ValidationLevel.WARNING)
                    .constraintType(ConstraintType.UNKNOWN)
                    .build();
            }
            
            Map<String, Object> constraint = results.get(0);
            String constraintType = (String) constraint.get("constraint_type");
            String constraintLevel = (String) constraint.get("constraint_level");
            String description = (String) constraint.get("description");
            
            return buildValidationResult(constraintType, constraintLevel, description, feeCode, serviceCode);
            
        } catch (Exception e) {
            log.error("校验费用科目服务约束失败: feeCode={}, serviceCode={}", feeCode, serviceCode, e);
            return ValidationResult.builder()
                .status(ExpenseEntry.ValidationStatus.WARNING)
                .message("校验服务失败，建议手动确认适用性")
                .level(ValidationLevel.WARNING)
                .constraintType(ConstraintType.UNKNOWN)
                .build();
        }
    }
    
    /**
     * 校验费用科目和供应商类型的约束关系
     */
    public ValidationResult validateFeeSupplierConstraint(String feeCode, String supplierType) {
        log.debug("校验费用科目供应商约束: feeCode={}, supplierType={}", feeCode, supplierType);
        
        if (supplierType == null || supplierType.trim().isEmpty()) {
            return ValidationResult.builder()
                .status(ExpenseEntry.ValidationStatus.VALID)
                .message("无供应商类型约束检查")
                .level(ValidationLevel.VALID)
                .constraintType(ConstraintType.ALLOWED)
                .build();
        }
        
        try {
            String sql = "SELECT constraint_type, constraint_level, description, priority " +
                "FROM fee_supplier_constraints " +
                "WHERE fee_code = ? AND supplier_type = ? AND is_active = true " +
                "ORDER BY priority DESC " +
                "LIMIT 1";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, feeCode, supplierType);
            
            if (results.isEmpty()) {
                return ValidationResult.builder()
                    .status(ExpenseEntry.ValidationStatus.WARNING)
                    .message(String.format("费用科目[%s]与供应商类型[%s]无明确约束关系，建议确认适用性", feeCode, supplierType))
                    .level(ValidationLevel.WARNING)
                    .constraintType(ConstraintType.UNKNOWN)
                    .build();
            }
            
            Map<String, Object> constraint = results.get(0);
            String constraintType = (String) constraint.get("constraint_type");
            String constraintLevel = (String) constraint.get("constraint_level");
            String description = (String) constraint.get("description");
            
            return buildValidationResult(constraintType, constraintLevel, description, feeCode, supplierType);
            
        } catch (Exception e) {
            log.error("校验费用科目供应商约束失败: feeCode={}, supplierType={}", feeCode, supplierType, e);
            return ValidationResult.builder()
                .status(ExpenseEntry.ValidationStatus.WARNING)
                .message("校验服务失败，建议手动确认适用性")
                .level(ValidationLevel.WARNING)
                .constraintType(ConstraintType.UNKNOWN)
                .build();
        }
    }
    
    /**
     * 批量校验费用明细
     */
    public List<ValidationResult> batchValidateExpenseEntries(List<Map<String, String>> entries) {
        return entries.stream()
            .map(entry -> {
                String feeCode = entry.get("feeCode");
                String serviceCode = entry.get("serviceCode");
                String supplierType = entry.get("supplierType");
                
                ValidationResult serviceResult = validateFeeServiceConstraint(feeCode, serviceCode);
                ValidationResult supplierResult = validateFeeSupplierConstraint(feeCode, supplierType);
                
                // 返回更严格的校验结果
                return serviceResult.getLevel().ordinal() > supplierResult.getLevel().ordinal() 
                    ? serviceResult : supplierResult;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 获取费用科目的适用服务列表
     */
    public List<String> getApplicableServices(String feeCode) {
        try {
            String sql = "SELECT service_code " +
                "FROM fee_service_constraints " +
                "WHERE fee_code = ? AND constraint_type = 'ALLOWED' AND is_active = true " +
                "ORDER BY priority DESC";
            
            return jdbcTemplate.queryForList(sql, String.class, feeCode);
            
        } catch (Exception e) {
            log.error("获取费用科目适用服务失败: feeCode={}", feeCode, e);
            return List.of();
        }
    }
    
    /**
     * 获取费用科目的适用供应商类型列表
     */
    public List<String> getApplicableSupplierTypes(String feeCode) {
        try {
            String sql = "SELECT supplier_type " +
                "FROM fee_supplier_constraints " +
                "WHERE fee_code = ? AND constraint_type = 'ALLOWED' AND is_active = true " +
                "ORDER BY priority DESC";
            
            return jdbcTemplate.queryForList(sql, String.class, feeCode);
            
        } catch (Exception e) {
            log.error("获取费用科目适用供应商类型失败: feeCode={}", feeCode, e);
            return List.of();
        }
    }
    
    /**
     * 构建校验结果
     */
    private ValidationResult buildValidationResult(String constraintType, String constraintLevel, 
                                                 String description, String feeCode, String target) {
        ConstraintType type = ConstraintType.valueOf(constraintType);
        ValidationLevel level = ValidationLevel.valueOf(constraintLevel);
        
        ExpenseEntry.ValidationStatus status;
        String message;
        
        switch (type) {
            case ALLOWED:
                status = ExpenseEntry.ValidationStatus.VALID;
                message = description != null ? description : "校验通过";
                break;
            case FORBIDDEN:
                status = ExpenseEntry.ValidationStatus.ERROR;
                message = String.format("费用科目[%s]不允许使用于[%s]", feeCode, target);
                break;
            case WARNING:
                status = ExpenseEntry.ValidationStatus.WARNING;
                message = String.format("费用科目[%s]使用于[%s]需要特别注意: %s", feeCode, target, description);
                break;
            default:
                status = ExpenseEntry.ValidationStatus.WARNING;
                message = "未知的约束类型，建议手动确认";
                break;
        }
        
        // 根据约束级别调整状态
        if (level == ValidationLevel.SUGGESTION && status == ExpenseEntry.ValidationStatus.ERROR) {
            status = ExpenseEntry.ValidationStatus.WARNING;
            message = "建议: " + message;
        }
        
        return ValidationResult.builder()
            .status(status)
            .message(message)
            .level(level)
            .constraintType(type)
            .build();
    }
    
    /**
     * 校验结果类
     */
    @Data
    @lombok.Builder
    public static class ValidationResult {
        private ExpenseEntry.ValidationStatus status;
        private String message;
        private ValidationLevel level;
        private ConstraintType constraintType;
    }
    
    /**
     * 校验级别枚举
     */
    public enum ValidationLevel {
        VALID,      // 有效
        SUGGESTION, // 建议
        WARNING,    // 警告
        STRICT      // 严格
    }
    
    /**
     * 约束类型枚举
     */
    public enum ConstraintType {
        ALLOWED,    // 允许
        FORBIDDEN,  // 禁止
        WARNING,    // 警告
        UNKNOWN     // 未知
    }
}