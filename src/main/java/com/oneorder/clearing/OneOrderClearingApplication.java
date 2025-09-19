package com.oneorder.clearing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * OneOrder财务清分系统启动类
 * 
 * @author OneOrder Team
 */
@SpringBootApplication
@EnableCaching
@EnableTransactionManagement
public class OneOrderClearingApplication {

    public static void main(String[] args) {
        SpringApplication.run(OneOrderClearingApplication.class, args);
        System.out.println("==============================================");
        System.out.println("OneOrder财务清分系统启动成功！");
        System.out.println("API文档地址: http://localhost:8080/api/swagger-ui.html");
        System.out.println("==============================================");
    }
}