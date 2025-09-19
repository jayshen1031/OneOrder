package com.oneorder.clearing.dto;

import lombok.Data;

/**
 * 统一响应DTO
 */
@Data
public class ResponseDTO<T> {
    private int code;
    private String message;
    private T data;
    private long timestamp;

    public ResponseDTO() {
        this.timestamp = System.currentTimeMillis();
    }

    public ResponseDTO(int code, String message, T data) {
        this();
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ResponseDTO<T> success(T data) {
        return new ResponseDTO<>(200, "成功", data);
    }

    public static <T> ResponseDTO<T> success(String message, T data) {
        return new ResponseDTO<>(200, message, data);
    }

    public static <T> ResponseDTO<T> error(String message) {
        return new ResponseDTO<>(500, message, null);
    }

    public static <T> ResponseDTO<T> error(int code, String message) {
        return new ResponseDTO<>(code, message, null);
    }
}