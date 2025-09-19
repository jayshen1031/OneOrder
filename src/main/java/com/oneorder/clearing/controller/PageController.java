package com.oneorder.clearing.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * 页面控制器
 * 处理静态页面访问
 */
@RestController
public class PageController {

    @GetMapping(value = "/freight-order.html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> freightOrderPage() {
        return getStaticPage("static/freight-order.html");
    }

    @GetMapping(value = "/clearing-test-center.html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> clearingTestCenterPage() {
        return getStaticPage("static/clearing-test-center.html");
    }

    @GetMapping(value = "/freight-demo.html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> freightDemoPage() {
        return getStaticPage("static/freight-demo.html");
    }

    private ResponseEntity<String> getStaticPage(String resourcePath) {
        try {
            ClassPathResource resource = new ClassPathResource(resourcePath);
            InputStream inputStream = resource.getInputStream();
            String content = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(content);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
}