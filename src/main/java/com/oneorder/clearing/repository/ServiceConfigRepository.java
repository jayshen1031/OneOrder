package com.oneorder.clearing.repository;

import com.oneorder.clearing.entity.ServiceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 服务配置数据访问接口
 */
@Repository
public interface ServiceConfigRepository extends JpaRepository<ServiceConfig, Long> {
    
    /**
     * 根据费用编码查找
     */
    Optional<ServiceConfig> findByFeeCode(String feeCode);
    
    /**
     * 根据业务类型查找启用的配置
     */
    List<ServiceConfig> findByBusinessTypeAndEnabledTrue(String businessType);
    
    /**
     * 根据费用分类查找启用的配置
     */
    List<ServiceConfig> findByFeeCategoryAndEnabledTrue(String feeCategory);
    
    /**
     * 根据相关服务查找启用的配置
     */
    List<ServiceConfig> findByRelatedServiceAndEnabledTrue(String relatedService);
    
    /**
     * 根据收付方向查找启用的配置
     */
    List<ServiceConfig> findByDirectionAndEnabledTrue(String direction);
    
    /**
     * 查找所有启用的配置
     */
    List<ServiceConfig> findByEnabledTrueOrderByFeeCodeAsc();
    
    /**
     * 根据供应商类型查找配置
     */
    List<ServiceConfig> findBySupplierTypeAndEnabledTrue(String supplierType);
    
    /**
     * 组合查询：业务类型+费用分类
     */
    @Query("SELECT sc FROM ServiceConfig sc WHERE " +
           "(:businessType IS NULL OR sc.businessType = :businessType) AND " +
           "(:feeCategory IS NULL OR sc.feeCategory = :feeCategory) AND " +
           "sc.enabled = true ORDER BY sc.feeCode ASC")
    List<ServiceConfig> findByBusinessTypeAndFeeCategory(
            @Param("businessType") String businessType,
            @Param("feeCategory") String feeCategory);
    
    /**
     * 获取所有费用分类
     */
    @Query("SELECT DISTINCT sc.feeCategory FROM ServiceConfig sc WHERE sc.enabled = true ORDER BY sc.feeCategory")
    List<String> findAllFeeCategoriesEnabled();
    
    /**
     * 获取所有业务类型
     */
    @Query("SELECT DISTINCT sc.businessType FROM ServiceConfig sc WHERE sc.enabled = true ORDER BY sc.businessType")
    List<String> findAllBusinessTypesEnabled();
    
    /**
     * 获取所有相关服务
     */
    @Query("SELECT DISTINCT sc.relatedService FROM ServiceConfig sc WHERE sc.enabled = true ORDER BY sc.relatedService")
    List<String> findAllRelatedServicesEnabled();
    
    /**
     * 获取所有供应商类型
     */
    @Query("SELECT DISTINCT sc.supplierType FROM ServiceConfig sc WHERE sc.enabled = true ORDER BY sc.supplierType")
    List<String> findAllSupplierTypesEnabled();
    
    /**
     * 按费用分类分组统计
     */
    @Query("SELECT sc.feeCategory, COUNT(sc) FROM ServiceConfig sc WHERE sc.enabled = true GROUP BY sc.feeCategory ORDER BY sc.feeCategory")
    List<Object[]> countByFeeCategory();
    
    /**
     * 按业务类型分组统计
     */
    @Query("SELECT sc.businessType, COUNT(sc) FROM ServiceConfig sc WHERE sc.enabled = true GROUP BY sc.businessType ORDER BY sc.businessType")
    List<Object[]> countByBusinessType();
    
    /**
     * 查找中文名称包含关键字的配置
     */
    @Query("SELECT sc FROM ServiceConfig sc WHERE " +
           "sc.chineseName LIKE %:keyword% AND sc.enabled = true ORDER BY sc.feeCode ASC")
    List<ServiceConfig> findByChineseNameContaining(@Param("keyword") String keyword);
    
    /**
     * 查找英文名称包含关键字的配置
     */
    @Query("SELECT sc FROM ServiceConfig sc WHERE " +
           "sc.englishName LIKE %:keyword% AND sc.enabled = true ORDER BY sc.feeCode ASC")
    List<ServiceConfig> findByEnglishNameContaining(@Param("keyword") String keyword);
    
    /**
     * 多关键字搜索（中英文名称、费用编码、助记符）
     */
    @Query("SELECT sc FROM ServiceConfig sc WHERE " +
           "(sc.chineseName LIKE %:keyword% OR " +
           "sc.englishName LIKE %:keyword% OR " +
           "sc.feeCode LIKE %:keyword% OR " +
           "sc.abbreviation LIKE %:keyword%) AND " +
           "sc.enabled = true ORDER BY sc.feeCode ASC")
    List<ServiceConfig> searchByKeyword(@Param("keyword") String keyword);
}