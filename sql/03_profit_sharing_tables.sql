-- OneOrder管理账分润计算模块数据表设计
-- 创建时间: 2025-09-16
-- 版本: v1.0
-- 说明: 支持部门维度分润计算、内部协议匹配、多服务合并汇总等功能

-- ===================================
-- 1. 部门分润计算主表(department_profit_sharing)
-- ===================================
CREATE TABLE department_profit_sharing (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    calculation_id VARCHAR(50) NOT NULL,        -- 计算批次ID
    department_id VARCHAR(50) NOT NULL,         -- 部门ID  
    department_name VARCHAR(100) NOT NULL,      -- 部门名称
    department_type VARCHAR(20) NOT NULL,       -- 部门类型: SALES/OPERATION
    service_code VARCHAR(50) NOT NULL,          -- 服务项目编码
    service_name VARCHAR(100) NOT NULL,         -- 服务项目名称
    
    -- 五项核心金额
    external_revenue DECIMAL(15,2) DEFAULT 0,   -- 外部收入
    internal_income DECIMAL(15,2) DEFAULT 0,    -- 内部收入
    internal_payment DECIMAL(15,2) DEFAULT 0,   -- 内部支出
    external_cost DECIMAL(15,2) DEFAULT 0,      -- 外部支出
    department_profit DECIMAL(15,2) DEFAULT 0,  -- 部门毛利
    
    -- 分润计算详情
    service_gross_profit DECIMAL(15,2) DEFAULT 0, -- 服务毛利
    profit_sharing_ratio DECIMAL(5,4) DEFAULT 0,  -- 分润比例(0.5000代表50%)
    profit_sharing_amount DECIMAL(15,2) DEFAULT 0, -- 分润金额
    
    -- 协议和计算信息
    protocol_id VARCHAR(50),                     -- 适用的内部协议ID
    protocol_name VARCHAR(200),                  -- 内部协议名称
    calculation_method VARCHAR(50),              -- 计算方法: STANDARD/SPECIAL
    calculation_status VARCHAR(20) DEFAULT 'CALCULATED', -- 计算状态: CALCULATED/CONFIRMED/LOCKED
    
    -- 审计字段
    calculated_by VARCHAR(50) NOT NULL,          -- 计算人
    calculated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_by VARCHAR(50),                    -- 确认人
    confirmed_time TIMESTAMP,                    -- 确认时间
    version INTEGER DEFAULT 1,                   -- 版本号
    remarks VARCHAR(500),                        -- 备注说明
    
    -- 约束条件
    CONSTRAINT chk_department_type CHECK (department_type IN ('SALES', 'OPERATION')),
    CONSTRAINT chk_calculation_status CHECK (calculation_status IN ('CALCULATED', 'CONFIRMED', 'LOCKED')),
    CONSTRAINT chk_profit_sharing_ratio CHECK (profit_sharing_ratio >= 0 AND profit_sharing_ratio <= 1)
);

-- ===================================
-- 2. 分润计算汇总表(profit_sharing_summary)
-- ===================================
CREATE TABLE profit_sharing_summary (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    calculation_id VARCHAR(50) NOT NULL,
    
    -- 订单汇总信息
    total_external_revenue DECIMAL(15,2) DEFAULT 0,  -- 外部收入总计
    total_external_cost DECIMAL(15,2) DEFAULT 0,     -- 外部支出总计
    total_internal_flow DECIMAL(15,2) DEFAULT 0,     -- 内部流转总额
    total_gross_profit DECIMAL(15,2) DEFAULT 0,      -- 订单总毛利
    
    -- 部门统计
    involved_departments_count INTEGER DEFAULT 0,    -- 涉及部门数量
    sales_departments_count INTEGER DEFAULT 0,       -- 销售部门数量
    operation_departments_count INTEGER DEFAULT 0,   -- 操作部门数量
    
    -- 服务统计
    total_services_count INTEGER DEFAULT 0,          -- 总服务项数
    profitable_services_count INTEGER DEFAULT 0,     -- 盈利服务项数
    loss_services_count INTEGER DEFAULT 0,           -- 亏损服务项数
    
    -- 计算状态
    calculation_status VARCHAR(20) DEFAULT 'CALCULATED',
    has_negative_profit BOOLEAN DEFAULT FALSE,       -- 是否存在负利润
    balance_verified BOOLEAN DEFAULT FALSE,          -- 是否通过平衡校验
    
    -- 审计字段  
    calculated_by VARCHAR(50) NOT NULL,
    calculated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_by VARCHAR(50),
    confirmed_time TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_profit_summary_status CHECK (calculation_status IN ('CALCULATED', 'CONFIRMED', 'LOCKED')),
    UNIQUE (order_id, calculation_id)
);

-- ===================================
-- 3. 分润计算日志表(profit_calculation_log)
-- ===================================
CREATE TABLE profit_calculation_log (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    calculation_id VARCHAR(50) NOT NULL,
    log_level VARCHAR(10) NOT NULL,              -- 日志级别: DEBUG/INFO/WARN/ERROR
    log_type VARCHAR(50) NOT NULL,               -- 日志类型: CALCULATION/VALIDATION/BALANCE_CHECK
    service_code VARCHAR(50),                    -- 相关服务编码
    department_id VARCHAR(50),                   -- 相关部门ID
    message TEXT NOT NULL,                       -- 日志消息
    details JSONB,                               -- 详细信息(JSON格式)
    execution_time_ms INTEGER,                   -- 执行时间(毫秒)
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_log_level CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR'))
);

-- ===================================
-- 4. 分润规则配置表(profit_sharing_rules)
-- ===================================
CREATE TABLE profit_sharing_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL,              -- 规则编码
    rule_name VARCHAR(200) NOT NULL,             -- 规则名称
    rule_type VARCHAR(30) NOT NULL,              -- 规则类型: STANDARD/SERVICE_SPECIFIC/DEPARTMENT_SPECIFIC
    
    -- 适用条件
    applicable_service_codes TEXT,               -- 适用服务编码(逗号分隔)
    applicable_sales_departments TEXT,           -- 适用销售部门(逗号分隔)
    applicable_operation_departments TEXT,       -- 适用操作部门(逗号分隔)
    
    -- 分润比例配置
    sales_ratio DECIMAL(5,4) NOT NULL,           -- 销售部门分润比例
    operation_ratio DECIMAL(5,4) NOT NULL,       -- 操作部门分润比例
    
    -- 高级配置
    minimum_profit_threshold DECIMAL(15,2) DEFAULT 0, -- 最小利润门槛
    maximum_sharing_amount DECIMAL(15,2),        -- 最大分润金额限制
    calculation_method VARCHAR(50) DEFAULT 'PERCENTAGE', -- 计算方法: PERCENTAGE/FIXED_AMOUNT
    
    -- 状态和优先级
    rule_priority INTEGER DEFAULT 0,             -- 规则优先级(数值越大优先级越高)
    status VARCHAR(20) DEFAULT 'ACTIVE',         -- 状态: ACTIVE/INACTIVE
    effective_date DATE,                         -- 生效日期
    expiry_date DATE,                           -- 失效日期
    
    -- 审计字段
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_rule_type CHECK (rule_type IN ('STANDARD', 'SERVICE_SPECIFIC', 'DEPARTMENT_SPECIFIC')),
    CONSTRAINT chk_sales_ratio CHECK (sales_ratio >= 0 AND sales_ratio <= 1),
    CONSTRAINT chk_operation_ratio CHECK (operation_ratio >= 0 AND operation_ratio <= 1),
    CONSTRAINT chk_ratio_sum CHECK (sales_ratio + operation_ratio = 1.0000),
    CONSTRAINT chk_rule_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    UNIQUE (rule_code)
);

-- 创建索引
CREATE INDEX idx_dept_profit_order_id ON department_profit_sharing(order_id);
CREATE INDEX idx_dept_profit_calculation_id ON department_profit_sharing(calculation_id);
CREATE INDEX idx_dept_profit_department_id ON department_profit_sharing(department_id);
CREATE INDEX idx_dept_profit_service_code ON department_profit_sharing(service_code);
CREATE INDEX idx_dept_profit_status ON department_profit_sharing(calculation_status);
CREATE INDEX idx_dept_profit_order_dept ON department_profit_sharing(order_id, department_id);

CREATE INDEX idx_profit_summary_order_id ON profit_sharing_summary(order_id);
CREATE INDEX idx_profit_summary_calculation_id ON profit_sharing_summary(calculation_id);
CREATE INDEX idx_profit_summary_status ON profit_sharing_summary(calculation_status);
CREATE INDEX idx_profit_summary_calculated_time ON profit_sharing_summary(calculated_time);

CREATE INDEX idx_profit_log_order_id ON profit_calculation_log(order_id);
CREATE INDEX idx_profit_log_calculation_id ON profit_calculation_log(calculation_id);
CREATE INDEX idx_profit_log_level ON profit_calculation_log(log_level);
CREATE INDEX idx_profit_log_type ON profit_calculation_log(log_type);
CREATE INDEX idx_profit_log_created_time ON profit_calculation_log(created_time);

CREATE INDEX idx_profit_rules_rule_type ON profit_sharing_rules(rule_type);
CREATE INDEX idx_profit_rules_status ON profit_sharing_rules(status);
CREATE INDEX idx_profit_rules_priority ON profit_sharing_rules(rule_priority);
CREATE INDEX idx_profit_rules_effective_date ON profit_sharing_rules(effective_date);
CREATE INDEX idx_profit_rules_expiry_date ON profit_sharing_rules(expiry_date);

-- ===================================
-- 初始化基础数据
-- ===================================

-- 分润规则基础数据
INSERT INTO profit_sharing_rules (rule_code, rule_name, rule_type, sales_ratio, operation_ratio, rule_priority, created_by) VALUES
-- 标准规则(50%-50%)
('STANDARD_50_50', '标准分润规则(50%-50%)', 'STANDARD', 0.5000, 0.5000, 0, 'system'),
-- 海运专用规则(60%-40%)  
('OCEAN_60_40', '海运业务分润规则(60%-40%)', 'SERVICE_SPECIFIC', 0.6000, 0.4000, 10, 'system'),
-- 空运专用规则(55%-45%)
('AIR_55_45', '空运业务分润规则(55%-45%)', 'SERVICE_SPECIFIC', 0.5500, 0.4500, 10, 'system'),
-- 关务专用规则(40%-60%)
('CUSTOMS_40_60', '关务业务分润规则(40%-60%)', 'SERVICE_SPECIFIC', 0.4000, 0.6000, 10, 'system');

-- 更新服务适用范围
UPDATE profit_sharing_rules SET applicable_service_codes = 'MBL_PROCESSING,BOOKING,VESSEL_MANIFEST' WHERE rule_code = 'OCEAN_60_40';
UPDATE profit_sharing_rules SET applicable_service_codes = 'AIR_BOOKING,AIR_MANIFEST,AIR_DELIVERY' WHERE rule_code = 'AIR_55_45';
UPDATE profit_sharing_rules SET applicable_service_codes = 'CUSTOMS_DECLARATION,CUSTOMS_CLEARANCE,CUSTOMS_INSPECTION' WHERE rule_code = 'CUSTOMS_40_60';

-- ===================================
-- 视图和存储过程
-- ===================================

-- 部门分润汇总视图
CREATE VIEW department_profit_summary AS
SELECT 
    dps.order_id,
    dps.department_id,
    dps.department_name,
    dps.department_type,
    SUM(dps.external_revenue) as total_external_revenue,
    SUM(dps.internal_income) as total_internal_income,
    SUM(dps.internal_payment) as total_internal_payment,
    SUM(dps.external_cost) as total_external_cost,
    SUM(dps.department_profit) as total_department_profit,
    COUNT(dps.service_code) as service_count,
    MAX(dps.calculated_time) as last_calculated_time
FROM department_profit_sharing dps
WHERE dps.calculation_status IN ('CALCULATED', 'CONFIRMED')
GROUP BY dps.order_id, dps.department_id, dps.department_name, dps.department_type;

-- 订单分润平衡校验视图
CREATE VIEW profit_balance_check AS
SELECT 
    order_id,
    SUM(external_revenue) as total_external_revenue,
    SUM(external_cost) as total_external_cost,
    SUM(internal_income) as total_internal_income,
    SUM(internal_payment) as total_internal_payment,
    SUM(department_profit) as total_department_profit,
    -- 平衡校验
    (SUM(external_revenue) - SUM(external_cost)) as order_gross_profit,
    (SUM(internal_income) - SUM(internal_payment)) as internal_balance,
    CASE 
        WHEN ABS(SUM(internal_income) - SUM(internal_payment)) < 0.01 THEN TRUE
        ELSE FALSE 
    END as internal_balanced,
    CASE 
        WHEN ABS((SUM(external_revenue) - SUM(external_cost)) - SUM(department_profit)) < 0.01 THEN TRUE
        ELSE FALSE 
    END as profit_balanced
FROM department_profit_sharing
GROUP BY order_id;

-- 分润规则匹配函数
CREATE OR REPLACE FUNCTION find_profit_sharing_rule(
    p_service_code VARCHAR(50),
    p_sales_department VARCHAR(50),
    p_operation_department VARCHAR(50)
) RETURNS TABLE (
    rule_id BIGINT,
    rule_code VARCHAR(50),
    rule_name VARCHAR(200),
    sales_ratio DECIMAL(5,4),
    operation_ratio DECIMAL(5,4),
    rule_priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psr.id,
        psr.rule_code,
        psr.rule_name,
        psr.sales_ratio,
        psr.operation_ratio,
        psr.rule_priority
    FROM profit_sharing_rules psr
    WHERE psr.status = 'ACTIVE'
      AND (psr.effective_date IS NULL OR psr.effective_date <= CURRENT_DATE)
      AND (psr.expiry_date IS NULL OR psr.expiry_date >= CURRENT_DATE)
      AND (
          -- 服务特定规则
          (psr.rule_type = 'SERVICE_SPECIFIC' AND p_service_code = ANY(string_to_array(psr.applicable_service_codes, ',')))
          OR
          -- 部门特定规则
          (psr.rule_type = 'DEPARTMENT_SPECIFIC' AND 
           (p_sales_department = ANY(string_to_array(psr.applicable_sales_departments, ',')) OR
            p_operation_department = ANY(string_to_array(psr.applicable_operation_departments, ','))))
          OR
          -- 标准规则
          psr.rule_type = 'STANDARD'
      )
    ORDER BY psr.rule_priority DESC, psr.created_time ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 分润计算主存储过程
CREATE OR REPLACE FUNCTION calculate_profit_sharing(
    p_order_id VARCHAR(50),
    p_calculated_by VARCHAR(50)
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_calculation_id VARCHAR(50);
    v_service_record RECORD;
    v_rule_record RECORD;
    v_total_external_revenue DECIMAL(15,2) := 0;
    v_total_external_cost DECIMAL(15,2) := 0;
    v_total_gross_profit DECIMAL(15,2) := 0;
    v_service_count INTEGER := 0;
BEGIN
    -- 生成计算批次ID
    v_calculation_id := 'CALC_' || p_order_id || '_' || to_char(NOW(), 'YYYYMMDDHH24MISS');
    
    -- 记录开始日志
    INSERT INTO profit_calculation_log (order_id, calculation_id, log_level, log_type, message)
    VALUES (p_order_id, v_calculation_id, 'INFO', 'CALCULATION', '开始计算订单分润: ' || p_order_id);
    
    -- 按服务分组计算
    FOR v_service_record IN
        SELECT 
            service_code,
            SUM(CASE WHEN entry_type = 'RECEIVABLE' THEN amount ELSE 0 END) as service_revenue,
            SUM(CASE WHEN entry_type = 'PAYABLE' THEN amount ELSE 0 END) as service_cost,
            -- 模拟部门信息(实际应从用户session或订单信息获取)
            'SALES_DEPT' as sales_department,
            'OPERATION_DEPT' as operation_department
        FROM expense_entries 
        WHERE order_id = p_order_id
        GROUP BY service_code
    LOOP
        v_service_count := v_service_count + 1;
        
        -- 计算服务毛利
        DECLARE
            v_service_gross_profit DECIMAL(15,2);
            v_sales_sharing DECIMAL(15,2);
            v_operation_sharing DECIMAL(15,2);
        BEGIN
            v_service_gross_profit := v_service_record.service_revenue - v_service_record.service_cost;
            
            -- 查找适用的分润规则
            SELECT * INTO v_rule_record 
            FROM find_profit_sharing_rule(
                v_service_record.service_code,
                v_service_record.sales_department,
                v_service_record.operation_department
            );
            
            IF v_rule_record.rule_id IS NOT NULL THEN
                -- 计算分润金额
                v_sales_sharing := v_service_gross_profit * v_rule_record.sales_ratio;
                v_operation_sharing := v_service_gross_profit * v_rule_record.operation_ratio;
                
                -- 插入销售部门分润记录
                INSERT INTO department_profit_sharing (
                    order_id, calculation_id, department_id, department_name, department_type,
                    service_code, service_name, external_revenue, internal_payment, department_profit,
                    service_gross_profit, profit_sharing_ratio, profit_sharing_amount,
                    protocol_id, protocol_name, calculated_by
                ) VALUES (
                    p_order_id, v_calculation_id, v_service_record.sales_department, '销售部门', 'SALES',
                    v_service_record.service_code, v_service_record.service_code, v_service_record.service_revenue, 
                    v_service_record.service_cost + v_operation_sharing, v_sales_sharing,
                    v_service_gross_profit, v_rule_record.sales_ratio, v_sales_sharing,
                    v_rule_record.rule_id::VARCHAR, v_rule_record.rule_name, p_calculated_by
                );
                
                -- 插入操作部门分润记录
                INSERT INTO department_profit_sharing (
                    order_id, calculation_id, department_id, department_name, department_type,
                    service_code, service_name, internal_income, external_cost, department_profit,
                    service_gross_profit, profit_sharing_ratio, profit_sharing_amount,
                    protocol_id, protocol_name, calculated_by
                ) VALUES (
                    p_order_id, v_calculation_id, v_service_record.operation_department, '操作部门', 'OPERATION',
                    v_service_record.service_code, v_service_record.service_code, 
                    v_service_record.service_cost + v_operation_sharing, v_service_record.service_cost, v_operation_sharing,
                    v_service_gross_profit, v_rule_record.operation_ratio, v_operation_sharing,
                    v_rule_record.rule_id::VARCHAR, v_rule_record.rule_name, p_calculated_by
                );
                
                v_total_external_revenue := v_total_external_revenue + v_service_record.service_revenue;
                v_total_external_cost := v_total_external_cost + v_service_record.service_cost;
                v_total_gross_profit := v_total_gross_profit + v_service_gross_profit;
                
            ELSE
                -- 记录警告日志
                INSERT INTO profit_calculation_log (order_id, calculation_id, log_level, log_type, service_code, message)
                VALUES (p_order_id, v_calculation_id, 'WARN', 'CALCULATION', v_service_record.service_code, 
                       '未找到适用的分润规则');
            END IF;
        END;
    END LOOP;
    
    -- 插入汇总记录
    INSERT INTO profit_sharing_summary (
        order_id, calculation_id, total_external_revenue, total_external_cost, 
        total_gross_profit, total_services_count, calculated_by
    ) VALUES (
        p_order_id, v_calculation_id, v_total_external_revenue, v_total_external_cost,
        v_total_gross_profit, v_service_count, p_calculated_by
    );
    
    -- 记录完成日志
    INSERT INTO profit_calculation_log (order_id, calculation_id, log_level, log_type, message)
    VALUES (p_order_id, v_calculation_id, 'INFO', 'CALCULATION', '分润计算完成，批次ID: ' || v_calculation_id);
    
    RETURN v_calculation_id;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 数据完整性检查
-- ===================================

-- 验证表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN (
    'department_profit_sharing', 
    'profit_sharing_summary',
    'profit_calculation_log',
    'profit_sharing_rules'
)
ORDER BY table_name, ordinal_position;

-- 验证约束条件
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN (
    'department_profit_sharing', 
    'profit_sharing_summary',
    'profit_calculation_log',
    'profit_sharing_rules'
);

COMMIT;