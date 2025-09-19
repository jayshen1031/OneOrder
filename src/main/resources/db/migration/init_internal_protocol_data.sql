-- 内部协议系统初始化数据
-- 基于PRD设计，创建基础的部门、员工和协议数据

-- 1. 插入部门数据
INSERT INTO department (department_id, department_name, department_type, legal_entity_id, created_time) VALUES
-- 销售部门
('DEPT_SALES_01', '销售一部', 'SALES', 'ENTITY_HCBD', CURRENT_TIMESTAMP),
('DEPT_SALES_02', '销售二部', 'SALES', 'ENTITY_HCBD', CURRENT_TIMESTAMP),

-- 操作部门
('DEPT_OCEAN_01', '海运操作部', 'OCEAN_OP', 'ENTITY_HCBD', CURRENT_TIMESTAMP),
('DEPT_AIR_01', '空运操作部', 'AIR_OP', 'ENTITY_HCBD', CURRENT_TIMESTAMP),
('DEPT_TRUCK_01', '陆运操作部', 'TRUCK_OP', 'ENTITY_HCBD', CURRENT_TIMESTAMP),
('DEPT_RAIL_01', '铁运操作部', 'RAIL_OP', 'ENTITY_HCBD', CURRENT_TIMESTAMP),
('DEPT_CUSTOMS_01', '关务操作部', 'CUSTOMS_OP', 'ENTITY_HCBD', CURRENT_TIMESTAMP),
('DEPT_WAREHOUSE_01', '仓储操作部', 'WAREHOUSE_OP', 'ENTITY_HCBD', CURRENT_TIMESTAMP);

-- 2. 插入员工数据
INSERT INTO staff (staff_id, staff_name, legal_entity_id, department_id, role_type, phone, email, active, created_time) VALUES
-- 销售人员
('SALES_001', '李小明', 'ENTITY_HCBD', 'DEPT_SALES_01', 'SALES', '13800138001', 'li.xiaoming@oneorder.com', true, CURRENT_TIMESTAMP),
('SALES_002', '王丽华', 'ENTITY_HCBD', 'DEPT_SALES_01', 'SALES', '13800138002', 'wang.lihua@oneorder.com', true, CURRENT_TIMESTAMP),
('SALES_003', '张伟强', 'ENTITY_HCBD', 'DEPT_SALES_02', 'SALES', '13800138003', 'zhang.weiqiang@oneorder.com', true, CURRENT_TIMESTAMP),

-- 海运操作人员
('OCEAN_001', '陈海峰', 'ENTITY_HCBD', 'DEPT_OCEAN_01', 'OPERATION', '13800138011', 'chen.haifeng@oneorder.com', true, CURRENT_TIMESTAMP),
('OCEAN_002', '刘波浪', 'ENTITY_HCBD', 'DEPT_OCEAN_01', 'OPERATION', '13800138012', 'liu.bolang@oneorder.com', true, CURRENT_TIMESTAMP),

-- 空运操作人员
('AIR_001', '赵飞燕', 'ENTITY_HCBD', 'DEPT_AIR_01', 'OPERATION', '13800138021', 'zhao.feiyan@oneorder.com', true, CURRENT_TIMESTAMP),
('AIR_002', '孙凌云', 'ENTITY_HCBD', 'DEPT_AIR_01', 'OPERATION', '13800138022', 'sun.lingyun@oneorder.com', true, CURRENT_TIMESTAMP),

-- 陆运操作人员
('TRUCK_001', '马奔驰', 'ENTITY_HCBD', 'DEPT_TRUCK_01', 'OPERATION', '13800138031', 'ma.benchi@oneorder.com', true, CURRENT_TIMESTAMP),

-- 铁运操作人员
('RAIL_001', '铁轨通', 'ENTITY_HCBD', 'DEPT_RAIL_01', 'OPERATION', '13800138041', 'tie.guitong@oneorder.com', true, CURRENT_TIMESTAMP),

-- 关务操作人员
('CUSTOMS_001', '关晓彤', 'ENTITY_HCBD', 'DEPT_CUSTOMS_01', 'OPERATION', '13800138051', 'guan.xiaotong@oneorder.com', true, CURRENT_TIMESTAMP),

-- 仓储操作人员
('WAREHOUSE_001', '仓管员', 'ENTITY_HCBD', 'DEPT_WAREHOUSE_01', 'OPERATION', '13800138061', 'warehouse.manager@oneorder.com', true, CURRENT_TIMESTAMP);

-- 3. 更新部门主管信息
UPDATE department SET manager_id = 'SALES_001' WHERE department_id = 'DEPT_SALES_01';
UPDATE department SET manager_id = 'SALES_003' WHERE department_id = 'DEPT_SALES_02';
UPDATE department SET manager_id = 'OCEAN_001' WHERE department_id = 'DEPT_OCEAN_01';
UPDATE department SET manager_id = 'AIR_001' WHERE department_id = 'DEPT_AIR_01';

-- 4. 插入内部协议数据
INSERT INTO internal_protocol (
    protocol_id, 
    protocol_name, 
    sales_department_id, 
    operation_department_id, 
    service_code, 
    business_type, 
    base_commission_rate, 
    performance_bonus_rate,
    active, 
    effective_date, 
    expiry_date,
    created_by
) VALUES
-- 海运协议
('PROTO_OCEAN_001', '海运标准协议', 'DEPT_SALES_01', 'DEPT_OCEAN_01', 'FCL001', 'OCEAN', 8.00, 2.00, true, '2025-01-01', '2025-12-31', 'SALES_001'),
('PROTO_OCEAN_002', '海运高级协议', 'DEPT_SALES_01', 'DEPT_OCEAN_01', 'FCL001', 'OCEAN', 10.00, 3.00, true, '2025-01-01', '2025-12-31', 'SALES_001'),
('PROTO_OCEAN_003', '海运燃油协议', 'DEPT_SALES_01', 'DEPT_OCEAN_01', 'FCL002', 'OCEAN', 6.00, 1.50, true, '2025-01-01', '2025-12-31', 'SALES_001'),

-- 空运协议
('PROTO_AIR_001', '空运标准协议', 'DEPT_SALES_01', 'DEPT_AIR_01', 'AIR001', 'AIR', 9.00, 2.50, true, '2025-01-01', '2025-12-31', 'SALES_001'),
('PROTO_AIR_002', '空运燃油协议', 'DEPT_SALES_01', 'DEPT_AIR_01', 'AIR002', 'AIR', 7.00, 2.00, true, '2025-01-01', '2025-12-31', 'SALES_001'),

-- 关务协议
('PROTO_CUSTOMS_001', '报关标准协议', 'DEPT_SALES_01', 'DEPT_CUSTOMS_01', 'FCL005', 'CUSTOMS', 12.00, 3.00, true, '2025-01-01', '2025-12-31', 'SALES_001'),

-- 陆运协议
('PROTO_TRUCK_001', '陆运标准协议', 'DEPT_SALES_01', 'DEPT_TRUCK_01', 'FCL006', 'TRUCK', 8.50, 2.00, true, '2025-01-01', '2025-12-31', 'SALES_001'),

-- 仓储协议
('PROTO_WAREHOUSE_001', '仓储标准协议', 'DEPT_SALES_01', 'DEPT_WAREHOUSE_01', 'FCL007', 'WAREHOUSE', 11.00, 2.50, true, '2025-01-01', '2025-12-31', 'SALES_001'),

-- 通用协议（适用所有服务）
('PROTO_GENERAL_001', '销售一部通用协议', 'DEPT_SALES_01', 'DEPT_OCEAN_01', NULL, NULL, 7.50, 1.50, true, '2025-01-01', '2025-12-31', 'SALES_001'),
('PROTO_GENERAL_002', '销售二部通用协议', 'DEPT_SALES_02', 'DEPT_OCEAN_01', NULL, NULL, 7.00, 1.00, true, '2025-01-01', '2025-12-31', 'SALES_003');

-- 5. 插入协议分润规则数据
INSERT INTO protocol_revenue_rule (
    rule_id,
    protocol_id,
    legal_entity_id,
    sales_commission_rate,
    operation_commission_rate,
    management_fee_rate,
    revenue_split_method,
    active
) VALUES
-- 海运协议分润规则
('RULE_OCEAN_001', 'PROTO_OCEAN_001', 'ENTITY_HCBD', 60.00, 30.00, 10.00, 'PERCENTAGE', true),
('RULE_OCEAN_002', 'PROTO_OCEAN_002', 'ENTITY_HCBD', 55.00, 35.00, 10.00, 'PERCENTAGE', true),
('RULE_OCEAN_003', 'PROTO_OCEAN_003', 'ENTITY_HCBD', 65.00, 25.00, 10.00, 'PERCENTAGE', true),

-- 空运协议分润规则
('RULE_AIR_001', 'PROTO_AIR_001', 'ENTITY_HCBD', 58.00, 32.00, 10.00, 'PERCENTAGE', true),
('RULE_AIR_002', 'PROTO_AIR_002', 'ENTITY_HCBD', 62.00, 28.00, 10.00, 'PERCENTAGE', true),

-- 关务协议分润规则
('RULE_CUSTOMS_001', 'PROTO_CUSTOMS_001', 'ENTITY_HCBD', 50.00, 40.00, 10.00, 'PERCENTAGE', true),

-- 陆运协议分润规则
('RULE_TRUCK_001', 'PROTO_TRUCK_001', 'ENTITY_HCBD', 60.00, 30.00, 10.00, 'PERCENTAGE', true),

-- 仓储协议分润规则
('RULE_WAREHOUSE_001', 'PROTO_WAREHOUSE_001', 'ENTITY_HCBD', 55.00, 35.00, 10.00, 'PERCENTAGE', true),

-- 通用协议分润规则
('RULE_GENERAL_001', 'PROTO_GENERAL_001', 'ENTITY_HCBD', 60.00, 30.00, 10.00, 'PERCENTAGE', true),
('RULE_GENERAL_002', 'PROTO_GENERAL_002', 'ENTITY_HCBD', 65.00, 25.00, 10.00, 'PERCENTAGE', true);

-- 6. 创建一些示例订单服务数据
-- 注意：这里假设已经有一些订单数据，我们为它们添加服务项
-- 实际使用时，这些数据会通过API动态创建

INSERT INTO order_service (
    order_id,
    service_code,
    operation_staff_id,
    operation_department_id,
    internal_protocol_id,
    service_amount,
    status,
    assigned_time,
    notes
) VALUES
-- 示例：为假想的订单添加海运服务
('ORD20250915001', 'FCL001', 'OCEAN_001', 'DEPT_OCEAN_01', 'PROTO_OCEAN_001', 18000.00, 'ASSIGNED', CURRENT_TIMESTAMP, '海运费服务派单'),
('ORD20250915001', 'FCL002', 'OCEAN_001', 'DEPT_OCEAN_01', 'PROTO_OCEAN_003', 800.00, 'ASSIGNED', CURRENT_TIMESTAMP, '燃油附加费服务派单'),

-- 示例：为假想的订单添加空运服务
('ORD20250915002', 'AIR001', 'AIR_001', 'DEPT_AIR_01', 'PROTO_AIR_001', 25000.00, 'PROTOCOL_CONFIRMED', CURRENT_TIMESTAMP, '空运费服务已确认协议'),

-- 示例：为假想的订单添加关务服务
('ORD20250915003', 'FCL005', 'CUSTOMS_001', 'DEPT_CUSTOMS_01', 'PROTO_CUSTOMS_001', 500.00, 'IN_PROGRESS', CURRENT_TIMESTAMP, '报关服务执行中');

-- 7. 创建系统管理员账户
INSERT INTO staff (staff_id, staff_name, legal_entity_id, department_id, role_type, phone, email, active) VALUES
('ADMIN_001', '系统管理员', 'ENTITY_HCBD', 'DEPT_SALES_01', 'MANAGER', '13800138000', 'admin@oneorder.com', true);

-- 8. 验证数据完整性的查询（这些是注释，不会执行）
/*
-- 验证协议和分润规则的完整性
SELECT 
    p.protocol_id,
    p.protocol_name,
    p.sales_department_id,
    p.operation_department_id,
    p.base_commission_rate,
    r.sales_commission_rate,
    r.operation_commission_rate,
    r.management_fee_rate
FROM internal_protocol p
LEFT JOIN protocol_revenue_rule r ON p.protocol_id = r.protocol_id
WHERE p.active = true;

-- 验证部门和员工的关系
SELECT 
    d.department_name,
    d.department_type,
    COUNT(s.staff_id) as staff_count
FROM department d
LEFT JOIN staff s ON d.department_id = s.department_id
WHERE s.active = true
GROUP BY d.department_id, d.department_name, d.department_type
ORDER BY d.department_type, d.department_name;
*/