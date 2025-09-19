package com.oneorder.clearing.dto;

import lombok.Data;
import java.util.List;

/**
 * 协议确认请求DTO
 */
@Data
public class ProtocolConfirmRequest {
    private List<Long> serviceIds;
    private String internalProtocolId;
    private String confirmRemark;
    private boolean autoStart;
}