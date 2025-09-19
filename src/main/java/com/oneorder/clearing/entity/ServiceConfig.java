package com.oneorder.clearing.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 服务配置实体 - 基于第三版费用科目标准
 * 对应全局费用科目-字段表_最终版.csv
 */
@Entity
@Table(name = "service_config")
public class ServiceConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 全局费用编码 (如: FCL001, FCL002)
     */
    @Column(name = "fee_code", unique = true, nullable = false)
    private String feeCode;
    
    /**
     * 中文费用名称 (如: 海运费, 燃油附加费)
     */
    @Column(name = "chinese_name", nullable = false)
    private String chineseName;
    
    /**
     * 英文费用名称 (如: Ocean Freight, Bunker Adjustment Factor)
     */
    @Column(name = "english_name", nullable = false)
    private String englishName;
    
    /**
     * 助记符 (如: OF, BAF)
     */
    @Column(name = "abbreviation")
    private String abbreviation;
    
    /**
     * 默认币种 (USD, CNY)
     */
    @Column(name = "default_currency")
    private String defaultCurrency;
    
    /**
     * 默认应/免税
     */
    @Column(name = "tax_status")
    private String taxStatus;
    
    /**
     * 可选开票类型
     */
    @Column(name = "invoice_type")
    private String invoiceType;
    
    /**
     * 所属费用分类 (如: 跨境运输费用, 码头/港口/场站费用)
     */
    @Column(name = "fee_category")
    private String feeCategory;
    
    /**
     * 对应的服务 (如: MBL, 内装, 换单)
     */
    @Column(name = "related_service")
    private String relatedService;
    
    /**
     * 对应的供应商类型 (如: 船公司, 码头/场站, 报关行)
     */
    @Column(name = "supplier_type")
    private String supplierType;
    
    /**
     * 对应的财务科目 (如: 营业收入, 营业成本)
     */
    @Column(name = "accounting_subject")
    private String accountingSubject;
    
    /**
     * 收付方向 (应收, 应付)
     */
    @Column(name = "direction")
    private String direction;
    
    /**
     * 科目说明
     */
    @Column(name = "description", length = 500)
    private String description;
    
    /**
     * 科目说明英文
     */
    @Column(name = "description_english", length = 500)
    private String descriptionEnglish;
    
    /**
     * 原系统编码
     */
    @Column(name = "legacy_code")
    private String legacyCode;
    
    // ==================== 费率配置 ====================
    
    /**
     * 最低费率
     */
    @Column(name = "min_rate", precision = 12, scale = 2)
    private BigDecimal minRate;
    
    /**
     * 最高费率
     */
    @Column(name = "max_rate", precision = 12, scale = 2)
    private BigDecimal maxRate;
    
    /**
     * 标准费率
     */
    @Column(name = "standard_rate", precision = 12, scale = 2)
    private BigDecimal standardRate;
    
    /**
     * 计费单位 (如: 箱, CBM, KG, 票)
     */
    @Column(name = "unit")
    private String unit;
    
    /**
     * 是否启用
     */
    @Column(name = "enabled")
    private Boolean enabled = true;
    
    /**
     * 业务类型 (OCEAN, AIR, TRUCK, RAIL, CUSTOMS, WAREHOUSE)
     */
    @Column(name = "business_type")
    private String businessType;
    
    // ==================== 审计字段 ====================
    
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    /**
     * 配置版本号
     */
    @Column(name = "version")
    private Integer version = 1;
    
    // ==================== 构造函数 ====================
    
    public ServiceConfig() {}
    
    public ServiceConfig(String feeCode, String chineseName, String englishName) {
        this.feeCode = feeCode;
        this.chineseName = chineseName;
        this.englishName = englishName;
        this.createdTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    // ==================== Getter和Setter ====================
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFeeCode() {
        return feeCode;
    }
    
    public void setFeeCode(String feeCode) {
        this.feeCode = feeCode;
    }
    
    public String getChineseName() {
        return chineseName;
    }
    
    public void setChineseName(String chineseName) {
        this.chineseName = chineseName;
    }
    
    public String getEnglishName() {
        return englishName;
    }
    
    public void setEnglishName(String englishName) {
        this.englishName = englishName;
    }
    
    public String getAbbreviation() {
        return abbreviation;
    }
    
    public void setAbbreviation(String abbreviation) {
        this.abbreviation = abbreviation;
    }
    
    public String getDefaultCurrency() {
        return defaultCurrency;
    }
    
    public void setDefaultCurrency(String defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }
    
    public String getTaxStatus() {
        return taxStatus;
    }
    
    public void setTaxStatus(String taxStatus) {
        this.taxStatus = taxStatus;
    }
    
    public String getInvoiceType() {
        return invoiceType;
    }
    
    public void setInvoiceType(String invoiceType) {
        this.invoiceType = invoiceType;
    }
    
    public String getFeeCategory() {
        return feeCategory;
    }
    
    public void setFeeCategory(String feeCategory) {
        this.feeCategory = feeCategory;
    }
    
    public String getRelatedService() {
        return relatedService;
    }
    
    public void setRelatedService(String relatedService) {
        this.relatedService = relatedService;
    }
    
    public String getSupplierType() {
        return supplierType;
    }
    
    public void setSupplierType(String supplierType) {
        this.supplierType = supplierType;
    }
    
    public String getAccountingSubject() {
        return accountingSubject;
    }
    
    public void setAccountingSubject(String accountingSubject) {
        this.accountingSubject = accountingSubject;
    }
    
    public String getDirection() {
        return direction;
    }
    
    public void setDirection(String direction) {
        this.direction = direction;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getDescriptionEnglish() {
        return descriptionEnglish;
    }
    
    public void setDescriptionEnglish(String descriptionEnglish) {
        this.descriptionEnglish = descriptionEnglish;
    }
    
    public String getLegacyCode() {
        return legacyCode;
    }
    
    public void setLegacyCode(String legacyCode) {
        this.legacyCode = legacyCode;
    }
    
    public BigDecimal getMinRate() {
        return minRate;
    }
    
    public void setMinRate(BigDecimal minRate) {
        this.minRate = minRate;
    }
    
    public BigDecimal getMaxRate() {
        return maxRate;
    }
    
    public void setMaxRate(BigDecimal maxRate) {
        this.maxRate = maxRate;
    }
    
    public BigDecimal getStandardRate() {
        return standardRate;
    }
    
    public void setStandardRate(BigDecimal standardRate) {
        this.standardRate = standardRate;
    }
    
    public String getUnit() {
        return unit;
    }
    
    public void setUnit(String unit) {
        this.unit = unit;
    }
    
    public Boolean getEnabled() {
        return enabled;
    }
    
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getBusinessType() {
        return businessType;
    }
    
    public void setBusinessType(String businessType) {
        this.businessType = businessType;
    }
    
    public LocalDateTime getCreatedTime() {
        return createdTime;
    }
    
    public void setCreatedTime(LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }
    
    public LocalDateTime getUpdatedTime() {
        return updatedTime;
    }
    
    public void setUpdatedTime(LocalDateTime updatedTime) {
        this.updatedTime = updatedTime;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public Integer getVersion() {
        return version;
    }
    
    public void setVersion(Integer version) {
        this.version = version;
    }
    
    @PrePersist
    protected void onCreate() {
        this.createdTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedTime = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "ServiceConfig{" +
                "id=" + id +
                ", feeCode='" + feeCode + '\'' +
                ", chineseName='" + chineseName + '\'' +
                ", englishName='" + englishName + '\'' +
                ", abbreviation='" + abbreviation + '\'' +
                ", feeCategory='" + feeCategory + '\'' +
                ", businessType='" + businessType + '\'' +
                ", standardRate=" + standardRate +
                ", unit='" + unit + '\'' +
                ", enabled=" + enabled +
                '}';
    }
}