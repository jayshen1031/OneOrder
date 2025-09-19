-- OneOrder录费模块数据表设计
-- 创建时间: 2025-09-16
-- 版本: v1.0
-- 说明: 支持费用明细录入、费用科目约束校验、借抬头处理等功能

-- ===================================
-- 1. 费用明细表(expense_entries)
-- ===================================
CREATE TABLE expense_entries (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    service_code VARCHAR(50) NOT NULL,        -- 服务项目编码
    fee_code VARCHAR(50) NOT NULL,            -- 费用科目编码
    entry_type VARCHAR(10) NOT NULL,          -- 收付类型: RECEIVABLE/PAYABLE
    counterpart_entity VARCHAR(200) NOT NULL, -- 对方法人公司
    counterpart_department VARCHAR(100),      -- 对方部门
    counterpart_supplier_type VARCHAR(50),    -- 对方供应商类型(付款时)
    our_entity_id VARCHAR(50) NOT NULL,       -- 我方法人ID
    our_department_id VARCHAR(50) NOT NULL,   -- 我方部门ID
    amount DECIMAL(15,2) NOT NULL,            -- 金额
    currency VARCHAR(10) NOT NULL,            -- 币种
    is_transit_entity BOOLEAN DEFAULT FALSE,  -- 是否借抬头
    transit_reason VARCHAR(500),              -- 借抬头原因
    validation_status VARCHAR(20) DEFAULT 'VALID', -- 校验状态: VALID/WARNING/ERROR
    validation_message VARCHAR(500),          -- 校验提示信息
    created_by VARCHAR(50) NOT NULL,          -- 录入人
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    entry_status VARCHAR(20) DEFAULT 'DRAFT', -- 明细状态: DRAFT/CONFIRMED/LOCKED
    
    -- 约束条件
    CONSTRAINT chk_entry_type CHECK (entry_type IN ('RECEIVABLE', 'PAYABLE')),
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_validation_status CHECK (validation_status IN ('VALID', 'WARNING', 'ERROR')),
    CONSTRAINT chk_entry_status CHECK (entry_status IN ('DRAFT', 'CONFIRMED', 'LOCKED'))
);

-- 创建索引
CREATE INDEX idx_expense_entries_order_id ON expense_entries(order_id);
CREATE INDEX idx_expense_entries_service_code ON expense_entries(service_code);
CREATE INDEX idx_expense_entries_fee_code ON expense_entries(fee_code);
CREATE INDEX idx_expense_entries_entry_type ON expense_entries(entry_type);
CREATE INDEX idx_expense_entries_created_by ON expense_entries(created_by);
CREATE INDEX idx_expense_entries_order_service ON expense_entries(order_id, service_code);

-- ===================================
-- 2. 费用科目服务约束表(fee_service_constraints)
-- ===================================
CREATE TABLE fee_service_constraints (
    id BIGSERIAL PRIMARY KEY,
    fee_code VARCHAR(50) NOT NULL,            -- 费用科目编码
    service_code VARCHAR(50) NOT NULL,        -- 适用服务编码
    constraint_type VARCHAR(20) DEFAULT 'ALLOWED', -- 约束类型: ALLOWED/FORBIDDEN/PREFERRED
    priority INTEGER DEFAULT 0,               -- 优先级(越高越优先)
    description VARCHAR(200),                 -- 约束描述
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_constraint_type CHECK (constraint_type IN ('ALLOWED', 'FORBIDDEN', 'PREFERRED')),
    UNIQUE (fee_code, service_code)
);

-- 创建索引
CREATE INDEX idx_fee_service_constraints_fee_code ON fee_service_constraints(fee_code);
CREATE INDEX idx_fee_service_constraints_service_code ON fee_service_constraints(service_code);

-- ===================================
-- 3. 费用科目供应商约束表(fee_supplier_constraints)
-- ===================================
CREATE TABLE fee_supplier_constraints (
    id BIGSERIAL PRIMARY KEY,
    fee_code VARCHAR(50) NOT NULL,            -- 费用科目编码
    supplier_type VARCHAR(50) NOT NULL,       -- 适用供应商类型
    constraint_type VARCHAR(20) DEFAULT 'ALLOWED', -- 约束类型: ALLOWED/FORBIDDEN/PREFERRED
    priority INTEGER DEFAULT 0,               -- 优先级
    description VARCHAR(200),                 -- 约束描述
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_supplier_constraint_type CHECK (constraint_type IN ('ALLOWED', 'FORBIDDEN', 'PREFERRED')),
    UNIQUE (fee_code, supplier_type)
);

-- 创建索引
CREATE INDEX idx_fee_supplier_constraints_fee_code ON fee_supplier_constraints(fee_code);
CREATE INDEX idx_fee_supplier_constraints_supplier_type ON fee_supplier_constraints(supplier_type);

-- ===================================
-- 4. 录费状态管理表(expense_entry_status)
-- ===================================
CREATE TABLE expense_entry_status (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    entry_status VARCHAR(20) NOT NULL,        -- 录费状态: IN_PROGRESS/COMPLETED/LOCKED
    receivable_count INTEGER DEFAULT 0,       -- 收款明细数量
    payable_count INTEGER DEFAULT 0,          -- 付款明细数量
    total_receivable DECIMAL(15,2) DEFAULT 0, -- 收款总额
    total_payable DECIMAL(15,2) DEFAULT 0,    -- 付款总额
    last_modified_by VARCHAR(50),
    last_modified_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_time TIMESTAMP,                 -- 录费完成时间
    locked_time TIMESTAMP,                    -- 锁定时间
    completion_remarks VARCHAR(500),          -- 完成备注
    
    -- 约束条件
    CONSTRAINT chk_expense_entry_status CHECK (entry_status IN ('IN_PROGRESS', 'COMPLETED', 'LOCKED')),
    UNIQUE (order_id)
);

-- 创建索引
CREATE INDEX idx_expense_entry_status_order_id ON expense_entry_status(order_id);
CREATE INDEX idx_expense_entry_status_entry_status ON expense_entry_status(entry_status);

-- ===================================
-- 5. 法人实体表(legal_entities) - 支持借抬头
-- ===================================
CREATE TABLE legal_entities (
    id BIGSERIAL PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,           -- 法人实体ID
    entity_name VARCHAR(200) NOT NULL,        -- 法人实体名称
    entity_code VARCHAR(50),                  -- 法人实体编码
    entity_type VARCHAR(20),                  -- 实体类型: SUBSIDIARY/BRANCH/PARTNER
    tax_number VARCHAR(50),                   -- 税号
    registered_address VARCHAR(500),          -- 注册地址
    business_scope VARCHAR(1000),             -- 经营范围
    status VARCHAR(20) DEFAULT 'ACTIVE',      -- 状态: ACTIVE/INACTIVE
    can_receive BOOLEAN DEFAULT TRUE,         -- 是否可收款
    can_pay BOOLEAN DEFAULT TRUE,             -- 是否可付款
    is_transit_entity BOOLEAN DEFAULT FALSE,  -- 是否可作为借抬头
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_entity_type CHECK (entity_type IN ('SUBSIDIARY', 'BRANCH', 'PARTNER')),
    CONSTRAINT chk_legal_entity_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    UNIQUE (entity_id)
);

-- 创建索引
CREATE INDEX idx_legal_entities_entity_id ON legal_entities(entity_id);
CREATE INDEX idx_legal_entities_entity_type ON legal_entities(entity_type);
CREATE INDEX idx_legal_entities_status ON legal_entities(status);

-- ===================================
-- 初始化基础数据
-- ===================================

-- 法人实体基础数据
INSERT INTO legal_entities (entity_id, entity_name, entity_type, can_receive, can_pay, is_transit_entity) VALUES
('HCBD_SHANGHAI', '海程邦达物流(上海)有限公司', 'SUBSIDIARY', TRUE, TRUE, FALSE),
('HCBD_BEIJING', '海程邦达物流(北京)有限公司', 'SUBSIDIARY', TRUE, TRUE, FALSE),
('HCBD_SHENZHEN', '海程邦达物流(深圳)有限公司', 'SUBSIDIARY', TRUE, TRUE, FALSE),
('HCBD_HONGKONG', '海程邦达物流(香港)有限公司', 'SUBSIDIARY', TRUE, TRUE, TRUE),
('HCBD_SINGAPORE', '海程邦达物流(新加坡)有限公司', 'SUBSIDIARY', TRUE, TRUE, TRUE);

-- 费用科目服务约束基础数据(基于188个费用科目)
INSERT INTO fee_service_constraints (fee_code, service_code, constraint_type, priority, description) VALUES
-- 海运费约束
('FCL001', 'MBL_PROCESSING', 'ALLOWED', 10, '海运费适用于MBL处理服务'),
('FCL001', 'BOOKING', 'ALLOWED', 9, '海运费适用于订舱服务'),
('FCL001', 'VESSEL_MANIFEST', 'ALLOWED', 8, '海运费适用于舱单服务'),
-- THC约束  
('THC001', 'TERMINAL_HANDLING', 'ALLOWED', 10, 'THC费用适用于码头操作服务'),
('THC001', 'CONTAINER_HANDLING', 'ALLOWED', 9, 'THC费用适用于集装箱处理'),
-- 报关费约束
('CUSTOMS001', 'CUSTOMS_DECLARATION', 'ALLOWED', 10, '报关费适用于报关服务'),
('CUSTOMS001', 'CUSTOMS_CLEARANCE', 'ALLOWED', 9, '报关费适用于清关服务'),
-- 拖车费约束
('TRUCKING001', 'INLAND_TRANSPORT', 'ALLOWED', 10, '拖车费适用于境内运输服务'),
('TRUCKING001', 'PICKUP_DELIVERY', 'ALLOWED', 9, '拖车费适用于提货派送服务');

-- 费用科目供应商约束基础数据
INSERT INTO fee_supplier_constraints (fee_code, supplier_type, constraint_type, priority, description) VALUES
-- 海运费供应商约束
('FCL001', 'SHIPPING_COMPANY', 'ALLOWED', 10, '海运费供应商为船公司'),
('FCL001', 'FREIGHT_FORWARDER', 'ALLOWED', 8, '海运费供应商可为货代公司'),
-- THC供应商约束
('THC001', 'TERMINAL_OPERATOR', 'ALLOWED', 10, 'THC费用供应商为码头运营商'),
('THC001', 'PORT_AUTHORITY', 'ALLOWED', 9, 'THC费用供应商为港务局'),
-- 报关费供应商约束
('CUSTOMS001', 'CUSTOMS_BROKER', 'ALLOWED', 10, '报关费供应商为报关行'),
('CUSTOMS001', 'FREIGHT_FORWARDER', 'ALLOWED', 8, '报关费供应商可为货代公司'),
-- 拖车费供应商约束
('TRUCKING001', 'TRUCKING_COMPANY', 'ALLOWED', 10, '拖车费供应商为拖车公司'),
('TRUCKING001', 'LOGISTICS_PROVIDER', 'ALLOWED', 8, '拖车费供应商为物流服务商');

-- 录费状态初始化数据
INSERT INTO expense_entry_status (order_id, entry_status, last_modified_by) VALUES
('HCBD20250916001', 'IN_PROGRESS', 'system'),
('HCBD20250916002', 'IN_PROGRESS', 'system'),
('HCBD20250916003', 'IN_PROGRESS', 'system');

-- ===================================
-- 视图和存储过程
-- ===================================

-- 费用明细汇总视图
CREATE VIEW expense_entries_summary AS
SELECT 
    e.order_id,
    e.entry_type,
    COUNT(*) as entry_count,
    SUM(e.amount) as total_amount,
    e.currency,
    COUNT(CASE WHEN e.validation_status = 'ERROR' THEN 1 END) as error_count,
    COUNT(CASE WHEN e.validation_status = 'WARNING' THEN 1 END) as warning_count
FROM expense_entries e
GROUP BY e.order_id, e.entry_type, e.currency;

-- 费用科目约束检查函数
CREATE OR REPLACE FUNCTION check_fee_service_constraint(
    p_fee_code VARCHAR(50),
    p_service_code VARCHAR(50)
) RETURNS TABLE (
    is_valid BOOLEAN,
    constraint_type VARCHAR(20),
    message VARCHAR(500)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN fsc.constraint_type = 'FORBIDDEN' THEN FALSE
            WHEN fsc.constraint_type IN ('ALLOWED', 'PREFERRED') THEN TRUE
            ELSE TRUE  -- 默认允许
        END as is_valid,
        COALESCE(fsc.constraint_type, 'NONE') as constraint_type,
        CASE 
            WHEN fsc.constraint_type = 'FORBIDDEN' THEN 
                '费用科目 ' || p_fee_code || ' 不适用于服务 ' || p_service_code
            WHEN fsc.constraint_type = 'PREFERRED' THEN 
                '费用科目 ' || p_fee_code || ' 是服务 ' || p_service_code || ' 的推荐选择'
            WHEN fsc.constraint_type = 'ALLOWED' THEN 
                '费用科目 ' || p_fee_code || ' 适用于服务 ' || p_service_code
            ELSE '未配置约束规则，默认允许'
        END as message
    FROM fee_service_constraints fsc
    WHERE fsc.fee_code = p_fee_code AND fsc.service_code = p_service_code
    UNION ALL
    SELECT TRUE, 'NONE', '未配置约束规则，默认允许'
    WHERE NOT EXISTS (
        SELECT 1 FROM fee_service_constraints fsc2 
        WHERE fsc2.fee_code = p_fee_code AND fsc2.service_code = p_service_code
    );
END;
$$ LANGUAGE plpgsql;

-- 更新录费状态存储过程
CREATE OR REPLACE FUNCTION update_expense_entry_status(p_order_id VARCHAR(50))
RETURNS VOID AS $$
DECLARE
    v_receivable_count INTEGER;
    v_payable_count INTEGER;
    v_total_receivable DECIMAL(15,2);
    v_total_payable DECIMAL(15,2);
BEGIN
    -- 统计收款明细
    SELECT 
        COUNT(*),
        COALESCE(SUM(amount), 0)
    INTO v_receivable_count, v_total_receivable
    FROM expense_entries
    WHERE order_id = p_order_id AND entry_type = 'RECEIVABLE';
    
    -- 统计付款明细
    SELECT 
        COUNT(*),
        COALESCE(SUM(amount), 0)
    INTO v_payable_count, v_total_payable
    FROM expense_entries
    WHERE order_id = p_order_id AND entry_type = 'PAYABLE';
    
    -- 更新或插入状态记录
    INSERT INTO expense_entry_status (
        order_id, entry_status, receivable_count, payable_count,
        total_receivable, total_payable, last_modified_time
    ) VALUES (
        p_order_id, 'IN_PROGRESS', v_receivable_count, v_payable_count,
        v_total_receivable, v_total_payable, CURRENT_TIMESTAMP
    )
    ON CONFLICT (order_id) DO UPDATE SET
        receivable_count = v_receivable_count,
        payable_count = v_payable_count,
        total_receivable = v_total_receivable,
        total_payable = v_total_payable,
        last_modified_time = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 数据完整性检查
-- ===================================

-- 验证表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN (
    'expense_entries', 
    'fee_service_constraints', 
    'fee_supplier_constraints',
    'expense_entry_status',
    'legal_entities'
)
ORDER BY table_name, ordinal_position;

-- 验证约束条件
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN (
    'expense_entries', 
    'fee_service_constraints', 
    'fee_supplier_constraints',
    'expense_entry_status',
    'legal_entities'
);

-- 验证索引
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'expense_entries', 
    'fee_service_constraints', 
    'fee_supplier_constraints',
    'expense_entry_status',
    'legal_entities'
);

COMMIT;