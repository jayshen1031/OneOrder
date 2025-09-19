package com.oneorder.clearing.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 订舱请求
 */
@Data
public class BookingRequest {
    
    @NotBlank(message = "船名不能为空")
    private String vessel;
    
    @NotBlank(message = "航次不能为空")
    private String voyage;
    
    @NotNull(message = "预计开船时间不能为空")
    private LocalDateTime etd;
    
    @NotNull(message = "预计到港时间不能为空")
    private LocalDateTime eta;
    
    private String bookingNo;
    private String shippingLine;
    private String containerType;
    private Integer containerQty;
    private String remarks;
}