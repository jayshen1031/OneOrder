-- OneOrder接派单流程数据表结构
-- 第一期：接派单流程核心表
-- 创建日期：2025-09-16

-- 1. 服务派单表
CREATE TABLE service_assignments (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    service_code VARCHAR(50) NOT NULL,           -- 服务项目编码
    service_name VARCHAR(100) NOT NULL,          -- 服务项目名称
    customer_service_id VARCHAR(50) NOT NULL,    -- 客服ID
    customer_service_name VARCHAR(100) NOT NULL, -- 客服姓名
    assigned_operator_id VARCHAR(50),            -- 分配的操作人员ID
    assigned_operator_name VARCHAR(100),         -- 分配的操作人员姓名
    assignment_status VARCHAR(20) DEFAULT 'PENDING', -- 派单状态：PENDING/ASSIGNED/CONFIRMED/REJECTED
    assignment_time TIMESTAMP,                   -- 派单时间
    confirmation_time TIMESTAMP,                 -- 确认时间
    protocol_id BIGINT,                         -- 关联的内部协议ID
    service_fee DECIMAL(15,2),                  -- 服务费用
    estimated_cost DECIMAL(15,2),               -- 预估成本
    assignment_notes TEXT,                       -- 派单备注
    confirmation_notes TEXT,                     -- 确认备注
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    INDEX idx_order_service (order_id, service_code),
    INDEX idx_customer_service (customer_service_id),
    INDEX idx_assigned_operator (assigned_operator_id),
    INDEX idx_assignment_status (assignment_status),
    INDEX idx_assignment_time (assignment_time)
);

-- 2. 内部协议配置表
CREATE TABLE internal_protocols (
    id BIGSERIAL PRIMARY KEY,
    protocol_name VARCHAR(100) NOT NULL,        -- 协议名称
    business_type VARCHAR(20) NOT NULL,         -- 业务类型：OCEAN/AIR/LAND/RAIL/CUSTOMS/WAREHOUSE
    service_code VARCHAR(50),                   -- 适用服务编码（NULL表示全部服务）
    customer_service_dept VARCHAR(50),          -- 客服部门
    operation_dept VARCHAR(50),                 -- 操作部门
    service_fee_range_min DECIMAL(15,2),        -- 服务费用范围最小值
    service_fee_range_max DECIMAL(15,2),        -- 服务费用范围最大值
    cost_sharing_ratio DECIMAL(5,4),            -- 成本分摊比例
    profit_sharing_ratio DECIMAL(5,4),          -- 利润分摊比例
    sla_hours INTEGER,                          -- 服务级别协议小时数
    auto_assignment BOOLEAN DEFAULT FALSE,      -- 是否自动派单
    priority_level INTEGER DEFAULT 1,           -- 优先级（1-10，数字越大优先级越高）
    effective_date DATE NOT NULL,               -- 生效日期
    expiry_date DATE,                           -- 失效日期
    status VARCHAR(20) DEFAULT 'ACTIVE',        -- 状态：ACTIVE/INACTIVE
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    
    -- 确保分摊比例合理
    CHECK (cost_sharing_ratio >= 0 AND cost_sharing_ratio <= 1),
    CHECK (profit_sharing_ratio >= 0 AND profit_sharing_ratio <= 1),
    INDEX idx_business_service (business_type, service_code),
    INDEX idx_departments (customer_service_dept, operation_dept),
    INDEX idx_priority_effective (priority_level DESC, effective_date DESC),
    INDEX idx_status_dates (status, effective_date, expiry_date)
);

-- 3. 派单通知表
CREATE TABLE assignment_notifications (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    service_assignment_id BIGINT NOT NULL,      -- 关联的服务派单ID
    notification_type VARCHAR(30) NOT NULL,     -- 通知类型：NEW_ASSIGNMENT/STATUS_UPDATE/DEADLINE_REMINDER
    recipient_id VARCHAR(50) NOT NULL,          -- 接收人ID
    recipient_name VARCHAR(100) NOT NULL,       -- 接收人姓名
    recipient_type VARCHAR(20) NOT NULL,        -- 接收人类型：OPERATOR/SUPERVISOR/CUSTOMER_SERVICE
    notification_title VARCHAR(200) NOT NULL,   -- 通知标题
    notification_content TEXT NOT NULL,         -- 通知内容
    notification_status VARCHAR(20) DEFAULT 'UNREAD', -- 通知状态：UNREAD/READ/DISMISSED
    priority_level VARCHAR(10) DEFAULT 'NORMAL', -- 优先级：HIGH/NORMAL/LOW
    send_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 发送时间
    read_time TIMESTAMP,                        -- 阅读时间
    deadline_time TIMESTAMP,                    -- 截止时间
    related_action VARCHAR(50),                 -- 相关操作：CONFIRM/REJECT/UPDATE
    action_url VARCHAR(200),                    -- 操作链接
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (service_assignment_id) REFERENCES service_assignments(id),
    INDEX idx_recipient_status (recipient_id, notification_status),
    INDEX idx_notification_type (notification_type),
    INDEX idx_send_time (send_time),
    INDEX idx_deadline (deadline_time),
    INDEX idx_priority (priority_level, send_time)
);

-- 4. 可用操作人员配置表
CREATE TABLE available_operators (
    id BIGSERIAL PRIMARY KEY,
    operator_id VARCHAR(50) NOT NULL,           -- 操作人员ID
    operator_name VARCHAR(100) NOT NULL,        -- 操作人员姓名
    department_id VARCHAR(50) NOT NULL,         -- 所属部门ID
    department_name VARCHAR(100) NOT NULL,      -- 所属部门名称
    business_types VARCHAR(200),                -- 支持的业务类型（逗号分隔）
    service_codes VARCHAR(500),                 -- 支持的服务编码（逗号分隔）
    skill_level INTEGER DEFAULT 1,              -- 技能等级（1-5）
    max_concurrent_orders INTEGER DEFAULT 10,   -- 最大并发订单数
    current_order_count INTEGER DEFAULT 0,      -- 当前订单数量
    availability_status VARCHAR(20) DEFAULT 'AVAILABLE', -- 可用状态：AVAILABLE/BUSY/UNAVAILABLE
    working_hours VARCHAR(100),                 -- 工作时间（如：09:00-18:00）
    contact_info VARCHAR(200),                  -- 联系方式
    last_assignment_time TIMESTAMP,             -- 最后派单时间
    performance_rating DECIMAL(3,2),            -- 绩效评分（1.00-5.00）
    status VARCHAR(20) DEFAULT 'ACTIVE',        -- 状态：ACTIVE/INACTIVE
    created_by VARCHAR(50) NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_time TIMESTAMP,
    
    UNIQUE (operator_id),
    INDEX idx_department (department_id),
    INDEX idx_availability (availability_status),
    INDEX idx_business_types (business_types),
    INDEX idx_skill_performance (skill_level, performance_rating),
    INDEX idx_last_assignment (last_assignment_time)
);

-- 5. 服务派单日志表
CREATE TABLE service_assignment_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    service_assignment_id BIGINT NOT NULL,      -- 关联的服务派单ID
    action_type VARCHAR(30) NOT NULL,           -- 操作类型：CREATE/ASSIGN/CONFIRM/REJECT/UPDATE/CANCEL
    operator_id VARCHAR(50) NOT NULL,           -- 操作人员ID
    operator_name VARCHAR(100) NOT NULL,        -- 操作人员姓名
    old_status VARCHAR(20),                     -- 旧状态
    new_status VARCHAR(20),                     -- 新状态
    old_assigned_operator VARCHAR(50),          -- 原分配操作员
    new_assigned_operator VARCHAR(50),          -- 新分配操作员
    action_reason VARCHAR(200),                 -- 操作原因
    action_notes TEXT,                          -- 操作备注
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 操作时间
    ip_address VARCHAR(45),                     -- 操作IP地址
    user_agent VARCHAR(200),                    -- 用户代理
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (service_assignment_id) REFERENCES service_assignments(id),
    INDEX idx_order_assignment (order_id, service_assignment_id),
    INDEX idx_action_type_time (action_type, action_time),
    INDEX idx_operator_time (operator_id, action_time)
);

-- 插入示例数据

-- 示例内部协议
INSERT INTO internal_protocols (
    protocol_name, business_type, service_code, customer_service_dept, operation_dept,
    service_fee_range_min, service_fee_range_max, cost_sharing_ratio, profit_sharing_ratio,
    sla_hours, auto_assignment, priority_level, effective_date, created_by
) VALUES 
('海运MBL处理标准协议', 'OCEAN', 'MBL_PROCESSING', '海运销售部', '海运操作部', 800.00, 1500.00, 0.7000, 0.5000, 48, FALSE, 5, '2025-01-01', 'system'),
('海运内装服务协议', 'OCEAN', 'CONTAINER_LOADING', '海运销售部', '内装操作部', 200.00, 500.00, 0.8000, 0.4000, 24, TRUE, 3, '2025-01-01', 'system'),
('报关服务标准协议', 'CUSTOMS', 'CUSTOMS_DECLARATION', '海运销售部', '报关部', 300.00, 800.00, 0.6000, 0.5000, 12, FALSE, 8, '2025-01-01', 'system'),
('通用服务协议', 'OCEAN', NULL, '海运销售部', '海运操作部', 100.00, 2000.00, 0.7000, 0.5000, 72, FALSE, 1, '2025-01-01', 'system');

-- 示例可用操作人员
INSERT INTO available_operators (
    operator_id, operator_name, department_id, department_name, business_types, service_codes,
    skill_level, max_concurrent_orders, availability_status, working_hours, contact_info, created_by
) VALUES 
('OP001', '张三', 'OCEAN_OPS', '海运操作部', 'OCEAN', 'MBL_PROCESSING,BOOKING,BILL_OF_LADING', 4, 15, 'AVAILABLE', '09:00-18:00', 'zhangsan@hcbd.com', 'system'),
('OP002', '李四', 'OCEAN_OPS', '海运操作部', 'OCEAN', 'MBL_PROCESSING,CONTAINER_LOADING', 3, 12, 'AVAILABLE', '09:00-18:00', 'lisi@hcbd.com', 'system'),
('OP003', '王五', 'LOADING_OPS', '内装操作部', 'OCEAN', 'CONTAINER_LOADING,WAREHOUSE', 5, 20, 'AVAILABLE', '08:00-17:00', 'wangwu@hcbd.com', 'system'),
('OP004', '赵六', 'CUSTOMS_OPS', '报关部', 'CUSTOMS,OCEAN', 'CUSTOMS_DECLARATION,INSPECTION', 4, 10, 'BUSY', '09:00-18:00', 'zhaoliu@hcbd.com', 'system');

-- 添加表注释
COMMENT ON TABLE service_assignments IS '服务派单表 - 记录每个订单的服务项目派单情况';
COMMENT ON TABLE internal_protocols IS '内部协议配置表 - 定义客服与操作部门间的合作协议';
COMMENT ON TABLE assignment_notifications IS '派单通知表 - 管理派单相关的通知消息';
COMMENT ON TABLE available_operators IS '可用操作人员配置表 - 维护操作人员信息和可用性';
COMMENT ON TABLE service_assignment_logs IS '服务派单日志表 - 记录派单操作的完整审计轨迹';

-- 创建视图：当前活跃派单概览
CREATE VIEW v_active_assignments AS
SELECT 
    sa.id,
    sa.order_id,
    sa.service_code,
    sa.service_name,
    sa.customer_service_name,
    sa.assigned_operator_name,
    sa.assignment_status,
    sa.assignment_time,
    sa.service_fee,
    ip.protocol_name,
    ip.sla_hours,
    CASE 
        WHEN sa.assignment_time IS NOT NULL 
        THEN sa.assignment_time + INTERVAL '1 hour' * ip.sla_hours 
        ELSE NULL 
    END as deadline_time,
    ao.availability_status as operator_availability,
    ao.current_order_count as operator_current_load
FROM service_assignments sa
LEFT JOIN internal_protocols ip ON sa.protocol_id = ip.id
LEFT JOIN available_operators ao ON sa.assigned_operator_id = ao.operator_id
WHERE sa.assignment_status IN ('PENDING', 'ASSIGNED')
ORDER BY sa.assignment_time ASC;

COMMENT ON VIEW v_active_assignments IS '当前活跃派单概览 - 显示待处理和已分配的服务派单';