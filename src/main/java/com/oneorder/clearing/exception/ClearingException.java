package com.oneorder.clearing.exception;

/**
 * 清分业务异常
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */
public class ClearingException extends RuntimeException {
    
    public ClearingException(String message) {
        super(message);
    }
    
    public ClearingException(String message, Throwable cause) {
        super(message, cause);
    }
}