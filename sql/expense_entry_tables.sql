-- =====================================================
-- OneOrder录费模块数据库表结构
-- 版本: v3.0
-- 创建日期: 2025-09-20
-- 说明: 实现完整的费用明细录入和管理功能
-- =====================================================

-- 1. 费用明细表(expense_entries)
CREATE TABLE IF NOT EXISTS expense_entries (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    service_code VARCHAR(50) NOT NULL,  -- 服务项目编码
    fee_code VARCHAR(50) NOT NULL,      -- 费用科目编码
    entry_type VARCHAR(10) NOT NULL,    -- 收付类型: RECEIVABLE/PAYABLE
    counterpart_entity VARCHAR(200) NOT NULL,    -- 对方法人公司
    counterpart_department VARCHAR(100), -- 对方部门
    counterpart_supplier_type VARCHAR(50), -- 对方供应商类型(付款时)
    our_entity_id VARCHAR(50) NOT NULL, -- 我方法人ID
    our_department_id VARCHAR(50) NOT NULL, -- 我方部门ID
    amount DECIMAL(15,2) NOT NULL,      -- 金额
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY', -- 币种
    is_transit_entity BOOLEAN DEFAULT FALSE, -- 是否借抬头
    transit_reason VARCHAR(500),        -- 借抬头原因
    validation_status VARCHAR(20) DEFAULT 'VALID', -- 校验状态
    validation_message VARCHAR(500),    -- 校验提示信息
    created_by VARCHAR(50) NOT NULL,    -- 录入人
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    entry_status VARCHAR(20) DEFAULT 'DRAFT', -- 明细状态: DRAFT/CONFIRMED/LOCKED
    version_number INTEGER DEFAULT 1,   -- 版本号
    remarks VARCHAR(500)                -- 备注信息
);

-- 费用明细表索引
CREATE INDEX IF NOT EXISTS idx_expense_entries_order_service ON expense_entries(order_id, service_code);
CREATE INDEX IF NOT EXISTS idx_expense_entries_type ON expense_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_expense_entries_created_by ON expense_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_entries_status ON expense_entries(entry_status);
CREATE INDEX IF NOT EXISTS idx_expense_entries_created_time ON expense_entries(created_time);

-- 2. 费用科目服务约束表(fee_service_constraints)
CREATE TABLE IF NOT EXISTS fee_service_constraints (
    id BIGSERIAL PRIMARY KEY,
    fee_code VARCHAR(50) NOT NULL,      -- 费用科目编码
    service_code VARCHAR(50) NOT NULL,  -- 适用服务编码
    constraint_type VARCHAR(20) DEFAULT 'ALLOWED', -- 约束类型: ALLOWED/FORBIDDEN/WARNING
    constraint_level VARCHAR(20) DEFAULT 'STRICT', -- 约束级别: STRICT/WARNING/SUGGESTION
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'SYSTEM',
    is_active BOOLEAN DEFAULT TRUE,     -- 是否激活
    priority INTEGER DEFAULT 1,        -- 优先级
    description VARCHAR(200)            -- 约束描述
);

-- 费用科目服务约束唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS uk_fee_service_constraints ON fee_service_constraints(fee_code, service_code) WHERE is_active = TRUE;

-- 3. 费用科目供应商约束表(fee_supplier_constraints)  
CREATE TABLE IF NOT EXISTS fee_supplier_constraints (
    id BIGSERIAL PRIMARY KEY,
    fee_code VARCHAR(50) NOT NULL,      -- 费用科目编码
    supplier_type VARCHAR(50) NOT NULL, -- 适用供应商类型
    constraint_type VARCHAR(20) DEFAULT 'ALLOWED', -- 约束类型: ALLOWED/FORBIDDEN/WARNING
    constraint_level VARCHAR(20) DEFAULT 'STRICT', -- 约束级别: STRICT/WARNING/SUGGESTION
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'SYSTEM',
    is_active BOOLEAN DEFAULT TRUE,     -- 是否激活
    priority INTEGER DEFAULT 1,        -- 优先级
    description VARCHAR(200)            -- 约束描述
);

-- 费用科目供应商约束唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS uk_fee_supplier_constraints ON fee_supplier_constraints(fee_code, supplier_type) WHERE is_active = TRUE;

-- 4. 录费状态管理表(expense_entry_status)
CREATE TABLE IF NOT EXISTS expense_entry_status (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    entry_status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',  -- 录费状态: IN_PROGRESS/COMPLETED/LOCKED
    receivable_count INTEGER DEFAULT 0, -- 收款明细数量
    payable_count INTEGER DEFAULT 0,    -- 付款明细数量
    total_receivable DECIMAL(15,2) DEFAULT 0, -- 收款总额
    total_payable DECIMAL(15,2) DEFAULT 0,    -- 付款总额
    receivable_currency VARCHAR(10) DEFAULT 'CNY', -- 收款币种
    payable_currency VARCHAR(10) DEFAULT 'CNY',    -- 付款币种
    last_modified_by VARCHAR(50),
    last_modified_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_time TIMESTAMP,           -- 录费完成时间
    completed_by VARCHAR(50),           -- 完成人
    locked_time TIMESTAMP,              -- 锁定时间
    locked_by VARCHAR(50),              -- 锁定人
    lock_reason VARCHAR(200),           -- 锁定原因
    validation_passed BOOLEAN DEFAULT FALSE, -- 是否通过校验
    can_start_profit_sharing BOOLEAN DEFAULT FALSE, -- 可否开始分润
    can_start_clearing BOOLEAN DEFAULT FALSE        -- 可否开始清分
);

-- 录费状态管理表唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS uk_expense_entry_status_order ON expense_entry_status(order_id);

-- 5. 费用明细变更历史表(expense_entry_history)
CREATE TABLE IF NOT EXISTS expense_entry_history (
    id BIGSERIAL PRIMARY KEY,
    entry_id BIGINT NOT NULL,           -- 费用明细ID
    order_id VARCHAR(50) NOT NULL,
    change_type VARCHAR(20) NOT NULL,   -- 变更类型: CREATE/UPDATE/DELETE/STATUS_CHANGE
    old_values JSON,                    -- 变更前数据
    new_values JSON,                    -- 变更后数据
    changed_fields TEXT[],              -- 变更字段列表
    change_reason VARCHAR(200),         -- 变更原因
    changed_by VARCHAR(50) NOT NULL,    -- 变更人
    changed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,                    -- 操作IP地址
    user_agent VARCHAR(500)             -- 用户代理
);

-- 费用明细变更历史索引
CREATE INDEX IF NOT EXISTS idx_expense_entry_history_entry_id ON expense_entry_history(entry_id);
CREATE INDEX IF NOT EXISTS idx_expense_entry_history_order_id ON expense_entry_history(order_id);
CREATE INDEX IF NOT EXISTS idx_expense_entry_history_changed_by ON expense_entry_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_expense_entry_history_changed_time ON expense_entry_history(changed_time);

-- 6. 供应商主数据表(suppliers) - 用于供应商类型校验
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) NOT NULL UNIQUE, -- 供应商编码
    supplier_name VARCHAR(200) NOT NULL,       -- 供应商名称
    supplier_type VARCHAR(50) NOT NULL,        -- 供应商类型
    legal_entity_name VARCHAR(200),            -- 法人名称
    business_license VARCHAR(50),              -- 营业执照号
    tax_number VARCHAR(50),                    -- 税号
    contact_person VARCHAR(100),               -- 联系人
    contact_phone VARCHAR(50),                 -- 联系电话
    contact_email VARCHAR(100),                -- 联系邮箱
    address VARCHAR(500),                      -- 地址
    is_active BOOLEAN DEFAULT TRUE,            -- 是否激活
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_time TIMESTAMP,
    updated_by VARCHAR(50),
    remarks VARCHAR(500)                       -- 备注
);

-- 供应商主数据索引
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- 7. 费用科目主数据扩展表(fee_codes_extended)
CREATE TABLE IF NOT EXISTS fee_codes_extended (
    id BIGSERIAL PRIMARY KEY,
    fee_code VARCHAR(50) NOT NULL UNIQUE,  -- 费用科目编码
    fee_name VARCHAR(100) NOT NULL,        -- 费用科目名称
    fee_category VARCHAR(50),              -- 费用类别
    fee_type VARCHAR(20),                  -- 费用类型: INCOME/EXPENSE
    default_currency VARCHAR(10) DEFAULT 'CNY', -- 默认币种
    min_amount DECIMAL(15,2),              -- 最小金额
    max_amount DECIMAL(15,2),              -- 最大金额
    requires_approval BOOLEAN DEFAULT FALSE, -- 是否需要审批
    approval_threshold DECIMAL(15,2),     -- 审批阈值
    is_transit_allowed BOOLEAN DEFAULT TRUE, -- 是否允许借抬头
    auto_suggest_service BOOLEAN DEFAULT TRUE, -- 是否自动建议服务
    is_active BOOLEAN DEFAULT TRUE,        -- 是否激活
    sort_order INTEGER DEFAULT 1,         -- 排序
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'SYSTEM',
    updated_time TIMESTAMP,
    updated_by VARCHAR(50),
    description VARCHAR(500)               -- 描述
);

-- 费用科目扩展表索引
CREATE INDEX IF NOT EXISTS idx_fee_codes_extended_category ON fee_codes_extended(fee_category);
CREATE INDEX IF NOT EXISTS idx_fee_codes_extended_type ON fee_codes_extended(fee_type);
CREATE INDEX IF NOT EXISTS idx_fee_codes_extended_active ON fee_codes_extended(is_active);

-- =====================================================
-- 初始化基础数据
-- =====================================================

-- 初始化常用供应商类型
INSERT INTO suppliers (supplier_code, supplier_name, supplier_type, legal_entity_name, is_active) VALUES
('SUP001', '中远海运集装箱运输有限公司', 'SHIPPING_COMPANY', '中远海运集装箱运输有限公司', TRUE),
('SUP002', '上海外高桥集装箱码头有限公司', 'TERMINAL', '上海外高桥集装箱码头有限公司', TRUE),
('SUP003', '上海海关', 'CUSTOMS', '中华人民共和国上海海关', TRUE),
('SUP004', '中国外运华东有限公司', 'FREIGHT_FORWARDER', '中国外运华东有限公司', TRUE),
('SUP005', '上海振华重工集团', 'EQUIPMENT_PROVIDER', '上海振华重工（集团）股份有限公司', TRUE),
('SUP006', '招商局物流集团', 'LOGISTICS_PROVIDER', '招商局物流集团有限公司', TRUE),
('SUP007', '中检集团上海公司', 'INSPECTION_COMPANY', '中国检验认证集团上海有限公司', TRUE),
('SUP008', '德邦物流股份有限公司', 'INLAND_TRANSPORT', '德邦物流股份有限公司', TRUE)
ON CONFLICT (supplier_code) DO NOTHING;

-- 初始化费用科目扩展信息
INSERT INTO fee_codes_extended (fee_code, fee_name, fee_category, fee_type, default_currency, is_active) VALUES
('FCL001', '海运费', '跨境运输费用', 'EXPENSE', 'USD', TRUE),
('FCL002', '码头操作费', '码头港口场站费用', 'EXPENSE', 'CNY', TRUE),
('FCL003', '报关费', '单证文件费用', 'EXPENSE', 'CNY', TRUE),
('FCL004', '内装费', '集装箱费用', 'EXPENSE', 'CNY', TRUE),
('FCL005', '拖车费', '境内运输费用', 'EXPENSE', 'CNY', TRUE),
('FCL006', '订舱费', '单证文件费用', 'EXPENSE', 'CNY', TRUE),
('FCL007', '换单费', '单证文件费用', 'EXPENSE', 'CNY', TRUE),
('FCL008', '查验费', '关检费用', 'EXPENSE', 'CNY', TRUE)
ON CONFLICT (fee_code) DO NOTHING;

-- 初始化费用科目服务约束关系（基于OneOrder费用科目梳理）
INSERT INTO fee_service_constraints (fee_code, service_code, constraint_type, constraint_level, description) VALUES
-- 海运费适用服务
('FCL001', 'MBL_PROCESSING', 'ALLOWED', 'STRICT', '海运费适用于MBL处理服务'),
('FCL001', 'BOOKING', 'ALLOWED', 'STRICT', '海运费适用于订舱服务'),
('FCL001', 'VESSEL_MANIFEST', 'ALLOWED', 'WARNING', '海运费适用于舱单服务'),
-- 码头操作费适用服务
('FCL002', 'TERMINAL_HANDLING', 'ALLOWED', 'STRICT', '码头操作费适用于码头操作服务'),
('FCL002', 'CONTAINER_LOADING', 'ALLOWED', 'STRICT', '码头操作费适用于内装服务'),
-- 报关费适用服务
('FCL003', 'CUSTOMS_DECLARATION', 'ALLOWED', 'STRICT', '报关费适用于报关服务'),
('FCL003', 'CUSTOMS_CLEARANCE', 'ALLOWED', 'STRICT', '报关费适用于清关服务'),
-- 内装费适用服务
('FCL004', 'CONTAINER_LOADING', 'ALLOWED', 'STRICT', '内装费适用于内装服务'),
('FCL004', 'CARGO_LOADING', 'ALLOWED', 'STRICT', '内装费适用于装货服务'),
-- 拖车费适用服务
('FCL005', 'INLAND_TRANSPORT', 'ALLOWED', 'STRICT', '拖车费适用于内陆运输服务'),
('FCL005', 'TRANSPORTATION', 'ALLOWED', 'STRICT', '拖车费适用于运输服务'),
-- 订舱费适用服务
('FCL006', 'BOOKING', 'ALLOWED', 'STRICT', '订舱费适用于订舱服务'),
-- 换单费适用服务
('FCL007', 'DOCUMENT_EXCHANGE', 'ALLOWED', 'STRICT', '换单费适用于换单服务'),
('FCL007', 'HBL_PROCESSING', 'ALLOWED', 'WARNING', '换单费适用于HBL处理服务'),
-- 查验费适用服务
('FCL008', 'CUSTOMS_INSPECTION', 'ALLOWED', 'STRICT', '查验费适用于海关查验服务'),
('FCL008', 'CARGO_INSPECTION', 'ALLOWED', 'STRICT', '查验费适用于货物查验服务')
ON CONFLICT DO NOTHING;

-- 初始化费用科目供应商约束关系
INSERT INTO fee_supplier_constraints (fee_code, supplier_type, constraint_type, constraint_level, description) VALUES
-- 海运费供应商类型约束
('FCL001', 'SHIPPING_COMPANY', 'ALLOWED', 'STRICT', '海运费适用于船公司'),
('FCL001', 'FREIGHT_FORWARDER', 'ALLOWED', 'WARNING', '海运费适用于货代公司'),
-- 码头操作费供应商类型约束
('FCL002', 'TERMINAL', 'ALLOWED', 'STRICT', '码头操作费适用于码头公司'),
('FCL002', 'EQUIPMENT_PROVIDER', 'ALLOWED', 'WARNING', '码头操作费适用于设备供应商'),
-- 报关费供应商类型约束
('FCL003', 'CUSTOMS', 'ALLOWED', 'STRICT', '报关费适用于海关'),
('FCL003', 'CUSTOMS_BROKER', 'ALLOWED', 'STRICT', '报关费适用于报关行'),
-- 内装费供应商类型约束
('FCL004', 'TERMINAL', 'ALLOWED', 'STRICT', '内装费适用于码头公司'),
('FCL004', 'LOGISTICS_PROVIDER', 'ALLOWED', 'STRICT', '内装费适用于物流公司'),
-- 拖车费供应商类型约束
('FCL005', 'INLAND_TRANSPORT', 'ALLOWED', 'STRICT', '拖车费适用于内陆运输公司'),
('FCL005', 'LOGISTICS_PROVIDER', 'ALLOWED', 'WARNING', '拖车费适用于物流公司'),
-- 订舱费供应商类型约束
('FCL006', 'SHIPPING_COMPANY', 'ALLOWED', 'STRICT', '订舱费适用于船公司'),
('FCL006', 'FREIGHT_FORWARDER', 'ALLOWED', 'WARNING', '订舱费适用于货代公司'),
-- 换单费供应商类型约束
('FCL007', 'SHIPPING_COMPANY', 'ALLOWED', 'STRICT', '换单费适用于船公司'),
('FCL007', 'FREIGHT_FORWARDER', 'ALLOWED', 'WARNING', '换单费适用于货代公司'),
-- 查验费供应商类型约束
('FCL008', 'CUSTOMS', 'ALLOWED', 'STRICT', '查验费适用于海关'),
('FCL008', 'INSPECTION_COMPANY', 'ALLOWED', 'STRICT', '查验费适用于检验公司')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 创建视图和函数
-- =====================================================

-- 创建费用明细详情视图
CREATE OR REPLACE VIEW v_expense_entry_details AS
SELECT 
    ee.id,
    ee.order_id,
    ee.service_code,
    sc.service_name,
    ee.fee_code,
    fce.fee_name,
    fce.fee_category,
    ee.entry_type,
    CASE 
        WHEN ee.entry_type = 'RECEIVABLE' THEN '收款'
        WHEN ee.entry_type = 'PAYABLE' THEN '付款'
        ELSE ee.entry_type
    END as entry_type_name,
    ee.counterpart_entity,
    ee.counterpart_department,
    ee.counterpart_supplier_type,
    ee.our_entity_id,
    le.entity_name as our_entity_name,
    ee.our_department_id,
    d.department_name as our_department_name,
    ee.amount,
    ee.currency,
    ee.is_transit_entity,
    ee.transit_reason,
    ee.validation_status,
    ee.validation_message,
    ee.entry_status,
    CASE 
        WHEN ee.entry_status = 'DRAFT' THEN '草稿'
        WHEN ee.entry_status = 'CONFIRMED' THEN '已确认'
        WHEN ee.entry_status = 'LOCKED' THEN '已锁定'
        ELSE ee.entry_status
    END as entry_status_name,
    ee.created_by,
    ee.created_time,
    ee.updated_by,
    ee.updated_time,
    ee.version_number,
    ee.remarks
FROM expense_entries ee
LEFT JOIN service_config sc ON ee.service_code = sc.service_code
LEFT JOIN fee_codes_extended fce ON ee.fee_code = fce.fee_code
LEFT JOIN legal_entity le ON ee.our_entity_id = le.entity_id
LEFT JOIN department d ON ee.our_department_id = d.department_id;

-- 创建计算订单费用统计的函数
CREATE OR REPLACE FUNCTION calculate_order_expense_summary(p_order_id VARCHAR(50))
RETURNS TABLE (
    order_id VARCHAR(50),
    receivable_count BIGINT,
    payable_count BIGINT,
    total_receivable DECIMAL(15,2),
    total_payable DECIMAL(15,2),
    net_amount DECIMAL(15,2),
    service_count BIGINT,
    fee_category_count BIGINT,
    last_entry_time TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_order_id as order_id,
        COUNT(*) FILTER (WHERE ee.entry_type = 'RECEIVABLE') as receivable_count,
        COUNT(*) FILTER (WHERE ee.entry_type = 'PAYABLE') as payable_count,
        COALESCE(SUM(ee.amount) FILTER (WHERE ee.entry_type = 'RECEIVABLE'), 0) as total_receivable,
        COALESCE(SUM(ee.amount) FILTER (WHERE ee.entry_type = 'PAYABLE'), 0) as total_payable,
        COALESCE(SUM(ee.amount) FILTER (WHERE ee.entry_type = 'RECEIVABLE'), 0) - 
        COALESCE(SUM(ee.amount) FILTER (WHERE ee.entry_type = 'PAYABLE'), 0) as net_amount,
        COUNT(DISTINCT ee.service_code) as service_count,
        COUNT(DISTINCT fce.fee_category) as fee_category_count,
        MAX(ee.created_time) as last_entry_time
    FROM expense_entries ee
    LEFT JOIN fee_codes_extended fce ON ee.fee_code = fce.fee_code
    WHERE ee.order_id = p_order_id
    GROUP BY p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON TABLE expense_entries IS '费用明细表：记录所有外部收付费用明细';
COMMENT ON TABLE fee_service_constraints IS '费用科目服务约束表：定义费用科目的适用服务范围';
COMMENT ON TABLE fee_supplier_constraints IS '费用科目供应商约束表：定义费用科目的适用供应商类型';
COMMENT ON TABLE expense_entry_status IS '录费状态管理表：跟踪订单的录费进度和状态';
COMMENT ON TABLE expense_entry_history IS '费用明细变更历史表：记录所有费用明细的变更历史';
COMMENT ON TABLE suppliers IS '供应商主数据表：管理供应商基础信息';
COMMENT ON TABLE fee_codes_extended IS '费用科目主数据扩展表：扩展费用科目的详细信息';

-- 创建触发器函数：自动更新录费状态
CREATE OR REPLACE FUNCTION update_expense_entry_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 当费用明细发生变化时，更新录费状态表
    INSERT INTO expense_entry_status (order_id)
    VALUES (COALESCE(NEW.order_id, OLD.order_id))
    ON CONFLICT (order_id) DO NOTHING;
    
    -- 重新计算统计数据
    UPDATE expense_entry_status 
    SET 
        receivable_count = summary.receivable_count,
        payable_count = summary.payable_count,
        total_receivable = summary.total_receivable,
        total_payable = summary.total_payable,
        last_modified_time = CURRENT_TIMESTAMP
    FROM calculate_order_expense_summary(COALESCE(NEW.order_id, OLD.order_id)) summary
    WHERE expense_entry_status.order_id = summary.order_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS tr_expense_entries_status_update ON expense_entries;
CREATE TRIGGER tr_expense_entries_status_update
    AFTER INSERT OR UPDATE OR DELETE ON expense_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_entry_status();

-- 完成表结构创建
COMMIT;