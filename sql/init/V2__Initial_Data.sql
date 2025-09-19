-- OneOrder财务清分系统 - 初始数据
-- V2__Initial_Data.sql

-- 插入法人实体数据
INSERT INTO legal_entity (entity_id, entity_name, entity_code, entity_type, region, country, is_transit_entity, default_retention_rate, tax_registration_no, is_active, created_by) VALUES
-- 客户
('CUSTOMER001', '上海汽车进出口有限公司', 'SH-AUTO-001', 'CUSTOMER', 'CN-SH', 'CN', false, 0.0000, '91310000123456789A', true, 'SYSTEM'),
('CUSTOMER002', '深圳华为技术有限公司', 'SZ-HW-001', 'CUSTOMER', 'CN-SZ', 'CN', false, 0.0000, '91440300279823456B', true, 'SYSTEM'),
('CUSTOMER003', '广州美的集团股份有限公司', 'GZ-MIDEA-001', 'CUSTOMER', 'CN-GZ', 'CN', false, 0.0000, '91440101234567890C', true, 'SYSTEM'),

-- 销售站
('SALES001', '上海邦达物流有限公司', 'BD-SH-SALES', 'SALES', 'CN-SH', 'CN', false, 0.0000, '91310000567890123D', true, 'SYSTEM'),
('SALES002', '深圳邦达货运代理有限公司', 'BD-SZ-SALES', 'SALES', 'CN-SZ', 'CN', false, 0.0000, '91440300678901234E', true, 'SYSTEM'),
('SALES003', '宁波邦达物流有限公司', 'BD-NB-SALES', 'SALES', 'CN-NB', 'CN', false, 0.0000, '91330200789012345F', true, 'SYSTEM'),
('SALES004', '天津邦达国际货运有限公司', 'BD-TJ-SALES', 'SALES', 'CN-TJ', 'CN', false, 0.0000, '91120000890123456G', true, 'SYSTEM'),

-- 交付站
('DELIVERY001', '上海邦达运输有限公司', 'BD-SH-DELIVERY', 'DELIVERY', 'CN-SH', 'CN', false, 0.0000, '91310000901234567H', true, 'SYSTEM'),
('DELIVERY002', '深圳邦达仓储有限公司', 'BD-SZ-DELIVERY', 'DELIVERY', 'CN-SZ', 'CN', false, 0.0000, '91440300012345678I', true, 'SYSTEM'),
('DELIVERY003', '香港邦达国际贸易有限公司', 'BD-HK-DELIVERY', 'DELIVERY', 'HK', 'HK', true, 0.0300, 'HK-123456789', true, 'SYSTEM'),
('DELIVERY004', '泰国邦达物流有限公司', 'BD-TH-DELIVERY', 'DELIVERY', 'TH', 'TH', true, 0.0250, 'TH-987654321', true, 'SYSTEM'),

-- 供应商
('SUPPLIER001', '中国远洋海运集团有限公司', 'COSCO-001', 'SUPPLIER', 'CN-BJ', 'CN', false, 0.0000, '91110000123456789J', true, 'SYSTEM'),
('SUPPLIER002', '马士基（中国）有限公司', 'MAERSK-CN-001', 'SUPPLIER', 'CN-SH', 'CN', false, 0.0000, '91310000234567890K', true, 'SYSTEM'),
('SUPPLIER003', '东方海外货柜航运公司', 'OOCL-001', 'SUPPLIER', 'HK', 'HK', false, 0.0000, 'HK-345678901', true, 'SYSTEM'),
('SUPPLIER004', '达飞轮船（中国）有限公司', 'CMA-CGM-CN-001', 'SUPPLIER', 'CN-SH', 'CN', false, 0.0000, '91310000456789012L', true, 'SYSTEM');

-- 插入清分规则数据
INSERT INTO clearing_rules (rule_id, rule_name, rule_type, rule_config, priority, is_active, applicable_scope, condition_expression, description, created_by) VALUES
-- 清分模式规则
('RULE001', '默认星式清分规则', 'CLEARING_MODE', '{"defaultMode":"STAR","threshold":10000}', 1, true, null, '${order.totalAmount} >= 1000', '订单金额大于1000元时使用星式清分', 'SYSTEM'),
('RULE002', '小额订单链式清分规则', 'CLEARING_MODE', '{"defaultMode":"CHAIN","threshold":1000}', 2, true, null, '${order.totalAmount} < 1000', '小额订单使用链式清分', 'SYSTEM'),

-- 分润规则
('RULE003', '默认五五开分润规则', 'PROFIT_SHARING', '{"salesRate":0.5,"deliveryRate":0.5,"distributionMethod":"EQUAL"}', 1, true, null, null, '销售和交付法人体五五开分润', 'SYSTEM'),
('RULE004', '高价值订单分润规则', 'PROFIT_SHARING', '{"salesRate":0.6,"deliveryRate":0.4,"distributionMethod":"WEIGHTED"}', 2, true, null, '${order.totalAmount} >= 50000', '高价值订单销售法人体获得更多分润', 'SYSTEM'),

-- 借抬头规则
('RULE005', '香港借抬头规则', 'TRANSIT_ENTITY', '{"transitEntityId":"DELIVERY003","retentionRate":0.03,"applicableType":"RECEIVABLE"}', 1, true, '["HK"]', '${order.currency} == "USD"', '美元订单通过香港借抬头，留存3%', 'SYSTEM'),
('RULE006', '泰国借抬头规则', 'TRANSIT_ENTITY', '{"transitEntityId":"DELIVERY004","retentionRate":0.025,"applicableType":"PAYABLE"}', 2, true, '["TH"]', '${order.portOfDischarge} LIKE "%THAILAND%"', '泰国目的港订单借抬头规则', 'SYSTEM'),

-- 过账规则
('RULE007', '跨境过账规则', 'CROSS_BORDER', '{"transitEntityId":"DELIVERY003","enableNetting":true,"handlingFee":100}', 1, true, null, '${order.currency} != "CNY"', '非人民币订单需要跨境过账', 'SYSTEM'),

-- 净额规则
('RULE008', '日净额抵消规则', 'NETTING', '{"threshold":10000,"period":"DAILY","currency":"USD"}', 1, true, null, null, '美元日净额超过1万时进行抵消', 'SYSTEM'),

-- 留存规则（管报与法报差异）
('RULE009', '嘉兴公司留存差异规则', 'RETENTION', '{"targetEntityId":"SALES003","managementRate":0.0,"legalRate":0.5}', 1, true, '["SALES003"]', null, '嘉兴公司管理上不留利润，法报五五开', 'SYSTEM');

-- 插入示例订单数据
INSERT INTO orders (order_id, order_no, customer_id, sales_entity_id, delivery_entity_id, payment_entity_id, total_amount, total_cost, currency, order_status, clearing_status, clearing_mode, order_date, business_type, port_of_loading, port_of_discharge, created_by) VALUES
('ORD-2024-0001', 'SH-AUTO-20240101-001', 'CUSTOMER001', 'SALES001', 'DELIVERY001', null, 50000.00, 40000.00, 'CNY', 'CONFIRMED', 'PENDING', 'STAR', '2024-01-01 10:00:00', 'FREIGHT_FORWARDING', '上海港', '宁波港', 'SYSTEM'),
('ORD-2024-0002', 'HW-EXPORT-20240102-001', 'CUSTOMER002', 'SALES002', 'DELIVERY003', null, 80000.00, 65000.00, 'USD', 'CONFIRMED', 'PENDING', 'STAR', '2024-01-02 14:30:00', 'INTERNATIONAL_TRADE', '深圳港', '洛杉矶港', 'SYSTEM'),
('ORD-2024-0003', 'MIDEA-SHIP-20240103-001', 'CUSTOMER003', 'SALES003', 'DELIVERY004', null, 25000.00, 18000.00, 'USD', 'CONFIRMED', 'PENDING', 'CHAIN', '2024-01-03 09:15:00', 'FREIGHT_FORWARDING', '广州港', '曼谷港', 'SYSTEM');

-- 插入订单项数据
INSERT INTO order_items (item_id, order_id, service_type, service_name, service_provider_id, charge_amount, cost_amount, currency, quantity, unit, unit_price, created_by) VALUES
-- 订单1的服务项
('ITEM-001-001', 'ORD-2024-0001', 'OCEAN_FREIGHT', '上海-宁波海运', 'SUPPLIER001', 30000.00, 25000.00, 'CNY', 1.00, '票', 30000.00, 'SYSTEM'),
('ITEM-001-002', 'ORD-2024-0001', 'TRUCKING', '内陆拖车服务', 'SUPPLIER002', 15000.00, 12000.00, 'CNY', 1.00, '票', 15000.00, 'SYSTEM'),
('ITEM-001-003', 'ORD-2024-0001', 'CUSTOMS', '报关服务', 'DELIVERY001', 5000.00, 3000.00, 'CNY', 1.00, '票', 5000.00, 'SYSTEM'),

-- 订单2的服务项
('ITEM-002-001', 'ORD-2024-0002', 'OCEAN_FREIGHT', '深圳-洛杉矶海运', 'SUPPLIER002', 60000.00, 48000.00, 'USD', 1.00, '票', 60000.00, 'SYSTEM'),
('ITEM-002-002', 'ORD-2024-0002', 'INSURANCE', '货物保险', 'DELIVERY003', 12000.00, 10000.00, 'USD', 1.00, '票', 12000.00, 'SYSTEM'),
('ITEM-002-003', 'ORD-2024-0002', 'DOCUMENTATION', '单证服务', 'DELIVERY003', 8000.00, 7000.00, 'USD', 1.00, '票', 8000.00, 'SYSTEM'),

-- 订单3的服务项
('ITEM-003-001', 'ORD-2024-0003', 'OCEAN_FREIGHT', '广州-曼谷海运', 'SUPPLIER003', 18000.00, 15000.00, 'USD', 1.00, '票', 18000.00, 'SYSTEM'),
('ITEM-003-002', 'ORD-2024-0003', 'CUSTOMS', '出口报关', 'DELIVERY002', 4000.00, 2000.00, 'USD', 1.00, '票', 4000.00, 'SYSTEM'),
('ITEM-003-003', 'ORD-2024-0003', 'TRUCKING', '广州港拖车', 'SUPPLIER004', 3000.00, 1000.00, 'USD', 1.00, '票', 3000.00, 'SYSTEM');

-- 插入一些已完成清分的示例数据（用于仪表盘展示）
INSERT INTO clearing_results (result_id, order_id, entity_id, amount, currency, transaction_type, account_type, clearing_mode, is_transit_retention, management_amount, legal_amount, created_by) VALUES
-- 订单1的清分结果（星式）
('RESULT-001-001', 'ORD-2024-0001', 'SALES001', 50000.00, 'CNY', 'RECEIVABLE', 'EXTERNAL_RECEIVABLE', 'STAR', false, 50000.00, 50000.00, 'SYSTEM'),
('RESULT-001-002', 'ORD-2024-0001', 'SALES001', 5000.00, 'CNY', 'PROFIT_SHARING', 'INTERNAL_RECEIVABLE', 'STAR', false, 5000.00, 5000.00, 'SYSTEM'),
('RESULT-001-003', 'ORD-2024-0001', 'DELIVERY001', 5000.00, 'CNY', 'PROFIT_SHARING', 'INTERNAL_RECEIVABLE', 'STAR', false, 5000.00, 5000.00, 'SYSTEM'),
('RESULT-001-004', 'ORD-2024-0001', 'SALES001', -40000.00, 'CNY', 'PAYABLE', 'EXTERNAL_PAYABLE', 'STAR', false, -40000.00, -40000.00, 'SYSTEM');

-- 更新已完成清分的订单状态
UPDATE orders SET clearing_status = 'CLEARED' WHERE order_id = 'ORD-2024-0001';

-- 插入会计分录示例数据
INSERT INTO accounting_entries (entry_id, voucher_id, clearing_result_id, order_id, entity_id, account_code, account_name, debit_amount, credit_amount, currency, entry_type, summary, is_posted, report_type, created_by) VALUES
-- 订单1的管理报表分录
('ENTRY-001-001', 'VOUCHER-001', 'RESULT-001-001', 'ORD-2024-0001', 'SALES001', '1122', '应收账款', 50000.00, 0.00, 'CNY', 'RECEIVABLE', '应收账款-SH-AUTO-20240101-001', true, 'MANAGEMENT', 'SYSTEM'),
('ENTRY-001-002', 'VOUCHER-001', 'RESULT-001-004', 'ORD-2024-0001', 'SALES001', '2202', '应付账款', 0.00, 40000.00, 'CNY', 'PAYABLE', '应付账款-SH-AUTO-20240101-001', true, 'MANAGEMENT', 'SYSTEM'),
('ENTRY-001-003', 'VOUCHER-001', 'RESULT-001-002', 'ORD-2024-0001', 'SALES001', '4103', '营业利润', 0.00, 5000.00, 'CNY', 'PROFIT', '营业利润-分润-SH-AUTO-20240101-001', true, 'MANAGEMENT', 'SYSTEM'),
('ENTRY-001-004', 'VOUCHER-001', 'RESULT-001-003', 'ORD-2024-0001', 'DELIVERY001', '4103', '营业利润', 0.00, 5000.00, 'CNY', 'PROFIT', '营业利润-分润-SH-AUTO-20240101-001', true, 'MANAGEMENT', 'SYSTEM'),

-- 订单1的法定报表分录（与管理报表相同）
('ENTRY-001-005', 'VOUCHER-001-LEGAL', 'RESULT-001-001', 'ORD-2024-0001', 'SALES001', '1122', '应收账款', 50000.00, 0.00, 'CNY', 'RECEIVABLE', '应收账款-SH-AUTO-20240101-001', true, 'LEGAL', 'SYSTEM'),
('ENTRY-001-006', 'VOUCHER-001-LEGAL', 'RESULT-001-004', 'ORD-2024-0001', 'SALES001', '2202', '应付账款', 0.00, 40000.00, 'CNY', 'PAYABLE', '应付账款-SH-AUTO-20240101-001', true, 'LEGAL', 'SYSTEM'),
('ENTRY-001-007', 'VOUCHER-001-LEGAL', 'RESULT-001-002', 'ORD-2024-0001', 'SALES001', '4103', '营业利润', 0.00, 5000.00, 'CNY', 'PROFIT', '营业利润-分润-SH-AUTO-20240101-001', true, 'LEGAL', 'SYSTEM'),
('ENTRY-001-008', 'VOUCHER-001-LEGAL', 'RESULT-001-003', 'ORD-2024-0001', 'DELIVERY001', '4103', '营业利润', 0.00, 5000.00, 'CNY', 'PROFIT', '营业利润-分润-SH-AUTO-20240101-001', true, 'LEGAL', 'SYSTEM');