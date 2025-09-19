package com.oneorder.clearing.dto;

import com.oneorder.clearing.entity.ClearingResult;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 清分响应DTO
 */
@Data
public class ClearingResponse {
    
    /**
     * 是否成功
     */
    private Boolean success;
    
    /**
     * 响应代码
     */
    private String code;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 清分结果列表
     */
    private List<ClearingResult> results;
    
    /**
     * 处理时间
     */
    private LocalDateTime processTime;
    
    /**
     * 总记录数
     */
    private Integer totalCount;
    
    /**
     * 验证信息
     */
    private List<String> validationMessages;
    
    /**
     * 差异信息（管报vs法报）
     */
    private List<String> differences;
    
    public static ClearingResponse success(List<ClearingResult> results) {
        ClearingResponse response = new ClearingResponse();
        response.setSuccess(true);
        response.setCode("SUCCESS");
        response.setMessage("清分执行成功");
        response.setResults(results);
        response.setTotalCount(results != null ? results.size() : 0);
        response.setProcessTime(LocalDateTime.now());
        return response;
    }
    
    public static ClearingResponse failed(String message) {
        ClearingResponse response = new ClearingResponse();
        response.setSuccess(false);
        response.setCode("FAILED");
        response.setMessage(message);
        response.setProcessTime(LocalDateTime.now());
        return response;
    }
    
    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return success != null && success;
    }
}