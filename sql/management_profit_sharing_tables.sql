-- OneOrder管理账分润计算模块数据库表设计
-- 基于PRD v1.1需求文档

-- 1. 管理账分润结果表
CREATE TABLE management_profit_sharing_results (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    sales_department_id VARCHAR(50) NOT NULL,  -- 销售部门ID
    operation_department_id VARCHAR(50) NOT NULL, -- 操作部门ID
    external_revenue DECIMAL(15,2) NOT NULL,   -- 外部收入
    external_cost DECIMAL(15,2) NOT NULL,      -- 外部支出
    gross_profit DECIMAL(15,2) NOT NULL,       -- 毛利
    profit_sharing_ratio VARCHAR(20) NOT NULL, -- 分润比例(如"50:50")
    sales_profit_amount DECIMAL(15,2) NOT NULL, -- 销售分润金额
    operation_profit_amount DECIMAL(15,2) NOT NULL, -- 操作分润金额
    sales_internal_payment DECIMAL(15,2) NOT NULL, -- 销售内部支出
    operation_internal_income DECIMAL(15,2) NOT NULL, -- 操作内部收入
    calculation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_version INTEGER DEFAULT 1,      -- 计算版本
    status VARCHAR(20) DEFAULT 'ACTIVE',        -- 状态: ACTIVE/ARCHIVED
    
    -- 外键约束
    CONSTRAINT fk_profit_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    
    -- 索引
    INDEX idx_order_service (order_id, service_code),
    INDEX idx_calculation_time (calculation_time),
    INDEX idx_sales_dept (sales_department_id),
    INDEX idx_operation_dept (operation_department_id)
);

-- 2. 部门汇总表（五项要素完整版）
CREATE TABLE department_profit_summary (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    department_id VARCHAR(50) NOT NULL,        -- 部门ID
    department_name VARCHAR(100) NOT NULL,     -- 部门名称
    department_type VARCHAR(20) NOT NULL,      -- 部门类型: SALES/OPERATION
    external_revenue DECIMAL(15,2) DEFAULT 0,  -- 外部收入
    internal_income DECIMAL(15,2) DEFAULT 0,   -- 内部收入
    internal_payment DECIMAL(15,2) DEFAULT 0,  -- 内部支出
    external_cost DECIMAL(15,2) DEFAULT 0,     -- 外部支出
    department_profit DECIMAL(15,2) NOT NULL,  -- 部门毛利
    profit_margin DECIMAL(5,4),                -- 利润率
    service_count INTEGER DEFAULT 0,           -- 涉及服务数量
    calculation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_version INTEGER DEFAULT 1,      -- 计算版本
    
    -- 验证约束：部门毛利 = 外部收入 + 内部收入 - 内部支出 - 外部支出
    CONSTRAINT chk_profit_balance CHECK (
        ABS(department_profit - (external_revenue + internal_income - internal_payment - external_cost)) < 0.01
    ),
    
    -- 外键约束
    CONSTRAINT fk_summary_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    
    -- 唯一约束
    UNIQUE KEY uk_order_dept (order_id, department_id),
    
    -- 索引
    INDEX idx_department_type (department_type),
    INDEX idx_profit_margin (profit_margin),
    INDEX idx_calculation_time (calculation_time)
);

-- 3. 内部协议配置表
CREATE TABLE internal_profit_sharing_protocols (
    id BIGSERIAL PRIMARY KEY,
    protocol_name VARCHAR(100) NOT NULL,       -- 协议名称
    service_code VARCHAR(50),                  -- 适用服务(NULL表示全部)
    sales_department_id VARCHAR(50),           -- 适用销售部门(NULL表示全部)
    operation_department_id VARCHAR(50),       -- 适用操作部门(NULL表示全部)
    sales_ratio DECIMAL(5,4) NOT NULL,         -- 销售分润比例
    operation_ratio DECIMAL(5,4) NOT NULL,     -- 操作分润比例
    priority INTEGER DEFAULT 1,                -- 优先级(数字越大优先级越高)
    effective_date DATE NOT NULL,              -- 生效日期
    expiry_date DATE,                          -- 失效日期
    status VARCHAR(20) DEFAULT 'ACTIVE',       -- 状态: ACTIVE/INACTIVE
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    
    -- 约束：分润比例之和必须为100%
    CONSTRAINT chk_ratio_sum CHECK (ABS(sales_ratio + operation_ratio - 1.0000) < 0.0001),
    
    -- 索引
    INDEX idx_service_department (service_code, sales_department_id, operation_department_id),
    INDEX idx_priority_effective (priority DESC, effective_date DESC),
    INDEX idx_status_date (status, effective_date)
);

-- 4. 管理账计算历史表
CREATE TABLE management_profit_calculation_history (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    calculation_version INTEGER NOT NULL,
    calculation_status VARCHAR(20) NOT NULL,   -- PENDING/PROCESSING/COMPLETED/FAILED
    calculation_start_time TIMESTAMP NOT NULL,
    calculation_end_time TIMESTAMP,
    total_gross_profit DECIMAL(15,2),
    service_count INTEGER,
    department_count INTEGER,
    error_message TEXT,
    calculation_notes TEXT,
    calculated_by VARCHAR(50) NOT NULL,
    
    -- 外键约束
    CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    
    -- 索引
    INDEX idx_order_version (order_id, calculation_version),
    INDEX idx_status_time (calculation_status, calculation_start_time)
);

-- 5. 分润计算明细日志表
CREATE TABLE profit_calculation_detail_log (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    calculation_version INTEGER NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    step_name VARCHAR(50) NOT NULL,            -- 计算步骤名称
    step_sequence INTEGER NOT NULL,            -- 步骤序号
    input_data JSON,                           -- 输入数据
    output_data JSON,                          -- 输出数据
    calculation_formula TEXT,                  -- 计算公式
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_duration_ms INTEGER,             -- 执行耗时(毫秒)
    
    -- 索引
    INDEX idx_calc_log (order_id, calculation_version, service_code),
    INDEX idx_step_sequence (step_sequence)
);

-- 插入默认协议数据
INSERT INTO internal_profit_sharing_protocols (
    protocol_name, service_code, sales_department_id, operation_department_id,
    sales_ratio, operation_ratio, priority, effective_date, created_by
) VALUES 
-- 海运相关协议
('海运MBL处理标准协议', 'MBL_PROCESSING', 'OCEAN_SALES', 'OCEAN_OPERATION', 0.5000, 0.5000, 10, '2025-01-01', 'SYSTEM'),
('海运HBL处理标准协议', 'HBL_PROCESSING', 'OCEAN_SALES', 'OCEAN_OPERATION', 0.5000, 0.5000, 10, '2025-01-01', 'SYSTEM'),
('海运预订服务协议', 'BOOKING', 'OCEAN_SALES', 'OCEAN_OPERATION', 0.6000, 0.4000, 10, '2025-01-01', 'SYSTEM'),

-- 空运相关协议
('空运预订服务协议', 'BOOKING', 'AIR_SALES', 'AIR_OPERATION', 0.6000, 0.4000, 10, '2025-01-01', 'SYSTEM'),
('空运清关服务协议', 'CUSTOMS_CLEARANCE', 'AIR_SALES', 'AIR_OPERATION', 0.4000, 0.6000, 10, '2025-01-01', 'SYSTEM'),

-- 陆运相关协议
('陆运运输服务协议', 'TRANSPORTATION', 'LAND_SALES', 'LAND_OPERATION', 0.5000, 0.5000, 10, '2025-01-01', 'SYSTEM'),
('陆运清关服务协议', 'CUSTOMS_CLEARANCE', 'LAND_SALES', 'LAND_OPERATION', 0.4000, 0.6000, 10, '2025-01-01', 'SYSTEM'),

-- 内装相关协议
('内装操作服务协议', 'CONTAINER_LOADING', 'OCEAN_SALES', 'CONTAINER_OPERATION', 0.4000, 0.6000, 10, '2025-01-01', 'SYSTEM'),

-- 报关相关协议
('报关服务标准协议', 'CUSTOMS_CLEARANCE', 'OCEAN_SALES', 'CUSTOMS_OPERATION', 0.3000, 0.7000, 10, '2025-01-01', 'SYSTEM'),

-- 通用默认协议(优先级最低)
('通用服务分润协议', NULL, NULL, NULL, 0.5000, 0.5000, 1, '2025-01-01', 'SYSTEM');

-- 创建视图：部门分润汇总视图
CREATE VIEW v_department_profit_summary AS
SELECT 
    dps.order_id,
    dps.department_id,
    dps.department_name,
    dps.department_type,
    dps.external_revenue,
    dps.internal_income,
    dps.internal_payment,
    dps.external_cost,
    dps.department_profit,
    dps.profit_margin,
    dps.service_count,
    dps.calculation_time,
    o.customer_name,
    o.business_type,
    o.order_status
FROM department_profit_summary dps
LEFT JOIN orders o ON dps.order_id = o.order_id
WHERE dps.status = 'ACTIVE';

-- 创建视图：订单分润概览
CREATE VIEW v_order_profit_overview AS
SELECT 
    order_id,
    calculation_time,
    SUM(external_revenue) as total_external_revenue,
    SUM(external_cost) as total_external_cost,
    SUM(internal_income) as total_internal_income,
    SUM(internal_payment) as total_internal_payment,
    SUM(department_profit) as total_department_profit,
    COUNT(DISTINCT department_id) as department_count,
    AVG(profit_margin) as avg_profit_margin
FROM department_profit_summary
GROUP BY order_id, calculation_time;

-- 创建索引优化查询性能
CREATE INDEX idx_profit_results_order_service ON management_profit_sharing_results(order_id, service_code);
CREATE INDEX idx_dept_summary_order_dept ON department_profit_summary(order_id, department_id);
CREATE INDEX idx_protocols_match ON internal_profit_sharing_protocols(service_code, sales_department_id, operation_department_id, status, effective_date);

-- 添加数据验证存储过程
DELIMITER //

CREATE PROCEDURE ValidateManagementProfitData(IN p_order_id VARCHAR(50))
BEGIN
    DECLARE v_internal_income_sum DECIMAL(15,2);
    DECLARE v_internal_payment_sum DECIMAL(15,2);
    DECLARE v_total_dept_profit DECIMAL(15,2);
    DECLARE v_order_gross_profit DECIMAL(15,2);
    
    -- 计算内部收支总和
    SELECT 
        SUM(internal_income),
        SUM(internal_payment),
        SUM(department_profit)
    INTO v_internal_income_sum, v_internal_payment_sum, v_total_dept_profit
    FROM department_profit_summary 
    WHERE order_id = p_order_id;
    
    -- 计算订单总毛利
    SELECT SUM(gross_profit) INTO v_order_gross_profit
    FROM management_profit_sharing_results
    WHERE order_id = p_order_id;
    
    -- 验证内部收支平衡
    IF ABS(v_internal_income_sum - v_internal_payment_sum) > 0.01 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = '内部收支不平衡';
    END IF;
    
    -- 验证部门毛利合计等于订单毛利
    IF ABS(v_total_dept_profit - v_order_gross_profit) > 0.01 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = '部门毛利合计与订单毛利不一致';
    END IF;
    
    SELECT 
        '验证通过' as result,
        v_internal_income_sum as internal_income_sum,
        v_internal_payment_sum as internal_payment_sum,
        v_total_dept_profit as total_dept_profit,
        v_order_gross_profit as order_gross_profit;
        
END //

DELIMITER ;

-- 添加注释
ALTER TABLE management_profit_sharing_results COMMENT = '管理账分润计算结果表，存储每个服务的分润详情';
ALTER TABLE department_profit_summary COMMENT = '部门汇总表，按五项要素汇总部门收支情况';
ALTER TABLE internal_profit_sharing_protocols COMMENT = '内部协议配置表，定义部门间分润规则';
ALTER TABLE management_profit_calculation_history COMMENT = '管理账计算历史记录表';
ALTER TABLE profit_calculation_detail_log COMMENT = '分润计算明细日志表，用于审计和调试';