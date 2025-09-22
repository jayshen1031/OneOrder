-- =====================================================
-- OneOrder系统借抬头记录功能增强SQL脚本
-- 补充expense_entries表缺失字段，使其完全符合PRD文档要求
-- =====================================================

-- 1. 补充默认法人字段 - 记录用户角色对应的默认法人
ALTER TABLE expense_entries 
ADD COLUMN default_entity_id VARCHAR(50) COMMENT '默认法人ID（用户角色对应的默认法人，用于记录差异）';

-- 2. 补充借抬头类型枚举字段 - 直接标记借抬头类型
ALTER TABLE expense_entries 
ADD COLUMN transit_type ENUM('RECEIVABLE_TRANSIT', 'PAYABLE_TRANSIT') NULL COMMENT '借抬头类型：收款借抬头/付款借抬头';

-- 3. 补充审批相关字段 - 完善审批记录
ALTER TABLE expense_entries 
ADD COLUMN approval_required BOOLEAN DEFAULT FALSE COMMENT '是否需要审批（借抬头等特殊情况）';

ALTER TABLE expense_entries 
ADD COLUMN approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NULL COMMENT '审批状态';

ALTER TABLE expense_entries 
ADD COLUMN approved_by VARCHAR(50) NULL COMMENT '审批人ID';

ALTER TABLE expense_entries 
ADD COLUMN approved_time TIMESTAMP NULL COMMENT '审批时间';

ALTER TABLE expense_entries 
ADD COLUMN approval_comment TEXT NULL COMMENT '审批意见';

-- 4. 添加索引优化查询性能
CREATE INDEX idx_expense_entries_transit ON expense_entries(is_transit_entity, transit_type);
CREATE INDEX idx_expense_entries_approval ON expense_entries(approval_required, approval_status);
CREATE INDEX idx_expense_entries_default_entity ON expense_entries(default_entity_id, our_entity_id);

-- 5. 添加约束确保数据一致性
-- 借抬头时必须指定借抬头类型
ALTER TABLE expense_entries 
ADD CONSTRAINT chk_transit_type_when_transit 
CHECK (
    (is_transit_entity = FALSE AND transit_type IS NULL) OR 
    (is_transit_entity = TRUE AND transit_type IS NOT NULL)
);

-- 需要审批时必须有审批状态
ALTER TABLE expense_entries 
ADD CONSTRAINT chk_approval_status_when_required 
CHECK (
    (approval_required = FALSE) OR 
    (approval_required = TRUE AND approval_status IS NOT NULL)
);

-- 审批通过时必须有审批人和时间
ALTER TABLE expense_entries 
ADD CONSTRAINT chk_approval_info_when_approved 
CHECK (
    (approval_status != 'APPROVED') OR 
    (approval_status = 'APPROVED' AND approved_by IS NOT NULL AND approved_time IS NOT NULL)
);

-- =====================================================
-- 数据更新 - 为现有数据补充默认值
-- =====================================================

-- 为现有记录补充默认法人（基于部门推断法人映射）
UPDATE expense_entries ee
SET default_entity_id = (
    CASE 
        WHEN ee.our_department_id = 'DEPT_SALES_SH' THEN 'ENTITY_SH_SALES'
        WHEN ee.our_department_id = 'DEPT_OPERATION_SH' THEN 'ENTITY_SH_OPERATION'
        WHEN ee.our_department_id = 'DEPT_SALES_BJ' THEN 'ENTITY_BJ_SALES'
        WHEN ee.our_department_id = 'DEPT_OPERATION_BJ' THEN 'ENTITY_BJ_OPERATION'
        WHEN ee.our_department_id LIKE '%SALES%' THEN 'ENTITY_CN_SALES'
        WHEN ee.our_department_id LIKE '%OPERATION%' THEN 'ENTITY_CN_OPERATION'
        ELSE 'ENTITY_CN_SALES' -- 默认销售法人
    END
)
WHERE default_entity_id IS NULL;

-- 为现有借抬头记录补充借抬头类型
UPDATE expense_entries 
SET transit_type = (
    CASE 
        WHEN entry_type = 'RECEIVABLE' THEN 'RECEIVABLE_TRANSIT'
        WHEN entry_type = 'PAYABLE' THEN 'PAYABLE_TRANSIT'
        ELSE NULL
    END
)
WHERE is_transit_entity = TRUE AND transit_type IS NULL;

-- 为大额借抬头记录标记需要审批
UPDATE expense_entries 
SET approval_required = TRUE,
    approval_status = 'APPROVED',
    approved_by = 'SYSTEM',
    approved_time = NOW(),
    approval_comment = '历史数据，系统自动审批通过'
WHERE is_transit_entity = TRUE 
  AND amount >= 50000  -- 5万以上需要审批
  AND approval_required IS NULL;

-- =====================================================
-- 创建视图便于查询借抬头差异
-- =====================================================

CREATE OR REPLACE VIEW v_expense_entry_transit_analysis AS
SELECT 
    ee.id,
    ee.order_id,
    ee.service_code,
    ee.fee_code,
    ee.entry_type,
    ee.amount,
    ee.currency,
    
    -- 法人信息
    ee.default_entity_id,
    ee.our_entity_id AS actual_entity_id,
    CASE 
        WHEN ee.default_entity_id != ee.our_entity_id THEN TRUE 
        ELSE FALSE 
    END AS has_entity_difference,
    
    -- 借抬头信息
    ee.is_transit_entity,
    ee.transit_type,
    ee.transit_reason,
    
    -- 审批信息
    ee.approval_required,
    ee.approval_status,
    ee.approved_by,
    ee.approved_time,
    ee.approval_comment,
    
    -- 关联信息
    de.entity_name AS default_entity_name,
    ae.entity_name AS actual_entity_name,
    
    ee.created_time,
    ee.created_by
FROM expense_entries ee
LEFT JOIN legal_entity de ON ee.default_entity_id = de.entity_id
LEFT JOIN legal_entity ae ON ee.our_entity_id = ae.entity_id;

-- =====================================================
-- 创建存储过程自动设置默认法人
-- =====================================================

DELIMITER $$

CREATE PROCEDURE sp_set_default_entity_for_user(
    IN p_user_id VARCHAR(50),
    IN p_department_id VARCHAR(50),
    OUT p_default_entity_id VARCHAR(50)
)
BEGIN
    -- 根据用户部门自动推断默认法人
    SELECT 
        CASE 
            WHEN p_department_id = 'DEPT_SALES_SH' THEN 'ENTITY_SH_SALES'
            WHEN p_department_id = 'DEPT_OPERATION_SH' THEN 'ENTITY_SH_OPERATION'
            WHEN p_department_id = 'DEPT_SALES_BJ' THEN 'ENTITY_BJ_SALES'
            WHEN p_department_id = 'DEPT_OPERATION_BJ' THEN 'ENTITY_BJ_OPERATION'
            WHEN p_department_id LIKE '%SALES%' THEN 'ENTITY_CN_SALES'
            WHEN p_department_id LIKE '%OPERATION%' THEN 'ENTITY_CN_OPERATION'
            ELSE 'ENTITY_CN_SALES'
        END 
    INTO p_default_entity_id;
END$$

DELIMITER ;

-- =====================================================
-- 数据验证查询
-- =====================================================

-- 验证所有记录都有默认法人
SELECT 
    '验证默认法人' AS check_type,
    COUNT(*) AS total_records,
    COUNT(default_entity_id) AS has_default_entity,
    COUNT(*) - COUNT(default_entity_id) AS missing_default_entity
FROM expense_entries;

-- 验证借抬头记录的类型标记
SELECT 
    '验证借抬头类型' AS check_type,
    COUNT(*) AS total_transit_records,
    COUNT(transit_type) AS has_transit_type,
    COUNT(*) - COUNT(transit_type) AS missing_transit_type
FROM expense_entries 
WHERE is_transit_entity = TRUE;

-- 验证法人差异记录
SELECT 
    '验证法人差异' AS check_type,
    COUNT(*) AS total_records,
    SUM(CASE WHEN default_entity_id != our_entity_id THEN 1 ELSE 0 END) AS has_difference,
    SUM(CASE WHEN default_entity_id = our_entity_id THEN 1 ELSE 0 END) AS no_difference
FROM expense_entries
WHERE default_entity_id IS NOT NULL AND our_entity_id IS NOT NULL;

-- =====================================================
-- 字段说明文档
-- =====================================================

/*
新增字段说明：

1. default_entity_id VARCHAR(50)
   - 作用：记录用户角色对应的默认法人
   - 用途：与our_entity_id对比，识别是否使用了借抬头
   - 填充：根据用户部门自动推断

2. transit_type ENUM('RECEIVABLE_TRANSIT', 'PAYABLE_TRANSIT')
   - 作用：直接标记借抬头类型
   - RECEIVABLE_TRANSIT: 收款借抬头
   - PAYABLE_TRANSIT: 付款借抬头
   - 约束：借抬头时必须指定类型

3. approval_* 字段组
   - approval_required: 是否需要审批
   - approval_status: 审批状态（待审批/已通过/已拒绝）
   - approved_by: 审批人
   - approved_time: 审批时间
   - approval_comment: 审批意见

数据一致性约束：
- 借抬头时必须指定类型
- 需要审批时必须有状态
- 审批通过时必须有审批人和时间

性能优化：
- 添加了3个复合索引
- 创建了分析视图
- 提供了存储过程自动设置默认法人
*/