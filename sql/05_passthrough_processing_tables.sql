-- =====================================================
-- OneOrder过账处理模块数据库设计
-- 模块功能：资金路由规则管理、过账处理、轧差结算、差异处理
-- 创建时间：2025-09-16
-- 作者：Claude Code Assistant
-- =====================================================

-- 1. 过账路由规则配置表
CREATE TABLE passthrough_routing_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL COMMENT '规则名称',
    rule_description TEXT COMMENT '规则描述',
    
    -- 匹配条件
    payer_legal_entity_id VARCHAR(50) NOT NULL COMMENT '付款法人ID',
    payer_legal_entity_name VARCHAR(200) NOT NULL COMMENT '付款法人名称',
    payee_legal_entity_id VARCHAR(50) NOT NULL COMMENT '收款法人ID', 
    payee_legal_entity_name VARCHAR(200) NOT NULL COMMENT '收款法人名称',
    currency_code VARCHAR(10) NOT NULL COMMENT '币种',
    
    -- 路由配置
    routing_entity_1_id VARCHAR(50) NOT NULL COMMENT '路由公司1ID',
    routing_entity_1_name VARCHAR(200) NOT NULL COMMENT '路由公司1名称',
    routing_entity_2_id VARCHAR(50) COMMENT '路由公司2ID(可选)',
    routing_entity_2_name VARCHAR(200) COMMENT '路由公司2名称(可选)',
    
    -- 留存规则
    retention_mode ENUM('PERCENTAGE', 'FIXED_AMOUNT') DEFAULT 'PERCENTAGE' COMMENT '留存模式：比例或固定金额',
    routing_1_retention_rate DECIMAL(10, 6) DEFAULT 0.000000 COMMENT '路由公司1留存比例',
    routing_1_retention_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '路由公司1固定留存金额',
    routing_2_retention_rate DECIMAL(10, 6) DEFAULT 0.000000 COMMENT '路由公司2留存比例',
    routing_2_retention_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '路由公司2固定留存金额',
    
    -- 豁免规则
    allow_business_entity_exemption BOOLEAN DEFAULT TRUE COMMENT '允许业务法人豁免',
    
    -- 规则状态和优先级
    rule_priority INTEGER DEFAULT 100 COMMENT '规则优先级(数字越小优先级越高)',
    rule_status ENUM('ACTIVE', 'INACTIVE', 'DRAFT') DEFAULT 'ACTIVE' COMMENT '规则状态',
    effective_date DATE NOT NULL COMMENT '生效日期',
    expiry_date DATE COMMENT '失效日期',
    
    -- 审计字段
    created_by VARCHAR(50) NOT NULL COMMENT '创建人',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by VARCHAR(50) COMMENT '更新人',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    version INTEGER DEFAULT 1 COMMENT '版本号',
    
    -- 索引
    KEY idx_payer_payee_currency (payer_legal_entity_id, payee_legal_entity_id, currency_code),
    KEY idx_rule_priority (rule_priority, rule_status),
    KEY idx_effective_date (effective_date, expiry_date)
) COMMENT '过账路由规则配置表';

-- 2. 过账处理指令表
CREATE TABLE passthrough_instructions (
    instruction_id VARCHAR(50) PRIMARY KEY,
    instruction_name VARCHAR(200) NOT NULL COMMENT '过账指令名称',
    
    -- 关联关系
    order_id VARCHAR(50) NOT NULL COMMENT '关联订单ID',
    clearing_instruction_id VARCHAR(50) NOT NULL COMMENT '关联清分指令ID',
    batch_id VARCHAR(50) NOT NULL COMMENT '批次ID',
    
    -- 过账模式和策略
    passthrough_mode ENUM('ROUTING', 'NETTING', 'DIFFERENTIAL') DEFAULT 'ROUTING' COMMENT '过账模式：路由/轧差/差异',
    processing_strategy ENUM('INCREMENTAL', 'FULL_REPLACEMENT') DEFAULT 'INCREMENTAL' COMMENT '处理策略',
    
    -- 处理状态
    instruction_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING' COMMENT '指令状态',
    processing_result TEXT COMMENT '处理结果描述',
    
    -- 金额统计
    original_total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT '原始总金额',
    passthrough_total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT '过账后总金额',
    retention_total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT '总留存金额',
    netting_saved_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '轧差节省金额',
    
    -- 处理计数
    original_transactions_count INTEGER DEFAULT 0 COMMENT '原始交易笔数',
    processed_transactions_count INTEGER DEFAULT 0 COMMENT '处理后交易笔数',
    routing_transactions_count INTEGER DEFAULT 0 COMMENT '路由交易笔数',
    netting_transactions_count INTEGER DEFAULT 0 COMMENT '轧差交易笔数',
    
    -- 执行时间
    scheduled_time TIMESTAMP COMMENT '计划执行时间',
    started_time TIMESTAMP COMMENT '开始执行时间',
    completed_time TIMESTAMP COMMENT '完成执行时间',
    execution_duration_ms BIGINT COMMENT '执行耗时(毫秒)',
    
    -- 审计字段
    created_by VARCHAR(50) NOT NULL COMMENT '创建人',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by VARCHAR(50) COMMENT '更新人',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    KEY idx_order_clearing (order_id, clearing_instruction_id),
    KEY idx_batch_status (batch_id, instruction_status),
    KEY idx_scheduled_time (scheduled_time),
    KEY idx_created_time (created_time)
) COMMENT '过账处理指令表';

-- 3. 过账处理明细表
CREATE TABLE passthrough_details (
    detail_id VARCHAR(50) PRIMARY KEY,
    instruction_id VARCHAR(50) NOT NULL COMMENT '过账指令ID',
    detail_sequence INTEGER NOT NULL COMMENT '明细序号',
    
    -- 原始交易信息
    original_payer_entity_id VARCHAR(50) NOT NULL COMMENT '原始付款法人ID',
    original_payer_entity_name VARCHAR(200) NOT NULL COMMENT '原始付款法人名称',
    original_payee_entity_id VARCHAR(50) NOT NULL COMMENT '原始收款法人ID',
    original_payee_entity_name VARCHAR(200) NOT NULL COMMENT '原始收款法人名称',
    original_amount DECIMAL(15, 2) NOT NULL COMMENT '原始交易金额',
    
    -- 过账处理后的交易信息
    actual_payer_entity_id VARCHAR(50) NOT NULL COMMENT '实际付款法人ID',
    actual_payer_entity_name VARCHAR(200) NOT NULL COMMENT '实际付款法人名称',
    actual_payee_entity_id VARCHAR(50) NOT NULL COMMENT '实际收款法人ID',
    actual_payee_entity_name VARCHAR(200) NOT NULL COMMENT '实际收款法人名称',
    actual_amount DECIMAL(15, 2) NOT NULL COMMENT '实际交易金额',
    
    -- 过账路径信息
    routing_path TEXT COMMENT '过账路径描述',
    applied_rule_id VARCHAR(50) COMMENT '应用的路由规则ID',
    routing_level INTEGER DEFAULT 1 COMMENT '路由层级',
    
    -- 留存信息
    retention_entity_id VARCHAR(50) COMMENT '留存法人ID',
    retention_entity_name VARCHAR(200) COMMENT '留存法人名称',
    retention_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '留存金额',
    retention_rate DECIMAL(10, 6) COMMENT '留存比例',
    
    -- 处理类型和状态
    detail_type ENUM('ROUTING', 'RETENTION', 'NETTING', 'PASSTHROUGH') NOT NULL COMMENT '明细类型',
    detail_status ENUM('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING' COMMENT '明细状态',
    
    -- 币种和服务信息
    currency_code VARCHAR(10) NOT NULL COMMENT '币种',
    service_code VARCHAR(50) COMMENT '服务代码',
    service_name VARCHAR(200) COMMENT '服务名称',
    
    -- 执行顺序和结果
    execution_order INTEGER NOT NULL COMMENT '执行顺序',
    execution_result VARCHAR(500) COMMENT '执行结果',
    executed_time TIMESTAMP COMMENT '执行时间',
    
    -- 审计字段
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键约束
    FOREIGN KEY (instruction_id) REFERENCES passthrough_instructions(instruction_id),
    
    -- 索引
    KEY idx_instruction_sequence (instruction_id, detail_sequence),
    KEY idx_original_entities (original_payer_entity_id, original_payee_entity_id),
    KEY idx_actual_entities (actual_payer_entity_id, actual_payee_entity_id),
    KEY idx_retention_entity (retention_entity_id),
    KEY idx_detail_type_status (detail_type, detail_status),
    KEY idx_execution_order (execution_order)
) COMMENT '过账处理明细表';

-- 4. 轧差处理规则表
CREATE TABLE netting_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL COMMENT '轧差规则名称',
    rule_description TEXT COMMENT '规则描述',
    
    -- 适用范围
    passthrough_entity_id VARCHAR(50) NOT NULL COMMENT '过账法人ID',
    passthrough_entity_name VARCHAR(200) NOT NULL COMMENT '过账法人名称',
    target_entity_id VARCHAR(50) NOT NULL COMMENT '目标法人ID',
    target_entity_name VARCHAR(200) NOT NULL COMMENT '目标法人名称',
    currency_code VARCHAR(10) NOT NULL COMMENT '币种',
    
    -- 轧差处理模式
    netting_mode ENUM('FULL_NETTING', 'SEPARATE_PAYMENTS') DEFAULT 'FULL_NETTING' COMMENT '处理模式：轧差/分开',
    min_netting_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '最小轧差金额',
    netting_threshold DECIMAL(15, 2) DEFAULT 0.00 COMMENT '轧差阈值',
    
    -- 规则状态
    rule_status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '规则状态',
    rule_priority INTEGER DEFAULT 100 COMMENT '优先级',
    effective_date DATE NOT NULL COMMENT '生效日期',
    expiry_date DATE COMMENT '失效日期',
    
    -- 审计字段
    created_by VARCHAR(50) NOT NULL COMMENT '创建人',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by VARCHAR(50) COMMENT '更新人',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    KEY idx_entities_currency (passthrough_entity_id, target_entity_id, currency_code),
    KEY idx_rule_status (rule_status, rule_priority),
    KEY idx_effective_date (effective_date, expiry_date)
) COMMENT '轧差处理规则表';

-- 5. 轧差处理结果表  
CREATE TABLE netting_results (
    netting_id VARCHAR(50) PRIMARY KEY,
    instruction_id VARCHAR(50) NOT NULL COMMENT '过账指令ID',
    
    -- 轧差参与方
    entity_a_id VARCHAR(50) NOT NULL COMMENT '法人A ID',
    entity_a_name VARCHAR(200) NOT NULL COMMENT '法人A名称',
    entity_b_id VARCHAR(50) NOT NULL COMMENT '法人B ID',
    entity_b_name VARCHAR(200) NOT NULL COMMENT '法人B名称',
    currency_code VARCHAR(10) NOT NULL COMMENT '币种',
    
    -- 轧差前金额
    entity_a_pay_b_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'A付B金额',
    entity_b_pay_a_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'B付A金额',
    
    -- 轧差后结果
    net_amount DECIMAL(15, 2) NOT NULL COMMENT '轧差后净额',
    net_payer_entity_id VARCHAR(50) NOT NULL COMMENT '轧差后付款方ID',
    net_payer_entity_name VARCHAR(200) NOT NULL COMMENT '轧差后付款方名称',
    net_payee_entity_id VARCHAR(50) NOT NULL COMMENT '轧差后收款方ID', 
    net_payee_entity_name VARCHAR(200) NOT NULL COMMENT '轧差后收款方名称',
    
    -- 轧差效果
    saved_transactions_count INTEGER DEFAULT 0 COMMENT '节省交易笔数',
    saved_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '节省金额',
    
    -- 处理状态
    netting_status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING' COMMENT '轧差状态',
    applied_rule_id VARCHAR(50) COMMENT '应用的轧差规则ID',
    
    -- 审计字段
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键约束
    FOREIGN KEY (instruction_id) REFERENCES passthrough_instructions(instruction_id),
    
    -- 索引
    KEY idx_instruction (instruction_id),
    KEY idx_entities (entity_a_id, entity_b_id, currency_code),
    KEY idx_net_transaction (net_payer_entity_id, net_payee_entity_id)
) COMMENT '轧差处理结果表';

-- 6. 过账执行日志表
CREATE TABLE passthrough_execution_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    instruction_id VARCHAR(50) NOT NULL COMMENT '过账指令ID',
    detail_id VARCHAR(50) COMMENT '关联明细ID(可选)',
    
    -- 日志信息
    log_level ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL') NOT NULL COMMENT '日志级别',
    log_type ENUM('ROUTING', 'RETENTION', 'NETTING', 'VALIDATION', 'EXECUTION', 'EXCEPTION') NOT NULL COMMENT '日志类型',
    log_message TEXT NOT NULL COMMENT '日志消息',
    log_details JSON COMMENT '日志详细数据',
    
    -- 执行上下文
    execution_phase ENUM('PREPARATION', 'ROUTING', 'NETTING', 'VALIDATION', 'EXECUTION', 'COMPLETION') COMMENT '执行阶段',
    processing_component VARCHAR(100) COMMENT '处理组件',
    
    -- 性能数据
    execution_time_ms BIGINT COMMENT '执行耗时(毫秒)',
    memory_usage_mb DECIMAL(10, 2) COMMENT '内存使用(MB)',
    
    -- 时间戳
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 外键约束
    FOREIGN KEY (instruction_id) REFERENCES passthrough_instructions(instruction_id),
    
    -- 索引
    KEY idx_instruction_time (instruction_id, created_time),
    KEY idx_log_level_type (log_level, log_type),
    KEY idx_execution_phase (execution_phase)
) COMMENT '过账执行日志表';

-- 7. 差异账单处理表
CREATE TABLE differential_billing (
    diff_id VARCHAR(50) PRIMARY KEY,
    
    -- 关联信息
    order_id VARCHAR(50) NOT NULL COMMENT '订单ID',
    original_instruction_id VARCHAR(50) NOT NULL COMMENT '原始过账指令ID',
    new_instruction_id VARCHAR(50) NOT NULL COMMENT '新过账指令ID',
    
    -- 差异类型
    diff_type ENUM('AMOUNT_CHANGE', 'RULE_CHANGE', 'ENTITY_CHANGE', 'CURRENCY_CHANGE') NOT NULL COMMENT '差异类型',
    diff_reason TEXT COMMENT '差异原因',
    
    -- 差异金额
    original_amount DECIMAL(15, 2) NOT NULL COMMENT '原始金额',
    new_amount DECIMAL(15, 2) NOT NULL COMMENT '新金额',
    diff_amount DECIMAL(15, 2) NOT NULL COMMENT '差异金额',
    currency_code VARCHAR(10) NOT NULL COMMENT '币种',
    
    -- 差异处理
    processing_mode ENUM('INCREMENTAL', 'FULL_REPLACEMENT') DEFAULT 'INCREMENTAL' COMMENT '处理模式',
    diff_status ENUM('IDENTIFIED', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'IDENTIFIED' COMMENT '差异状态',
    
    -- 审批信息
    approval_required BOOLEAN DEFAULT FALSE COMMENT '是否需要审批',
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') COMMENT '审批状态',
    approved_by VARCHAR(50) COMMENT '审批人',
    approved_time TIMESTAMP COMMENT '审批时间',
    approval_comment TEXT COMMENT '审批意见',
    
    -- 审计字段
    created_by VARCHAR(50) NOT NULL COMMENT '创建人',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by VARCHAR(50) COMMENT '更新人',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    KEY idx_order (order_id),
    KEY idx_instructions (original_instruction_id, new_instruction_id),
    KEY idx_diff_type (diff_type, diff_status),
    KEY idx_approval (approval_required, approval_status)
) COMMENT '差异账单处理表';

-- =====================================================
-- 创建视图
-- =====================================================

-- 过账处理概览视图
CREATE VIEW v_passthrough_overview AS
SELECT 
    pi.instruction_id,
    pi.instruction_name,
    pi.order_id,
    pi.passthrough_mode,
    pi.instruction_status,
    pi.original_total_amount,
    pi.passthrough_total_amount,
    pi.retention_total_amount,
    pi.netting_saved_amount,
    pi.original_transactions_count,
    pi.processed_transactions_count,
    pi.execution_duration_ms,
    pi.created_time,
    COUNT(pd.detail_id) as detail_count,
    COUNT(CASE WHEN pd.detail_status = 'PROCESSED' THEN 1 END) as processed_count,
    COUNT(nr.netting_id) as netting_count
FROM passthrough_instructions pi
LEFT JOIN passthrough_details pd ON pi.instruction_id = pd.instruction_id
LEFT JOIN netting_results nr ON pi.instruction_id = nr.instruction_id
GROUP BY pi.instruction_id;

-- 路由规则有效性视图
CREATE VIEW v_active_routing_rules AS
SELECT 
    rule_id,
    rule_name,
    payer_legal_entity_name,
    payee_legal_entity_name,
    currency_code,
    routing_entity_1_name,
    routing_entity_2_name,
    routing_1_retention_rate,
    routing_2_retention_rate,
    rule_priority,
    effective_date,
    expiry_date
FROM passthrough_routing_rules
WHERE rule_status = 'ACTIVE'
  AND effective_date <= CURDATE()
  AND (expiry_date IS NULL OR expiry_date >= CURDATE())
ORDER BY rule_priority ASC;

-- 轧差效果统计视图
CREATE VIEW v_netting_effectiveness AS
SELECT 
    entity_a_name,
    entity_b_name,
    currency_code,
    COUNT(*) as netting_count,
    SUM(entity_a_pay_b_amount + entity_b_pay_a_amount) as total_gross_amount,
    SUM(net_amount) as total_net_amount,
    SUM(saved_amount) as total_saved_amount,
    SUM(saved_transactions_count) as total_saved_transactions,
    AVG(net_amount / (entity_a_pay_b_amount + entity_b_pay_a_amount + 0.01)) * 100 as avg_netting_ratio
FROM netting_results
WHERE netting_status = 'COMPLETED'
GROUP BY entity_a_name, entity_b_name, currency_code;

-- =====================================================
-- 创建存储过程
-- =====================================================

DELIMITER //

-- 应用过账路由规则的存储过程
CREATE PROCEDURE sp_apply_routing_rules(
    IN p_instruction_id VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_payer_id, v_payee_id, v_currency VARCHAR(50);
    DECLARE v_amount DECIMAL(15,2);
    DECLARE v_rule_id VARCHAR(50);
    DECLARE v_routing_1_id, v_routing_2_id VARCHAR(50);
    DECLARE v_retention_1_rate, v_retention_2_rate DECIMAL(10,6);
    
    DECLARE cur CURSOR FOR 
        SELECT original_payer_entity_id, original_payee_entity_id, currency_code, original_amount
        FROM passthrough_details 
        WHERE instruction_id = p_instruction_id AND detail_status = 'PENDING';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error occurred during routing rules application';
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_payer_id, v_payee_id, v_currency, v_amount;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 查找匹配的路由规则
        SELECT rule_id, routing_entity_1_id, routing_entity_2_id, 
               routing_1_retention_rate, routing_2_retention_rate
        INTO v_rule_id, v_routing_1_id, v_routing_2_id,
             v_retention_1_rate, v_retention_2_rate
        FROM passthrough_routing_rules
        WHERE payer_legal_entity_id = v_payer_id
          AND payee_legal_entity_id = v_payee_id  
          AND currency_code = v_currency
          AND rule_status = 'ACTIVE'
          AND effective_date <= CURDATE()
          AND (expiry_date IS NULL OR expiry_date >= CURDATE())
        ORDER BY rule_priority ASC
        LIMIT 1;
        
        -- 如果找到路由规则，应用路由逻辑
        IF v_rule_id IS NOT NULL THEN
            -- 这里实现具体的路由逻辑
            -- 更新过账明细表中的实际付款方和收款方
            UPDATE passthrough_details 
            SET applied_rule_id = v_rule_id,
                detail_status = 'PROCESSED'
            WHERE instruction_id = p_instruction_id
              AND original_payer_entity_id = v_payer_id
              AND original_payee_entity_id = v_payee_id;
        END IF;
        
    END LOOP;
    CLOSE cur;
    
    SET p_result_code = 0;
    SET p_result_message = 'Routing rules applied successfully';
    COMMIT;
END //

DELIMITER ;

-- =====================================================
-- 创建初始化数据
-- =====================================================

-- 插入示例过账路由规则
INSERT INTO passthrough_routing_rules (
    rule_id, rule_name, rule_description,
    payer_legal_entity_id, payer_legal_entity_name,
    payee_legal_entity_id, payee_legal_entity_name,
    currency_code,
    routing_entity_1_id, routing_entity_1_name,
    routing_entity_2_id, routing_entity_2_name,
    retention_mode,
    routing_1_retention_rate, routing_2_retention_rate,
    rule_priority, rule_status, effective_date,
    created_by
) VALUES
('ROUTE_001', 'A公司到B公司USD过账规则', 'A公司付B公司USD时通过C公司过账',
 'ENTITY_A', 'A公司', 'ENTITY_B', 'B公司', 'USD',
 'ENTITY_C', 'C公司', NULL, NULL,
 'PERCENTAGE', 0.010000, 0.000000,
 100, 'ACTIVE', '2025-01-01', 'system'),

('ROUTE_002', 'A公司到B公司CNY双路由规则', 'A公司付B公司CNY时通过C公司和D公司过账',
 'ENTITY_A', 'A公司', 'ENTITY_B', 'B公司', 'CNY',
 'ENTITY_C', 'C公司', 'ENTITY_D', 'D公司',
 'PERCENTAGE', 0.010000, 0.005000,
 200, 'ACTIVE', '2025-01-01', 'system'),

('ROUTE_003', 'E公司到F公司EUR固定金额规则', 'E公司付F公司EUR时固定留存金额',
 'ENTITY_E', 'E公司', 'ENTITY_F', 'F公司', 'EUR',
 'ENTITY_G', 'G公司', NULL, NULL,
 'FIXED_AMOUNT', 0.000000, 0.000000,
 150, 'ACTIVE', '2025-01-01', 'system');

-- 插入示例轧差规则
INSERT INTO netting_rules (
    rule_id, rule_name, rule_description,
    passthrough_entity_id, passthrough_entity_name,
    target_entity_id, target_entity_name,
    currency_code, netting_mode,
    min_netting_amount, netting_threshold,
    rule_status, rule_priority, effective_date,
    created_by
) VALUES
('NETTING_001', 'C公司与B公司USD轧差规则', 'C公司与B公司之间USD交易进行轧差处理',
 'ENTITY_C', 'C公司', 'ENTITY_B', 'B公司', 'USD',
 'FULL_NETTING', 100.00, 50.00,
 'ACTIVE', 100, '2025-01-01', 'system'),

('NETTING_002', 'D公司与其他法人CNY轧差规则', 'D公司与其他法人CNY交易分开处理',
 'ENTITY_D', 'D公司', 'ENTITY_B', 'B公司', 'CNY', 
 'SEPARATE_PAYMENTS', 0.00, 0.00,
 'ACTIVE', 200, '2025-01-01', 'system');

-- =====================================================
-- 创建索引优化
-- =====================================================

-- 过账路由规则查询优化索引
CREATE INDEX idx_routing_rules_lookup ON passthrough_routing_rules 
(payer_legal_entity_id, payee_legal_entity_id, currency_code, rule_status, rule_priority);

-- 过账明细执行顺序索引
CREATE INDEX idx_details_execution ON passthrough_details 
(instruction_id, execution_order, detail_status);

-- 日志查询优化索引
CREATE INDEX idx_logs_query ON passthrough_execution_logs 
(instruction_id, log_level, created_time);

COMMENT ON TABLE passthrough_routing_rules IS '过账路由规则配置表 - 定义资金流的路由规则和留存计算';
COMMENT ON TABLE passthrough_instructions IS '过账处理指令表 - 过账处理的主控制表';
COMMENT ON TABLE passthrough_details IS '过账处理明细表 - 记录每笔过账交易的详细信息';
COMMENT ON TABLE netting_rules IS '轧差处理规则表 - 定义法人间的轧差处理规则';  
COMMENT ON TABLE netting_results IS '轧差处理结果表 - 记录轧差处理的结果';
COMMENT ON TABLE passthrough_execution_logs IS '过账执行日志表 - 记录过账处理的执行日志';
COMMENT ON TABLE differential_billing IS '差异账单处理表 - 处理清分结果变更产生的差异';