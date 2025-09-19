-- 创建服务配置表
CREATE TABLE IF NOT EXISTS service_config (
    id BIGSERIAL PRIMARY KEY,
    fee_code VARCHAR(20) UNIQUE NOT NULL,
    chinese_name VARCHAR(200) NOT NULL,
    english_name VARCHAR(200) NOT NULL,
    abbreviation VARCHAR(10),
    default_currency VARCHAR(10),
    tax_status VARCHAR(20),
    invoice_type VARCHAR(50),
    fee_category VARCHAR(100),
    related_service VARCHAR(100),
    supplier_type VARCHAR(100),
    accounting_subject VARCHAR(100),
    direction VARCHAR(20),
    description TEXT,
    description_english TEXT,
    legacy_code VARCHAR(50),
    min_rate DECIMAL(12,2),
    max_rate DECIMAL(12,2),
    standard_rate DECIMAL(12,2),
    unit VARCHAR(20),
    enabled BOOLEAN DEFAULT TRUE,
    business_type VARCHAR(20),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version INTEGER DEFAULT 1
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_service_config_fee_code ON service_config(fee_code);
CREATE INDEX IF NOT EXISTS idx_service_config_business_type ON service_config(business_type);
CREATE INDEX IF NOT EXISTS idx_service_config_fee_category ON service_config(fee_category);
CREATE INDEX IF NOT EXISTS idx_service_config_enabled ON service_config(enabled);

-- 插入第三版费用标准的示例数据
INSERT INTO service_config (fee_code, chinese_name, english_name, abbreviation, default_currency, tax_status, invoice_type, fee_category, related_service, supplier_type, accounting_subject, direction, description, description_english, min_rate, max_rate, standard_rate, unit, business_type, enabled, created_by, version) VALUES

-- 海运费用
('FCL001', '海运费', 'Ocean Freight', 'OF', 'USD', '应税', '增值税专票', '跨境运输费用', 'MBL', '船公司', '营业收入', '应收', '集装箱海上运输基本运费，按柜型收取', 'Basic ocean freight for container transportation charged by container type', 12000, 25000, 18000, '箱', 'OCEAN', true, 'system', 1),

('FCL002', '燃油附加费', 'Bunker Adjustment Factor', 'BAF', 'USD', '应税', '增值税专票', '跨境运输费用', 'MBL', '船公司', '营业收入', '应收', '因燃油价格波动产生的附加费用', 'Additional charge due to bunker fuel price fluctuations', 500, 1500, 800, '箱', 'OCEAN', true, 'system', 1),

('FCL003', '码头操作费(起运港)', 'Origin Terminal Handling Charge', 'OTHC', 'CNY', '应税', '增值税专票', '码头/港口/场站费用', '内装', '码头/场站', '营业成本', '应付', '起运港码头装卸及相关操作费用', 'Terminal handling charges at origin port for loading operations', 400, 600, 480, '箱', 'OCEAN', true, 'system', 1),

('FCL004', '码头操作费(目的港)', 'Destination Terminal Handling Charge', 'DTHC', 'USD', '应税', '增值税专票', '码头/港口/场站费用', '换单', '码头/场站', '营业收入', '应收', '目的港码头卸货及相关操作费用', 'Terminal handling charges at destination port for discharge operations', 80, 150, 120, '箱', 'OCEAN', true, 'system', 1),

('FCL005', '报关费', 'Customs Declaration Fee', 'CDF', 'CNY', '应税', '增值税专票', '关检费用', '报关', '报关行', '营业成本', '应付', '出口报关代理服务费', 'Export customs declaration agency service fee', 300, 800, 500, '票', 'CUSTOMS', true, 'system', 1),

('FCL006', '拖车费', 'Trucking Fee', 'TKF', 'CNY', '应税', '增值税专票', '境内运输费用', '拖车', '运输公司', '营业成本', '应付', '货物从发货地到港口的陆路运输费', 'Inland trucking from shipper to port', 800, 1500, 1200, '票', 'TRUCK', true, 'system', 1),

('FCL007', '仓储费', 'Warehouse Storage Fee', 'WSF', 'CNY', '应税', '增值税专票', '仓储费用', '仓储', '仓储公司', '营业成本', '应付', '货物在仓库存储期间产生的费用', 'Storage charges for goods in warehouse', 5, 12, 8, 'CBM/天', 'WAREHOUSE', true, 'system', 1),

('FCL008', '装箱费', 'Container Loading Fee', 'CLF', 'CNY', '应税', '增值税专票', '装卸费用', '内装', '装卸公司', '营业成本', '应付', '货物装入集装箱的作业费用', 'Fee for loading cargo into containers', 200, 500, 300, '箱', 'OCEAN', true, 'system', 1),

('FCL009', '单证费', 'Documentation Fee', 'DOC', 'CNY', '应税', '增值税专票', '单证文件费用', 'MBL', '货代公司', '营业收入', '应收', '制作和处理各类出口单证文件费用', 'Fee for preparing and processing export documentation', 50, 200, 100, '套', 'OCEAN', true, 'system', 1),

('FCL010', '保险费', 'Marine Insurance Premium', 'INS', 'CNY', '应税', '增值税专票', '保险费用', '保险', '保险公司', '营业成本', '应付', '货物运输保险费', 'Marine cargo insurance premium', 0.1, 0.5, 0.3, '%', 'OCEAN', true, 'system', 1),

-- 空运费用
('AIR001', '空运费', 'Air Freight', 'AF', 'CNY', '应税', '增值税专票', '跨境运输费用', '空运', '航空公司', '营业收入', '应收', '航空货物运输基本运费', 'Basic air freight charges', 18, 35, 25, 'KG', 'AIR', true, 'system', 1),

('AIR002', '燃油附加费', 'Fuel Surcharge', 'FSC', 'CNY', '应税', '增值税专票', '跨境运输费用', '空运', '航空公司', '营业收入', '应收', '航空燃油价格波动附加费', 'Air freight fuel surcharge', 2, 8, 5, 'KG', 'AIR', true, 'system', 1),

('AIR003', '安检费', 'Security Fee', 'SEC', 'CNY', '应税', '增值税专票', '关检费用', '安检', '机场', '营业成本', '应付', '航空货物安全检查费', 'Air cargo security screening fee', 1, 3, 2, 'KG', 'AIR', true, 'system', 1),

-- 陆运费用
('TRK001', '陆运费', 'Trucking Fee', 'TRK', 'CNY', '应税', '增值税专票', '境内运输费用', '陆运', '运输公司', '营业成本', '应付', '公路货物运输费', 'Road transportation fee', 2.8, 4.5, 3.5, '公里', 'TRUCK', true, 'system', 1),

-- 铁运费用
('RAIL001', '铁路运费', 'Rail Freight', 'RF', 'CNY', '应税', '增值税专票', '跨境运输费用', '铁运', '铁路公司', '营业成本', '应付', '铁路货物运输费', 'Railway transportation fee', 18000, 28000, 22000, '箱', 'RAIL', true, 'system', 1),

-- VGM费用
('FCL011', 'VGM费', 'Verified Gross Mass Fee', 'VGM', 'CNY', '应税', '增值税专票', '单证文件费用', '内装', '码头/场站', '营业成本', '应付', '集装箱核实总重量申报费', 'Fee for container verified gross mass declaration', 50, 150, 100, '箱', 'OCEAN', true, 'system', 1),

-- 舱单费
('FCL012', '舱单费', 'Manifest Fee', 'MNF', 'USD', '应税', '增值税专票', '单证文件费用', '舱单', '船公司', '营业成本', '应付', '向海关申报舱单信息费用', 'Fee for manifest declaration to customs', 25, 50, 35, '票', 'OCEAN', true, 'system', 1),

-- AMS费
('FCL013', 'AMS费', 'Automated Manifest System Fee', 'AMS', 'USD', '应税', '增值税专票', '单证文件费用', '舱单', '船公司', '营业成本', '应付', '美国自动舱单系统申报费', 'Fee for US Automated Manifest System filing', 15, 30, 25, '票', 'OCEAN', true, 'system', 1),

-- 换单费
('FCL014', '换单费', 'Bill of Lading Release Fee', 'D/O', 'USD', '应税', '增值税专票', '单证文件费用', '换单', '船代', '营业收入', '应收', '目的港换取提货单费用', 'Fee for exchanging B/L for delivery order at destination', 30, 80, 50, '票', 'OCEAN', true, 'system', 1),

-- 电放费
('FCL015', '电放费', 'Telex Release Fee', 'TLX', 'USD', '应税', '增值税专票', '单证文件费用', 'MBL', '船公司', '营业收入', '应收', '提单电放服务费', 'Fee for telex release of bill of lading', 25, 60, 40, '票', 'OCEAN', true, 'system', 1);

COMMENT ON TABLE service_config IS '服务配置表 - 基于第三版费用科目标准';
COMMENT ON COLUMN service_config.fee_code IS '全局费用编码';
COMMENT ON COLUMN service_config.chinese_name IS '中文费用名称';
COMMENT ON COLUMN service_config.english_name IS '英文费用名称';
COMMENT ON COLUMN service_config.abbreviation IS '助记符';
COMMENT ON COLUMN service_config.fee_category IS '所属费用分类';
COMMENT ON COLUMN service_config.business_type IS '业务类型(OCEAN/AIR/TRUCK/RAIL/CUSTOMS/WAREHOUSE)';
COMMENT ON COLUMN service_config.standard_rate IS '标准费率';
COMMENT ON COLUMN service_config.min_rate IS '最低费率';
COMMENT ON COLUMN service_config.max_rate IS '最高费率';
COMMENT ON COLUMN service_config.unit IS '计费单位';