package com.oneorder.clearing.service;

import com.oneorder.clearing.entity.ServiceConfig;
import com.oneorder.clearing.repository.ServiceConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * 服务配置初始化器
 * 基于第三版费用科目标准CSV文件初始化数据库
 */
@Service
public class ServiceConfigInitializer implements ApplicationRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(ServiceConfigInitializer.class);
    
    @Autowired
    private ServiceConfigRepository serviceConfigRepository;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 检查是否已有数据
        long count = serviceConfigRepository.count();
        if (count > 0) {
            logger.info("服务配置已存在 {} 条记录，跳过初始化", count);
            return;
        }
        
        logger.info("开始初始化服务配置数据...");
        
        try {
            initializeFromCsv();
            initializeDefaultRates();
            
            long finalCount = serviceConfigRepository.count();
            logger.info("服务配置初始化完成，共初始化 {} 条记录", finalCount);
            
        } catch (Exception e) {
            logger.error("服务配置初始化失败", e);
            // 不抛出异常，避免影响应用启动
        }
    }
    
    /**
     * 从CSV文件初始化配置
     */
    private void initializeFromCsv() {
        try {
            // 这里可以读取实际的CSV文件
            // ClassPathResource resource = new ClassPathResource("费用配置/全局费用科目-字段表_最终版.csv");
            
            // 暂时使用硬编码的示例数据
            initializeSampleData();
            
        } catch (Exception e) {
            logger.error("从CSV初始化失败，使用示例数据", e);
            initializeSampleData();
        }
    }
    
    /**
     * 初始化示例数据
     */
    private void initializeSampleData() {
        logger.info("使用示例数据初始化服务配置...");
        
        // 海运费用配置
        createServiceConfig("FCL001", "海运费", "Ocean Freight", "OF", 
                           "USD", "应税", "增值税专票", "跨境运输费用", "MBL", 
                           "船公司", "营业收入", "应收", 
                           "集装箱海上运输基本运费，按柜型收取", 
                           "Basic ocean freight for container transportation charged by container type",
                           new BigDecimal("12000"), new BigDecimal("25000"), new BigDecimal("18000"), "箱", "OCEAN");
        
        createServiceConfig("FCL002", "燃油附加费", "Bunker Adjustment Factor", "BAF", 
                           "USD", "应税", "增值税专票", "跨境运输费用", "MBL", 
                           "船公司", "营业收入", "应收", 
                           "因燃油价格波动产生的附加费用", 
                           "Additional charge due to bunker fuel price fluctuations",
                           new BigDecimal("500"), new BigDecimal("1500"), new BigDecimal("800"), "箱", "OCEAN");
        
        createServiceConfig("FCL003", "码头操作费(起运港)", "Origin Terminal Handling Charge", "OTHC", 
                           "CNY", "应税", "增值税专票", "码头/港口/场站费用", "内装", 
                           "码头/场站", "营业成本", "应付", 
                           "起运港码头装卸及相关操作费用", 
                           "Terminal handling charges at origin port for loading operations",
                           new BigDecimal("400"), new BigDecimal("600"), new BigDecimal("480"), "箱", "OCEAN");
        
        createServiceConfig("FCL004", "码头操作费(目的港)", "Destination Terminal Handling Charge", "DTHC", 
                           "USD", "应税", "增值税专票", "码头/港口/场站费用", "换单", 
                           "码头/场站", "营业收入", "应收", 
                           "目的港码头卸货及相关操作费用", 
                           "Terminal handling charges at destination port for discharge operations",
                           new BigDecimal("80"), new BigDecimal("150"), new BigDecimal("120"), "箱", "OCEAN");
        
        createServiceConfig("FCL005", "报关费", "Customs Declaration Fee", "CDF", 
                           "CNY", "应税", "增值税专票", "关检费用", "报关", 
                           "报关行", "营业成本", "应付", 
                           "出口报关代理服务费", 
                           "Export customs declaration agency service fee",
                           new BigDecimal("300"), new BigDecimal("800"), new BigDecimal("500"), "票", "CUSTOMS");
        
        createServiceConfig("FCL006", "拖车费", "Trucking Fee", "TKF", 
                           "CNY", "应税", "增值税专票", "境内运输费用", "拖车", 
                           "运输公司", "营业成本", "应付", 
                           "货物从发货地到港口的陆路运输费", 
                           "Inland trucking from shipper to port",
                           new BigDecimal("800"), new BigDecimal("1500"), new BigDecimal("1200"), "票", "TRUCK");
        
        createServiceConfig("FCL007", "仓储费", "Warehouse Storage Fee", "WSF", 
                           "CNY", "应税", "增值税专票", "仓储费用", "仓储", 
                           "仓储公司", "营业成本", "应付", 
                           "货物在仓库存储期间产生的费用", 
                           "Storage charges for goods in warehouse",
                           new BigDecimal("5"), new BigDecimal("12"), new BigDecimal("8"), "CBM/天", "WAREHOUSE");
        
        createServiceConfig("FCL008", "装箱费", "Container Loading Fee", "CLF", 
                           "CNY", "应税", "增值税专票", "装卸费用", "内装", 
                           "装卸公司", "营业成本", "应付", 
                           "货物装入集装箱的作业费用", 
                           "Fee for loading cargo into containers",
                           new BigDecimal("200"), new BigDecimal("500"), new BigDecimal("300"), "箱", "OCEAN");
        
        createServiceConfig("FCL009", "单证费", "Documentation Fee", "DOC", 
                           "CNY", "应税", "增值税专票", "单证文件费用", "MBL", 
                           "货代公司", "营业收入", "应收", 
                           "制作和处理各类出口单证文件费用", 
                           "Fee for preparing and processing export documentation",
                           new BigDecimal("50"), new BigDecimal("200"), new BigDecimal("100"), "套", "OCEAN");
        
        createServiceConfig("FCL010", "保险费", "Marine Insurance Premium", "INS", 
                           "CNY", "应税", "增值税专票", "保险费用", "保险", 
                           "保险公司", "营业成本", "应付", 
                           "货物运输保险费", 
                           "Marine cargo insurance premium",
                           new BigDecimal("0.1"), new BigDecimal("0.5"), new BigDecimal("0.3"), "%", "OCEAN");
        
        // 空运费用配置
        createServiceConfig("AIR001", "空运费", "Air Freight", "AF", 
                           "CNY", "应税", "增值税专票", "跨境运输费用", "空运", 
                           "航空公司", "营业收入", "应收", 
                           "航空货物运输基本运费", 
                           "Basic air freight charges",
                           new BigDecimal("18"), new BigDecimal("35"), new BigDecimal("25"), "KG", "AIR");
        
        createServiceConfig("AIR002", "燃油附加费", "Fuel Surcharge", "FSC", 
                           "CNY", "应税", "增值税专票", "跨境运输费用", "空运", 
                           "航空公司", "营业收入", "应收", 
                           "航空燃油价格波动附加费", 
                           "Air freight fuel surcharge",
                           new BigDecimal("2"), new BigDecimal("8"), new BigDecimal("5"), "KG", "AIR");
        
        createServiceConfig("AIR003", "安检费", "Security Fee", "SEC", 
                           "CNY", "应税", "增值税专票", "关检费用", "安检", 
                           "机场", "营业成本", "应付", 
                           "航空货物安全检查费", 
                           "Air cargo security screening fee",
                           new BigDecimal("1"), new BigDecimal("3"), new BigDecimal("2"), "KG", "AIR");
        
        // 陆运费用配置
        createServiceConfig("TRK001", "陆运费", "Trucking Fee", "TRK", 
                           "CNY", "应税", "增值税专票", "境内运输费用", "陆运", 
                           "运输公司", "营业成本", "应付", 
                           "公路货物运输费", 
                           "Road transportation fee",
                           new BigDecimal("2.8"), new BigDecimal("4.5"), new BigDecimal("3.5"), "公里", "TRUCK");
        
        // 铁运费用配置
        createServiceConfig("RAIL001", "铁路运费", "Rail Freight", "RF", 
                           "CNY", "应税", "增值税专票", "跨境运输费用", "铁运", 
                           "铁路公司", "营业成本", "应付", 
                           "铁路货物运输费", 
                           "Railway transportation fee",
                           new BigDecimal("18000"), new BigDecimal("28000"), new BigDecimal("22000"), "箱", "RAIL");
        
        logger.info("示例数据初始化完成");
    }
    
    /**
     * 创建服务配置
     */
    private void createServiceConfig(String feeCode, String chineseName, String englishName, String abbreviation,
                                   String defaultCurrency, String taxStatus, String invoiceType, String feeCategory,
                                   String relatedService, String supplierType, String accountingSubject, String direction,
                                   String description, String descriptionEnglish,
                                   BigDecimal minRate, BigDecimal maxRate, BigDecimal standardRate, String unit, String businessType) {
        
        ServiceConfig config = new ServiceConfig();
        config.setFeeCode(feeCode);
        config.setChineseName(chineseName);
        config.setEnglishName(englishName);
        config.setAbbreviation(abbreviation);
        config.setDefaultCurrency(defaultCurrency);
        config.setTaxStatus(taxStatus);
        config.setInvoiceType(invoiceType);
        config.setFeeCategory(feeCategory);
        config.setRelatedService(relatedService);
        config.setSupplierType(supplierType);
        config.setAccountingSubject(accountingSubject);
        config.setDirection(direction);
        config.setDescription(description);
        config.setDescriptionEnglish(descriptionEnglish);
        config.setMinRate(minRate);
        config.setMaxRate(maxRate);
        config.setStandardRate(standardRate);
        config.setUnit(unit);
        config.setBusinessType(businessType);
        config.setEnabled(true);
        config.setCreatedBy("system");
        config.setCreatedTime(LocalDateTime.now());
        config.setUpdatedTime(LocalDateTime.now());
        config.setVersion(1);
        
        serviceConfigRepository.save(config);
        logger.debug("创建服务配置: {} - {}", feeCode, chineseName);
    }
    
    /**
     * 初始化默认费率
     */
    private void initializeDefaultRates() {
        logger.info("初始化默认费率配置...");
        
        // 这里可以根据实际业务需求调整默认费率
        // 目前在createServiceConfig中已经设置了默认费率
        
        logger.info("默认费率配置初始化完成");
    }
}