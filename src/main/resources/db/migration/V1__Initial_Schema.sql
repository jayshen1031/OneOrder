-- OneOrder财务清分系统 - 初始数据库结构
-- V1__Initial_Schema.sql

-- 法人实体表
CREATE TABLE legal_entity (
    entity_id VARCHAR(50) PRIMARY KEY,
    entity_name VARCHAR(200) NOT NULL,
    entity_code VARCHAR(50) UNIQUE,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('CUSTOMER', 'SALES', 'DELIVERY', 'SUPPLIER')),
    region VARCHAR(10),
    country VARCHAR(10),
    is_transit_entity BOOLEAN NOT NULL DEFAULT FALSE,
    default_retention_rate DECIMAL(8,4) DEFAULT 0.0000,
    tax_registration_no VARCHAR(50),
    bank_accounts TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    remarks VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_legal_entity_type ON legal_entity(entity_type);
CREATE INDEX idx_legal_entity_region ON legal_entity(region);
CREATE INDEX idx_legal_entity_active ON legal_entity(is_active);
CREATE INDEX idx_legal_entity_transit ON legal_entity(is_transit_entity);

-- 订单表
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    order_no VARCHAR(100) UNIQUE NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    sales_entity_id VARCHAR(50) NOT NULL,
    delivery_entity_id VARCHAR(50),
    payment_entity_id VARCHAR(50),
    total_amount DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2),
    currency VARCHAR(10) NOT NULL,
    order_status VARCHAR(20) NOT NULL CHECK (order_status IN ('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    clearing_status VARCHAR(20) CHECK (clearing_status IN ('PENDING', 'CLEARING', 'CLEARED', 'FAILED')),
    clearing_mode VARCHAR(10) CHECK (clearing_mode IN ('STAR', 'CHAIN')),
    order_date TIMESTAMP NOT NULL,
    business_type VARCHAR(50),
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    remarks VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_sales_entity ON orders(sales_entity_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_clearing_status ON orders(clearing_status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_currency ON orders(currency);

-- 订单项表
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    item_id VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id),
    service_type VARCHAR(50) NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    service_provider_id VARCHAR(50),
    charge_amount DECIMAL(15,2) NOT NULL,
    cost_amount DECIMAL(15,2),
    currency VARCHAR(10) NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    unit_price DECIMAL(15,2),
    need_clearing BOOLEAN NOT NULL DEFAULT TRUE,
    remarks VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_service_type ON order_items(service_type);
CREATE INDEX idx_order_items_provider ON order_items(service_provider_id);

-- 清分规则表
CREATE TABLE clearing_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('CLEARING_MODE', 'PROFIT_SHARING', 'TRANSIT_ENTITY', 'CROSS_BORDER', 'NETTING', 'RETENTION')),
    rule_config TEXT,
    priority INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    applicable_scope TEXT,
    condition_expression TEXT,
    description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_clearing_rules_type ON clearing_rules(rule_type);
CREATE INDEX idx_clearing_rules_priority ON clearing_rules(priority);
CREATE INDEX idx_clearing_rules_active ON clearing_rules(is_active);

-- 清分结果表
CREATE TABLE clearing_results (
    id BIGSERIAL PRIMARY KEY,
    result_id VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id),
    entity_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('RECEIVABLE', 'PAYABLE', 'PROFIT_SHARING', 'TRANSIT_FEE', 'NETTING')),
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('EXTERNAL_RECEIVABLE', 'EXTERNAL_PAYABLE', 'INTERNAL_RECEIVABLE', 'INTERNAL_PAYABLE')),
    clearing_mode VARCHAR(10) NOT NULL CHECK (clearing_mode IN ('STAR', 'CHAIN')),
    is_transit_retention BOOLEAN NOT NULL DEFAULT FALSE,
    retention_rate DECIMAL(8,4),
    original_amount DECIMAL(15,2),
    rule_id VARCHAR(50),
    management_amount DECIMAL(15,2),
    legal_amount DECIMAL(15,2),
    remarks VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_clearing_results_order ON clearing_results(order_id);
CREATE INDEX idx_clearing_results_entity ON clearing_results(entity_id);
CREATE INDEX idx_clearing_results_transaction_type ON clearing_results(transaction_type);
CREATE INDEX idx_clearing_results_currency ON clearing_results(currency);
CREATE INDEX idx_clearing_results_rule ON clearing_results(rule_id);
CREATE INDEX idx_clearing_results_created_at ON clearing_results(created_at);

-- 会计分录表
CREATE TABLE accounting_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_id VARCHAR(50) UNIQUE NOT NULL,
    voucher_id VARCHAR(50) NOT NULL,
    clearing_result_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    debit_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('RECEIVABLE', 'PAYABLE', 'REVENUE', 'COST', 'EXPENSE', 'PROFIT', 'TRANSIT')),
    business_type VARCHAR(50),
    summary VARCHAR(200),
    is_posted BOOLEAN NOT NULL DEFAULT FALSE,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('MANAGEMENT', 'LEGAL')),
    remarks VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version BIGINT DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_accounting_entries_voucher ON accounting_entries(voucher_id);
CREATE INDEX idx_accounting_entries_order ON accounting_entries(order_id);
CREATE INDEX idx_accounting_entries_entity ON accounting_entries(entity_id);
CREATE INDEX idx_accounting_entries_account ON accounting_entries(account_code);
CREATE INDEX idx_accounting_entries_posted ON accounting_entries(is_posted);
CREATE INDEX idx_accounting_entries_report_type ON accounting_entries(report_type);
CREATE INDEX idx_accounting_entries_created_at ON accounting_entries(created_at);

-- 外键约束
ALTER TABLE orders ADD CONSTRAINT fk_orders_sales_entity FOREIGN KEY (sales_entity_id) REFERENCES legal_entity(entity_id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_delivery_entity FOREIGN KEY (delivery_entity_id) REFERENCES legal_entity(entity_id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment_entity FOREIGN KEY (payment_entity_id) REFERENCES legal_entity(entity_id);

ALTER TABLE clearing_results ADD CONSTRAINT fk_clearing_results_entity FOREIGN KEY (entity_id) REFERENCES legal_entity(entity_id);
ALTER TABLE clearing_results ADD CONSTRAINT fk_clearing_results_rule FOREIGN KEY (rule_id) REFERENCES clearing_rules(rule_id);

ALTER TABLE accounting_entries ADD CONSTRAINT fk_accounting_entries_entity FOREIGN KEY (entity_id) REFERENCES legal_entity(entity_id);
ALTER TABLE accounting_entries ADD CONSTRAINT fk_accounting_entries_clearing_result FOREIGN KEY (clearing_result_id) REFERENCES clearing_results(result_id);

-- 添加注释
COMMENT ON TABLE legal_entity IS '法人实体表，存储四类法人体信息';
COMMENT ON TABLE orders IS '订单表，存储订单基本信息';
COMMENT ON TABLE order_items IS '订单项表，存储订单服务项目';
COMMENT ON TABLE clearing_rules IS '清分规则表，存储各类清分规则配置';
COMMENT ON TABLE clearing_results IS '清分结果表，存储清分计算结果';
COMMENT ON TABLE accounting_entries IS '会计分录表，存储财务核算分录';

COMMENT ON COLUMN legal_entity.entity_type IS '实体类型：CUSTOMER-客户，SALES-销售站，DELIVERY-交付站，SUPPLIER-供应商';
COMMENT ON COLUMN legal_entity.is_transit_entity IS '是否为中转法人体（用于借抬头、过账）';
COMMENT ON COLUMN orders.clearing_mode IS '清分模式：STAR-星式，CHAIN-链式';
COMMENT ON COLUMN clearing_results.transaction_type IS '交易类型：RECEIVABLE-应收，PAYABLE-应付，PROFIT_SHARING-分润，TRANSIT_FEE-中转费，NETTING-净额';
COMMENT ON COLUMN clearing_results.account_type IS '账务类型：外收、外支、内收、内支';
COMMENT ON COLUMN accounting_entries.report_type IS '报表类型：MANAGEMENT-管理报表，LEGAL-法定报表';