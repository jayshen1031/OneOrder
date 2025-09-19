-- 创建管法分离报表基础表
-- 1. 法人实体管理表
CREATE TABLE IF NOT EXISTS legal_entities (
    entity_id VARCHAR(50) PRIMARY KEY,
    entity_name VARCHAR(200) NOT NULL,
    entity_code VARCHAR(50) UNIQUE NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- 'DOMESTIC', 'OVERSEAS', 'BRANCH'
    country_code VARCHAR(10),
    currency_code VARCHAR(10) DEFAULT 'CNY',
    tax_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 管理实体定义表
CREATE TABLE IF NOT EXISTS management_entities (
    mgmt_entity_id VARCHAR(50) PRIMARY KEY,
    mgmt_entity_name VARCHAR(200) NOT NULL,
    mgmt_entity_code VARCHAR(50) UNIQUE NOT NULL,
    entity_level INTEGER DEFAULT 1, -- 层级：1-总部, 2-区域, 3-分部, 4-部门
    entity_path VARCHAR(500), -- 层级路径，用/分隔
    manager_name VARCHAR(100),
    cost_center_code VARCHAR(50),
    profit_center_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 管法对应关系表
CREATE TABLE IF NOT EXISTS entity_mappings (
    mapping_id VARCHAR(50) PRIMARY KEY,
    mgmt_entity_id VARCHAR(50) NOT NULL,
    legal_entity_id VARCHAR(50) NOT NULL,
    allocation_ratio DECIMAL(5,4) DEFAULT 1.0000, -- 分配比例，支持一对多分摊
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_primary BOOLEAN DEFAULT TRUE, -- 是否主要归属
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mgmt_entity_id) REFERENCES management_entities(mgmt_entity_id),
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(entity_id)
);

-- 插入基础数据
-- 法人实体基础数据
INSERT INTO legal_entities (entity_id, entity_name, entity_code, entity_type, country_code, currency_code, tax_id) VALUES
('LE001', '海程邦达国际物流有限公司', 'HCBD_CN', 'DOMESTIC', 'CN', 'CNY', '91310000123456789A'),
('LE002', 'HCBD Logistics (HK) Limited', 'HCBD_HK', 'OVERSEAS', 'HK', 'HKD', 'HK123456789'),
('LE003', 'HCBD USA Inc.', 'HCBD_US', 'OVERSEAS', 'US', 'USD', 'US-123456789')
ON CONFLICT (entity_code) DO NOTHING;

-- 管理实体基础数据
INSERT INTO management_entities (mgmt_entity_id, mgmt_entity_name, mgmt_entity_code, entity_level, entity_path, cost_center_code) VALUES
('ME001', '海程邦达集团总部', 'HCBD_HQ', 1, '/HQ', 'CC001'),
('ME002', '中国区域', 'HCBD_CN_REGION', 2, '/HQ/CN', 'CC002'),
('ME003', '海外区域', 'HCBD_OS_REGION', 2, '/HQ/OS', 'CC003')
ON CONFLICT (mgmt_entity_code) DO NOTHING;

-- 管法对应关系基础数据
INSERT INTO entity_mappings (mapping_id, mgmt_entity_id, legal_entity_id, allocation_ratio, effective_date) VALUES
('MAP001', 'ME002', 'LE001', 1.0000, '2025-01-01'),
('MAP002', 'ME003', 'LE002', 0.5000, '2025-01-01'),
('MAP003', 'ME003', 'LE003', 0.5000, '2025-01-01')
ON CONFLICT (mapping_id) DO NOTHING;