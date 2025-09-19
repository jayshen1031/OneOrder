-- OneOrder 借抬头和过账规则测试数据初始化

-- 清理旧数据
DELETE FROM cross_border_flows;
DELETE FROM transit_entities;

-- 插入收款借抬头配置
INSERT INTO transit_entities (
    transit_id, transit_type, source_entity_id, transit_entity_id, target_entity_id,
    transit_account, retention_rate, retention_type, is_active, applicable_conditions,
    created_at, created_by, updated_at, updated_by, version
) VALUES (
    'TRANSIT_RECEIVABLE_001', 'RECEIVABLE_TRANSIT', 'CUSTOMER_001', 'ENTITY_HK_001', 'ENTITY_CN_SALES',
    '6225881234567890', 0.03, 'PERCENTAGE', true, 
    '{"businessTypes":["OCEAN_FREIGHT","AIR_FREIGHT"],"currencies":["CNY","USD"]}',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM', 0
);

-- 插入付款借抬头配置
INSERT INTO transit_entities (
    transit_id, transit_type, source_entity_id, transit_entity_id, target_entity_id,
    transit_account, fixed_retention_amount, retention_type, is_active, applicable_conditions,
    created_at, created_by, updated_at, updated_by, version
) VALUES (
    'TRANSIT_PAYABLE_001', 'PAYABLE_TRANSIT', 'ENTITY_CN_SALES', 'ENTITY_SG_001', 'SUPPLIER_001',
    '6225880000000001', 1000.00, 'FIXED_AMOUNT', true,
    '{"businessTypes":["TRUCK_FREIGHT","RAIL_FREIGHT"],"currencies":["CNY"]}',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM', 0
);

-- 插入标准过账流程配置
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

-- 插入东南亚过账流程配置
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

-- 验证数据插入
SELECT 'Transit Entities Count: ' || COUNT(*) as result FROM transit_entities;
SELECT 'Cross Border Flows Count: ' || COUNT(*) as result FROM cross_border_flows;

SELECT '=== 测试数据初始化完成 ===' as status;