package com.oneorder.clearing.entity;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 基础实体类，包含通用字段
 */
@MappedSuperclass
@Data
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    
    /**
     * 创建时间
     */
    @CreatedDate
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    /**
     * 更新时间
     */
    @LastModifiedDate
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    /**
     * 创建人
     */
    @Column(name = "created_by", length = 50)
    private String createdBy;
    
    /**
     * 更新人
     */
    @Column(name = "updated_by", length = 50)
    private String updatedBy;
    
    /**
     * 版本号（乐观锁）
     */
    @Version
    @Column(name = "version")
    private Long version;
}