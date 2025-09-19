package com.oneorder.clearing.service;

import com.oneorder.clearing.dto.ReportRequest;
import com.oneorder.clearing.dto.ManagementReportDTO;
import com.oneorder.clearing.dto.LegalReportDTO;
import com.oneorder.clearing.dto.DifferenceReportDTO;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 报表生成服务接口
 */
public interface ReportService {
    
    /**
     * 生成管理报表
     * @param request 报表请求参数
     * @return 管理报表数据
     */
    ManagementReportDTO generateManagementReport(ReportRequest request);
    
    /**
     * 生成法定报表
     * @param request 报表请求参数
     * @return 法定报表数据
     */
    LegalReportDTO generateLegalReport(ReportRequest request);
    
    /**
     * 生成差异对照报表
     * @param request 报表请求参数
     * @return 差异对照报表数据
     */
    DifferenceReportDTO generateDifferenceReport(ReportRequest request);
    
    /**
     * 导出管理报表（Excel/CSV）
     * @param request 报表请求参数
     * @param format 导出格式
     * @return 文件字节数组
     */
    byte[] exportManagementReport(ReportRequest request, String format);
    
    /**
     * 导出法定报表（Excel/CSV）
     * @param request 报表请求参数
     * @param format 导出格式
     * @return 文件字节数组
     */
    byte[] exportLegalReport(ReportRequest request, String format);
    
    /**
     * 生成清分路径可视化数据
     * @param orderId 订单ID
     * @return 可视化数据
     */
    String generateClearingPathVisualization(String orderId);
}