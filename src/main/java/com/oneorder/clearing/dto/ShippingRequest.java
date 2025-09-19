package com.oneorder.clearing.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 开船通知请求
 */
@Data
public class ShippingRequest {
    
    @NotNull(message = "实际开船时间不能为空")
    private LocalDateTime etd;
    
    @NotNull(message = "预计到港时间不能为空")
    private LocalDateTime eta;
    
    private String billOfLadingNo;
    private String containerNos;
    private String sealNos;
    private String remarks;
}