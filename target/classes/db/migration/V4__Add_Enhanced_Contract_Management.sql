-- 增强内部合约管理系统 - 集团级数据Schema
-- 基于PRD实体设计: 4.1-4.6 六大核心实体

-- ================== 4.1 内部主合约表 ==================
CREATE TABLE internal_master_contract (
    contract_id VARCHAR(20) PRIMARY KEY,
    sales_cost_center VARCHAR(200) NOT NULL, -- 多选支持，JSON格式存储
    delivery_cost_center VARCHAR(200) NOT NULL, -- 多选支持，JSON格式存储
    is_reciprocal_contract BOOLEAN DEFAULT FALSE,
    liability_clause TEXT,
    exemption_clause TEXT,
    execution_date DATE NOT NULL,
    is_long_term_contract BOOLEAN DEFAULT FALSE,
    expiration_date DATE, -- 非长期合同时必填
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(20),
    
    -- 约束：非长期合同时必须有有效期
    CHECK (is_long_term_contract = TRUE OR expiration_date IS NOT NULL),
    -- 约束：有效期不能早于生效时间
    CHECK (expiration_date IS NULL OR execution_date <= expiration_date),
    
    FOREIGN KEY (created_by) REFERENCES staff(staff_id)
);

CREATE INDEX idx_master_contract_dates ON internal_master_contract(execution_date, expiration_date);
CREATE INDEX idx_master_contract_type ON internal_master_contract(is_long_term_contract);
CREATE INDEX idx_master_contract_status ON internal_master_contract(is_reciprocal_contract);

-- ================== 4.2 合约条款表 ==================
CREATE TABLE contract_terms (
    terms_id VARCHAR(20) PRIMARY KEY,
    applicable_services VARCHAR(500), -- 多选支持，JSON格式存储
    applicable_customers VARCHAR(500), -- 多选支持，JSON格式存储，空表示所有客户
    applicable_conditions TEXT, -- 条件表达式
    profit_sharing_type VARCHAR(20) NOT NULL CHECK (profit_sharing_type IN ('BUY_SELL_PRICE', 'COST_PLUS_FEE', 'RATIO_SHARING', 'CUSTOM')),
    sales_profit_ratio DECIMAL(5,2), -- 百分比，不超过100%
    delivery_profit_ratio DECIMAL(5,2), -- 自动计算，两项总和为100%
    operating_fee_currency VARCHAR(3), -- 币种
    unit_of_measurement VARCHAR(20), -- 计量单位
    unit_price DECIMAL(12,2), -- 操作费单价，正数
    minimum_per_order DECIMAL(12,2), -- 票票最小值，正数
    maximum_per_order DECIMAL(12,2), -- 票票最大值，正数
    dept_type_for_script VARCHAR(20) CHECK (dept_type_for_script IN ('SALES', 'DELIVERY')), -- 脚本对象
    calculation_script TEXT, -- 分润计算脚本
    cost_price_disclosure BOOLEAN DEFAULT FALSE, -- 成本、售价是否相互公开
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束：按比例分润时必须设置比例
    CHECK (profit_sharing_type != 'RATIO_SHARING' OR (sales_profit_ratio IS NOT NULL AND delivery_profit_ratio IS NOT NULL)),
    -- 约束：成本+操作费时必须设置相关字段
    CHECK (profit_sharing_type != 'COST_PLUS_FEE' OR (operating_fee_currency IS NOT NULL AND unit_of_measurement IS NOT NULL AND unit_price IS NOT NULL)),
    -- 约束：自定义时必须有脚本
    CHECK (profit_sharing_type != 'CUSTOM' OR calculation_script IS NOT NULL),
    -- 约束：比例总和为100%
    CHECK (sales_profit_ratio IS NULL OR delivery_profit_ratio IS NULL OR sales_profit_ratio + delivery_profit_ratio = 100),
    -- 约束：最小值不能大于最大值
    CHECK (minimum_per_order IS NULL OR maximum_per_order IS NULL OR minimum_per_order <= maximum_per_order)
);

CREATE INDEX idx_contract_terms_type ON contract_terms(profit_sharing_type);
CREATE INDEX idx_contract_terms_currency ON contract_terms(operating_fee_currency);

-- ================== 4.3 法人间关联交易特殊规则表 ==================
CREATE TABLE intercompany_transaction_rules (
    rule_id VARCHAR(20) PRIMARY KEY,
    corresponding_terms_id VARCHAR(20) NOT NULL,
    sales_entity_id VARCHAR(20) NOT NULL, -- 销售站对应法人
    delivery_entity_id VARCHAR(20) NOT NULL, -- 交付站对应法人
    transaction_mode VARCHAR(30) NOT NULL CHECK (transaction_mode IN ('RATIO_RETENTION', 'COST_RATIO_MARKUP', 'COST_FIXED_MARKUP')),
    sales_profit_retention_ratio DECIMAL(5,2), -- 销售法人留存毛利比例
    delivery_profit_retention_ratio DECIMAL(5,2), -- 交付法人留存毛利比例，自动计算
    cost_markup_ratio DECIMAL(5,2), -- 成本加成比例
    fixed_markup_amount DECIMAL(12,2), -- 固定加成金额
    fixed_markup_currency VARCHAR(3), -- 固定加成币种
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (corresponding_terms_id) REFERENCES contract_terms(terms_id),
    FOREIGN KEY (sales_entity_id) REFERENCES legal_entity(entity_id),
    FOREIGN KEY (delivery_entity_id) REFERENCES legal_entity(entity_id),
    
    -- 约束：销售站法人和交付站法人组合唯一性
    UNIQUE (corresponding_terms_id, sales_entity_id, delivery_entity_id),
    -- 约束：比例留存模式时必须设置比例
    CHECK (transaction_mode != 'RATIO_RETENTION' OR (sales_profit_retention_ratio IS NOT NULL AND delivery_profit_retention_ratio IS NOT NULL)),
    -- 约束：成本按比例加成模式时必须设置加成比例
    CHECK (transaction_mode != 'COST_RATIO_MARKUP' OR cost_markup_ratio IS NOT NULL),
    -- 约束：成本+固定金额加成模式时必须设置固定金额和币种
    CHECK (transaction_mode != 'COST_FIXED_MARKUP' OR (fixed_markup_amount IS NOT NULL AND fixed_markup_currency IS NOT NULL)),
    -- 约束：留存比例总和为100%
    CHECK (sales_profit_retention_ratio IS NULL OR delivery_profit_retention_ratio IS NULL OR sales_profit_retention_ratio + delivery_profit_retention_ratio = 100)
);

CREATE INDEX idx_intercompany_rules_entities ON intercompany_transaction_rules(sales_entity_id, delivery_entity_id);
CREATE INDEX idx_intercompany_rules_terms ON intercompany_transaction_rules(corresponding_terms_id);
CREATE INDEX idx_intercompany_rules_mode ON intercompany_transaction_rules(transaction_mode);

-- ================== 4.4 考核补贴规则表 ==================
CREATE TABLE assessment_subsidy_rules (
    rule_id VARCHAR(20) PRIMARY KEY,
    rule_name_cn VARCHAR(100) NOT NULL,
    rule_name_en VARCHAR(100),
    applicable_cost_centers VARCHAR(500), -- 留空为集团层有效，JSON格式存储多选
    applicable_services VARCHAR(500) NOT NULL, -- 对应主数据-服务，JSON格式存储
    subsidy_conditions TEXT, -- 补贴条件
    subsidy_cost_center_type VARCHAR(20) NOT NULL CHECK (subsidy_cost_center_type IN ('SALES', 'DELIVERY')),
    subsidy_mode VARCHAR(20) NOT NULL CHECK (subsidy_mode IN ('PROFIT_MARKUP', 'FIXED_SUBSIDY')),
    markup_base VARCHAR(20) CHECK (markup_base IN ('TOTAL_PROFIT', 'DEPT_PROFIT')), -- 毛利加成模式下的基数
    markup_coefficient DECIMAL(5,2), -- 加成系数，如20%补贴则系数为1.2
    exclude_negative_profit BOOLEAN DEFAULT TRUE, -- 负毛利不计算补贴
    subsidy_currency VARCHAR(3) NOT NULL,
    unit_of_measurement VARCHAR(20), -- 关联核算对应的可用计量单位
    unit_subsidy_amount DECIMAL(12,2), -- 单位补贴金额
    minimum_subsidy_per_order DECIMAL(12,2), -- 单订单补贴最小值
    maximum_subsidy_per_order DECIMAL(12,2), -- 单订单补贴最大值
    is_commission_calculated BOOLEAN DEFAULT TRUE, -- 补贴是否提成计入
    valid_from DATE NOT NULL, -- 有效期起始，不可早于创建日期
    valid_to DATE NOT NULL, -- 有效期截止，以创建订单日期判定
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束：毛利加成模式时必须设置基数和系数
    CHECK (subsidy_mode != 'PROFIT_MARKUP' OR (markup_base IS NOT NULL AND markup_coefficient IS NOT NULL)),
    -- 约束：定额补贴模式时必须设置单位和金额
    CHECK (subsidy_mode != 'FIXED_SUBSIDY' OR (unit_of_measurement IS NOT NULL AND unit_subsidy_amount IS NOT NULL)),
    -- 约束：有效期起始不能晚于截止
    CHECK (valid_from <= valid_to),
    -- 约束：最小值不能大于最大值
    CHECK (minimum_subsidy_per_order IS NULL OR maximum_subsidy_per_order IS NULL OR minimum_subsidy_per_order <= maximum_subsidy_per_order)
);

CREATE INDEX idx_subsidy_rules_dates ON assessment_subsidy_rules(valid_from, valid_to);
CREATE INDEX idx_subsidy_rules_type ON assessment_subsidy_rules(subsidy_cost_center_type, subsidy_mode);
CREATE INDEX idx_subsidy_rules_currency ON assessment_subsidy_rules(subsidy_currency);

-- ================== 4.5 收付款借抬头规则表 ==================
CREATE TABLE receipt_payment_retention_rules (
    rule_id VARCHAR(20) PRIMARY KEY,
    applicable_entities VARCHAR(500) NOT NULL, -- 法人公司，JSON格式存储多选
    receipt_retention_mode VARCHAR(30) CHECK (receipt_retention_mode IN ('RATIO_RETENTION', 'FIXED_AMOUNT_RETENTION')),
    receipt_retention_ratio DECIMAL(5,2), -- 收款留存比例
    receipt_retention_amount DECIMAL(12,2), -- 收款留存金额
    receipt_retention_currency VARCHAR(3), -- 收款留存币种
    convert_to_receipt_currency BOOLEAN DEFAULT TRUE, -- 转换为收款抬头币种
    receipt_retention_ratio_limit DECIMAL(5,2), -- 收款留存金额占收款金额比例上限
    no_retention_if_business_participant BOOLEAN DEFAULT TRUE, -- 同时作为业务参与方则不留存
    payment_retention_mode VARCHAR(30) CHECK (payment_retention_mode IN ('RATIO_RETENTION', 'FIXED_AMOUNT_RETENTION')),
    payment_retention_ratio DECIMAL(5,2), -- 付款留存比例
    payment_retention_amount DECIMAL(12,2), -- 付款留存金额
    payment_retention_currency VARCHAR(3), -- 付款留存币种
    convert_to_payment_currency BOOLEAN DEFAULT TRUE, -- 转换为付款抬头币种
    payment_retention_ratio_limit DECIMAL(5,2), -- 付款留存金额占付款金额比例上限
    no_payment_retention_if_business_participant BOOLEAN DEFAULT TRUE, -- 同时作为业务参与方则不留存
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束：收款按比例留存时必须设置比例
    CHECK (receipt_retention_mode != 'RATIO_RETENTION' OR receipt_retention_ratio IS NOT NULL),
    -- 约束：收款按固定金额留存时必须设置金额和币种
    CHECK (receipt_retention_mode != 'FIXED_AMOUNT_RETENTION' OR (receipt_retention_amount IS NOT NULL AND receipt_retention_currency IS NOT NULL)),
    -- 约束：付款按比例留存时必须设置比例
    CHECK (payment_retention_mode != 'RATIO_RETENTION' OR payment_retention_ratio IS NOT NULL),
    -- 约束：付款按固定金额留存时必须设置金额和币种
    CHECK (payment_retention_mode != 'FIXED_AMOUNT_RETENTION' OR (payment_retention_amount IS NOT NULL AND payment_retention_currency IS NOT NULL))
);

CREATE INDEX idx_retention_rules_receipt_mode ON receipt_payment_retention_rules(receipt_retention_mode);
CREATE INDEX idx_retention_rules_payment_mode ON receipt_payment_retention_rules(payment_retention_mode);

-- ================== 4.6 资金路由规则表 ==================
CREATE TABLE fund_routing_rules (
    rule_id VARCHAR(20) PRIMARY KEY,
    paying_entity_id VARCHAR(20) NOT NULL, -- 付款法人公司
    receiving_entity_id VARCHAR(20) NOT NULL, -- 收款法人公司
    currency VARCHAR(3), -- 币种，不填即为全币种适用
    routing_entity_1 VARCHAR(20), -- 路由公司1
    routing_entity_2 VARCHAR(20), -- 路由公司2
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (paying_entity_id) REFERENCES legal_entity(entity_id),
    FOREIGN KEY (receiving_entity_id) REFERENCES legal_entity(entity_id),
    FOREIGN KEY (routing_entity_1) REFERENCES legal_entity(entity_id),
    FOREIGN KEY (routing_entity_2) REFERENCES legal_entity(entity_id),
    
    -- 约束：付款方和收款方不能相同
    CHECK (paying_entity_id != receiving_entity_id),
    -- 约束：路由公司不能与付款方或收款方相同
    CHECK (routing_entity_1 IS NULL OR (routing_entity_1 != paying_entity_id AND routing_entity_1 != receiving_entity_id)),
    CHECK (routing_entity_2 IS NULL OR (routing_entity_2 != paying_entity_id AND routing_entity_2 != receiving_entity_id))
);

CREATE INDEX idx_fund_routing_entities ON fund_routing_rules(paying_entity_id, receiving_entity_id);
CREATE INDEX idx_fund_routing_currency ON fund_routing_rules(currency);

-- ================== 扩展现有表结构 ==================

-- 为订单表添加合约管理字段
ALTER TABLE orders ADD COLUMN master_contract_id VARCHAR(20);
ALTER TABLE orders ADD COLUMN contract_terms_id VARCHAR(20);
ALTER TABLE orders ADD COLUMN assigned_sales_staff VARCHAR(20);
ALTER TABLE orders ADD COLUMN assigned_delivery_staff VARCHAR(20);

-- 添加外键约束
ALTER TABLE orders ADD FOREIGN KEY (master_contract_id) REFERENCES internal_master_contract(contract_id);
ALTER TABLE orders ADD FOREIGN KEY (contract_terms_id) REFERENCES contract_terms(terms_id);
ALTER TABLE orders ADD FOREIGN KEY (assigned_sales_staff) REFERENCES staff(staff_id);
ALTER TABLE orders ADD FOREIGN KEY (assigned_delivery_staff) REFERENCES staff(staff_id);

-- 为order_service表添加合约条款关联
ALTER TABLE order_service ADD COLUMN contract_terms_id VARCHAR(20);
ALTER TABLE order_service ADD COLUMN subsidy_rule_id VARCHAR(20);
ALTER TABLE order_service ADD COLUMN intercompany_rule_id VARCHAR(20);

-- 添加外键约束
ALTER TABLE order_service ADD FOREIGN KEY (contract_terms_id) REFERENCES contract_terms(terms_id);
ALTER TABLE order_service ADD FOREIGN KEY (subsidy_rule_id) REFERENCES assessment_subsidy_rules(rule_id);
ALTER TABLE order_service ADD FOREIGN KEY (intercompany_rule_id) REFERENCES intercompany_transaction_rules(rule_id);

-- 创建索引
CREATE INDEX idx_orders_contracts ON orders(master_contract_id, contract_terms_id);
CREATE INDEX idx_orders_staff_assignment ON orders(assigned_sales_staff, assigned_delivery_staff);
CREATE INDEX idx_order_service_rules ON order_service(contract_terms_id, subsidy_rule_id, intercompany_rule_id);

-- ================== 添加表注释 ==================
COMMENT ON TABLE internal_master_contract IS '内部主合约表 - 集团级销售与交付核算单元协作协议';
COMMENT ON TABLE contract_terms IS '合约条款表 - 定义分润模型和计算规则';
COMMENT ON TABLE intercompany_transaction_rules IS '法人间关联交易特殊规则表 - 定义跨法人实体的交易处理规则';
COMMENT ON TABLE assessment_subsidy_rules IS '考核补贴规则表 - 集团人力资源管理的补贴政策';
COMMENT ON TABLE receipt_payment_retention_rules IS '收付款借抬头规则表 - 集团财务管理的资金留存规则';
COMMENT ON TABLE fund_routing_rules IS '资金路由规则表 - 集团财务管理的资金流转路径';

-- ================== 创建视图便于查询 ==================

-- 有效合约视图
CREATE VIEW active_master_contracts AS
SELECT mc.*, 
       CASE 
           WHEN mc.is_long_term_contract = TRUE THEN TRUE
           WHEN mc.expiration_date IS NULL OR mc.expiration_date >= CURRENT_DATE THEN TRUE
           ELSE FALSE
       END as is_currently_active
FROM internal_master_contract mc
WHERE mc.execution_date <= CURRENT_DATE;

-- 完整合约信息视图
CREATE VIEW contract_full_info AS
SELECT mc.contract_id,
       mc.execution_date,
       mc.expiration_date,
       mc.is_long_term_contract,
       ct.terms_id,
       ct.profit_sharing_type,
       ct.sales_profit_ratio,
       ct.delivery_profit_ratio
FROM internal_master_contract mc
LEFT JOIN contract_terms ct ON mc.contract_id = ct.terms_id; -- 这里需要根据实际关联关系调整

COMMENT ON VIEW active_master_contracts IS '当前有效的内部主合约视图';
COMMENT ON VIEW contract_full_info IS '完整合约信息视图 - 主合约与条款的关联信息';