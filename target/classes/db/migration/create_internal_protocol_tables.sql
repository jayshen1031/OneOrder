-- 内部协议相关表创建脚本
-- 基于PRD设计 v2.0

-- 1. 员工表(staff)
CREATE TABLE staff (
    staff_id VARCHAR(20) PRIMARY KEY,
    staff_name VARCHAR(50) NOT NULL,
    legal_entity_id VARCHAR(20) NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('SALES', 'OPERATION', 'MANAGER')),
    phone VARCHAR(20),
    email VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entity(entity_id)
);

-- 创建员工表索引
CREATE INDEX idx_staff_department ON staff(department_id);
CREATE INDEX idx_staff_role_type ON staff(role_type);
CREATE INDEX idx_staff_active ON staff(active);

-- 2. 部门表(department)
CREATE TABLE department (
    department_id VARCHAR(20) PRIMARY KEY,
    department_name VARCHAR(50) NOT NULL,
    department_type VARCHAR(20) NOT NULL CHECK (department_type IN ('SALES', 'OCEAN_OP', 'AIR_OP', 'TRUCK_OP', 'RAIL_OP', 'CUSTOMS_OP', 'WAREHOUSE_OP')),
    legal_entity_id VARCHAR(20) NOT NULL,
    manager_id VARCHAR(20),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entity(entity_id),
    FOREIGN KEY (manager_id) REFERENCES staff(staff_id)
);

-- 添加外键约束到staff表
ALTER TABLE staff ADD FOREIGN KEY (department_id) REFERENCES department(department_id);

-- 创建部门表索引
CREATE INDEX idx_department_type ON department(department_type);
CREATE INDEX idx_department_entity ON department(legal_entity_id);

-- 3. 内部协议表(internal_protocol)
CREATE TABLE internal_protocol (
    protocol_id VARCHAR(20) PRIMARY KEY,
    protocol_name VARCHAR(100) NOT NULL,
    sales_department_id VARCHAR(20) NOT NULL,
    operation_department_id VARCHAR(20) NOT NULL,
    service_code VARCHAR(20), -- NULL表示适用所有服务
    business_type VARCHAR(20) CHECK (business_type IN ('OCEAN', 'AIR', 'TRUCK', 'RAIL', 'CUSTOMS', 'WAREHOUSE')), -- NULL表示适用所有业务类型
    base_commission_rate DECIMAL(5,2) NOT NULL CHECK (base_commission_rate >= 0 AND base_commission_rate <= 100), -- 基础佣金率(%)
    performance_bonus_rate DECIMAL(5,2) DEFAULT 0 CHECK (performance_bonus_rate >= 0 AND performance_bonus_rate <= 100), -- 绩效奖金率(%)
    active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(20),
    
    FOREIGN KEY (sales_department_id) REFERENCES department(department_id),
    FOREIGN KEY (operation_department_id) REFERENCES department(department_id),
    FOREIGN KEY (service_code) REFERENCES service_config(fee_code),
    FOREIGN KEY (created_by) REFERENCES staff(staff_id),
    
    CHECK (expiry_date IS NULL OR effective_date <= expiry_date)
);

-- 创建内部协议表索引
CREATE INDEX idx_protocol_departments ON internal_protocol(sales_department_id, operation_department_id);
CREATE INDEX idx_protocol_service ON internal_protocol(service_code);
CREATE INDEX idx_protocol_business_type ON internal_protocol(business_type);
CREATE INDEX idx_protocol_active_dates ON internal_protocol(active, effective_date, expiry_date);

-- 4. 协议分润规则表(protocol_revenue_rule)
CREATE TABLE protocol_revenue_rule (
    rule_id VARCHAR(20) PRIMARY KEY,
    protocol_id VARCHAR(20) NOT NULL,
    legal_entity_id VARCHAR(20) NOT NULL,
    sales_commission_rate DECIMAL(5,2) NOT NULL CHECK (sales_commission_rate >= 0 AND sales_commission_rate <= 100), -- 销售佣金率(%)
    operation_commission_rate DECIMAL(5,2) NOT NULL CHECK (operation_commission_rate >= 0 AND operation_commission_rate <= 100), -- 操作佣金率(%)
    management_fee_rate DECIMAL(5,2) NOT NULL CHECK (management_fee_rate >= 0 AND management_fee_rate <= 100), -- 管理费率(%)
    revenue_split_method VARCHAR(20) DEFAULT 'PERCENTAGE' CHECK (revenue_split_method IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    active BOOLEAN DEFAULT true,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (protocol_id) REFERENCES internal_protocol(protocol_id) ON DELETE CASCADE,
    FOREIGN KEY (legal_entity_id) REFERENCES legal_entity(entity_id),
    
    -- 确保总佣金率不超过100%
    CHECK (sales_commission_rate + operation_commission_rate + management_fee_rate <= 100)
);

-- 创建分润规则表索引
CREATE INDEX idx_revenue_rule_protocol ON protocol_revenue_rule(protocol_id);
CREATE INDEX idx_revenue_rule_entity ON protocol_revenue_rule(legal_entity_id);

-- 5. 订单服务表(order_service) - 支持内部协议
CREATE TABLE order_service (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    service_code VARCHAR(20) NOT NULL, -- 关联service_config.fee_code
    operation_staff_id VARCHAR(20),
    operation_department_id VARCHAR(20),
    internal_protocol_id VARCHAR(20), -- 关联internal_protocol.protocol_id
    service_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'PROTOCOL_CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    assigned_time TIMESTAMP,
    protocol_confirmed_time TIMESTAMP,
    started_time TIMESTAMP,
    completed_time TIMESTAMP,
    notes TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (service_code) REFERENCES service_config(fee_code),
    FOREIGN KEY (operation_staff_id) REFERENCES staff(staff_id),
    FOREIGN KEY (operation_department_id) REFERENCES department(department_id),
    FOREIGN KEY (internal_protocol_id) REFERENCES internal_protocol(protocol_id)
);

-- 创建订单服务表索引
CREATE INDEX idx_order_service_order ON order_service(order_id);
CREATE INDEX idx_order_service_staff ON order_service(operation_staff_id);
CREATE INDEX idx_order_service_status ON order_service(status);
CREATE INDEX idx_order_service_protocol ON order_service(internal_protocol_id);

-- 6. 扩展orders表 - 添加销售人员和部门信息
ALTER TABLE orders ADD COLUMN sales_staff_id VARCHAR(20);
ALTER TABLE orders ADD COLUMN sales_department_id VARCHAR(20);

-- 添加外键约束
ALTER TABLE orders ADD FOREIGN KEY (sales_staff_id) REFERENCES staff(staff_id);
ALTER TABLE orders ADD FOREIGN KEY (sales_department_id) REFERENCES department(department_id);

-- 创建索引
CREATE INDEX idx_orders_sales_staff ON orders(sales_staff_id);
CREATE INDEX idx_orders_sales_department ON orders(sales_department_id);

-- 添加注释
COMMENT ON TABLE staff IS '员工表 - 存储销售和操作人员信息';
COMMENT ON TABLE department IS '部门表 - 存储销售部门和操作部门信息';
COMMENT ON TABLE internal_protocol IS '内部协议表 - 存储部门间协作协议';
COMMENT ON TABLE protocol_revenue_rule IS '协议分润规则表 - 定义协议的分润比例';
COMMENT ON TABLE order_service IS '订单服务表 - 存储订单中的具体服务项和协议信息';

COMMENT ON COLUMN internal_protocol.base_commission_rate IS '基础佣金率(%)';
COMMENT ON COLUMN internal_protocol.performance_bonus_rate IS '绩效奖金率(%)';
COMMENT ON COLUMN protocol_revenue_rule.sales_commission_rate IS '销售佣金率(%)';
COMMENT ON COLUMN protocol_revenue_rule.operation_commission_rate IS '操作佣金率(%)';
COMMENT ON COLUMN protocol_revenue_rule.management_fee_rate IS '管理费率(%)';