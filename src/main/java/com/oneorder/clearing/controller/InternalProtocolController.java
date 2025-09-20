package com.oneorder.clearing.controller;

import com.oneorder.clearing.entity.InternalProtocol;
import com.oneorder.clearing.repository.InternalProtocolRepository;
import com.oneorder.clearing.dto.ProtocolMatchRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 内部协议管理控制器
 */
@RestController
@RequestMapping("/api/internal-protocols")
@RequiredArgsConstructor
@Slf4j
public class InternalProtocolController {
    
    private final InternalProtocolRepository protocolRepository;
    
    /**
     * 获取所有有效协议
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProtocols() {
        try {
            List<InternalProtocol> protocols = protocolRepository.findAllActive();
            List<ProtocolDTO> protocolDTOs = protocols.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            log.info("获取所有协议成功，数量: {}", protocolDTOs.size());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", protocolDTOs);
            response.put("message", "获取协议列表成功");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取协议列表失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取协议列表失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 协议匹配 - 根据部门和服务查找适用协议
     */
    @PostMapping("/match")
    public ResponseEntity<Map<String, Object>> matchProtocols(@RequestBody ProtocolMatchRequest request) {
        try {
            List<InternalProtocol> protocols = protocolRepository.findAvailableProtocols(
                request.getSalesDepartmentId(),
                request.getOperationDepartmentId(),
                request.getServiceCode(),
                request.getBusinessType(),
                LocalDate.now()
            );
            
            List<ProtocolDTO> protocolDTOs = protocols.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            log.info("协议匹配成功，找到 {} 个适用协议", protocolDTOs.size());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", protocolDTOs);
            response.put("message", "协议匹配成功");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("协议匹配失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "协议匹配失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 创建新协议
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createProtocol(@RequestBody CreateProtocolRequest request) {
        try {
            InternalProtocol protocol = new InternalProtocol();
            protocol.setProtocolId(generateProtocolId());
            protocol.setProtocolName(request.getProtocolName());
            protocol.setSalesDepartmentId(request.getSalesDepartmentId());
            protocol.setOperationDepartmentId(request.getOperationDepartmentId());
            protocol.setServiceCode(request.getServiceCode());
            protocol.setBusinessType(request.getBusinessType());
            protocol.setBaseCommissionRate(request.getBaseCommissionRate());
            protocol.setPerformanceBonusRate(request.getPerformanceBonusRate());
            protocol.setActive(true);
            protocol.setEffectiveDate(request.getEffectiveDate());
            protocol.setExpiryDate(request.getExpiryDate());
            protocol.setCreatedBy("SYSTEM"); // TODO: 获取当前用户
            
            InternalProtocol saved = protocolRepository.save(protocol);
            log.info("创建协议成功: {}", saved.getProtocolId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", convertToDTO(saved));
            response.put("message", "创建协议成功");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("创建协议失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "创建协议失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // ==================== 辅助方法 ====================
    
    /**
     * 转换为DTO
     */
    private ProtocolDTO convertToDTO(InternalProtocol protocol) {
        ProtocolDTO dto = new ProtocolDTO();
        dto.setProtocolId(protocol.getProtocolId());
        dto.setProtocolName(protocol.getProtocolName());
        dto.setSalesDepartmentId(protocol.getSalesDepartmentId());
        dto.setOperationDepartmentId(protocol.getOperationDepartmentId());
        dto.setServiceCode(protocol.getServiceCode());
        dto.setBusinessType(protocol.getBusinessType());
        dto.setBaseCommissionRate(protocol.getBaseCommissionRate());
        dto.setPerformanceBonusRate(protocol.getPerformanceBonusRate());
        dto.setTotalCommissionRate(protocol.getTotalCommissionRate());
        dto.setActive(protocol.getActive());
        dto.setEffectiveDate(protocol.getEffectiveDate());
        dto.setExpiryDate(protocol.getExpiryDate());
        dto.setCreatedTime(protocol.getCreatedTime());
        dto.setUpdatedTime(protocol.getUpdatedTime());
        dto.setEffective(protocol.isEffective());
        
        return dto;
    }
    
    /**
     * 生成协议ID
     */
    private String generateProtocolId() {
        return "PROT" + System.currentTimeMillis();
    }
    
    // ==================== DTO类 ====================
    
    @Data
    public static class ProtocolDTO {
        private String protocolId;
        private String protocolName;
        private String salesDepartmentId;
        private String operationDepartmentId;
        private String serviceCode;
        private String businessType;
        private BigDecimal baseCommissionRate;
        private BigDecimal performanceBonusRate;
        private BigDecimal totalCommissionRate;
        private Boolean active;
        private LocalDate effectiveDate;
        private LocalDate expiryDate;
        private java.time.LocalDateTime createdTime;
        private java.time.LocalDateTime updatedTime;
        private boolean effective;
    }
    
    @Data
    public static class CreateProtocolRequest {
        private String protocolName;
        private String salesDepartmentId;
        private String operationDepartmentId;
        private String serviceCode;
        private String businessType;
        private BigDecimal baseCommissionRate;
        private BigDecimal performanceBonusRate;
        private LocalDate effectiveDate;
        private LocalDate expiryDate;
    }
}