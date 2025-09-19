package com.oneorder.clearing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

/**
 * 录费模块测试控制器
 */
@RestController
@RequestMapping("/api/expense-test")
@CrossOrigin(origins = "*")
public class ExpenseTestController {
    
    /**
     * 测试接口
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "录费模块测试接口正常");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
    
    /**
     * 模拟费用科目列表
     */
    @GetMapping("/fee-codes")
    public ResponseEntity<Map<String, Object>> getFeeCodes() {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "成功");
        response.put("data", new String[]{"FCL001", "THC001", "CUSTOMS001"});
        return ResponseEntity.ok(response);
    }
}