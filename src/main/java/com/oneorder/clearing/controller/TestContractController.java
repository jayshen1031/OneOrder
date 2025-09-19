package com.oneorder.clearing.controller;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 测试合约管理控制器
 */
@RestController
@RequestMapping("/api/test-contract")
public class TestContractController {

    @GetMapping("/ping")
    public Map<String, String> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "pong");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }
}