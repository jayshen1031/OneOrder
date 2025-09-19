-- OneOrder清分处理模块数据表设计
-- 创建时间: 2025-09-16
-- 版本: v1.0
-- 说明: 支持星式/链式清分、法人实体流转、借抬头过账等核心清分业务

-- ===================================
-- 1. 清分指令主表(clearing_instructions)
-- ===================================
CREATE TABLE clearing_instructions (
    id BIGSERIAL PRIMARY KEY,
    instruction_id VARCHAR(50) NOT NULL UNIQUE,    -- 清分指令ID
    order_id VARCHAR(50) NOT NULL,                 -- 订单ID
    calculation_id VARCHAR(50) NOT NULL,           -- 分润计算批次ID
    clearing_batch_id VARCHAR(50) NOT NULL,        -- 清分批次ID
    
    -- 清分模式和策略
    clearing_mode VARCHAR(20) NOT NULL,            -- 清分模式: STAR/CHAIN
    clearing_strategy VARCHAR(30) NOT NULL,        -- 清分策略: STANDARD/TRANSIT_ENTITY/CROSS_BORDER
    
    -- 金额信息
    total_receivable DECIMAL(15,2) DEFAULT 0,      -- 总应收金额
    total_payable DECIMAL(15,2) DEFAULT 0,         -- 总应付金额
    total_gross_profit DECIMAL(15,2) DEFAULT 0,    -- 总毛利
    clearing_amount DECIMAL(15,2) DEFAULT 0,       -- 清分金额
    
    -- 法人实体信息
    primary_entity_id VARCHAR(50) NOT NULL,        -- 主要法人实体
    transit_entity_id VARCHAR(50),                 -- 借抬头法人实体
    cross_border_entity_id VARCHAR(50),           -- 过账法人实体
    
    -- 清分状态
    instruction_status VARCHAR(20) DEFAULT 'PENDING',    -- 指令状态: PENDING/PROCESSING/COMPLETED/FAILED/CANCELLED
    execution_priority INTEGER DEFAULT 5,               -- 执行优先级(1-9, 9最高)
    
    -- 审计字段
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(50),                      -- 审核人
    approved_time TIMESTAMP,                      -- 审核时间
    executed_by VARCHAR(50),                      -- 执行人
    executed_time TIMESTAMP,                      -- 执行时间
    
    -- 备注信息
    clearing_notes TEXT,                          -- 清分说明
    risk_remarks TEXT,                           -- 风险备注
    
    -- 约束条件
    CONSTRAINT chk_clearing_mode CHECK (clearing_mode IN ('STAR', 'CHAIN')),
    CONSTRAINT chk_clearing_strategy CHECK (clearing_strategy IN ('STANDARD', 'TRANSIT_ENTITY', 'CROSS_BORDER', 'NETTING')),
    CONSTRAINT chk_instruction_status CHECK (instruction_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    CONSTRAINT chk_execution_priority CHECK (execution_priority >= 1 AND execution_priority <= 9)
);

-- ===================================
-- 2. 清分明细表(clearing_details)
-- ===================================
CREATE TABLE clearing_details (
    id BIGSERIAL PRIMARY KEY,
    instruction_id VARCHAR(50) NOT NULL,          -- 清分指令ID
    detail_sequence INTEGER NOT NULL,             -- 明细序号
    detail_type VARCHAR(20) NOT NULL,            -- 明细类型: RECEIVABLE/PAYABLE/INTERNAL_TRANSFER/RETENTION
    
    -- 资金流转信息
    from_entity_id VARCHAR(50) NOT NULL,         -- 付款方法人实体
    from_entity_name VARCHAR(200) NOT NULL,      -- 付款方名称
    to_entity_id VARCHAR(50) NOT NULL,           -- 收款方法人实体  
    to_entity_name VARCHAR(200) NOT NULL,        -- 收款方名称
    
    -- 金额和币种
    detail_amount DECIMAL(15,2) NOT NULL,        -- 明细金额
    currency_code VARCHAR(10) DEFAULT 'CNY',     -- 币种
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,     -- 汇率
    base_currency_amount DECIMAL(15,2),          -- 本位币金额
    
    -- 业务信息
    service_code VARCHAR(50),                     -- 服务编码
    service_name VARCHAR(100),                    -- 服务名称
    department_id VARCHAR(50),                    -- 部门ID
    department_name VARCHAR(100),                 -- 部门名称
    
    -- 财务科目
    account_code VARCHAR(50),                     -- 会计科目代码
    account_name VARCHAR(200),                    -- 会计科目名称
    cost_center VARCHAR(50),                      -- 成本中心
    profit_center VARCHAR(50),                    -- 利润中心
    
    -- 清分规则
    clearing_rule_id VARCHAR(50),                -- 适用的清分规则ID
    clearing_rule_name VARCHAR(200),             -- 清分规则名称
    clearing_ratio DECIMAL(5,4),                 -- 清分比例
    
    -- 状态跟踪
    detail_status VARCHAR(20) DEFAULT 'PENDING', -- 明细状态: PENDING/PROCESSING/COMPLETED/FAILED
    execution_order INTEGER DEFAULT 1,           -- 执行顺序
    
    -- 关联信息
    related_order_id VARCHAR(50),                -- 关联订单ID
    related_profit_sharing_id BIGINT,            -- 关联分润记录ID
    
    -- 时间戳
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_time TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_detail_type CHECK (detail_type IN ('RECEIVABLE', 'PAYABLE', 'INTERNAL_TRANSFER', 'RETENTION', 'NETTING')),
    CONSTRAINT chk_detail_status CHECK (detail_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_detail_amount CHECK (detail_amount > 0),
    FOREIGN KEY (instruction_id) REFERENCES clearing_instructions(instruction_id)
);

-- ===================================
-- 3. 清分批次表(clearing_batches)
-- ===================================
CREATE TABLE clearing_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL UNIQUE,        -- 批次ID
    batch_name VARCHAR(200) NOT NULL,            -- 批次名称
    batch_type VARCHAR(20) NOT NULL,             -- 批次类型: DAILY/WEEKLY/MANUAL/URGENT
    
    -- 批次统计
    total_instructions_count INTEGER DEFAULT 0,   -- 指令总数
    completed_instructions_count INTEGER DEFAULT 0, -- 已完成指令数
    total_clearing_amount DECIMAL(15,2) DEFAULT 0, -- 批次总清分金额
    
    -- 批次时间
    batch_date DATE NOT NULL,                    -- 批次日期
    planned_execution_time TIMESTAMP,            -- 计划执行时间
    actual_start_time TIMESTAMP,                 -- 实际开始时间
    actual_end_time TIMESTAMP,                   -- 实际结束时间
    
    -- 批次状态
    batch_status VARCHAR(20) DEFAULT 'PREPARING', -- 批次状态: PREPARING/READY/PROCESSING/COMPLETED/FAILED
    success_rate DECIMAL(5,2) DEFAULT 0,         -- 成功率
    
    -- 风险控制
    risk_level VARCHAR(10) DEFAULT 'LOW',        -- 风险级别: LOW/MEDIUM/HIGH/CRITICAL
    requires_approval BOOLEAN DEFAULT FALSE,     -- 是否需要审批
    auto_execution BOOLEAN DEFAULT TRUE,         -- 是否自动执行
    
    -- 审计信息
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(50),
    approved_time TIMESTAMP,
    executed_by VARCHAR(50),
    
    -- 备注
    batch_remarks TEXT,
    
    -- 约束条件
    CONSTRAINT chk_batch_type CHECK (batch_type IN ('DAILY', 'WEEKLY', 'MANUAL', 'URGENT')),
    CONSTRAINT chk_batch_status CHECK (batch_status IN ('PREPARING', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- ===================================
-- 4. 清分执行日志表(clearing_execution_logs)
-- ===================================
CREATE TABLE clearing_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    log_id VARCHAR(50) NOT NULL,                 -- 日志ID
    instruction_id VARCHAR(50) NOT NULL,         -- 清分指令ID
    detail_id BIGINT,                            -- 清分明细ID (可选)
    batch_id VARCHAR(50) NOT NULL,               -- 批次ID
    
    -- 日志信息
    log_level VARCHAR(10) NOT NULL,              -- 日志级别: DEBUG/INFO/WARN/ERROR/FATAL
    log_type VARCHAR(30) NOT NULL,               -- 日志类型: VALIDATION/EXECUTION/CALLBACK/EXCEPTION
    log_message TEXT NOT NULL,                   -- 日志消息
    error_code VARCHAR(20),                      -- 错误代码
    error_details TEXT,                          -- 错误详情
    
    -- 执行信息
    execution_step VARCHAR(50),                  -- 执行步骤
    execution_duration_ms INTEGER,               -- 执行耗时(毫秒)
    retry_count INTEGER DEFAULT 0,               -- 重试次数
    
    -- 业务上下文
    business_context JSONB,                      -- 业务上下文(JSON格式)
    system_context JSONB,                        -- 系统上下文(JSON格式)
    
    -- 时间戳
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_log_level CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    FOREIGN KEY (instruction_id) REFERENCES clearing_instructions(instruction_id),
    FOREIGN KEY (batch_id) REFERENCES clearing_batches(batch_id)
);

-- ===================================
-- 5. 清分规则配置表(clearing_rule_configs)
-- ===================================
CREATE TABLE clearing_rule_configs (
    id BIGSERIAL PRIMARY KEY,
    rule_id VARCHAR(50) NOT NULL UNIQUE,         -- 规则ID
    rule_code VARCHAR(50) NOT NULL,              -- 规则编码
    rule_name VARCHAR(200) NOT NULL,             -- 规则名称
    rule_category VARCHAR(30) NOT NULL,          -- 规则分类: CLEARING_MODE/ENTITY_FLOW/NETTING
    
    -- 规则条件
    applicable_clearing_mode VARCHAR(20),        -- 适用清分模式
    applicable_business_types TEXT,              -- 适用业务类型(逗号分隔)
    applicable_service_codes TEXT,               -- 适用服务编码(逗号分隔)
    applicable_entity_types TEXT,                -- 适用法人实体类型(逗号分隔)
    
    -- 规则参数 
    rule_parameters JSONB,                        -- 规则参数(JSON格式)
    rule_expression TEXT,                         -- 规则表达式
    
    -- 执行配置
    execution_order INTEGER DEFAULT 1,           -- 执行顺序
    rule_priority INTEGER DEFAULT 5,             -- 规则优先级
    is_mandatory BOOLEAN DEFAULT FALSE,          -- 是否强制执行
    
    -- 生效配置
    effective_date DATE,                          -- 生效日期
    expiry_date DATE,                            -- 失效日期
    rule_status VARCHAR(20) DEFAULT 'ACTIVE',    -- 规则状态: ACTIVE/INACTIVE/TESTING
    
    -- 审计字段
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_rule_category CHECK (rule_category IN ('CLEARING_MODE', 'ENTITY_FLOW', 'NETTING', 'RETENTION', 'VALIDATION')),
    CONSTRAINT chk_clearing_mode_rule CHECK (applicable_clearing_mode IS NULL OR applicable_clearing_mode IN ('STAR', 'CHAIN')),
    CONSTRAINT chk_rule_status CHECK (rule_status IN ('ACTIVE', 'INACTIVE', 'TESTING')),
    CONSTRAINT chk_rule_priority CHECK (rule_priority >= 1 AND rule_priority <= 9),
    UNIQUE (rule_code)
);

-- 创建索引
CREATE INDEX idx_clearing_instructions_order_id ON clearing_instructions(order_id);
CREATE INDEX idx_clearing_instructions_batch_id ON clearing_instructions(clearing_batch_id);
CREATE INDEX idx_clearing_instructions_status ON clearing_instructions(instruction_status);
CREATE INDEX idx_clearing_instructions_priority ON clearing_instructions(execution_priority);
CREATE INDEX idx_clearing_instructions_created_time ON clearing_instructions(created_time);
CREATE INDEX idx_clearing_instructions_entity ON clearing_instructions(primary_entity_id);

CREATE INDEX idx_clearing_details_instruction_id ON clearing_details(instruction_id);
CREATE INDEX idx_clearing_details_entities ON clearing_details(from_entity_id, to_entity_id);
CREATE INDEX idx_clearing_details_service ON clearing_details(service_code);
CREATE INDEX idx_clearing_details_department ON clearing_details(department_id);
CREATE INDEX idx_clearing_details_status ON clearing_details(detail_status);
CREATE INDEX idx_clearing_details_sequence ON clearing_details(instruction_id, detail_sequence);

CREATE INDEX idx_clearing_batches_date ON clearing_batches(batch_date);
CREATE INDEX idx_clearing_batches_status ON clearing_batches(batch_status);
CREATE INDEX idx_clearing_batches_type ON clearing_batches(batch_type);
CREATE INDEX idx_clearing_batches_execution_time ON clearing_batches(planned_execution_time);

CREATE INDEX idx_clearing_execution_logs_instruction ON clearing_execution_logs(instruction_id);
CREATE INDEX idx_clearing_execution_logs_batch ON clearing_execution_logs(batch_id);
CREATE INDEX idx_clearing_execution_logs_level ON clearing_execution_logs(log_level);
CREATE INDEX idx_clearing_execution_logs_type ON clearing_execution_logs(log_type);
CREATE INDEX idx_clearing_execution_logs_created_time ON clearing_execution_logs(created_time);

CREATE INDEX idx_clearing_rule_configs_category ON clearing_rule_configs(rule_category);
CREATE INDEX idx_clearing_rule_configs_status ON clearing_rule_configs(rule_status);
CREATE INDEX idx_clearing_rule_configs_priority ON clearing_rule_configs(rule_priority);
CREATE INDEX idx_clearing_rule_configs_effective ON clearing_rule_configs(effective_date, expiry_date);

-- ===================================
-- 初始化基础数据
-- ===================================

-- 清分规则配置基础数据
INSERT INTO clearing_rule_configs (rule_id, rule_code, rule_name, rule_category, applicable_clearing_mode, rule_parameters, execution_order, rule_priority, created_by) VALUES
-- 星式清分规则
('RULE_001', 'STAR_STANDARD', '标准星式清分规则', 'CLEARING_MODE', 'STAR', '{"central_entity": "HCBD_SHANGHAI", "retention_rate": 0.00}', 1, 8, 'system'),
-- 链式清分规则
('RULE_002', 'CHAIN_STANDARD', '标准链式清分规则', 'CLEARING_MODE', 'CHAIN', '{"max_chain_length": 3, "commission_rate": 0.02}', 1, 8, 'system'),
-- 借抬头规则
('RULE_003', 'TRANSIT_RECEIVABLE', '收款借抬头规则', 'ENTITY_FLOW', null, '{"transit_entity": "HCBD_HONGKONG", "retention_rate": 0.03, "flow_type": "RECEIVABLE"}', 2, 9, 'system'),
('RULE_004', 'TRANSIT_PAYABLE', '付款借抬头规则', 'ENTITY_FLOW', null, '{"transit_entity": "HCBD_SINGAPORE", "retention_rate": 0.02, "flow_type": "PAYABLE"}', 2, 9, 'system'),
-- 过账规则
('RULE_005', 'CROSS_BORDER_ASIA', '亚太过账规则', 'ENTITY_FLOW', null, '{"regions": ["HK", "SG", "TH"], "processing_fee_rate": 0.001, "netting_enabled": true}', 3, 7, 'system'),
-- 抵消规则
('RULE_006', 'NETTING_DAILY', '日批次抵消规则', 'NETTING', null, '{"netting_threshold": 10000, "same_entity_only": false, "priority_threshold": 7}', 4, 6, 'system');

-- 创建清分批次(示例数据)
INSERT INTO clearing_batches (batch_id, batch_name, batch_type, batch_date, planned_execution_time, created_by) VALUES
('BATCH_20250916_001', '2025-09-16 日常清分批次', 'DAILY', '2025-09-16', '2025-09-16 18:00:00', 'system'),
('BATCH_20250916_002', '2025-09-16 紧急清分批次', 'URGENT', '2025-09-16', '2025-09-16 20:00:00', 'system');

-- ===================================
-- 视图和存储过程
-- ===================================

-- 清分指令汇总视图
CREATE VIEW clearing_instructions_summary AS
SELECT 
    ci.clearing_batch_id,
    ci.clearing_mode,
    ci.instruction_status,
    COUNT(ci.id) as instructions_count,
    SUM(ci.clearing_amount) as total_clearing_amount,
    AVG(ci.execution_priority) as avg_priority,
    MIN(ci.created_time) as earliest_created,
    MAX(ci.created_time) as latest_created
FROM clearing_instructions ci
GROUP BY ci.clearing_batch_id, ci.clearing_mode, ci.instruction_status;

-- 清分明细执行状态视图
CREATE VIEW clearing_details_execution_status AS
SELECT 
    cd.instruction_id,
    cd.detail_type,
    cd.detail_status,
    COUNT(cd.id) as detail_count,
    SUM(cd.detail_amount) as total_amount,
    AVG(cd.execution_order) as avg_execution_order
FROM clearing_details cd
GROUP BY cd.instruction_id, cd.detail_type, cd.detail_status;

-- 清分规则匹配函数
CREATE OR REPLACE FUNCTION find_applicable_clearing_rules(
    p_clearing_mode VARCHAR(20),
    p_business_type VARCHAR(50),
    p_service_code VARCHAR(50),
    p_entity_type VARCHAR(50)
) RETURNS TABLE (
    rule_id VARCHAR(50),
    rule_code VARCHAR(50),
    rule_name VARCHAR(200),
    rule_category VARCHAR(30),
    rule_parameters JSONB,
    rule_priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        crc.rule_id,
        crc.rule_code,
        crc.rule_name,
        crc.rule_category,
        crc.rule_parameters,
        crc.rule_priority
    FROM clearing_rule_configs crc
    WHERE crc.rule_status = 'ACTIVE'
      AND (crc.effective_date IS NULL OR crc.effective_date <= CURRENT_DATE)
      AND (crc.expiry_date IS NULL OR crc.expiry_date >= CURRENT_DATE)
      AND (
          -- 清分模式匹配
          (crc.applicable_clearing_mode IS NULL OR crc.applicable_clearing_mode = p_clearing_mode)
          AND
          -- 业务类型匹配
          (crc.applicable_business_types IS NULL OR p_business_type = ANY(string_to_array(crc.applicable_business_types, ',')))
          AND
          -- 服务编码匹配
          (crc.applicable_service_codes IS NULL OR p_service_code = ANY(string_to_array(crc.applicable_service_codes, ',')))
          AND
          -- 实体类型匹配
          (crc.applicable_entity_types IS NULL OR p_entity_type = ANY(string_to_array(crc.applicable_entity_types, ',')))
      )
    ORDER BY crc.rule_priority DESC, crc.execution_order ASC;
END;
$$ LANGUAGE plpgsql;

-- 清分指令生成存储过程
CREATE OR REPLACE FUNCTION generate_clearing_instruction(
    p_order_id VARCHAR(50),
    p_calculation_id VARCHAR(50),
    p_clearing_mode VARCHAR(20),
    p_created_by VARCHAR(50)
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_instruction_id VARCHAR(50);
    v_batch_id VARCHAR(50);
    v_clearing_amount DECIMAL(15,2);
    v_profit_sharing_record RECORD;
BEGIN
    -- 生成清分指令ID
    v_instruction_id := 'CLEARING_' || p_order_id || '_' || to_char(NOW(), 'YYYYMMDDHH24MISS');
    
    -- 获取当前日期的批次ID (如果不存在则创建)
    SELECT batch_id INTO v_batch_id 
    FROM clearing_batches 
    WHERE batch_date = CURRENT_DATE 
      AND batch_type = 'DAILY' 
      AND batch_status IN ('PREPARING', 'READY')
    ORDER BY created_time DESC 
    LIMIT 1;
    
    IF v_batch_id IS NULL THEN
        v_batch_id := 'BATCH_' || to_char(NOW(), 'YYYYMMDD') || '_AUTO';
        INSERT INTO clearing_batches (batch_id, batch_name, batch_type, batch_date, created_by)
        VALUES (v_batch_id, '自动生成批次 - ' || CURRENT_DATE, 'DAILY', CURRENT_DATE, p_created_by);
    END IF;
    
    -- 计算清分金额（从分润计算结果获取）
    SELECT SUM(profit_sharing_amount) INTO v_clearing_amount
    FROM department_profit_sharing
    WHERE order_id = p_order_id AND calculation_id = p_calculation_id;
    
    -- 创建清分指令
    INSERT INTO clearing_instructions (
        instruction_id, order_id, calculation_id, clearing_batch_id,
        clearing_mode, clearing_strategy, clearing_amount,
        primary_entity_id, instruction_status, created_by
    ) VALUES (
        v_instruction_id, p_order_id, p_calculation_id, v_batch_id,
        p_clearing_mode, 'STANDARD', COALESCE(v_clearing_amount, 0),
        'HCBD_SHANGHAI', 'PENDING', p_created_by
    );
    
    -- 生成清分明细（基于分润计算结果）
    FOR v_profit_sharing_record IN
        SELECT * FROM department_profit_sharing 
        WHERE order_id = p_order_id AND calculation_id = p_calculation_id
    LOOP
        -- 生成收入明细
        IF v_profit_sharing_record.external_revenue > 0 THEN
            INSERT INTO clearing_details (
                instruction_id, detail_sequence, detail_type,
                from_entity_id, from_entity_name, to_entity_id, to_entity_name,
                detail_amount, service_code, service_name, department_id, department_name,
                detail_status
            ) VALUES (
                v_instruction_id, 
                (SELECT COALESCE(MAX(detail_sequence), 0) + 1 FROM clearing_details WHERE instruction_id = v_instruction_id),
                'RECEIVABLE',
                'CUSTOMER_' || p_order_id, '客户', v_profit_sharing_record.department_id, v_profit_sharing_record.department_name,
                v_profit_sharing_record.external_revenue, 
                v_profit_sharing_record.service_code, v_profit_sharing_record.service_name,
                v_profit_sharing_record.department_id, v_profit_sharing_record.department_name,
                'PENDING'
            );
        END IF;
        
        -- 生成支出明细
        IF v_profit_sharing_record.external_cost > 0 THEN
            INSERT INTO clearing_details (
                instruction_id, detail_sequence, detail_type,
                from_entity_id, from_entity_name, to_entity_id, to_entity_name,
                detail_amount, service_code, service_name, department_id, department_name,
                detail_status
            ) VALUES (
                v_instruction_id,
                (SELECT COALESCE(MAX(detail_sequence), 0) + 1 FROM clearing_details WHERE instruction_id = v_instruction_id),
                'PAYABLE',
                v_profit_sharing_record.department_id, v_profit_sharing_record.department_name, 'SUPPLIER_' || p_order_id, '供应商',
                v_profit_sharing_record.external_cost,
                v_profit_sharing_record.service_code, v_profit_sharing_record.service_name,
                v_profit_sharing_record.department_id, v_profit_sharing_record.department_name,
                'PENDING'
            );
        END IF;
        
        -- 生成内部流转明细
        IF v_profit_sharing_record.internal_payment > 0 THEN
            INSERT INTO clearing_details (
                instruction_id, detail_sequence, detail_type,
                from_entity_id, from_entity_name, to_entity_id, to_entity_name,
                detail_amount, service_code, service_name, department_id, department_name,
                detail_status
            ) VALUES (
                v_instruction_id,
                (SELECT COALESCE(MAX(detail_sequence), 0) + 1 FROM clearing_details WHERE instruction_id = v_instruction_id),
                'INTERNAL_TRANSFER',
                v_profit_sharing_record.department_id, v_profit_sharing_record.department_name, 'INTERNAL', '内部结算',
                v_profit_sharing_record.internal_payment,
                v_profit_sharing_record.service_code, v_profit_sharing_record.service_name,
                v_profit_sharing_record.department_id, v_profit_sharing_record.department_name,
                'PENDING'
            );
        END IF;
    END LOOP;
    
    -- 记录生成日志
    INSERT INTO clearing_execution_logs (log_id, instruction_id, batch_id, log_level, log_type, log_message)
    VALUES (
        'LOG_' || v_instruction_id || '_CREATE', v_instruction_id, v_batch_id,
        'INFO', 'GENERATION', '清分指令生成完成，指令ID: ' || v_instruction_id
    );
    
    RETURN v_instruction_id;
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
    'clearing_instructions', 
    'clearing_details',
    'clearing_batches',
    'clearing_execution_logs',
    'clearing_rule_configs'
)
ORDER BY table_name, ordinal_position;

-- 验证约束条件
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN (
    'clearing_instructions', 
    'clearing_details',
    'clearing_batches',
    'clearing_execution_logs',
    'clearing_rule_configs'
);

COMMIT;