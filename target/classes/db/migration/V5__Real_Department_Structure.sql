-- V5: 基于真实业务数据的部门结构初始化
-- 根据实际销售和操作部门层级关系设计

-- 清空现有部门数据重新初始化
DELETE FROM department WHERE id > 0;

-- 重置序列
ALTER SEQUENCE department_id_seq RESTART WITH 1;

-- ============================
-- 一级销售部门
-- ============================
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
-- 地域性销售部门
('中国东区', 'SALES_EAST', 'SALES', NULL, 1, true, NOW()),
('中国西区', 'SALES_WEST', 'SALES', NULL, 1, true, NOW()),
('中国南区', 'SALES_SOUTH', 'SALES', NULL, 1, true, NOW()),
('中国北区', 'SALES_NORTH', 'SALES', NULL, 1, true, NOW()),

-- 专业化销售部门
('集团大客户部', 'SALES_KEY_ACCOUNT', 'SALES', NULL, 1, true, NOW()),
('上海海领供应链', 'SALES_HAILING', 'SALES', NULL, 1, true, NOW()),
('半导体解决方案部', 'SALES_SEMICONDUCTOR', 'SALES', NULL, 1, true, NOW()),

-- 事业部销售
('空运事业部', 'SALES_AIR', 'SALES', NULL, 1, true, NOW()),
('海运事业部', 'SALES_OCEAN', 'SALES', NULL, 1, true, NOW()),
('铁运事业部', 'SALES_RAIL', 'SALES', NULL, 1, true, NOW()),
('海外中心', 'SALES_OVERSEAS', 'SALES', NULL, 1, true, NOW());

-- ============================
-- 二级销售部门（基于一级部门）
-- ============================

-- 中国东区下属二级部门
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
('上海分公司', 'SALES_EAST_SH', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_EAST'), 2, true, NOW()),
('合肥分公司', 'SALES_EAST_HF', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_EAST'), 2, true, NOW()),
('福建分公司', 'SALES_EAST_FJ', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_EAST'), 2, true, NOW()),
('武汉分公司', 'SALES_EAST_WH', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_EAST'), 2, true, NOW()),
('电商业务部', 'SALES_EAST_EC', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_EAST'), 2, true, NOW()),
('大客户部', 'SALES_EAST_KEY', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_EAST'), 2, true, NOW()),
('西安海邦', 'SALES_EAST_XAHB', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_EAST'), 2, true, NOW());

-- 中国西区下属二级部门
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
('成都分公司', 'SALES_WEST_CD', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_WEST'), 2, true, NOW()),
('大客户项目一部', 'SALES_WEST_KEY1', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_WEST'), 2, true, NOW()),
('大客户项目二部', 'SALES_WEST_KEY2', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_WEST'), 2, true, NOW()),
('大客户项目三部', 'SALES_WEST_KEY3', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_WEST'), 2, true, NOW()),
('大客户部', 'SALES_WEST_KEY', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_WEST'), 2, true, NOW());

-- 中国南区下属二级部门  
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
('深圳分公司', 'SALES_SOUTH_SZ', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_SOUTH'), 2, true, NOW()),
('广州分公司', 'SALES_SOUTH_GZ', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_SOUTH'), 2, true, NOW()),
('广西分公司', 'SALES_SOUTH_GX', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_SOUTH'), 2, true, NOW()),
('南区大客户部', 'SALES_SOUTH_KEY', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_SOUTH'), 2, true, NOW()),
('海南特区', 'SALES_SOUTH_HN', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_SOUTH'), 2, true, NOW()),
('电商业务部', 'SALES_SOUTH_EC', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_SOUTH'), 2, true, NOW());

-- 中国北区下属二级部门
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
('青岛业务一部', 'SALES_NORTH_QD1', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('青岛业务二部', 'SALES_NORTH_QD2', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('青岛业务三部', 'SALES_NORTH_QD3', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('烟威分公司', 'SALES_NORTH_YW', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('郑州分公司', 'SALES_NORTH_ZZ', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('淄博分公司', 'SALES_NORTH_ZB', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('鲁中南分公司', 'SALES_NORTH_LZN', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('西安分公司', 'SALES_NORTH_XA', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('吉通仓储部', 'SALES_NORTH_JT', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('展览部', 'SALES_NORTH_ZL', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('客户解决方案部', 'SALES_NORTH_SOLUTION', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('关务单证中心', 'SALES_NORTH_CUSTOMS', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('陆运部', 'SALES_NORTH_TRUCK', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW()),
('青岛海邦', 'SALES_NORTH_QDHB', 'SALES', (SELECT id FROM department WHERE dept_code = 'SALES_NORTH'), 2, true, NOW());

-- ============================
-- 一级操作部门
-- ============================
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
-- 地域性操作部门
('中国东区', 'OP_EAST', 'OPERATION', NULL, 1, true, NOW()),
('中国西区', 'OP_WEST', 'OPERATION', NULL, 1, true, NOW()),
('中国南区', 'OP_SOUTH', 'OPERATION', NULL, 1, true, NOW()),
('中国北区', 'OP_NORTH', 'OPERATION', NULL, 1, true, NOW()),

-- 专业化操作部门
('上海海领供应链', 'OP_HAILING', 'OPERATION', NULL, 1, true, NOW()),
('半导体解决方案部', 'OP_SEMICONDUCTOR', 'OPERATION', NULL, 1, true, NOW()),

-- 事业部操作
('空运事业部', 'OP_AIR', 'OPERATION', NULL, 1, true, NOW()),
('海运事业部', 'OP_OCEAN', 'OPERATION', NULL, 1, true, NOW()),
('铁运事业部', 'OP_RAIL', 'OPERATION', NULL, 1, true, NOW()),
('海外中心', 'OP_OVERSEAS', 'OPERATION', NULL, 1, true, NOW());

-- ============================
-- 二级操作部门（基于一级部门）
-- ============================

-- 中国东区下属操作二级部门
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
('上海分公司', 'OP_EAST_SH', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW()),
('合肥分公司', 'OP_EAST_HF', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW()),
('福建分公司', 'OP_EAST_FJ', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW()),
('武汉分公司', 'OP_EAST_WH', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW()),
('电商业务部', 'OP_EAST_EC', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW()),
('上海途畅', 'OP_EAST_TC', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW()),
('武汉邦达吉通', 'OP_EAST_WHJT', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW()),
('西安海邦', 'OP_EAST_XAHB', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_EAST'), 2, true, NOW());

-- 空运事业部下属操作二级部门
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
('空运东区', 'OP_AIR_EAST', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_AIR'), 2, true, NOW()),
('空运西区', 'OP_AIR_WEST', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_AIR'), 2, true, NOW()),
('空运南区', 'OP_AIR_SOUTH', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_AIR'), 2, true, NOW()),
('空运北区', 'OP_AIR_NORTH', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_AIR'), 2, true, NOW()),
('空运海外部', 'OP_AIR_OVERSEAS', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_AIR'), 2, true, NOW()),
('空运项目中心', 'OP_AIR_PROJECT', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_AIR'), 2, true, NOW());

-- 海运事业部下属操作二级部门  
INSERT INTO department (dept_name, dept_code, dept_type, parent_id, level_num, is_active, created_time) VALUES
('海运东区', 'OP_OCEAN_EAST', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('上海站', 'OP_OCEAN_SH', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('深圳站', 'OP_OCEAN_SZ', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('厦门站', 'OP_OCEAN_XM', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('青岛站', 'OP_OCEAN_QD', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('天津站', 'OP_OCEAN_TJ', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('宁波北美站', 'OP_OCEAN_NBNA', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('宁波非美站', 'OP_OCEAN_NBNNA', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('嘉兴站', 'OP_OCEAN_JX', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('南京站', 'OP_OCEAN_NJ', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('顺圆物流（香港）', 'OP_OCEAN_HK', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('海运北区', 'OP_OCEAN_NORTH', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('营销支持部', 'OP_OCEAN_MARKETING', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('运营管理部', 'OP_OCEAN_OPS', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('北美航线产品部', 'OP_OCEAN_NAPRODUCT', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('北美海外业务发展部', 'OP_OCEAN_NADEV', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW()),
('系统运维部', 'OP_OCEAN_IT', 'OPERATION', (SELECT id FROM department WHERE dept_code = 'OP_OCEAN'), 2, true, NOW());

-- 其他操作部门的二级部门...
-- (继续添加其他操作部门的二级结构)

-- ============================
-- 业务类型配置
-- ============================
INSERT INTO service_config (fee_code, fee_name, business_type, fee_type, currency, unit_price, description, is_active, created_time) VALUES
-- 基于真实业务类型添加服务配置
('AIR_EXPORT', '空运出口', 'AIR', 'SERVICE', 'CNY', 500.00, '空运出口基础服务费', true, NOW()),
('AIR_IMPORT', '空运进口', 'AIR', 'SERVICE', 'CNY', 450.00, '空运进口基础服务费', true, NOW()),
('AIR_DOMESTIC', '空运国内', 'AIR', 'SERVICE', 'CNY', 300.00, '空运国内运输服务费', true, NOW()),
('AIR_OVERSEAS', '空运境外', 'AIR', 'SERVICE', 'USD', 80.00, '空运境外服务费', true, NOW()),

('OCEAN_EXPORT', '海运出口', 'OCEAN', 'SERVICE', 'CNY', 800.00, '海运出口基础服务费', true, NOW()),
('OCEAN_IMPORT', '海运进口', 'OCEAN', 'SERVICE', 'CNY', 750.00, '海运进口基础服务费', true, NOW()),
('OCEAN_OVERSEAS', '海运境外', 'OCEAN', 'SERVICE', 'USD', 120.00, '海运境外服务费', true, NOW()),
('OCEAN_OTHER', '海运其他', 'OCEAN', 'SERVICE', 'CNY', 600.00, '海运其他服务费', true, NOW()),

('RAIL_EXPORT', '铁运出口', 'RAIL', 'SERVICE', 'CNY', 400.00, '铁运出口基础服务费', true, NOW()),
('RAIL_IMPORT', '铁运进口', 'RAIL', 'SERVICE', 'CNY', 380.00, '铁运进口基础服务费', true, NOW()),
('RAIL_OTHER', '铁运其他', 'RAIL', 'SERVICE', 'CNY', 350.00, '铁运其他服务费', true, NOW()),

('TRUCK_SERVICE', '陆运', 'TRUCK', 'SERVICE', 'CNY', 200.00, '陆运基础服务费', true, NOW()),
('CUSTOMS_SERVICE', '报关', 'CUSTOMS', 'SERVICE', 'CNY', 300.00, '报关基础服务费', true, NOW()),
('WAREHOUSE_SERVICE', '仓储', 'WAREHOUSE', 'SERVICE', 'CNY', 150.00, '仓储基础服务费', true, NOW()),
('OTHER_SERVICE', '其他', 'OTHER', 'SERVICE', 'CNY', 100.00, '其他服务费', true, NOW());

-- 添加部门业务类型关联表
CREATE TABLE IF NOT EXISTS department_business_type (
    id SERIAL PRIMARY KEY,
    sales_dept_id INTEGER REFERENCES department(id),
    operation_dept_id INTEGER REFERENCES department(id),
    business_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_dept_business_sales ON department_business_type(sales_dept_id);
CREATE INDEX idx_dept_business_operation ON department_business_type(operation_dept_id);
CREATE INDEX idx_dept_business_type ON department_business_type(business_type);

COMMENT ON TABLE department_business_type IS '部门业务类型关联表，记录销售部门和操作部门的业务协作关系';
COMMENT ON COLUMN department_business_type.sales_dept_id IS '销售部门ID';
COMMENT ON COLUMN department_business_type.operation_dept_id IS '操作部门ID';
COMMENT ON COLUMN department_business_type.business_type IS '业务类型：空运出口、海运进口、报关、陆运等';