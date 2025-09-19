-- ==================================================
-- 管法分离报表模块 - 数据库表结构设计
-- 用于管理法人实体与管理实体分离的财务报表
-- ==================================================

-- 1. 法人实体管理表
-- 存储各法人实体基本信息
CREATE TABLE IF NOT EXISTS legal_entities (
    entity_id VARCHAR(50) PRIMARY KEY,
    entity_name VARCHAR(200) NOT NULL,
    entity_code VARCHAR(50) UNIQUE NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- 'DOMESTIC', 'OVERSEAS', 'BRANCH'
    country_code VARCHAR(10),
    currency_code VARCHAR(10) DEFAULT 'CNY',
    tax_id VARCHAR(100),
    incorporation_date DATE,
    legal_representative VARCHAR(100),
    registered_capital DECIMAL(15,2),
    business_license VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- 2. 管理实体定义表
-- 管理层面的组织架构定义
CREATE TABLE IF NOT EXISTS management_entities (
    mgmt_entity_id VARCHAR(50) PRIMARY KEY,
    mgmt_entity_name VARCHAR(200) NOT NULL,
    mgmt_entity_code VARCHAR(50) UNIQUE NOT NULL,
    parent_mgmt_entity_id VARCHAR(50),
    entity_level INTEGER DEFAULT 1, -- 层级：1-总部, 2-区域, 3-分部, 4-部门
    entity_path VARCHAR(500), -- 层级路径，用/分隔
    manager_name VARCHAR(100),
    cost_center_code VARCHAR(50),
    profit_center_code VARCHAR(50),
    budget_responsibility BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (parent_mgmt_entity_id) REFERENCES management_entities(mgmt_entity_id)
);

-- 3. 管法对应关系表
-- 定义管理实体与法人实体的对应关系
CREATE TABLE IF NOT EXISTS entity_mappings (
    mapping_id VARCHAR(50) PRIMARY KEY,
    mgmt_entity_id VARCHAR(50) NOT NULL,
    legal_entity_id VARCHAR(50) NOT NULL,
    allocation_ratio DECIMAL(5,4) DEFAULT 1.0000, -- 分配比例，支持一对多分摊
    effective_date DATE NOT NULL,
    expiry_date DATE,
    mapping_type VARCHAR(20) DEFAULT 'DIRECT', -- 'DIRECT', 'ALLOCATED', 'SHARED'
    allocation_rule TEXT, -- 分配规则说明
    is_primary BOOLEAN DEFAULT TRUE, -- 是否主要归属
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (mgmt_entity_id) REFERENCES management_entities(mgmt_entity_id),
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(entity_id),
    UNIQUE(mgmt_entity_id, legal_entity_id, effective_date)
);

-- 4. 资金流向记录表
-- 记录不同法人实体间的资金流向
CREATE TABLE IF NOT EXISTS fund_flow_records (
    flow_record_id VARCHAR(50) PRIMARY KEY,
    source_legal_entity VARCHAR(50) NOT NULL,
    target_legal_entity VARCHAR(50) NOT NULL,
    mgmt_entity_id VARCHAR(50), -- 管理归属实体
    flow_type VARCHAR(30) NOT NULL, -- 'CLEARING', 'PASSTHROUGH', 'TRANSFER', 'SETTLEMENT'
    reference_id VARCHAR(100), -- 关联的业务单据ID
    reference_type VARCHAR(30), -- 'ORDER', 'CLEARING_INSTRUCTION', 'PASSTHROUGH_INSTRUCTION'
    flow_amount DECIMAL(15,2) NOT NULL,
    flow_currency VARCHAR(10) DEFAULT 'CNY',
    flow_date DATE NOT NULL,
    business_date DATE NOT NULL, -- 业务日期
    accounting_period VARCHAR(10) NOT NULL, -- 会计期间 YYYY-MM
    flow_direction VARCHAR(10) NOT NULL, -- 'INBOUND', 'OUTBOUND'
    flow_purpose TEXT, -- 资金流向用途说明
    tax_implications TEXT, -- 税务影响说明
    compliance_notes TEXT, -- 合规备注
    status VARCHAR(20) DEFAULT 'RECORDED', -- 'RECORDED', 'CONFIRMED', 'ADJUSTED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (source_legal_entity) REFERENCES legal_entities(entity_id),
    FOREIGN KEY (target_legal_entity) REFERENCES legal_entities(entity_id),
    FOREIGN KEY (mgmt_entity_id) REFERENCES management_entities(mgmt_entity_id)
);

-- 5. 管法分离损益表
-- 按管理实体和法人实体分别核算的损益情况
CREATE TABLE IF NOT EXISTS entity_profit_loss (
    pl_record_id VARCHAR(50) PRIMARY KEY,
    accounting_period VARCHAR(10) NOT NULL, -- YYYY-MM
    mgmt_entity_id VARCHAR(50),
    legal_entity_id VARCHAR(50),
    revenue_item VARCHAR(50) NOT NULL, -- 收入科目
    expense_item VARCHAR(50), -- 支出科目
    item_amount DECIMAL(15,2) NOT NULL,
    item_currency VARCHAR(10) DEFAULT 'CNY',
    management_perspective_amount DECIMAL(15,2), -- 管理口径金额
    legal_perspective_amount DECIMAL(15,2), -- 法人口径金额
    allocation_basis VARCHAR(100), -- 分摊依据
    adjustment_amount DECIMAL(15,2) DEFAULT 0, -- 调整金额
    adjustment_reason TEXT, -- 调整原因
    business_unit VARCHAR(50), -- 业务单元
    cost_center VARCHAR(50), -- 成本中心
    profit_center VARCHAR(50), -- 利润中心
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (mgmt_entity_id) REFERENCES management_entities(mgmt_entity_id),
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(entity_id)
);

-- 6. 过账处理统计表
-- 按法人实体统计过账处理情况
CREATE TABLE IF NOT EXISTS passthrough_entity_stats (
    stat_record_id VARCHAR(50) PRIMARY KEY,
    accounting_period VARCHAR(10) NOT NULL,
    legal_entity_id VARCHAR(50) NOT NULL,
    mgmt_entity_id VARCHAR(50),
    total_instructions INTEGER DEFAULT 0,
    completed_instructions INTEGER DEFAULT 0,
    failed_instructions INTEGER DEFAULT 0,
    total_original_amount DECIMAL(15,2) DEFAULT 0,
    total_passthrough_amount DECIMAL(15,2) DEFAULT 0,
    total_retention_amount DECIMAL(15,2) DEFAULT 0,
    routing_instructions INTEGER DEFAULT 0,
    netting_instructions INTEGER DEFAULT 0,
    differential_instructions INTEGER DEFAULT 0,
    inbound_flow_amount DECIMAL(15,2) DEFAULT 0, -- 流入金额
    outbound_flow_amount DECIMAL(15,2) DEFAULT 0, -- 流出金额
    net_flow_amount DECIMAL(15,2) DEFAULT 0, -- 净流量
    cross_entity_transactions INTEGER DEFAULT 0, -- 跨法人交易数量
    compliance_issues INTEGER DEFAULT 0, -- 合规问题数量
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(entity_id),
    FOREIGN KEY (mgmt_entity_id) REFERENCES management_entities(mgmt_entity_id),
    UNIQUE(accounting_period, legal_entity_id, mgmt_entity_id)
);

-- 7. 合规性检查记录表
-- 记录不同地区法人实体的合规性检查结果
CREATE TABLE IF NOT EXISTS compliance_check_records (
    check_record_id VARCHAR(50) PRIMARY KEY,
    legal_entity_id VARCHAR(50) NOT NULL,
    check_period VARCHAR(10) NOT NULL, -- YYYY-MM
    check_type VARCHAR(30) NOT NULL, -- 'TAX_COMPLIANCE', 'REGULATORY_COMPLIANCE', 'TRANSFER_PRICING'
    check_category VARCHAR(50), -- 具体检查类别
    check_result VARCHAR(20) DEFAULT 'PENDING', -- 'PASSED', 'FAILED', 'WARNING', 'PENDING'
    risk_level VARCHAR(10), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    identified_issues TEXT, -- 发现的问题
    remediation_plan TEXT, -- 整改计划
    compliance_officer VARCHAR(50), -- 合规官
    check_date DATE NOT NULL,
    due_date DATE, -- 整改截止日期
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    resolution_notes TEXT, -- 解决方案备注
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(entity_id)
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_legal_entities_code ON legal_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_legal_entities_type ON legal_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_management_entities_code ON management_entities(mgmt_entity_code);
CREATE INDEX IF NOT EXISTS idx_management_entities_level ON management_entities(entity_level);
CREATE INDEX IF NOT EXISTS idx_entity_mappings_mgmt ON entity_mappings(mgmt_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_mappings_legal ON entity_mappings(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_fund_flow_period ON fund_flow_records(accounting_period);
CREATE INDEX IF NOT EXISTS idx_fund_flow_date ON fund_flow_records(flow_date);
CREATE INDEX IF NOT EXISTS idx_fund_flow_source ON fund_flow_records(source_legal_entity);
CREATE INDEX IF NOT EXISTS idx_fund_flow_target ON fund_flow_records(target_legal_entity);
CREATE INDEX IF NOT EXISTS idx_profit_loss_period ON entity_profit_loss(accounting_period);
CREATE INDEX IF NOT EXISTS idx_profit_loss_mgmt ON entity_profit_loss(mgmt_entity_id);
CREATE INDEX IF NOT EXISTS idx_profit_loss_legal ON entity_profit_loss(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_passthrough_stats_period ON passthrough_entity_stats(accounting_period);
CREATE INDEX IF NOT EXISTS idx_compliance_entity ON compliance_check_records(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_period ON compliance_check_records(check_period);

-- 创建管理视图用于报表展示

-- 1. 管法对应关系汇总视图
CREATE OR REPLACE VIEW v_entity_mapping_summary AS
SELECT 
    em.mapping_id,
    me.mgmt_entity_name,
    me.mgmt_entity_code,
    le.entity_name AS legal_entity_name,
    le.entity_code AS legal_entity_code,
    le.entity_type,
    em.allocation_ratio,
    em.effective_date,
    em.expiry_date,
    em.is_primary,
    CASE WHEN em.expiry_date IS NULL OR em.expiry_date > CURRENT_DATE 
         THEN 'ACTIVE' ELSE 'EXPIRED' END AS mapping_status
FROM entity_mappings em
JOIN management_entities me ON em.mgmt_entity_id = me.mgmt_entity_id
JOIN legal_entities le ON em.legal_entity_id = le.entity_id
WHERE me.is_active = TRUE AND le.is_active = TRUE;

-- 2. 资金流向汇总视图
CREATE OR REPLACE VIEW v_fund_flow_summary AS
SELECT 
    ffr.accounting_period,
    sle.entity_name AS source_entity_name,
    sle.entity_code AS source_entity_code,
    tle.entity_name AS target_entity_name,
    tle.entity_code AS target_entity_code,
    me.mgmt_entity_name,
    ffr.flow_type,
    COUNT(*) AS transaction_count,
    SUM(ffr.flow_amount) AS total_amount,
    AVG(ffr.flow_amount) AS average_amount,
    ffr.flow_currency
FROM fund_flow_records ffr
JOIN legal_entities sle ON ffr.source_legal_entity = sle.entity_id
JOIN legal_entities tle ON ffr.target_legal_entity = tle.entity_id
LEFT JOIN management_entities me ON ffr.mgmt_entity_id = me.mgmt_entity_id
GROUP BY ffr.accounting_period, sle.entity_name, sle.entity_code, 
         tle.entity_name, tle.entity_code, me.mgmt_entity_name, 
         ffr.flow_type, ffr.flow_currency;

-- 3. 管法分离损益汇总视图
CREATE OR REPLACE VIEW v_entity_profit_loss_summary AS
SELECT 
    epl.accounting_period,
    me.mgmt_entity_name,
    me.mgmt_entity_code,
    le.entity_name AS legal_entity_name,
    le.entity_code AS legal_entity_code,
    SUM(CASE WHEN epl.revenue_item IS NOT NULL THEN epl.item_amount ELSE 0 END) AS total_revenue,
    SUM(CASE WHEN epl.expense_item IS NOT NULL THEN epl.item_amount ELSE 0 END) AS total_expense,
    SUM(CASE WHEN epl.revenue_item IS NOT NULL THEN epl.item_amount ELSE 0 END) - 
    SUM(CASE WHEN epl.expense_item IS NOT NULL THEN epl.item_amount ELSE 0 END) AS net_profit,
    SUM(epl.management_perspective_amount) AS mgmt_perspective_total,
    SUM(epl.legal_perspective_amount) AS legal_perspective_total,
    SUM(epl.adjustment_amount) AS total_adjustments,
    epl.item_currency
FROM entity_profit_loss epl
LEFT JOIN management_entities me ON epl.mgmt_entity_id = me.mgmt_entity_id
LEFT JOIN legal_entities le ON epl.legal_entity_id = le.entity_id
GROUP BY epl.accounting_period, me.mgmt_entity_name, me.mgmt_entity_code,
         le.entity_name, le.entity_code, epl.item_currency;

-- 插入基础数据

-- 法人实体基础数据
INSERT INTO legal_entities (entity_id, entity_name, entity_code, entity_type, country_code, currency_code, tax_id, created_by) VALUES
('LE001', '海程邦达国际物流有限公司', 'HCBD_CN', 'DOMESTIC', 'CN', 'CNY', '91310000123456789A', 'system'),
('LE002', 'HCBD Logistics (HK) Limited', 'HCBD_HK', 'OVERSEAS', 'HK', 'HKD', 'HK123456789', 'system'),
('LE003', 'HCBD USA Inc.', 'HCBD_US', 'OVERSEAS', 'US', 'USD', 'US-123456789', 'system'),
('LE004', 'HCBD Singapore Pte Ltd', 'HCBD_SG', 'OVERSEAS', 'SG', 'SGD', 'SG-123456789', 'system'),
('LE005', '海程邦达上海分公司', 'HCBD_SH', 'BRANCH', 'CN', 'CNY', '91310000123456789B', 'system'),
('LE006', '海程邦达深圳分公司', 'HCBD_SZ', 'BRANCH', 'CN', 'CNY', '91310000123456789C', 'system');

-- 管理实体基础数据
INSERT INTO management_entities (mgmt_entity_id, mgmt_entity_name, mgmt_entity_code, entity_level, entity_path, cost_center_code, created_by) VALUES
('ME001', '海程邦达集团总部', 'HCBD_HQ', 1, '/HQ', 'CC001', 'system'),
('ME002', '中国区域', 'HCBD_CN_REGION', 2, '/HQ/CN', 'CC002', 'system'),
('ME003', '海外区域', 'HCBD_OS_REGION', 2, '/HQ/OS', 'CC003', 'system'),
('ME004', '华东大区', 'HCBD_EAST', 3, '/HQ/CN/EAST', 'CC004', 'system'),
('ME005', '华南大区', 'HCBD_SOUTH', 3, '/HQ/CN/SOUTH', 'CC005', 'system'),
('ME006', '北美分部', 'HCBD_NA', 3, '/HQ/OS/NA', 'CC006', 'system'),
('ME007', '亚太分部', 'HCBD_AP', 3, '/HQ/OS/AP', 'CC007', 'system');

-- 管法对应关系基础数据
INSERT INTO entity_mappings (mapping_id, mgmt_entity_id, legal_entity_id, allocation_ratio, effective_date, created_by) VALUES
('MAP001', 'ME004', 'LE001', 0.6000, '2025-01-01', 'system'), -- 华东大区 60% 归属总公司
('MAP002', 'ME004', 'LE005', 1.0000, '2025-01-01', 'system'), -- 华东大区 100% 归属上海分公司
('MAP003', 'ME005', 'LE001', 0.3000, '2025-01-01', 'system'), -- 华南大区 30% 归属总公司
('MAP004', 'ME005', 'LE006', 1.0000, '2025-01-01', 'system'), -- 华南大区 100% 归属深圳分公司
('MAP005', 'ME006', 'LE003', 1.0000, '2025-01-01', 'system'), -- 北美分部 100% 归属美国公司
('MAP006', 'ME007', 'LE002', 0.5000, '2025-01-01', 'system'), -- 亚太分部 50% 归属香港公司
('MAP007', 'ME007', 'LE004', 0.5000, '2025-01-01', 'system'); -- 亚太分部 50% 归属新加坡公司

-- 创建存储过程用于生成管法分离报表数据

-- 1. 更新过账处理统计数据
CREATE OR REPLACE FUNCTION update_passthrough_entity_stats(p_accounting_period VARCHAR(10))
RETURNS void AS $$
DECLARE
    current_period VARCHAR(10) := COALESCE(p_accounting_period, TO_CHAR(CURRENT_DATE, 'YYYY-MM'));
BEGIN
    -- 删除当期已有统计数据
    DELETE FROM passthrough_entity_stats WHERE accounting_period = current_period;
    
    -- 重新生成统计数据
    INSERT INTO passthrough_entity_stats (
        stat_record_id, accounting_period, legal_entity_id, mgmt_entity_id,
        total_instructions, completed_instructions, failed_instructions,
        total_original_amount, total_passthrough_amount, total_retention_amount,
        routing_instructions, netting_instructions, differential_instructions
    )
    SELECT 
        'STAT_' || le.entity_code || '_' || current_period AS stat_record_id,
        current_period AS accounting_period,
        le.entity_id AS legal_entity_id,
        em.mgmt_entity_id,
        COALESCE(pt_stats.total_instructions, 0),
        COALESCE(pt_stats.completed_instructions, 0), 
        COALESCE(pt_stats.failed_instructions, 0),
        COALESCE(pt_stats.total_original_amount, 0),
        COALESCE(pt_stats.total_passthrough_amount, 0),
        COALESCE(pt_stats.total_retention_amount, 0),
        COALESCE(pt_stats.routing_instructions, 0),
        COALESCE(pt_stats.netting_instructions, 0),
        COALESCE(pt_stats.differential_instructions, 0)
    FROM legal_entities le
    LEFT JOIN entity_mappings em ON le.entity_id = em.legal_entity_id 
        AND em.effective_date <= CURRENT_DATE 
        AND (em.expiry_date IS NULL OR em.expiry_date > CURRENT_DATE)
    LEFT JOIN (
        -- 这里应该关联实际的过账处理数据，目前用模拟数据
        SELECT 
            'LE001' AS entity_id, 10 AS total_instructions, 8 AS completed_instructions, 2 AS failed_instructions,
            180000.00 AS total_original_amount, 177750.50 AS total_passthrough_amount, 2249.50 AS total_retention_amount,
            6 AS routing_instructions, 3 AS netting_instructions, 1 AS differential_instructions
        UNION ALL
        SELECT 'LE002', 5, 5, 0, 95000.00, 94250.00, 750.00, 4, 1, 0
        UNION ALL  
        SELECT 'LE003', 3, 2, 1, 45000.00, 44100.00, 900.00, 2, 1, 0
    ) pt_stats ON le.entity_id = pt_stats.entity_id
    WHERE le.is_active = TRUE;
    
    RAISE NOTICE '过账处理统计数据已更新，会计期间: %', current_period;
END;
$$ LANGUAGE plpgsql;

-- 调用存储过程生成当前月份的统计数据
SELECT update_passthrough_entity_stats('2025-09');

COMMIT;