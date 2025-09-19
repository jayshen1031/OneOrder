package com.oneorder.clearing.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

/**
 * 报关请求
 */
@Data
public class CustomsRequest {
    
    @NotBlank(message = "报关单号不能为空")
    private String declarationNo;
    
    private String customsStatus;
    private String commodityCode;
    private String exportLicenseNo;
    private String remarks;
}