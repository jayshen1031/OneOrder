-- V3__Add_Transit_And_CrossBorder_Tables.sql
-- 添加借抬头和过账规则表结构

-- 借抬头实体表
CREATE TABLE transit_entities (
    transit_id VARCHAR(50) PRIMARY KEY,
    transit_type VARCHAR(20) NOT NULL CHECK (transit_type IN ('RECEIVABLE_TRANSIT', 'PAYABLE_TRANSIT')),
    source_entity_id VARCHAR(50) NOT NULL,
    transit_entity_id VARCHAR(50) NOT NULL,
    target_entity_id VARCHAR(50) NOT NULL,
    transit_account VARCHAR(100),
    retention_rate DECIMAL(5,4),
    fixed_retention_amount DECIMAL(15,2),
    retention_type VARCHAR(20) DEFAULT 'PERCENTAGE' CHECK (retention_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    applicable_conditions TEXT,
    remarks VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 借抬头表索引
CREATE INDEX idx_transit_entities_type ON transit_entities(transit_type);
CREATE INDEX idx_transit_entities_account ON transit_entities(transit_account);
CREATE INDEX idx_transit_entities_active ON transit_entities(is_active);
CREATE INDEX idx_transit_entities_source ON transit_entities(source_entity_id);
CREATE INDEX idx_transit_entities_target ON transit_entities(target_entity_id);

-- 跨境流程表
CREATE TABLE cross_border_flows (
    flow_id VARCHAR(50) PRIMARY KEY,
    flow_type VARCHAR(30) NOT NULL CHECK (flow_type IN ('STANDARD_FLOW', 'SOUTHEAST_ASIA_FLOW', 'EUROPE_AMERICA_FLOW')),
    payer_entity_id VARCHAR(50) NOT NULL,
    payer_region VARCHAR(50),
    transit_entity_id VARCHAR(50) NOT NULL,
    transit_region VARCHAR(50),
    receiver_entity_id VARCHAR(50) NOT NULL,
    receiver_region VARCHAR(50),
    processing_type VARCHAR(20) NOT NULL CHECK (processing_type IN ('FLAT_TRANSFER', 'NET_TRANSFER')),
    transit_retention_rate DECIMAL(5,4),
    netting_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    netting_priority INTEGER DEFAULT 0,
    applicable_conditions TEXT,
    remarks VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 跨境流程表索引
CREATE INDEX idx_cross_border_flows_type ON cross_border_flows(flow_type);
CREATE INDEX idx_cross_border_flows_payer ON cross_border_flows(payer_entity_id);
CREATE INDEX idx_cross_border_flows_transit ON cross_border_flows(transit_entity_id);
CREATE INDEX idx_cross_border_flows_receiver ON cross_border_flows(receiver_entity_id);
CREATE INDEX idx_cross_border_flows_netting ON cross_border_flows(netting_enabled);

-- 添加paymentAccount字段到orders表
ALTER TABLE orders ADD COLUMN payment_account VARCHAR(100);
CREATE INDEX idx_orders_payment_account ON orders(payment_account);

-- 插入测试数据
-- 收款借抬头配置
INSERT INTO transit_entities (
    transit_id, transit_type, source_entity_id, transit_entity_id, target_entity_id,
    transit_account, retention_rate, retention_type, applicable_conditions,
    created_at, created_by, updated_at, updated_by, version
) VALUES (
    'TRANSIT_RECEIVABLE_001', 'RECEIVABLE_TRANSIT', 'CUSTOMER_001', 'ENTITY_HK_001', 'ENTITY_CN_SALES',
    '6225881234567890', 0.03, 'PERCENTAGE', 
    '{"businessTypes":["OCEAN_FREIGHT","AIR_FREIGHT"],"currencies":["CNY","USD"]}',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM', 0
);

-- 付款借抬头配置
INSERT INTO transit_entities (
    transit_id, transit_type, source_entity_id, transit_entity_id, target_entity_id,
    transit_account, fixed_retention_amount, retention_type, applicable_conditions,
    created_at, created_by, updated_at, updated_by, version
) VALUES (
    'TRANSIT_PAYABLE_001', 'PAYABLE_TRANSIT', 'ENTITY_CN_SALES', 'ENTITY_SG_001', 'SUPPLIER_001',
    '6225880000000001', 1000.00, 'FIXED_AMOUNT',
    '{"businessTypes":["TRUCK_FREIGHT","RAIL_FREIGHT"],"currencies":["CNY"]}',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM', 0
);

-- 标准过账流程配置
INSERT INTO cross_border_flows (
    flow_id, flow_type, payer_entity_id, payer_region, transit_entity_id, transit_region,
    receiver_entity_id, receiver_region, processing_type, transit_retention_rate,
    netting_enabled, netting_priority, applicable_conditions,
    created_at, created_by, updated_at, updated_by, version
) VALUES (
    'FLOW_STANDARD_001', 'STANDARD_FLOW', 'ENTITY_CN_NINGBO', 'CN', 'ENTITY_HK_TRANSIT', 'HK',
    'ENTITY_TH_RECEIVER', 'TH', 'FLAT_TRANSFER', 0.005,
    true, 1, '{"businessTypes":["OCEAN_FREIGHT"],"currencies":["CNY","USD"]}',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM', 0
);

-- 东南亚过账流程配置
INSERT INTO cross_border_flows (
    flow_id, flow_type, payer_entity_id, payer_region, transit_entity_id, transit_region,
    receiver_entity_id, receiver_region, processing_type, transit_retention_rate,
    netting_enabled, netting_priority, applicable_conditions,
    created_at, created_by, updated_at, updated_by, version
) VALUES (
    'FLOW_SOUTHEAST_001', 'SOUTHEAST_ASIA_FLOW', 'ENTITY_CN_SHENZHEN', 'CN', 'ENTITY_SG_TRANSIT', 'SG',
    'ENTITY_MY_RECEIVER', 'MY', 'NET_TRANSFER', 0.008,
    true, 2, '{"businessTypes":["AIR_FREIGHT","TRUCK_FREIGHT"],"currencies":["CNY","USD"]}',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM', 0
);