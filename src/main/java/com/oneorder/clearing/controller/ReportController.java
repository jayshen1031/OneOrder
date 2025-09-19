package com.oneorder.clearing.controller;

import com.oneorder.clearing.dto.*;
import com.oneorder.clearing.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 报表控制器
 */
@Tag(name = "报表管理", description = "报表生成和导出相关接口")
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {
    
    private final ReportService reportService;
    
    @Operation(summary = "生成管理报表", description = "生成管理口径报表")
    @PostMapping("/management")
    public ResponseEntity<ManagementReportDTO> generateManagementReport(@Valid @RequestBody ReportRequest request) {
        log.info("收到管理报表生成请求，时间范围: {} - {}", request.getStartTime(), request.getEndTime());
        
        try {
            ManagementReportDTO report = reportService.generateManagementReport(request);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("生成管理报表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "生成法定报表", description = "生成法定口径报表")
    @PostMapping("/legal")
    public ResponseEntity<LegalReportDTO> generateLegalReport(@Valid @RequestBody ReportRequest request) {
        log.info("收到法定报表生成请求，时间范围: {} - {}", request.getStartTime(), request.getEndTime());
        
        try {
            LegalReportDTO report = reportService.generateLegalReport(request);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("生成法定报表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "生成差异对照报表", description = "生成管报与法报的差异对照表")
    @PostMapping("/difference")
    public ResponseEntity<DifferenceReportDTO> generateDifferenceReport(@Valid @RequestBody ReportRequest request) {
        log.info("收到差异对照报表生成请求，时间范围: {} - {}", request.getStartTime(), request.getEndTime());
        
        try {
            DifferenceReportDTO report = reportService.generateDifferenceReport(request);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("生成差异对照报表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "导出管理报表", description = "导出管理报表到Excel或CSV")
    @PostMapping("/management/export")
    public ResponseEntity<byte[]> exportManagementReport(
            @Valid @RequestBody ReportRequest request,
            @RequestParam(defaultValue = "excel") String format) {
        log.info("收到管理报表导出请求，格式: {}", format);
        
        try {
            byte[] data = reportService.exportManagementReport(request, format);
            
            String filename = "management_report_" + System.currentTimeMillis();
            String contentType;
            
            if ("excel".equalsIgnoreCase(format)) {
                filename += ".xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else {
                filename += ".csv";
                contentType = "text/csv";
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(data);
        } catch (Exception e) {
            log.error("导出管理报表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "导出法定报表", description = "导出法定报表到Excel或CSV")
    @PostMapping("/legal/export")
    public ResponseEntity<byte[]> exportLegalReport(
            @Valid @RequestBody ReportRequest request,
            @RequestParam(defaultValue = "excel") String format) {
        log.info("收到法定报表导出请求，格式: {}", format);
        
        try {
            byte[] data = reportService.exportLegalReport(request, format);
            
            String filename = "legal_report_" + System.currentTimeMillis();
            String contentType;
            
            if ("excel".equalsIgnoreCase(format)) {
                filename += ".xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else {
                filename += ".csv";
                contentType = "text/csv";
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(data);
        } catch (Exception e) {
            log.error("导出法定报表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @Operation(summary = "生成清分路径可视化", description = "生成订单清分路径的可视化数据")
    @GetMapping("/visualization/{orderId}")
    public ResponseEntity<String> generateClearingPathVisualization(@PathVariable String orderId) {
        log.info("收到清分路径可视化请求，订单ID: {}", orderId);
        
        try {
            String visualization = reportService.generateClearingPathVisualization(orderId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(visualization);
        } catch (Exception e) {
            log.error("生成清分路径可视化失败", e);
            return ResponseEntity.internalServerError().body("{}");
        }
    }
}