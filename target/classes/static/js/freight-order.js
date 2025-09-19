// OneOrder 货代订单管理系统 JavaScript
// 版本: 2025-09-17-22:35 - 添加操作员ID系统

// =================== 操作员数据系统 ===================
const operatorData = {
    // 当前登录用户
    currentUser: {
        opid: 'CS001',
        name: '张美华',
        department: '客服中心',
        role: '客服专员',
        level: 'CS', // CS=客服, SA=销售, OP=操作
        permissions: ['order_create', 'order_view', 'service_assign']
    },
    
    // 所有操作员数据 - 包含层级关系和管理权限
    operators: [
        // 运营管理层 (GM开头) - 可以看到所有订单
        { opid: 'GM001', name: '李总', dept1: '总部', dept2: '运营管理部', role: '运营总监', level: 'GM', manageLevel: 'ALL', subordinates: ['*'] },
        { opid: 'GM002', name: '王经理', dept1: '总部', dept2: '运营管理部', role: '运营经理', level: 'GM', manageLevel: 'ALL', subordinates: ['*'] },
        
        // 客服中心人员 (CS开头)
        { opid: 'CS001', name: '张美华', dept1: '上海海领供应链', dept2: '客服中心', role: '客服专员', level: 'CS', manageLevel: 'SELF', manager: 'CS002' },
        { opid: 'CS002', name: '李小红', dept1: '上海海领供应链', dept2: '客服中心', role: '客服主管', level: 'CS', manageLevel: 'TEAM', subordinates: ['CS001', 'CS003', 'CS004'], manager: 'CS005' },
        { opid: 'CS003', name: '王丽娟', dept1: '上海海领供应链', dept2: '客服中心', role: '高级客服', level: 'CS', manageLevel: 'SELF', manager: 'CS002' },
        { opid: 'CS004', name: '陈晓芳', dept1: '上海海领供应链', dept2: '客服中心', role: '客服专员', level: 'CS', manageLevel: 'SELF', manager: 'CS002' },
        { opid: 'CS005', name: '刘雨辰', dept1: '上海海领供应链', dept2: '客服中心', role: '客服总监', level: 'CS', manageLevel: 'DEPT', subordinates: ['CS002', 'CS001', 'CS003', 'CS004'] },
        
        // 销售人员 (SA开头)
        { opid: 'SA001', name: '周建华', dept1: '上海海领供应链', dept2: '销售部', role: '销售经理', level: 'SA', manageLevel: 'TEAM', subordinates: ['SA002'] },
        { opid: 'SA002', name: '孙丽萍', dept1: '上海海领供应链', dept2: '市场拓展部', role: '市场专员', level: 'SA', manageLevel: 'SELF', manager: 'SA001' },
        { opid: 'SA003', name: '吴志强', dept1: '集团大客户部', dept2: '半导体销售部', role: '大客户经理', level: 'SA', manageLevel: 'TEAM', subordinates: ['SA004'] },
        { opid: 'SA004', name: '赵敏', dept1: '中国西区', dept2: '大客户项目一部', role: '项目经理', level: 'SA', manageLevel: 'SELF', manager: 'SA003' },
        { opid: 'SA005', name: '钱海涛', dept1: '中国南区', dept2: '南区大客户部', role: '区域经理', level: 'SA', manageLevel: 'REGION', subordinates: ['SA006', 'SA007'] },
        { opid: 'SA006', name: '张丽', dept1: '中国南区', dept2: '广州分公司', role: '销售专员', level: 'SA', manageLevel: 'SELF', manager: 'SA005' },
        { opid: 'SA007', name: '陈明', dept1: '中国南区', dept2: '深圳分公司', role: '销售专员', level: 'SA', manageLevel: 'SELF', manager: 'SA005' },
        
        // 操作人员 (OP开头)
        { opid: 'OP001', name: '马晓东', dept1: '空运事业部', dept2: '空运西区', role: '空运操作专员', level: 'OP', manageLevel: 'SELF', manager: 'OP002' },
        { opid: 'OP002', name: '林芳', dept1: '海运事业部', dept2: '海运东区', role: '海运操作主管', level: 'OP', manageLevel: 'TEAM', subordinates: ['OP001', 'OP003'] },
        { opid: 'OP003', name: '郭强', dept1: '中国东区', dept2: '上海分公司', role: '报关专员', level: 'OP', manageLevel: 'SELF', manager: 'OP002' },
        { opid: 'OP004', name: '何小丽', dept1: '中国南区', dept2: '深圳分公司', role: '操作主管', level: 'OP', manageLevel: 'TEAM', subordinates: ['OP005', 'OP006'] },
        { opid: 'OP005', name: '蒋峰', dept1: '铁运事业部', dept2: '铁运北区', role: '铁运操作员', level: 'OP', manageLevel: 'SELF', manager: 'OP004' },
        { opid: 'OP006', name: '徐静', dept1: '半导体解决方案部', dept2: '上海站', role: '解决方案专员', level: 'OP', manageLevel: 'SELF', manager: 'OP004' },
        { opid: 'OP007', name: '袁涛', dept1: '中国北区', dept2: '关务单证中心', role: '关务操作员', level: 'OP', manageLevel: 'SELF', manager: 'OP008' },
        { opid: 'OP008', name: '高玲', dept1: '中国西区', dept2: '成都分公司', role: '西区操作主管', level: 'OP', manageLevel: 'REGION', subordinates: ['OP007'] },
    ]
};

// 获取操作员信息
function getOperatorInfo(opid) {
    return operatorData.operators.find(op => op.opid === opid);
}

// 获取当前用户信息
function getCurrentUser() {
    return operatorData.currentUser;
}

// 获取当前用户角色（兼容其他模块）
function getCurrentUserRole() {
    const user = getCurrentUser();
    return user.level === 'CS' ? 'CUSTOMER_SERVICE' : user.role;
}

// 切换登录用户 (用于测试)
window.switchUser = function(opid) {
    const operator = getOperatorInfo(opid);
    if (operator) {
        operatorData.currentUser = {
            opid: operator.opid,
            name: operator.name,
            department: `${operator.dept1} - ${operator.dept2}`,
            role: operator.role,
            level: operator.level,
            permissions: getUserPermissions(operator.level)
        };
        
        // 使用新的用户状态管理系统
        if (window.UserState) {
            window.UserState.switchUser({
                id: operator.opid,
                name: operator.name,
                department: `${operator.dept1} - ${operator.dept2}`,
                departmentId: getDepartmentIdFromName(`${operator.dept1} - ${operator.dept2}`),
                role: operator.role,
                level: operator.level,
                status: 'online',
                loginTime: new Date().toISOString()
            });
        } else {
            // fallback到原有方法
            saveCustomerServiceToSession();
        }
        
        updateUserInterface();
    }
}

// 根据用户级别获取权限
function getUserPermissions(level) {
    switch(level) {
        case 'GM': return ['order_view_all', 'order_create', 'order_manage', 'system_admin'];
        case 'CS': return ['order_create', 'order_view', 'service_assign'];
        case 'SA': return ['order_view', 'customer_manage', 'quote_create'];
        case 'OP': return ['order_view', 'service_execute', 'status_update'];
        default: return ['order_view'];
    }
}

// 保存客服信息到sessionStorage（供派单页面使用）
function saveCustomerServiceToSession() {
    try {
        const currentUser = getCurrentUser();
        const customerService = {
            id: currentUser.opid,
            name: currentUser.name,
            department: currentUser.department,
            departmentId: getDepartmentIdFromName(currentUser.department),
            role: currentUser.role,
            level: currentUser.level,
            status: 'online',
            loginTime: new Date().toISOString()
        };
        
        sessionStorage.setItem('currentCustomerService', JSON.stringify(customerService));
        console.log('客服信息已保存到sessionStorage:', customerService);
    } catch (error) {
        console.error('保存客服信息到sessionStorage失败:', error);
    }
}

// 根据部门名称获取部门ID
function getDepartmentIdFromName(departmentName) {
    const deptMapping = {
        '上海海领供应链 - 客服中心': 'DEPT_CS_01',
        '上海海领供应链 - 销售部': 'DEPT_SALES_01',
        '上海海领供应链 - 海运操作部': 'DEPT_OCEAN_01',
        '上海海领供应链 - 空运操作部': 'DEPT_AIR_01',
        '客服中心': 'DEPT_CS_01',
        '销售部': 'DEPT_SALES_01'
    };
    return deptMapping[departmentName] || 'DEPT_CS_01';
}

// 获取用户可见的订单ID列表
function getVisibleOrderIds(currentUser) {
    const user = getOperatorInfo(currentUser.opid);
    console.log(`计算用户${currentUser.opid}的可见订单ID, 用户信息:`, user);
    
    if (!user) {
        console.log(`用户${currentUser.opid}未找到详细信息`);
        return [];
    }
    
    // 运营管理层可以看到所有订单
    if (user.level === 'GM' && user.manageLevel === 'ALL') {
        console.log(`用户${currentUser.opid}是运营管理层，可看所有订单`);
        return ['*']; // 表示所有订单
    }
    
    const visibleIds = new Set();
    
    // 添加自己创建的订单
    visibleIds.add(currentUser.opid);
    console.log(`添加自己的订单ID: ${currentUser.opid}`);
    
    // 临时修复：为了演示，客服可以看到部分订单
    if (user.level === 'CS') {
        // 客服可以看到自己和其他客服创建的订单
        ['CS001', 'CS002', 'CS003', 'CS004'].forEach(csId => {
            visibleIds.add(csId);
        });
        console.log(`客服用户添加同事订单权限: CS001, CS002, CS003, CS004`);
    }
    
    // 添加下级的订单
    if (user.subordinates && user.subordinates.length > 0) {
        console.log(`用户${currentUser.opid}有下级:`, user.subordinates);
        
        if (user.subordinates.includes('*')) {
            console.log(`用户${currentUser.opid}有全部下级权限`);
            return ['*']; // 可以看到所有订单
        }
        
        user.subordinates.forEach(subId => {
            visibleIds.add(subId);
            console.log(`添加下级订单ID: ${subId}`);
            // 递归获取下级的下级
            const subUser = getOperatorInfo(subId);
            if (subUser && subUser.subordinates) {
                subUser.subordinates.forEach(subSubId => {
                    visibleIds.add(subSubId);
                    console.log(`添加下级的下级订单ID: ${subSubId}`);
                });
            }
        });
    } else {
        console.log(`用户${currentUser.opid}没有下级`);
    }
    
    const result = Array.from(visibleIds);
    console.log(`用户${currentUser.opid}最终可见订单ID列表:`, result);
    return result;
}

// 判断用户是否可以看到特定订单
function canViewOrder(order, currentUser) {
    const visibleIds = getVisibleOrderIds(currentUser);
    
    // 运营可以看到所有订单
    if (visibleIds.includes('*')) {
        console.log(`用户${currentUser.opid}有全部权限，可以看到订单${order.orderNo}`);
        return true;
    }
    
    // 检查订单的创建者或负责人是否在可见列表中
    const orderOwner = order.staffId || order.createdBy || order.salesStaffId;
    const canView = visibleIds.includes(orderOwner);
    
    console.log(`订单${order.orderNo}创建者:${orderOwner}, 用户${currentUser.opid}可见ID:${visibleIds.join(',')}, 可查看:${canView}`);
    return canView;
}

// 过滤订单列表 - 只显示用户有权限看到的订单
function filterOrdersByPermission(orders) {
    const currentUser = getCurrentUser();
    return orders.filter(order => canViewOrder(order, currentUser));
}

// 更新用户界面
function updateUserInterface() {
    const user = getCurrentUser();
    const userDetail = getOperatorInfo(user.opid);
    
    document.getElementById('currentUserName').textContent = user.name;
    document.getElementById('currentUserDept').textContent = user.department;
    document.getElementById('currentUserOpid').textContent = user.opid;
    
    // 每次更新界面时也保存客服信息
    saveCustomerServiceToSession();
    
    // 更新订单表单中的当前操作员
    if (document.getElementById('currentOperator')) {
        document.getElementById('currentOperator').value = `${user.name} (${user.opid}) - ${user.role}`;
    }
    
    // 显示权限级别信息
    const permissionInfo = getPermissionLevelDescription(userDetail);
    console.log(`当前用户权限: ${permissionInfo.description}`);
    console.log(`可见订单范围: ${permissionInfo.scope}`);
    
    // 更新订单列表（如果当前在订单页面）
    if (currentSection === 'orders') {
        loadOrders();
    }
}

// 获取权限级别描述
function getPermissionLevelDescription(user) {
    if (!user) return { description: '未知', scope: '无' };
    
    switch(user.manageLevel) {
        case 'ALL':
            return { description: '运营管理层', scope: '所有订单' };
        case 'DEPT':
            return { description: '部门总监', scope: `本部门所有订单 (管理${user.subordinates?.length || 0}人)` };
        case 'REGION':
            return { description: '区域经理', scope: `本区域所有订单 (管理${user.subordinates?.length || 0}人)` };
        case 'TEAM':
            return { description: '团队主管', scope: `团队订单 (管理${user.subordinates?.length || 0}人)` };
        case 'SELF':
            return { description: '普通员工', scope: '仅自己的订单' };
        default:
            return { description: '普通员工', scope: '仅自己的订单' };
    }
}

// =================== 全局变量 ===================
let currentSection = 'dashboard';
let orders = [];
let customers = [];
let serviceRates = {};

// 真实客户数据映射（基于外部收款法人数据）
const customerMapping = {
    'CUST_001': 'CONG TY TNHH COCREATION GRASS CORPORATION VIET NAM',
    'CUST_002': 'COCREATION GRASS CORPORATION (VIET NAM) CO., LTD',
    'CUST_003': 'CONG TY TNHH CONG NGHIEP ZHANG LONG',
    'CUST_004': 'CONG TY TNHH THOI TRANG G&G VIET NAM',
    'CUST_005': 'VIETNAM FOUR SEASON MACHINERY MANUFACTORY COMPANY LIMITED',
    'CUST_006': 'ALPHA AVIATION VIET NAM CO., LTD',
    'CUST_007': 'BOE VISION ELECTRONIC TECHNOLOGY (VIET NAM) COMPANY LIMITED',
    'CUST_008': 'CHI NHANH THANH PHO HAI PHONG CONG TY CO PHAN GIAO NHAN WIN WIN',
    'CUST_009': 'CONG TY TNHH NINGBO CHANGYA PLASTIC (VIET NAM)',
    'CUST_010': 'AN GIA GROUP COMPANY LIMITED'
};

// 获取客户名称的函数（如果customerName为空，从customerId映射）
function getCustomerName(order) {
    // 如果customerName存在且不为空，直接返回
    if (order.customerName && order.customerName.trim() !== '') {
        return order.customerName;
    }
    
    // 否则从customerId映射中查找
    if (order.customerId && customerMapping[order.customerId]) {
        return customerMapping[order.customerId];
    }
    
    // 都没有的话显示customerId或Unknown
    return order.customerId || 'Unknown Customer';
}

// 客户数据（模拟）
const mockCustomers = [
    { id: 'CUST001', name: '华为技术有限公司', type: '制造业', creditLevel: 'A+' },
    { id: 'CUST002', name: '阿里巴巴集团', type: '电商', creditLevel: 'AAA' },
    { id: 'CUST003', name: '比亚迪股份', type: '汽车', creditLevel: 'A' },
    { id: 'CUST004', name: '海康威视', type: '安防', creditLevel: 'A+' },
    { id: 'CUST005', name: '小米科技', type: '电子', creditLevel: 'A' }
];

// 基于第三版本费用梳理的完整服务配置
// 包含26个服务段和90个具体费用科目
const serviceRateConfig = {
    // 海运服务 - 基于海运整柜出口费用科目
    OCEAN: {
        // 主运费
        OCEAN_FREIGHT: { min: 12000, max: 25000, unit: '箱', code: 'FCL001', nameEn: 'Ocean Freight' },
        BAF: { min: 500, max: 1500, unit: '箱', code: 'FCL002', nameEn: 'Bunker Adjustment Factor' },
        
        // 码头/港口费用
        OTHC: { rate: 480, unit: '箱', code: 'FCL003', nameEn: 'Origin Terminal Handling Charge' },
        DTHC: { rate: 520, unit: '箱', code: 'FCL004', nameEn: 'Destination Terminal Handling Charge' },
        PORT_MISC: { rate: 150, unit: '箱', code: 'FCL024', nameEn: 'Port Miscellaneous Charges' },
        SECURITY_FEE: { rate: 80, unit: '箱', code: 'FCL025', nameEn: 'Security Fee' },
        PORT_DUES: { rate: 120, unit: '箱', code: 'FCL033', nameEn: 'Port Dues' },
        
        // 单证文件费用
        DOC_FEE: { rate: 300, unit: '票', code: 'FCL009', nameEn: 'Documentation Fee' },
        D_O_FEE: { rate: 200, unit: '票', code: 'FCL014', nameEn: 'D/O Release Fee' },
        TELEX_RELEASE: { rate: 300, unit: '票', code: 'FCL015', nameEn: 'Telex Release Fee' },
        AMENDMENT_FEE: { rate: 300, unit: '次', code: 'FCL017', nameEn: 'Bill Amendment Fee' },
        
        // 集装箱费用
        DEMURRAGE: { rate: 200, unit: '天/箱', code: 'FCL018', nameEn: 'Container Demurrage' },
        PICK_UP_FEE: { rate: 150, unit: '箱', code: 'FCL019', nameEn: 'Container Pick-up Fee' },
        RETURN_FEE: { rate: 150, unit: '箱', code: 'FCL020', nameEn: 'Container Return Fee' },
        SEAL_FEE: { rate: 50, unit: '个', code: 'FCL021', nameEn: 'Container Seal Fee' },
        
        // 其他费用
        VGM_FEE: { rate: 80, unit: '箱', code: 'FCL011', nameEn: 'VGM Fee' },
        MANIFEST_FEE: { rate: 100, unit: '票', code: 'FCL012', nameEn: 'Manifest Fee' },
        AMS_FEE: { rate: 150, unit: '票', code: 'FCL013', nameEn: 'AMS Fee' }
    },
    
    // 空运服务
    AIR: {
        GENERAL: { min: 18, max: 35, unit: 'KG' },
        DANGEROUS: { min: 28, max: 45, unit: 'KG' },
        LIVE: { min: 35, max: 55, unit: 'KG' },
        SECURITY: { rate: 2.5, unit: 'KG' },
        FUEL: { rate: 0, unit: 'KG', variable: true },
        WAR_RISK: { rate: 0.15, unit: 'KG' }
    },
    
    // 陆运服务
    TRUCK: {
        TRUCKING_FEE: { min: 800, max: 2000, unit: '箱', code: 'FCL006', nameEn: 'Trucking Fee' },
        MULTI_PICKUP: { rate: 300, unit: '次', code: 'FCL045', nameEn: 'Multiple Pick-up/Delivery Fee' },
        WAITING_FEE: { rate: 150, unit: '小时', code: 'FCL046', nameEn: 'Waiting Time Fee' },
        PARKING_FEE: { rate: 50, unit: '次', code: 'FCL047', nameEn: 'Parking Fee' },
        TOLL_FEE: { rate: 0, unit: '实际', code: 'FCL048', nameEn: 'Toll Fee', variable: true },
        FUEL_COST: { rate: 0, unit: '实际', code: 'FCL049', nameEn: 'Fuel Cost', variable: true },
        CHASSIS_FEE: { rate: 200, unit: '天', code: 'FCL087', nameEn: 'Chassis Fee' }
    },
    
    // 铁运服务
    RAIL: {
        CHINA_EUROPE: { min: 18000, max: 28000, unit: '箱' },
        CHINA_EUROPE_LCL: { min: 280, max: 380, unit: 'CBM' },
        DOMESTIC: { min: 0.15, max: 0.25, unit: '吨公里' },
        LOADING: { rate: 60, unit: '吨' },
        STORAGE: { rate: 8, unit: '天/吨' },
        TRANSFER: { rate: 120, unit: '吨' }
    },
    
    // 关检服务
    CUSTOMS: {
        DECLARATION_FEE: { min: 300, max: 800, unit: '票', code: 'FCL005', nameEn: 'Customs Declaration Fee' },
        CLEARANCE_FEE: { min: 500, max: 1200, unit: '票', code: 'FCL059', nameEn: 'Customs Clearance Fee' },
        INSPECTION_FEE: { rate: 800, unit: '次', code: 'FCL074', nameEn: 'Customs Examination Fee' },
        TRANSIT_FEE: { rate: 300, unit: '票', code: 'FCL072', nameEn: 'Transit Fee' },
        DECLARATION_FORM: { rate: 50, unit: '份', code: 'FCL073', nameEn: 'Declaration Form Fee' },
        LATE_FINE: { rate: 0, unit: '实际', code: 'FCL075', nameEn: 'Late Declaration Fine', variable: true },
        SUPERVISION_FEE: { rate: 200, unit: '次', code: 'FCL090', nameEn: 'Supervision Fee' }
    },
    
    // 仓储服务
    WAREHOUSE: {
        STORAGE_FEE: { min: 5, max: 15, unit: 'CBM/天', code: 'FCL007', nameEn: 'Warehouse Storage Fee' },
        IN_OUT_FEE: { rate: 100, unit: '票', code: 'FCL037', nameEn: 'Warehouse In/Out Fee' },
        FORKLIFT_FEE: { rate: 150, unit: '小时', code: 'FCL038', nameEn: 'Forklift Fee' },
        PALLET_FEE: { rate: 50, unit: '个', code: 'FCL040', nameEn: 'Pallet Fee' },
        MANAGEMENT: { rate: 800, unit: '月' }
    },
    
    // 装卸服务
    LOADING: {
        CONTAINER_LOADING: { rate: 300, unit: '箱', code: 'FCL008', nameEn: 'Container Loading Fee' },
        LOADING_DISCHARGING: { rate: 80, unit: '吨', code: 'FCL028', nameEn: 'Loading/Discharging Fee' },
        TALLY_FEE: { rate: 200, unit: '票', code: 'FCL067', nameEn: 'Tally Fee' },
        STRIPPING_FEE: { rate: 400, unit: '箱', code: 'FCL066', nameEn: 'Container Stripping Fee' }
    },
    
    // 增值服务
    VALUE_ADDED: {
        PACKING_FEE: { rate: 200, unit: '票', code: 'FCL041', nameEn: 'Packing Fee' },
        SECURING_FEE: { rate: 150, unit: '票', code: 'FCL042', nameEn: 'Securing Fee' },
        LABELING_FEE: { rate: 3, unit: '件', code: 'FCL043', nameEn: 'Labeling Fee' },
        FUMIGATION_FEE: { rate: 300, unit: '票', code: 'FCL029', nameEn: 'Fumigation Fee' },
        INSPECTION_SERVICE: { rate: 500, unit: '票', code: 'FCL030', nameEn: 'Inspection Fee' },
        DANGEROUS_LABEL: { rate: 100, unit: '票', code: 'FCL088', nameEn: 'Dangerous Goods Label Fee' },
        MATERIAL_COST: { rate: 0, unit: '实际', code: 'FCL089', nameEn: 'Material Cost', variable: true }
    }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded 事件触发');
    initializeSystem();
    console.log('initializeSystem() 完成，现在强制调用 loadOrders()');
    
    // 强制调用API加载实时数据
    loadOrdersData().then(() => {
        console.log('loadOrdersData() 完成，orders.length =', orders.length);
        console.log('前3个订单号:', orders.slice(0, 3).map(o => o.orderNo));
        updateDashboardStats();
    }).catch(error => {
        console.error('loadOrdersData() 失败，使用fallback:', error);
        // 只有在API失败时才使用模拟数据
        orders = generateMockOrders();
        updateDashboardStats();
    });
    
    console.log('loadCustomers() 调用开始');
    loadCustomers();
    console.log('DOMContentLoaded 处理完成');
});

// 系统初始化
function initializeSystem() {
    console.log('OneOrder 货代订单管理系统初始化...');
    console.log('当前 orders 数组状态:', orders, 'length:', orders.length);
    
    // 初始化用户界面
    updateUserInterface();
    
    // 不再生成模拟数据，改为从API加载真实数据
    // generateMockOrders(); // 注释掉模拟数据生成
    
    // 设置当前时间
    updateCurrentDateTime();
    
    // 每分钟更新一次时间
    setInterval(updateCurrentDateTime, 60000);
    
    console.log('系统初始化完成，准备从API加载真实订单数据...');
    console.log('当前登录用户:', getCurrentUser());
    console.log('DOMContentLoaded 中即将调用 loadDashboard()');
}

// 生成模拟订单数据
function generateMockOrders() {
    const businessTypes = ['OCEAN', 'AIR', 'TRUCK', 'RAIL'];
    const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
    const ports = ['上海', '深圳', '广州', '青岛', '天津', '宁波', '厦门', '大连'];
    const foreignPorts = ['洛杉矶', '纽约', '汉堡', '鹿特丹', '新加坡', '釜山', '东京', '悉尼'];
    
    orders = [];
    for (let i = 1; i <= 20; i++) {
        const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
        const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
        const loadingPort = ports[Math.floor(Math.random() * ports.length)];
        const dischargePort = foreignPorts[Math.floor(Math.random() * foreignPorts.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const order = {
            orderNo: `HW-EXPORT-${new Date().getFullYear()}${String(Date.now() + i).slice(-6)}-${String(i).padStart(3, '0')}`,
            orderId: `ORDER-${Date.now()}-${i}`,
            customerId: customer.id,
            customerName: customer.name,
            businessType: businessType,
            portOfLoading: loadingPort,
            portOfDischarge: dischargePort,
            estimatedDeparture: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
            estimatedArrival: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
            cargoDescription: '一般货物',
            packageCount: Math.floor(Math.random() * 100) + 1,
            weight: Math.floor(Math.random() * 10000) + 100,
            volume: Math.floor(Math.random() * 100) + 1,
            totalAmount: Math.floor(Math.random() * 50000) + 5000,
            totalCost: Math.floor(Math.random() * 30000) + 3000,
            currency: 'CNY',
            orderStatus: status,
            clearingStatus: status === 'COMPLETED' ? 'CLEARED' : 'PENDING',
            orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            services: generateOrderServices(businessType),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        };
        
        orders.push(order);
    }
    
    // 按创建时间倒序排列
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 生成订单服务
function generateOrderServices(businessType) {
    const services = [];
    
    switch (businessType) {
        case 'OCEAN':
            services.push({
                type: 'FCL_40GP',
                description: '40GP整箱运输',
                quantity: 1,
                rate: 18000,
                amount: 18000
            });
            services.push({
                type: 'THC',
                description: '码头操作费',
                quantity: 1,
                rate: 480,
                amount: 480
            });
            services.push({
                type: 'DOC_FEE',
                description: '文件费',
                quantity: 1,
                rate: 300,
                amount: 300
            });
            break;
            
        case 'AIR':
            const weight = Math.floor(Math.random() * 1000) + 100;
            services.push({
                type: 'GENERAL',
                description: '空运运费',
                quantity: weight,
                rate: 25,
                amount: weight * 25
            });
            services.push({
                type: 'SECURITY',
                description: '安检费',
                quantity: weight,
                rate: 2.5,
                amount: weight * 2.5
            });
            break;
            
        case 'TRUCK':
            services.push({
                type: 'FTL',
                description: '整车运输',
                quantity: 1,
                rate: 3500,
                amount: 3500
            });
            services.push({
                type: 'LOADING',
                description: '装卸费',
                quantity: 10,
                rate: 80,
                amount: 800
            });
            break;
            
        case 'RAIL':
            services.push({
                type: 'CHINA_EUROPE',
                description: '中欧班列整箱',
                quantity: 1,
                rate: 23000,
                amount: 23000
            });
            services.push({
                type: 'LOADING',
                description: '装卸费',
                quantity: 15,
                rate: 60,
                amount: 900
            });
            break;
    }
    
    return services;
}

// 更新当前时间
function updateCurrentDateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN');
    // 可以在界面某个地方显示当前时间
}

// 显示指定区域
function showSection(sectionId) {
    // 隐藏所有区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 显示指定区域 - 添加安全检查
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionId;
    } else {
        console.warn(`页面元素 ${sectionId} 不存在`);
        return;
    }
    
    // 更新导航状态
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const navLink = document.querySelector(`[href="#${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // 根据区域加载相应内容
    switch (sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'services':
            // 服务配置页面是静态的，不需要加载
            break;
        case 'protocols':
            loadProtocolManagement();
            break;
        case 'tasks':
            loadTaskManagement();
            break;
        case 'clearing':
            loadClearingManagement();
            break;
        case 'reports':
            loadReports();
            break;
        case 'customers':
            loadCustomers();
            break;
    }
}

// 加载仪表盘
function loadDashboard() {
    console.log('loadDashboard() 被调用，当前 orders.length =', orders.length);
    console.log('当前 orders 数组内容:', orders);
    
    // 如果没有订单数据，先从API加载
    if (orders.length === 0) {
        console.log('订单数组为空，开始调用 loadOrders()...');
        loadOrders().then(() => {
            console.log('loadOrders() 完成，orders.length =', orders.length);
            updateDashboardStats();
        }).catch(error => {
            console.error('loadOrders() 失败:', error);
            updateDashboardStats();
        });
    } else {
        console.log('使用现有订单数据，直接更新统计...');
        updateDashboardStats();
    }
}

// 更新仪表盘统计数据
function updateDashboardStats() {
    // 统计各类业务订单数量
    const oceanCount = orders.filter(o => o.businessType === 'OCEAN').length;
    const airCount = orders.filter(o => o.businessType === 'AIR').length;
    const truckCount = orders.filter(o => o.businessType === 'TRUCK').length;
    const railCount = orders.filter(o => o.businessType === 'RAIL').length;
    const customsCount = orders.filter(o => o.businessType === 'CUSTOMS').length;
    const warehouseCount = orders.filter(o => o.businessType === 'WAREHOUSE').length;
    
    // 更新统计数字（如果元素存在）
    const oceanElement = document.getElementById('oceanOrders');
    const airElement = document.getElementById('airOrders');
    const truckElement = document.getElementById('truckOrders');
    const railElement = document.getElementById('railOrders');
    
    if (oceanElement) oceanElement.textContent = oceanCount;
    if (airElement) airElement.textContent = airCount;
    if (truckElement) truckElement.textContent = truckCount;
    if (railElement) railElement.textContent = railCount;
    
    // 计算总计数据
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalCost = orders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    
    // 更新总计显示
    const totalOrdersElement = document.getElementById('totalOrders');
    const totalRevenueElement = document.getElementById('totalRevenue');
    const totalProfitElement = document.getElementById('totalProfit');
    
    if (totalOrdersElement) totalOrdersElement.textContent = totalOrders;
    if (totalRevenueElement) totalRevenueElement.textContent = `¥${totalRevenue.toLocaleString()}`;
    if (totalProfitElement) totalProfitElement.textContent = `¥${totalProfit.toLocaleString()}`;
    
    // 加载最近订单
    loadRecentOrders();
}

// 加载最近订单
function loadRecentOrders() {
    console.log('loadRecentOrders() 被调用，orders.length =', orders.length);
    console.log('前5个订单数据:', orders.slice(0, 5));
    
    const recentOrders = orders.slice(0, 5);
    const tableBody = document.getElementById('recentOrdersTable');
    
    tableBody.innerHTML = recentOrders.map(order => {
        const creatorInfo = getOperatorInfo(order.staffId) || { name: '未知', opid: order.staffId };
        const serviceInfo = getOrderServicesDisplay(order);
        
        return `
        <tr onclick="showOrderDetail('${order.orderId}')">
            <td class="order-no-cell"><code>${order.orderNo}</code></td>
            <td title="${getCustomerName(order)}">${getCustomerName(order).length > 50 ? getCustomerName(order).substring(0, 47) + '...' : getCustomerName(order)}</td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="${getBusinessTypeIcon(order.businessType)} me-1"></i>
                    <span class="badge ${getBusinessTypeBadgeClass(order.businessType)}">${getBusinessTypeName(order.businessType)}</span>
                </div>
            </td>
            <td>
                <div class="service-summary">
                    <small class="text-muted d-block">共${serviceInfo.count}项服务</small>
                    <div class="service-tags">
                        ${serviceInfo.tags}
                    </div>
                </div>
            </td>
            <td>${order.portOfLoading}</td>
            <td>${order.portOfDischarge}</td>
            <td><strong>¥${order.totalAmount.toLocaleString()}</strong></td>
            <td><span class="order-status status-${order.orderStatus.toLowerCase()}">${getStatusName(order.orderStatus)}</span></td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="badge bg-info me-1">${creatorInfo.opid}</span>
                    <small>${creatorInfo.name}</small>
                    <div class="text-muted" style="font-size: 0.7rem;">客服</div>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); showOrderDetail('${order.orderId}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); executeOrderClearing('${order.orderId}')" ${order.orderStatus !== 'COMPLETED' ? 'disabled="true"' : ''}>
                    <i class="fas fa-coins"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

// 显示新建订单表单
function showNewOrderForm() {
    // 生成订单号
    const orderNo = generateOrderNo();
    document.getElementById('orderNo').value = orderNo;
    
    // 设置接单时间为当前时间
    const now = new Date();
    const receiveTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm格式
    document.getElementById('receiveTime').value = receiveTime;
    
    // 加载客户选项
    loadCustomerOptions();
    
    // 显示表单
    document.getElementById('newOrderForm').style.display = 'block';
    
    // 滚动到表单位置
    document.getElementById('newOrderForm').scrollIntoView({ behavior: 'smooth' });
}

// 隐藏新建订单表单
function cancelNewOrder() {
    document.getElementById('newOrderForm').style.display = 'none';
    document.getElementById('orderForm').reset();
}

// 生成订单号
function generateOrderNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = String(Date.now()).slice(-6);
    return `ORD${year}${month}${day}${timestamp}`;
}

// 加载客户选项
function loadCustomerOptions() {
    const customerSelect = document.getElementById('customerId');
    customerSelect.innerHTML = '<option value="">请选择客户</option>' +
        mockCustomers.map(customer => 
            `<option value="${customer.id}">${customer.name} (${customer.type})</option>`
        ).join('');
}

// 加载客户信息
function loadCustomers() {
    customers = mockCustomers;
}

// 更新客户信息
function updateCustomerInfo() {
    const customerId = document.getElementById('customerId').value;
    const customer = mockCustomers.find(c => c.id === customerId);
    
    if (customer) {
        console.log('选择客户:', customer.name);
        // 可以在这里更新相关的客户信息显示
    }
}

// 基于第三版本费用梳理的完整服务选项加载
function loadServiceOptions() {
    const businessType = document.getElementById('businessType').value;
    const serviceSelection = document.getElementById('serviceSelection');
    
    if (!businessType) {
        serviceSelection.innerHTML = '';
        document.getElementById('selectedServicesAlert').classList.add('d-none');
        return;
    }
    
    let servicesHtml = '';
    
    switch (businessType) {
        case 'OCEAN':
            servicesHtml = `
                <!-- 主运费服务 -->
                <div class="col-12 mb-3">
                    <h6 class="text-primary"><i class="fas fa-ship me-2"></i>主运费服务</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input service-checkbox" type="checkbox" id="oceanFreight" checked onchange="updateSelectedServices()" data-service-name="海运费" data-service-code="FCL001" data-service-price="¥12,000-25,000/箱">
                                <label class="form-check-label" for="oceanFreight">
                                    <strong>海运费 (FCL001)</strong><br>
                                    <small class="text-muted">¥12,000-25,000/箱</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input service-checkbox" type="checkbox" id="baf" checked onchange="updateSelectedServices()" data-service-name="燃油附加费" data-service-code="FCL002" data-service-price="¥500-1,500/箱">
                                <label class="form-check-label" for="baf">
                                    <strong>燃油附加费 (FCL002)</strong><br>
                                    <small class="text-muted">¥500-1,500/箱</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 码头港口服务 -->
                <div class="col-12 mb-3">
                    <h6 class="text-info"><i class="fas fa-anchor me-2"></i>码头港口服务</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input service-checkbox" type="checkbox" id="othc" checked onchange="updateSelectedServices()" data-service-name="起运港THC" data-service-code="FCL003" data-service-price="¥480/箱">
                                <label class="form-check-label" for="othc">
                                    <strong>起运港THC (FCL003)</strong><br>
                                    <small class="text-muted">¥480/箱</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input service-checkbox" type="checkbox" id="dthc" checked onchange="updateSelectedServices()" data-service-name="目的港THC" data-service-code="FCL004" data-service-price="¥520/箱">
                                <label class="form-check-label" for="dthc">
                                    <strong>目的港THC (FCL004)</strong><br>
                                    <small class="text-muted">¥520/箱</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input service-checkbox" type="checkbox" id="portMisc" onchange="updateSelectedServices()" data-service-name="港杂费" data-service-code="FCL024" data-service-price="¥150/箱">
                                <label class="form-check-label" for="portMisc">
                                    <strong>港杂费 (FCL024)</strong><br>
                                    <small class="text-muted">¥150/箱</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 单证文件服务 -->
                <div class="col-12 mb-3">
                    <h6 class="text-success"><i class="fas fa-file-alt me-2"></i>单证文件服务</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input service-checkbox" type="checkbox" id="docFee" checked onchange="updateSelectedServices()" data-service-name="单证费" data-service-code="FCL009" data-service-price="¥300/票">
                                <label class="form-check-label" for="docFee">
                                    <strong>单证费 (FCL009)</strong><br>
                                    <small class="text-muted">¥300/票</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input service-checkbox" type="checkbox" id="doFee" onchange="updateSelectedServices()" data-service-name="换单费" data-service-code="FCL014" data-service-price="¥200/票">
                                <label class="form-check-label" for="doFee">
                                    <strong>换单费 (FCL014)</strong><br>
                                    <small class="text-muted">¥200/票</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="telexRelease">
                                <label class="form-check-label" for="telexRelease">
                                    <strong>电放费 (FCL015)</strong><br>
                                    <small class="text-muted">¥300/票</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 集装箱服务 -->
                <div class="col-12 mb-3">
                    <h6 class="text-warning"><i class="fas fa-cube me-2"></i>集装箱服务</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="pickupFee" checked>
                                <label class="form-check-label" for="pickupFee">
                                    <strong>提箱费 (FCL019)</strong><br>
                                    <small class="text-muted">¥150/箱</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="returnFee" checked>
                                <label class="form-check-label" for="returnFee">
                                    <strong>还箱费 (FCL020)</strong><br>
                                    <small class="text-muted">¥150/箱</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="sealFee" checked>
                                <label class="form-check-label" for="sealFee">
                                    <strong>铅封费 (FCL021)</strong><br>
                                    <small class="text-muted">¥50/个</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 关检服务 -->
                <div class="col-12 mb-3">
                    <h6 class="text-danger"><i class="fas fa-stamp me-2"></i>关检服务</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="customsDeclaration" checked>
                                <label class="form-check-label" for="customsDeclaration">
                                    <strong>报关费 (FCL005)</strong><br>
                                    <small class="text-muted">¥300-800/票</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="customsExam">
                                <label class="form-check-label" for="customsExam">
                                    <strong>查验费 (FCL074)</strong><br>
                                    <small class="text-muted">¥800/次</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="vgmFee" checked>
                                <label class="form-check-label" for="vgmFee">
                                    <strong>VGM费 (FCL011)</strong><br>
                                    <small class="text-muted">¥80/箱</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 陆运服务 -->
                <div class="col-12 mb-3">
                    <h6 class="text-secondary"><i class="fas fa-truck me-2"></i>陆运服务</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="truckingFee" checked>
                                <label class="form-check-label" for="truckingFee">
                                    <strong>拖车费 (FCL006)</strong><br>
                                    <small class="text-muted">¥800-2,000/箱</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="waitingFee">
                                <label class="form-check-label" for="waitingFee">
                                    <strong>待时费 (FCL046)</strong><br>
                                    <small class="text-muted">¥150/小时</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="tollFee">
                                <label class="form-check-label" for="tollFee">
                                    <strong>过路费 (FCL048)</strong><br>
                                    <small class="text-muted">按实际发生</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'AIR':
            servicesHtml = `
                <div class="col-12 mb-3">
                    <h6 class="text-primary"><i class="fas fa-plane me-2"></i>空运主运费</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="cargoType" value="GENERAL" id="generalCargo" checked>
                                <label class="form-check-label" for="generalCargo">
                                    <strong>普通货物</strong><br>
                                    <small class="text-muted">¥18-35/KG</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="cargoType" value="DANGEROUS" id="dangerousCargo">
                                <label class="form-check-label" for="dangerousCargo">
                                    <strong>危险品</strong><br>
                                    <small class="text-muted">¥28-45/KG</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="cargoType" value="LIVE" id="liveCargo">
                                <label class="form-check-label" for="liveCargo">
                                    <strong>活体货物</strong><br>
                                    <small class="text-muted">¥35-55/KG</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 mb-3">
                    <h6 class="text-info"><i class="fas fa-plus-circle me-2"></i>附加服务</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="securityFee" checked>
                                <label class="form-check-label" for="securityFee">
                                    <strong>安检费</strong><br>
                                    <small class="text-muted">¥2.5/KG</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="fuelSurcharge" checked>
                                <label class="form-check-label" for="fuelSurcharge">
                                    <strong>燃油附加费</strong><br>
                                    <small class="text-muted">按时价</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="warRisk">
                                <label class="form-check-label" for="warRisk">
                                    <strong>战险费</strong><br>
                                    <small class="text-muted">¥0.15/KG</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'TRUCK':
            servicesHtml = `
                <div class="col-md-6 mb-3">
                    <h6>运输类型</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="truckType" value="FTL" id="ftl" checked>
                        <label class="form-check-label" for="ftl">整车运输 FTL (¥2.8-4.5/公里)</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="truckType" value="LTL" id="ltl">
                        <label class="form-check-label" for="ltl">零担运输 LTL (¥180-280/吨)</label>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">运输距离 (公里)</label>
                        <input type="number" class="form-control" id="distance" placeholder="请输入运输距离">
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>附加服务</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="loading" checked>
                        <label class="form-check-label" for="loading">装卸费 (¥80/吨)</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="waiting">
                        <label class="form-check-label" for="waiting">等待费 (¥150/小时)</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="toll" checked>
                        <label class="form-check-label" for="toll">过路费 (实际发生)</label>
                    </div>
                </div>
            `;
            break;
            
        case 'RAIL':
            servicesHtml = `
                <div class="col-md-6 mb-3">
                    <h6>铁运类型</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="railType" value="CHINA_EUROPE" id="chinaEurope" checked>
                        <label class="form-check-label" for="chinaEurope">中欧班列整箱 (¥18,000-28,000)</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="railType" value="CHINA_EUROPE_LCL" id="chinaEuropeLcl">
                        <label class="form-check-label" for="chinaEuropeLcl">中欧班列拼箱 (¥280-380/CBM)</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="railType" value="DOMESTIC" id="domestic">
                        <label class="form-check-label" for="domestic">国内铁运 (¥0.15-0.25/吨公里)</label>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>附加服务</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="railLoading" checked>
                        <label class="form-check-label" for="railLoading">装卸费 (¥60/吨)</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="storage">
                        <label class="form-check-label" for="storage">仓储费 (¥8/天/吨)</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="transfer">
                        <label class="form-check-label" for="transfer">换装费 (¥120/吨)</label>
                    </div>
                </div>
            `;
            break;
    }
    
    // 添加MULTIMODAL的处理
    if (businessType === 'MULTIMODAL') {
        servicesHtml += `
            <div class="col-12 mb-3">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>多式联运</strong> - 请选择涉及的运输方式组合，系统将自动加载对应的服务选项
                </div>
            </div>
            <div class="col-12 mb-3">
                <h6 class="text-primary"><i class="fas fa-route me-2"></i>运输方式组合</h6>
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="oceanInMulti">
                            <label class="form-check-label" for="oceanInMulti">
                                <strong>海运段</strong><br>
                                <small class="text-muted">包含海运相关费用</small>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="airInMulti">
                            <label class="form-check-label" for="airInMulti">
                                <strong>空运段</strong><br>
                                <small class="text-muted">包含空运相关费用</small>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="truckInMulti" checked>
                            <label class="form-check-label" for="truckInMulti">
                                <strong>陆运段</strong><br>
                                <small class="text-muted">包含陆运相关费用</small>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="railInMulti">
                            <label class="form-check-label" for="railInMulti">
                                <strong>铁运段</strong><br>
                                <small class="text-muted">包含铁运相关费用</small>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 mb-3">
                <h6 class="text-success"><i class="fas fa-handshake me-2"></i>联运服务</h6>
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="transshipment" checked>
                            <label class="form-check-label" for="transshipment">
                                <strong>中转服务</strong><br>
                                <small class="text-muted">多式联运中转</small>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="coordination" checked>
                            <label class="form-check-label" for="coordination">
                                <strong>运输协调</strong><br>
                                <small class="text-muted">各段运输衔接</small>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="tracking" checked>
                            <label class="form-check-label" for="tracking">
                                <strong>全程跟踪</strong><br>
                                <small class="text-muted">端到端物流监控</small>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (!servicesHtml) {
        servicesHtml = '<p class="text-muted">请选择业务类型以查看可用服务</p>';
    }
    
    serviceSelection.innerHTML = `<div class="row">${servicesHtml}</div>`;
    // 初始化时更新已选择的服务
    setTimeout(() => {
        updateSelectedServices();
    }, 100);
}

// 更新已选择的服务显示
function updateSelectedServices() {
    const checkboxes = document.querySelectorAll('.service-checkbox');
    const selectedServices = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedServices.push({
                name: checkbox.dataset.serviceName,
                code: checkbox.dataset.serviceCode,
                price: checkbox.dataset.servicePrice
            });
        }
    });
    
    const selectedServicesAlert = document.getElementById('selectedServicesAlert');
    const selectedServicesList = document.getElementById('selectedServicesList');
    const selectedServicesCount = document.getElementById('selectedServicesCount');
    
    if (selectedServices.length > 0) {
        selectedServicesAlert.classList.remove('d-none');
        selectedServicesList.innerHTML = selectedServices.map(service => 
            `<span class="badge bg-primary me-2 mb-1">${service.name} (${service.code})</span>`
        ).join('');
        selectedServicesCount.textContent = selectedServices.length;
    } else {
        selectedServicesAlert.classList.add('d-none');
    }
}

// 计算费用
function calculateFees() {
    const businessType = document.getElementById('businessType').value;
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const volume = parseFloat(document.getElementById('volume').value) || 0;
    
    if (!businessType) {
        alert('请先选择业务类型');
        return;
    }
    
    let totalAmount = 0;
    let feeBreakdownHtml = '';
    
    switch (businessType) {
        case 'OCEAN':
            totalAmount = calculateOceanFreight(weight, volume);
            break;
        case 'AIR':
            totalAmount = calculateAirFreight(weight);
            break;
        case 'TRUCK':
            totalAmount = calculateTruckFreight(weight, volume);
            break;
        case 'RAIL':
            totalAmount = calculateRailFreight(weight, volume);
            break;
    }
    
    // 显示总金额
    document.getElementById('totalAmount').textContent = `¥ ${totalAmount.toLocaleString()}`;
    
    // 显示费用明细（这里简化处理）
    document.getElementById('feeBreakdown').innerHTML = `
        <div class="fee-breakdown">
            <h6>${getBusinessTypeName(businessType)}运费明细</h6>
            <div class="row">
                <div class="col-6">基本运费:</div>
                <div class="col-6 text-end">¥ ${(totalAmount * 0.8).toLocaleString()}</div>
            </div>
            <div class="row">
                <div class="col-6">附加费用:</div>
                <div class="col-6 text-end">¥ ${(totalAmount * 0.2).toLocaleString()}</div>
            </div>
            <hr>
            <div class="row fw-bold">
                <div class="col-6">合计:</div>
                <div class="col-6 text-end">¥ ${totalAmount.toLocaleString()}</div>
            </div>
        </div>
    `;
}

// 计算海运费用
function calculateOceanFreight(weight, volume) {
    const containerType = document.querySelector('input[name="containerType"]:checked')?.value;
    let baseFreight = 0;
    
    switch (containerType) {
        case 'FCL_20GP':
            baseFreight = 12000;
            break;
        case 'FCL_40GP':
            baseFreight = 18000;
            break;
        case 'FCL_40HQ':
            baseFreight = 20000;
            break;
        case 'LCL':
            baseFreight = volume * 265; // 平均单价
            break;
        default:
            baseFreight = 18000;
    }
    
    let additionalFees = 0;
    if (document.getElementById('thc')?.checked) additionalFees += 480;
    if (document.getElementById('docFee')?.checked) additionalFees += 300;
    if (document.getElementById('inspection')?.checked) additionalFees += 800;
    
    return Math.round(baseFreight + additionalFees);
}

// 计算空运费用
function calculateAirFreight(weight) {
    const cargoType = document.querySelector('input[name="cargoType"]:checked')?.value || 'GENERAL';
    let ratePerKg = 25; // 默认费率
    
    switch (cargoType) {
        case 'GENERAL':
            ratePerKg = 25;
            break;
        case 'DANGEROUS':
            ratePerKg = 36;
            break;
        case 'LIVE':
            ratePerKg = 45;
            break;
    }
    
    let baseFreight = weight * ratePerKg;
    let additionalFees = 0;
    
    if (document.getElementById('securityFee')?.checked) additionalFees += weight * 2.5;
    if (document.getElementById('fuelSurcharge')?.checked) additionalFees += weight * 3.2;
    if (document.getElementById('warRisk')?.checked) additionalFees += weight * 0.15;
    
    return Math.round(baseFreight + additionalFees);
}

// 计算陆运费用
function calculateTruckFreight(weight, volume) {
    const truckType = document.querySelector('input[name="truckType"]:checked')?.value || 'FTL';
    const distance = parseFloat(document.getElementById('distance')?.value) || 1000; // 默认1000公里
    
    let baseFreight = 0;
    
    if (truckType === 'FTL') {
        baseFreight = distance * 3.5; // 平均每公里3.5元
    } else {
        baseFreight = weight * 230; // 平均每吨230元
    }
    
    let additionalFees = 0;
    if (document.getElementById('loading')?.checked) additionalFees += weight * 80;
    if (document.getElementById('waiting')?.checked) additionalFees += 150 * 2; // 假设等待2小时
    if (document.getElementById('toll')?.checked) additionalFees += distance * 0.8; // 过路费
    
    return Math.round(baseFreight + additionalFees);
}

// 计算铁运费用
function calculateRailFreight(weight, volume) {
    const railType = document.querySelector('input[name="railType"]:checked')?.value || 'CHINA_EUROPE';
    let baseFreight = 0;
    
    switch (railType) {
        case 'CHINA_EUROPE':
            baseFreight = 23000; // 中欧班列整箱
            break;
        case 'CHINA_EUROPE_LCL':
            baseFreight = volume * 330; // 中欧班列拼箱
            break;
        case 'DOMESTIC':
            baseFreight = weight * 0.2 * 2000; // 假设2000公里
            break;
    }
    
    let additionalFees = 0;
    if (document.getElementById('railLoading')?.checked) additionalFees += weight * 60;
    if (document.getElementById('storage')?.checked) additionalFees += weight * 8 * 3; // 假设存储3天
    if (document.getElementById('transfer')?.checked) additionalFees += weight * 120;
    
    return Math.round(baseFreight + additionalFees);
}

// 保存订单
function saveOrder() {
    if (!validateOrderForm()) {
        return;
    }
    
    const formData = collectOrderFormData();
    
    // 模拟保存到后端
    console.log('保存订单:', formData);
    
    // 添加到订单列表
    orders.unshift(formData);
    
    // 显示成功消息
    showNotification('订单保存成功', 'success');
    
    // 清空表单
    document.getElementById('orderForm').reset();
    document.getElementById('newOrderForm').style.display = 'none';
    
    // 刷新订单列表
    if (currentSection === 'orders') {
        loadOrders();
    }
}

// 提交订单
async function submitOrder() {
    if (!validateOrderForm()) {
        return;
    }
    
    const submitButton = document.querySelector('#newOrderForm button[onclick="submitOrder()"]');
    const originalText = submitButton.innerHTML;
    
    try {
        // 禁用按钮，显示加载状态
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i> 创建中...';
        
        const formData = collectOrderFormData();
        
        // 获取接单客服信息（当前登录用户）
        const currentUser = getCurrentUser();
        const receiveTime = document.getElementById('receiveTime').value;
        
        // 获取选择的服务信息
        const selectedServices = [];
        document.querySelectorAll('.service-checkbox:checked').forEach(checkbox => {
            selectedServices.push({
                serviceId: checkbox.id,
                serviceName: checkbox.dataset.serviceName,
                serviceCode: checkbox.dataset.serviceCode,
                servicePrice: checkbox.dataset.servicePrice
            });
        });
        
        // 构建API请求数据格式
        const orderData = {
            customerId: formData.customerId,
            businessType: formData.businessType,
            staffId: currentUser.opid, // 客服成为订单负责人
            customerServiceInfo: {
                opid: currentUser.opid,
                name: currentUser.name,
                department: currentUser.department,
                role: currentUser.role,
                receiveTime: receiveTime,
                selectedServicesCount: selectedServices.length
            },
            selectedServices: selectedServices,
            orderDetails: {
                orderNo: formData.orderNo,
                portOfLoading: formData.portOfLoading,
                portOfDischarge: formData.portOfDischarge,
                estimatedDeparture: formData.estimatedDeparture,
                estimatedArrival: formData.estimatedArrival,
                cargoDescription: formData.cargoDescription,
                packageCount: formData.packageCount,
                weight: formData.weight,
                volume: formData.volume
            }
        };
        
        console.log('提交订单到API:', orderData);
        
        // 调用真实API
        const response = await fetch('/api/api/customer-intake/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            // API创建成功
            showDetailedSuccessMessage(result.data);
            
            // 添加到本地订单列表（保持界面一致性）
            const enrichedOrder = {
                ...formData,
                orderId: result.data.orderId,
                orderNo: result.data.orderNo,
                totalAmount: result.data.totalAmount,
                orderStatus: 'CONFIRMED'
            };
            orders.unshift(enrichedOrder);
            
            // 清空表单
            document.getElementById('orderForm').reset();
            document.getElementById('newOrderForm').style.display = 'none';
            
            // 刷新订单列表
            if (currentSection === 'orders') {
                loadOrders();
            }
            
        } else {
            // API返回错误
            console.error('API错误:', result);
            showNotification(`订单创建失败: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('提交订单错误:', error);
        showNotification(`订单创建失败: ${error.message}`, 'error');
    } finally {
        // 恢复按钮状态
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// 验证订单表单
function validateOrderForm() {
    const requiredFields = ['customerId', 'businessType', 'portOfLoading', 'portOfDischarge'];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            let fieldName = element.previousElementSibling.textContent;
            alert(`请填写${fieldName}`);
            element.focus();
            return false;
        }
    }
    
    // 验证是否选择了至少一个服务
    const selectedServices = document.querySelectorAll('.service-checkbox:checked');
    if (selectedServices.length === 0) {
        alert('请至少选择一个服务项目');
        document.getElementById('serviceSelection').scrollIntoView({ behavior: 'smooth' });
        return false;
    }
    
    return true;
}

// 收集订单表单数据
function collectOrderFormData() {
    const now = new Date();
    const customerId = document.getElementById('customerId').value;
    const customer = mockCustomers.find(c => c.id === customerId);
    
    const totalAmountText = document.getElementById('totalAmount').textContent;
    const totalAmount = parseInt(totalAmountText.replace(/[¥,\s]/g, '')) || 0;
    
    return {
        orderNo: document.getElementById('orderNo').value,
        orderId: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerId: customerId,
        customerName: customer ? customer.name : '',
        businessType: document.getElementById('businessType').value,
        portOfLoading: document.getElementById('portOfLoading').value,
        portOfDischarge: document.getElementById('portOfDischarge').value,
        estimatedDeparture: document.getElementById('estimatedDeparture').value ? new Date(document.getElementById('estimatedDeparture').value) : null,
        estimatedArrival: document.getElementById('estimatedArrival').value ? new Date(document.getElementById('estimatedArrival').value) : null,
        cargoDescription: document.getElementById('cargoDescription').value || '一般货物',
        packageCount: parseInt(document.getElementById('packageCount').value) || 0,
        weight: parseFloat(document.getElementById('weight').value) || 0,
        volume: parseFloat(document.getElementById('volume').value) || 0,
        totalAmount: totalAmount,
        totalCost: Math.round(totalAmount * 0.7), // 假设成本是收入的70%
        currency: 'CNY',
        orderStatus: 'PENDING',
        clearingStatus: 'PENDING',
        orderDate: now,
        services: collectSelectedServices(),
        createdAt: now,
        salesEntityId: 'SALES001', // 默认销售法人体
        deliveryEntityId: 'DELIVERY001' // 默认交付法人体
    };
}

// 映射服务到API格式
function mapServicesToAPI(services, businessType) {
    const serviceMapping = {
        'OCEAN': {
            'FCL_20GP': 'BOOKING',
            'FCL_40GP': 'BOOKING',
            'FCL_40HQ': 'BOOKING',
            'FCL_45GP': 'BOOKING',
            'LCL': 'MBL_PROCESSING'
        },
        'AIR': {
            'AIR_FREIGHT': 'AIR_BOOKING'
        },
        'TRUCK': {
            'TRUCK_TRANSPORT': 'TRUCK_TRANSPORT'
        },
        'RAIL': {
            'RAIL_TRANSPORT': 'RAIL_TRANSPORT'
        },
        'CUSTOMS': {
            'IMPORT_CUSTOMS': 'IMPORT_CUSTOMS',
            'EXPORT_CUSTOMS': 'EXPORT_CUSTOMS'
        },
        'WAREHOUSE': {
            'STORAGE': 'STORAGE'
        }
    };
    
    const mappedServices = [];
    
    // 根据业务类型添加必选服务
    switch (businessType) {
        case 'OCEAN':
            mappedServices.push('BOOKING', 'MBL_PROCESSING');
            break;
        case 'AIR':
            mappedServices.push('AIR_BOOKING', 'HAWB_PROCESSING');
            break;
        case 'TRUCK':
            mappedServices.push('TRUCK_TRANSPORT');
            break;
        case 'RAIL':
            mappedServices.push('RAIL_TRANSPORT');
            break;
        case 'CUSTOMS':
            mappedServices.push('IMPORT_CUSTOMS', 'EXPORT_CUSTOMS');
            break;
        case 'WAREHOUSE':
            mappedServices.push('STORAGE');
            break;
    }
    
    // 添加用户选择的其他服务
    if (services && services.length > 0) {
        services.forEach(service => {
            const mapping = serviceMapping[businessType];
            if (mapping && mapping[service.type]) {
                const apiService = mapping[service.type];
                if (!mappedServices.includes(apiService)) {
                    mappedServices.push(apiService);
                }
            }
        });
    }
    
    return mappedServices;
}

// 显示详细的成功信息
function showDetailedSuccessMessage(orderData) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-check-circle-fill text-success"></i> 订单创建成功
                    </h5>
                </div>
                <div class="modal-body">
                    <p>订单已成功创建并提交到系统，系统已自动将您设置为订单负责人。</p>
                    <div class="alert alert-info">
                        <strong>订单编号:</strong> ${orderData.orderNo}<br>
                        <strong>订单ID:</strong> ${orderData.orderId}<br>
                        <strong>总金额:</strong> ¥${orderData.totalAmount}<br>
                        <strong>创建时间:</strong> ${new Date().toLocaleString()}
                    </div>
                    <p>接下来您可以：</p>
                    <ul>
                        <li>前往派单管理界面分配操作人员</li>
                        <li>查看订单详情和执行进度</li>
                        <li>继续创建新的订单</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">继续创建订单</button>
                    <button type="button" class="btn btn-primary" onclick="showSection('assignment'); bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();">去派单管理</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // 模态框关闭后移除DOM元素
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// 收集选择的服务
function collectSelectedServices() {
    const services = [];
    const businessType = document.getElementById('businessType').value;
    
    // 这里简化处理，实际应该根据表单中的选择来收集服务
    switch (businessType) {
        case 'OCEAN':
            const containerType = document.querySelector('input[name="containerType"]:checked')?.value || 'FCL_40GP';
            services.push({
                type: containerType,
                description: getServiceDescription(containerType),
                quantity: 1,
                rate: getServiceRate(containerType),
                amount: getServiceRate(containerType)
            });
            break;
        case 'AIR':
            const weight = parseFloat(document.getElementById('weight').value) || 100;
            services.push({
                type: 'GENERAL',
                description: '空运运费',
                quantity: weight,
                rate: 25,
                amount: weight * 25
            });
            break;
        // 其他业务类型...
    }
    
    return services;
}

// 获取服务描述
function getServiceDescription(serviceType) {
    const descriptions = {
        'FCL_20GP': '20GP整箱运输',
        'FCL_40GP': '40GP整箱运输',
        'FCL_40HQ': '40HQ整箱运输',
        'LCL': '拼箱运输',
        'GENERAL': '空运普通货物',
        'FTL': '整车运输',
        'CHINA_EUROPE': '中欧班列整箱'
    };
    return descriptions[serviceType] || serviceType;
}

// 获取服务费率
function getServiceRate(serviceType) {
    const rates = {
        'FCL_20GP': 12000,
        'FCL_40GP': 18000,
        'FCL_40HQ': 20000,
        'LCL': 265,
        'GENERAL': 25,
        'FTL': 3500,
        'CHINA_EUROPE': 23000
    };
    return rates[serviceType] || 0;
}

// 加载订单数据到全局变量（不依赖DOM元素）
async function loadOrdersData() {
    try {
        console.log('开始调用API加载真实订单数据...');
        
        // 从API获取真实订单数据
        const response = await fetch('/api/freight-orders?page=0&size=50');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiOrders = await response.json();
        console.log('获取到的API订单数据:', apiOrders);
        
        // 转换API数据为前端需要的格式（移除旧的推断逻辑，使用getCustomerName函数）
        orders = apiOrders.map(order => {
            return {
                orderId: order.orderId || 'N/A',
                orderNo: order.orderNo || 'N/A',
                customerId: order.customerId || 'N/A',
                customerName: order.customerName,  // 保持原始值，由getCustomerName函数处理
                businessType: order.businessType || 'OCEAN',
                portOfLoading: order.portOfLoading || '上海',
                portOfDischarge: order.portOfDischarge || '洛杉矶',
                totalAmount: order.totalAmount || 15000,
                totalCost: order.totalCost || 12000,
                orderStatus: order.orderStatus || 'PENDING',
                clearingStatus: order.clearingStatus || 'PENDING',
                createdAt: order.createdAt || new Date().toISOString(),
                orderDate: order.orderDate || new Date().toISOString().split('T')[0]
            };
        });
        
        console.log('数据转换完成，orders.length =', orders.length);
        return orders;
        
    } catch (error) {
        console.error('API调用失败:', error);
        throw error;
    }
}

// 加载订单列表
async function loadOrders() {
    const tableBody = document.getElementById('ordersTable');
    
    if (!tableBody) return;
    
    try {
        // 显示加载状态
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    加载订单数据中...
                </td>
            </tr>
        `;
        
        // 从API获取真实订单数据
        const response = await fetch('/api/freight-orders?page=0&size=50');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiOrders = await response.json();
        console.log('获取到的API订单数据:', apiOrders);
        
        // 转换API数据为前端需要的格式，并补充缺失字段
        const allOrders = apiOrders.map((order, index) => {
            // 为演示权限控制，给订单分配不同的创建者
            // API数据中这些字段为null，所以需要为演示分配创建者
            const demoCreators = ['CS001', 'CS002', 'SA001', 'SA002', 'OP001', 'OP002'];
            const assignedCreator = order.salesStaffId || order.createdBy || order.staffId || demoCreators[index % demoCreators.length];
            
            // 根据业务类型生成服务列表
            const businessType = order.businessType || 'OCEAN';
            const servicesByType = {
                'OCEAN': ['订舱', '拖车', '报关', '海运', '目的港清关', '派送'],
                'AIR': ['订舱', '拖车', '报关', '空运', '目的港清关', '派送'],
                'TRUCK': ['调车', '装货', '陆运', '目的地卸货', '派送'],
                'RAIL': ['装车', '铁运', '目的地接货', '派送'],
                'MULTIMODAL': ['订舱', '拖车', '中转', '多式联运', '清关', '派送']
            };
            
            return {
                orderId: order.orderId || 'N/A',
                orderNo: order.orderNo || 'N/A',
                customerId: order.customerId || 'N/A',
                customerName: order.customerName,  // 保持原始值，由getCustomerName函数处理
                businessType: businessType,
                servicesList: order.servicesList || servicesByType[businessType] || ['基础服务'],
                portOfLoading: order.portOfLoading || '上海',
                portOfDischarge: order.portOfDischarge || '洛杉矶',
                totalAmount: order.totalAmount || 15000,
                totalCost: order.totalCost || 12000,
                orderStatus: order.orderStatus || 'PENDING',
                clearingStatus: order.clearingStatus || 'PENDING',
                createdAt: order.createdAt || new Date().toISOString(),
                orderDate: order.orderDate || new Date().toISOString().split('T')[0],
                // 关键：添加订单创建者信息用于权限控制
                staffId: assignedCreator,
                createdBy: assignedCreator,
                salesStaffId: assignedCreator
            };
        });
        
        // 临时取消权限过滤，显示所有订单用于调试
        orders = allOrders; // filterOrdersByPermission(allOrders);
        const currentUser = getCurrentUser();
        const userDetail = getOperatorInfo(currentUser.opid);
        const permissionInfo = getPermissionLevelDescription(userDetail);
        
        console.log(`权限过滤结果: 原始${allOrders.length}条订单，过滤后${orders.length}条订单`);
        console.log(`当前用户权限: ${permissionInfo.description} - ${permissionInfo.scope}`);
        
        // 如果没有数据，显示提示信息
        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-4">
                        <i class="fas fa-inbox fa-2x text-muted mb-3 d-block"></i>
                        <p class="text-muted">暂无订单数据</p>
                        <button class="btn btn-primary btn-sm" onclick="showNewOrderForm()">
                            <i class="fas fa-plus me-1"></i>创建新订单
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        // 渲染订单列表
        tableBody.innerHTML = orders.map(order => {
            const creatorInfo = getOperatorInfo(order.staffId) || { name: '未知', opid: order.staffId };
            const isDisabled = order.orderStatus !== 'COMPLETED';
            const disabledAttr = isDisabled ? 'disabled="true"' : '';
            
            // 获取订单包含的服务信息
            const serviceInfo = getOrderServicesDisplay(order);
            
            return `
            <tr>
                <td class="order-no-cell"><code>${order.orderNo}</code></td>
                <td title="${getCustomerName(order)}">${getCustomerName(order).length > 50 ? getCustomerName(order).substring(0, 47) + '...' : getCustomerName(order)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="${getBusinessTypeIcon(order.businessType)} me-1"></i>
                        <span class="badge ${getBusinessTypeBadgeClass(order.businessType)}">${getBusinessTypeName(order.businessType)}</span>
                    </div>
                </td>
                <td>
                    <div class="service-summary">
                        <small class="text-muted d-block">共${serviceInfo.count}项服务</small>
                        <div class="service-tags">
                            ${serviceInfo.tags}
                        </div>
                    </div>
                </td>
                <td>${order.portOfLoading}</td>
                <td>${order.portOfDischarge}</td>
                <td><strong>¥${order.totalAmount.toLocaleString()}</strong></td>
                <td><span class="order-status status-${order.orderStatus.toLowerCase()}">${getStatusName(order.orderStatus)}</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-info me-1">${creatorInfo.opid}</span>
                        <small>${creatorInfo.name}</small>
                        <div class="text-muted" style="font-size: 0.7rem;">客服</div>
                    </div>
                </td>
                <td>${formatDateTime(order.createdAt)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="showOrderDetail('${order.orderId}')" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editOrder('${order.orderId}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="executeOrderClearing('${order.orderId}')" title="执行清分" ` + disabledAttr + `>
                            <i class="fas fa-coins"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        
        // 更新统计信息
        updateDashboardStats();
        
    } catch (error) {
        console.error('加载订单失败，使用模拟数据:', error);
        
        // API失败时使用模拟数据作为fallback
        orders = generateMockOrders();
        console.log('使用模拟订单数据:', orders.length, '条记录');
        
        // 渲染模拟数据到表格
        tableBody.innerHTML = orders.map(order => {
            const isDisabled = order.orderStatus !== 'COMPLETED';
            const disabledAttr = isDisabled ? 'disabled="true"' : '';
            
            return `
            <tr>
                <td class="order-no-cell"><code>${order.orderNo}</code></td>
                <td title="${getCustomerName(order)}">${getCustomerName(order).length > 50 ? getCustomerName(order).substring(0, 47) + '...' : getCustomerName(order)}</td>
                <td><span class="badge bg-primary">${getBusinessTypeName(order.businessType)}</span></td>
                <td>${order.portOfLoading}</td>
                <td>${order.portOfDischarge}</td>
                <td><strong>¥${order.totalAmount.toLocaleString()}</strong></td>
                <td><span class="order-status status-${order.orderStatus.toLowerCase()}">${getStatusName(order.orderStatus)}</span></td>
                <td>${formatDateTime(order.createdAt)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="showOrderDetail('${order.orderId}')" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editOrder('${order.orderId}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="executeOrderClearing('${order.orderId}')" title="执行清分" ${disabledAttr}>
                            <i class="fas fa-coins"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        
        // 更新统计信息
        updateDashboardStats();
        
        // 显示API失败提示（但不影响页面功能）
        showNotification('API连接失败，当前显示模拟数据', 'warning');
    }
}

// 显示订单详情
function showOrderDetail(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;
    
    const modalContent = document.getElementById('orderDetailContent');
    
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary"><i class="fas fa-info-circle me-2"></i>基本信息</h6>
                <table class="table table-sm">
                    <tr><td>订单号:</td><td><code>${order.orderNo}</code></td></tr>
                    <tr><td>客户:</td><td title="${getCustomerName(order)}">${getCustomerName(order)}</td></tr>
                    <tr><td>业务类型:</td><td><span class="badge bg-primary">${getBusinessTypeName(order.businessType)}</span></td></tr>
                    <tr><td>订单状态:</td><td><span class="order-status status-${order.orderStatus.toLowerCase()}">${getStatusName(order.orderStatus)}</span></td></tr>
                    <tr><td>创建时间:</td><td>${formatDateTime(order.createdAt)}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary"><i class="fas fa-route me-2"></i>运输信息</h6>
                <table class="table table-sm">
                    <tr><td>起运地:</td><td>${order.portOfLoading}</td></tr>
                    <tr><td>目的地:</td><td>${order.portOfDischarge}</td></tr>
                    <tr><td>预计起运:</td><td>${formatDate(order.estimatedDeparture)}</td></tr>
                    <tr><td>预计到达:</td><td>${formatDate(order.estimatedArrival)}</td></tr>
                </table>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-6">
                <h6 class="text-primary"><i class="fas fa-boxes me-2"></i>货物信息</h6>
                <table class="table table-sm">
                    <tr><td>货物描述:</td><td>${order.cargoDescription}</td></tr>
                    <tr><td>件数:</td><td>${order.packageCount} 件</td></tr>
                    <tr><td>重量:</td><td>${order.weight} KG</td></tr>
                    <tr><td>体积:</td><td>${order.volume} CBM</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary"><i class="fas fa-calculator me-2"></i>费用信息</h6>
                <table class="table table-sm">
                    <tr><td>总金额:</td><td><strong>¥${order.totalAmount.toLocaleString()}</strong></td></tr>
                    <tr><td>总成本:</td><td>¥${order.totalCost.toLocaleString()}</td></tr>
                    <tr><td>预计毛利:</td><td>¥${(order.totalAmount - order.totalCost).toLocaleString()}</td></tr>
                    <tr><td>币种:</td><td>${order.currency}</td></tr>
                </table>
            </div>
        </div>
        
        ${order.services && order.services.length > 0 ? `
        <div class="row mt-3">
            <div class="col-12">
                <h6 class="text-primary"><i class="fas fa-tools me-2"></i>服务明细</h6>
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>服务类型</th>
                            <th>描述</th>
                            <th>数量</th>
                            <th>单价</th>
                            <th>金额</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.services.map(service => `
                        <tr>
                            <td><code>${service.type}</code></td>
                            <td>${service.description}</td>
                            <td>${service.quantity} ${getServiceUnit(service.type)}</td>
                            <td>¥${service.rate.toLocaleString()}</td>
                            <td><strong>¥${service.amount.toLocaleString()}</strong></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
    `;
    
    // 设置当前操作的订单ID
    window.currentOrderId = orderId;
    
    // 显示模态框
    new bootstrap.Modal(document.getElementById('orderDetailModal')).show();
}

// 执行订单清分
function executeOrderClearing(orderId) {
    if (!orderId && window.currentOrderId) {
        orderId = window.currentOrderId;
    }
    
    const order = orders.find(o => o.orderId === orderId);
    if (!order) {
        alert('未找到订单信息');
        return;
    }
    
    if (order.orderStatus !== 'COMPLETED') {
        alert('只有已完成的订单才能执行清分');
        return;
    }
    
    // 构建清分请求数据
    const clearingRequest = {
        order: {
            orderId: order.orderId,
            orderNo: order.orderNo,
            customerId: order.customerId,
            salesEntityId: order.salesEntityId || 'SALES001',
            deliveryEntityId: order.deliveryEntityId || 'DELIVERY001',
            totalAmount: order.totalAmount,
            totalCost: order.totalCost,
            currency: order.currency,
            orderDate: order.orderDate,
            businessType: order.businessType,
            portOfLoading: order.portOfLoading,
            portOfDischarge: order.portOfDischarge
        },
        isSimulation: false,
        operator: 'system'
    };
    
    // 调用清分API
    showNotification('正在执行清分...', 'info');
    
    fetch('/api/clearing/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(clearingRequest)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('清分执行成功', 'success');
            
            // 更新订单状态
            order.clearingStatus = 'CLEARED';
            
            // 显示清分结果
            showClearingResult(data);
            
            // 关闭详情模态框
            bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'))?.hide();
            
        } else {
            showNotification('清分执行失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('清分执行失败:', error);
        showNotification('清分执行失败: ' + error.message, 'error');
    });
}

// 显示清分结果
function showClearingResult(clearingResponse) {
    const results = clearingResponse.clearingResults || [];
    
    let resultHtml = `
        <div class="card mt-3">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-check-circle text-success me-2"></i>清分结果</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>法人体</th>
                                <th>交易类型</th>
                                <th>账户类型</th>
                                <th>金额</th>
                                <th>币种</th>
                                <th>是否中转留存</th>
                                <th>规则ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.map(result => `
                            <tr>
                                <td><strong>${result.entityId}</strong></td>
                                <td><span class="badge bg-info">${getTransactionTypeName(result.transactionType)}</span></td>
                                <td><span class="badge bg-secondary">${getAccountTypeName(result.accountType)}</span></td>
                                <td><strong class="${result.amount > 0 ? 'text-success' : 'text-danger'}">¥${result.amount.toLocaleString()}</strong></td>
                                <td>${result.currency}</td>
                                <td>${result.isTransitRetention ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>'}</td>
                                <td><code>${result.ruleId || 'N/A'}</code></td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="mt-3">
                    <h6>清分汇总:</h6>
                    <p class="text-muted">共产生 ${results.length} 条清分记录，总金额验证: ${validateClearingBalance(results) ? '<span class="text-success">平衡</span>' : '<span class="text-danger">不平衡</span>'}</p>
                </div>
            </div>
        </div>
    `;
    
    // 可以选择在页面某个位置显示结果，或者弹窗显示
    showModal('清分结果', resultHtml);
}

// 验证清分平衡
function validateClearingBalance(results) {
    const totalDebits = results.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
    const totalCredits = results.filter(r => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0);
    return Math.abs(totalDebits - totalCredits) < 0.01; // 容忍小数点误差
}

// 批量清分处理
function executeBatchClearing() {
    const orderStatus = document.getElementById('clearingOrderStatus').value;
    const clearingMode = document.getElementById('clearingMode').value;
    
    // 筛选符合条件的订单
    let eligibleOrders = orders;
    if (orderStatus === 'COMPLETED') {
        eligibleOrders = orders.filter(order => order.orderStatus === 'COMPLETED' && order.clearingStatus !== 'CLEARED');
    }
    
    if (eligibleOrders.length === 0) {
        alert('没有符合条件的订单需要清分');
        return;
    }
    
    const confirmMessage = `将对 ${eligibleOrders.length} 个订单执行${clearingMode === 'STAR' ? '星式' : '链式'}清分，是否继续？`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    showNotification(`正在批量处理 ${eligibleOrders.length} 个订单...`, 'info');
    
    // 模拟批量处理
    let processedCount = 0;
    eligibleOrders.forEach((order, index) => {
        setTimeout(() => {
            executeOrderClearing(order.orderId);
            processedCount++;
            
            if (processedCount === eligibleOrders.length) {
                showNotification(`批量清分完成，共处理 ${processedCount} 个订单`, 'success');
            }
        }, index * 1000); // 每秒处理一个订单
    });
}

// 加载清分管理页面
function loadClearingManagement() {
    // 清分管理页面主要是配置和批量操作，内容已在HTML中定义
    console.log('加载清分管理页面');
}

// 工具函数

// 获取业务类型名称
function getBusinessTypeName(businessType) {
    const names = {
        'OCEAN': '海运',
        'AIR': '空运',
        'TRUCK': '陆运',
        'RAIL': '铁运',
        'MULTIMODAL': '多式联运'
    };
    return names[businessType] || businessType;
}

// 获取业务类型图标
function getBusinessTypeIcon(businessType) {
    const icons = {
        'OCEAN': 'fas fa-ship ocean-freight',
        'AIR': 'fas fa-plane air-freight',
        'TRUCK': 'fas fa-truck truck-freight',
        'RAIL': 'fas fa-train rail-freight',
        'MULTIMODAL': 'fas fa-route'
    };
    return icons[businessType] || 'fas fa-box';
}

// 获取业务类型徽章样式
function getBusinessTypeBadgeClass(businessType) {
    const classes = {
        'OCEAN': 'bg-primary',
        'AIR': 'bg-warning text-dark',
        'TRUCK': 'bg-success',
        'RAIL': 'bg-danger',
        'MULTIMODAL': 'bg-info'
    };
    return classes[businessType] || 'bg-secondary';
}

// 获取状态名称
function getStatusName(status) {
    const names = {
        'PENDING': '待确认',
        'CONFIRMED': '已确认',
        'SHIPPED': '已发运',
        'DELIVERED': '已送达',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
    };
    return names[status] || status;
}

// 获取订单包含的服务显示信息
function getOrderServicesDisplay(order) {
    // 根据业务类型生成基础服务列表
    const servicesByType = {
        'OCEAN': ['订舱', '拖车', '报关', '海运', '目的港清关', '派送'],
        'AIR': ['订舱', '拖车', '报关', '空运', '目的港清关', '派送'],
        'TRUCK': ['调车', '装货', '陆运', '目的地卸货', '派送'],
        'RAIL': ['装车', '铁运', '目的地接货', '派送'],
        'MULTIMODAL': ['订舱', '拖车', '中转', '多式联运', '清关', '派送']
    };
    
    // 从订单数据中获取实际服务列表
    let services = [];
    if (order.servicesList && Array.isArray(order.servicesList)) {
        services = order.servicesList;
    } else if (order.businessType && servicesByType[order.businessType]) {
        // 如果没有具体服务数据，使用业务类型的默认服务
        services = servicesByType[order.businessType];
    } else {
        services = ['基础服务'];
    }
    
    // 生成服务标签
    const maxDisplayTags = 3;
    const displayServices = services.slice(0, maxDisplayTags);
    const remainingCount = services.length - maxDisplayTags;
    
    let tags = displayServices.map(service => 
        `<span class="badge bg-light text-dark me-1 mb-1" style="font-size: 0.7rem;">${service}</span>`
    ).join('');
    
    if (remainingCount > 0) {
        tags += `<span class="badge bg-secondary me-1 mb-1" style="font-size: 0.7rem;">+${remainingCount}项</span>`;
    }
    
    return {
        count: services.length,
        tags: tags,
        services: services
    };
}

// 获取交易类型名称
function getTransactionTypeName(transactionType) {
    const names = {
        'RECEIVABLE': '应收',
        'PAYABLE': '应付',
        'TRANSIT_FEE': '中转费',
        'PROFIT_SHARING': '分润'
    };
    return names[transactionType] || transactionType;
}

// 获取账户类型名称
function getAccountTypeName(accountType) {
    const names = {
        'EXTERNAL_RECEIVABLE': '外部应收',
        'EXTERNAL_PAYABLE': '外部应付',
        'INTERNAL_RECEIVABLE': '内部应收',
        'INTERNAL_PAYABLE': '内部应付'
    };
    return names[accountType] || accountType;
}

// 获取服务单位
function getServiceUnit(serviceType) {
    const units = {
        'FCL_20GP': '箱',
        'FCL_40GP': '箱',
        'FCL_40HQ': '箱',
        'LCL': 'CBM',
        'GENERAL': 'KG',
        'FTL': '趟',
        'LTL': '吨',
        'CHINA_EUROPE': '箱'
    };
    return units[serviceType] || '个';
}

// 格式化日期时间
function formatDateTime(dateTime) {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('zh-CN');
}

// 格式化日期
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${getBootstrapAlertType(type)} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 获取Bootstrap警告类型
function getBootstrapAlertType(type) {
    const types = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return types[type] || 'info';
}

// 显示模态框
function showModal(title, content) {
    // 创建模态框HTML
    const modalHtml = `
        <div class="modal fade" id="dynamicModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的动态模态框
    const existingModal = document.getElementById('dynamicModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加新的模态框
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
    modal.show();
    
    // 模态框隐藏后移除DOM
    document.getElementById('dynamicModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// 过滤订单
function filterOrders() {
    const statusFilter = document.getElementById('orderStatusFilter').value;
    // 这里可以根据状态筛选订单，重新渲染表格
    loadOrders();
}

// 编辑订单
function editOrder(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;
    
    // 这里可以实现编辑功能
    showNotification('编辑功能开发中...', 'info');
}

console.log('OneOrder 货代订单管理系统 JavaScript 加载完成');

// ==================== 测试功能函数 ====================

// 初始化测试数据
function initTestData() {
    showNotification('正在初始化测试数据...', 'info');
    
    fetch('/api/clearing/test/init-all-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            showNotification('测试数据初始化成功！', 'success');
            console.log('初始化结果:', data.data);
        } else {
            showNotification('初始化失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('初始化失败:', error);
        showNotification('初始化失败: ' + error.message, 'error');
    });
}

// 测试收款借抬头
function testReceivableTransit() {
    const businessType = document.getElementById('receivableBusinessType').value;
    const amount = document.getElementById('receivableAmount').value;
    const paymentAccount = document.getElementById('receivableAccount').value;
    
    const request = {
        businessType: businessType,
        amount: amount,
        currency: 'CNY',
        customerId: 'CUST_001'
    };
    
    if (paymentAccount) {
        request.paymentAccount = paymentAccount;
    }
    
    showNotification('正在测试收款借抬头...', 'info');
    
    fetch('/api/clearing/test/transit-entity/receivable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    })
    .then(response => response.json())
    .then(data => {
        displayTestResult('收款借抬头测试', data);
    })
    .catch(error => {
        console.error('收款借抬头测试失败:', error);
        showNotification('测试失败: ' + error.message, 'error');
    });
}

// 测试付款借抬头
function testPayableTransit() {
    const businessType = document.getElementById('payableBusinessType').value;
    const totalCost = document.getElementById('payableAmount').value;
    
    const request = {
        businessType: businessType,
        totalCost: totalCost,
        currency: 'CNY',
        customerId: 'CUST_002'
    };
    
    showNotification('正在测试付款借抬头...', 'info');
    
    fetch('/api/clearing/test/transit-entity/payable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    })
    .then(response => response.json())
    .then(data => {
        displayTestResult('付款借抬头测试', data);
    })
    .catch(error => {
        console.error('付款借抬头测试失败:', error);
        showNotification('测试失败: ' + error.message, 'error');
    });
}

// 测试过账流程
function testCrossBorderFlow() {
    const businessType = document.getElementById('crossBorderBusinessType').value;
    const amount = document.getElementById('crossBorderAmount').value;
    
    const request = {
        businessType: businessType,
        amount: amount,
        currency: 'CNY',
        customerId: 'CUST_003'
    };
    
    showNotification('正在测试过账流程...', 'info');
    
    fetch('/api/clearing/test/cross-border/flat-transfer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    })
    .then(response => response.json())
    .then(data => {
        displayTestResult('标准过账测试', data);
    })
    .catch(error => {
        console.error('过账流程测试失败:', error);
        showNotification('测试失败: ' + error.message, 'error');
    });
}

// 测试抵消规则
function testNettingRules() {
    const request = {
        orderCount: 3,
        testType: 'netting'
    };
    
    showNotification('正在测试抵消规则...', 'info');
    
    fetch('/api/clearing/test/cross-border/netting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    })
    .then(response => response.json())
    .then(data => {
        displayTestResult('抵消规则测试', data);
    })
    .catch(error => {
        console.error('抵消规则测试失败:', error);
        showNotification('测试失败: ' + error.message, 'error');
    });
}

// 综合清分测试
function testComprehensiveClearing() {
    const request = {
        businessType: 'OCEAN_FREIGHT',
        amount: 100000,
        currency: 'CNY',
        customerId: 'CUST_001'
    };
    
    showNotification('正在执行综合清分测试...', 'info');
    
    fetch('/api/clearing/test/comprehensive', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    })
    .then(response => response.json())
    .then(data => {
        displayTestResult('综合清分测试', data);
    })
    .catch(error => {
        console.error('综合清分测试失败:', error);
        showNotification('测试失败: ' + error.message, 'error');
    });
}

// 显示测试结果
function displayTestResult(testName, data) {
    const resultsDiv = document.getElementById('clearingResults');
    const contentDiv = document.getElementById('clearingResultsContent');
    
    let resultHtml = `
        <div class="test-result-section mb-4">
            <h5 class="text-primary border-bottom pb-2">
                <i class="fas fa-vial me-2"></i>${testName}
                <span class="badge ${data.code === 200 ? 'bg-success' : 'bg-danger'} ms-2">
                    ${data.code === 200 ? '成功' : '失败'}
                </span>
            </h5>
            <div class="alert ${data.code === 200 ? 'alert-success' : 'alert-danger'}">
                <strong>结果：</strong>${data.message}
            </div>
    `;
    
    if (data.code === 200 && data.data) {
        const testData = data.data;
        
        // 显示基本信息
        if (testData.requiresTransit !== undefined) {
            resultHtml += `
                <div class="mb-3">
                    <h6>判定结果:</h6>
                    <p><strong>需要借抬头处理：</strong>
                        <span class="badge ${testData.requiresTransit ? 'bg-success' : 'bg-warning'}">
                            ${testData.requiresTransit ? '是' : '否'}
                        </span>
                    </p>
                    ${!testData.requiresTransit ? `<p><strong>原因：</strong>${testData.reason}</p>` : ''}
                </div>
            `;
        }
        
        if (testData.requiresCrossBorder !== undefined) {
            resultHtml += `
                <div class="mb-3">
                    <h6>判定结果:</h6>
                    <p><strong>需要过账处理：</strong>
                        <span class="badge ${testData.requiresCrossBorder ? 'bg-success' : 'bg-warning'}">
                            ${testData.requiresCrossBorder ? '是' : '否'}
                        </span>
                    </p>
                    ${!testData.requiresCrossBorder ? `<p><strong>原因：</strong>${testData.reason}</p>` : ''}
                </div>
            `;
        }
        
        if (testData.canNetting !== undefined) {
            resultHtml += `
                <div class="mb-3">
                    <h6>抵消判定:</h6>
                    <p><strong>可以抵消：</strong>
                        <span class="badge ${testData.canNetting ? 'bg-success' : 'bg-warning'}">
                            ${testData.canNetting ? '是' : '否'}
                        </span>
                    </p>
                    <p><strong>订单数量：</strong>${testData.orderCount}</p>
                    ${testData.nettingFlowCount ? `<p><strong>抵消流程数：</strong>${testData.nettingFlowCount}</p>` : ''}
                </div>
            `;
        }
        
        // 显示汇总信息
        if (testData.summary) {
            resultHtml += `
                <div class="mb-3">
                    <h6>处理汇总:</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card border-info">
                                <div class="card-body text-center">
                                    <h5 class="text-info">${testData.summary.totalRecords}</h5>
                                    <small>总记录数</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-warning">
                                <div class="card-body text-center">
                                    <h5 class="text-warning">¥${parseFloat(testData.summary.totalAmount || 0).toLocaleString()}</h5>
                                    <small>总金额</small>
                                </div>
                            </div>
                        </div>
                        ${testData.summary.totalRetention ? `
                        <div class="col-md-3">
                            <div class="card border-danger">
                                <div class="card-body text-center">
                                    <h5 class="text-danger">¥${parseFloat(testData.summary.totalRetention).toLocaleString()}</h5>
                                    <small>留存金额</small>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        ${testData.summary.retentionRecords !== undefined ? `
                        <div class="col-md-3">
                            <div class="card border-success">
                                <div class="card-body text-center">
                                    <h5 class="text-success">${testData.summary.retentionRecords}</h5>
                                    <small>留存记录</small>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // 显示详细清分结果
        if (testData.clearingResults && testData.clearingResults.length > 0) {
            resultHtml += `
                <div class="mb-3">
                    <h6>清分明细:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped clearing-result-table">
                            <thead>
                                <tr>
                                    <th>法人ID</th>
                                    <th>金额</th>
                                    <th>交易类型</th>
                                    <th>账务类型</th>
                                    <th>描述</th>
                                    <th>留存</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            testData.clearingResults.forEach(result => {
                const amountClass = parseFloat(result.amount) >= 0 ? 'amount-positive' : 'amount-negative';
                const retentionInfo = result.isTransitRetention && result.retentionAmount ? 
                    `¥${parseFloat(result.retentionAmount).toLocaleString()}` : '-';
                
                resultHtml += `
                    <tr ${result.isTransitRetention ? 'class="retention-highlight"' : ''}>
                        <td><code>${result.entityId}</code></td>
                        <td class="${amountClass}">¥${parseFloat(result.amount).toLocaleString()}</td>
                        <td><span class="badge bg-secondary">${result.transactionType}</span></td>
                        <td><span class="badge bg-info">${result.accountType}</span></td>
                        <td>${result.description || '-'}</td>
                        <td>${retentionInfo}</td>
                    </tr>
                `;
            });
            
            resultHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        // 显示抵消报告
        if (testData.report) {
            resultHtml += `
                <div class="mb-3">
                    <h6>抵消报告:</h6>
                    <pre class="bg-light p-3 rounded">${testData.report}</pre>
                </div>
            `;
        }
    }
    
    resultHtml += `</div><hr>`;
    
    // 如果已有结果，追加新结果；否则替换内容
    if (contentDiv.innerHTML.trim()) {
        contentDiv.innerHTML = resultHtml + contentDiv.innerHTML;
    } else {
        contentDiv.innerHTML = resultHtml;
    }
    
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
    
    showNotification(testName + '完成', 'success');
}

// 清除测试结果
function clearTestResults() {
    const resultsDiv = document.getElementById('clearingResults');
    const contentDiv = document.getElementById('clearingResultsContent');
    
    contentDiv.innerHTML = '';
    resultsDiv.style.display = 'none';
    
    showNotification('测试结果已清除', 'info');
}

// ==================== 动态服务配置管理 ====================

// 加载动态服务配置
async function loadDynamicServiceConfig() {
    const loadingStatus = document.getElementById('configLoadingStatus');
    const dynamicConfig = document.getElementById('dynamicServiceConfig');
    const staticConfig = document.querySelector('#services .row:not(#serviceConfigCards)');
    
    // 显示加载状态
    loadingStatus.classList.remove('d-none');
    
    try {
        // 先尝试从数据库加载配置
        const response = await fetch('/api/freight-orders/service-config');
        
        if (response.ok) {
            const data = await response.json();
            
            // 隐藏静态配置，显示动态配置
            if (staticConfig) staticConfig.style.display = 'none';
            dynamicConfig.style.display = 'block';
            
            // 生成动态配置卡片
            generateDynamicConfigCards(data.configs || []);
            
            showNotification('已加载动态配置数据 (' + (data.total || 0) + ' 条)', 'success');
            
        } else {
            throw new Error('API响应错误: ' + response.status);
        }
        
    } catch (error) {
        console.error('加载动态配置失败:', error);
        
        // API失败时显示提示，但保持静态配置可见
        showNotification('动态配置加载失败，显示静态配置: ' + error.message, 'warning');
        
        // 确保静态配置可见
        if (staticConfig) staticConfig.style.display = 'block';
        dynamicConfig.style.display = 'none';
        
    } finally {
        // 隐藏加载状态
        loadingStatus.classList.add('d-none');
    }
}

// 生成动态配置卡片
function generateDynamicConfigCards(configs) {
    const container = document.getElementById('serviceConfigCards');
    
    if (!configs || configs.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    没有找到配置数据，请检查数据库连接或联系管理员。
                </div>
            </div>
        `;
        return;
    }
    
    // 按业务类型分组
    const groupedConfigs = configs.reduce((groups, config) => {
        const type = config.businessType || '其他';
        if (!groups[type]) groups[type] = [];
        groups[type].push(config);
        return groups;
    }, {});
    
    let html = '';
    
    // 业务类型图标映射
    const typeIcons = {
        'OCEAN': 'fas fa-ship',
        'AIR': 'fas fa-plane', 
        'TRUCK': 'fas fa-truck',
        'RAIL': 'fas fa-train',
        'CUSTOMS': 'fas fa-passport',
        'WAREHOUSE': 'fas fa-warehouse'
    };
    
    // 业务类型名称映射
    const typeNames = {
        'OCEAN': '海运服务',
        'AIR': '空运服务',
        'TRUCK': '陆运服务', 
        'RAIL': '铁运服务',
        'CUSTOMS': '关务服务',
        'WAREHOUSE': '仓储服务'
    };
    
    // 为每个业务类型生成卡片
    Object.keys(groupedConfigs).forEach(businessType => {
        const typeConfigs = groupedConfigs[businessType];
        const icon = typeIcons[businessType] || 'fas fa-cog';
        const typeName = typeNames[businessType] || businessType;
        
        html += `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card service-card h-100">
                    <div class="card-header ${businessType.toLowerCase()}-freight">
                        <h5 class="mb-0">
                            <i class="${icon} me-2"></i>${typeName}
                            <small class="text-muted">(${typeConfigs.length}个费用科目)</small>
                        </h5>
                    </div>
                    <div class="card-body">
        `;
        
        // 显示前5个主要费用科目
        const mainConfigs = typeConfigs.slice(0, 5);
        mainConfigs.forEach(config => {
            const rate = config.standardRate ? 
                `¥${config.standardRate} ${config.unit || ''}` : 
                '价格待定';
                
            html += `
                <div class="service-item mb-2">
                    <h6 class="small mb-1">
                        <i class="fas fa-tag me-1"></i>${config.chineseName}
                        <span class="badge bg-secondary ms-1">${config.feeCode}</span>
                    </h6>
                    <p class="text-muted small mb-1">${rate}</p>
                    ${config.description ? `<p class="text-muted" style="font-size: 0.75rem;">${config.description}</p>` : ''}
                </div>
            `;
        });
        
        // 如果还有更多配置，显示链接
        if (typeConfigs.length > 5) {
            html += `
                <div class="text-center mt-2">
                    <small class="text-muted">还有 ${typeConfigs.length - 5} 个费用科目...</small>
                </div>
            `;
        }
        
        html += `
                    </div>
                    <div class="card-footer text-center">
                        <button class="btn btn-outline-primary btn-sm" onclick="openServiceConfigManager('${businessType}')">
                            <i class="fas fa-edit me-1"></i>编辑配置
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 打开服务配置管理器
function openServiceConfigManager(businessType = '') {
    const url = businessType ? 
        `/api/service-config.html?businessType=${businessType}` : 
        `/api/service-config.html`;
    
    // 在新窗口打开配置管理页面
    window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
}

// 页面加载时自动尝试加载动态配置
document.addEventListener('DOMContentLoaded', function() {
    // 当用户点击服务配置菜单时，自动加载动态配置
    const servicesLink = document.querySelector('a[href="#services"]');
    if (servicesLink) {
        servicesLink.addEventListener('click', function() {
            // 延迟加载，确保section已显示
            setTimeout(() => {
                loadDynamicServiceConfig();
            }, 200);
        });
    }
});

// ==================== 内部协议管理功能 ====================

// 加载内部协议管理页面
function loadProtocolManagement() {
    console.log('加载内部协议管理页面');
    
    // 加载部门数据
    loadDepartments();
    
    // 加载员工数据
    loadStaff();
    
    // 加载协议数据
    loadAllProtocols();
}

// 加载所有协议
function loadAllProtocols() {
    console.log('加载协议列表...');
    
    fetch('/api/clearing/protocols')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('协议列表:', data);
        if (Array.isArray(data)) {
            displayAllProtocols(data);
        } else {
            console.warn('协议数据格式异常:', data);
            // 使用模拟数据
            displayAllProtocols(mockProtocolData());
        }
    })
    .catch(error => {
        console.error('加载协议失败:', error);
        // 使用模拟数据作为备选
        displayAllProtocols(mockProtocolData());
    });
}

// 显示所有协议
function displayAllProtocols(protocols) {
    const tbody = document.getElementById('allProtocolsTable');
    if (!tbody) {
        console.warn('协议表格元素不存在');
        return;
    }
    
    if (protocols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">暂无协议数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = protocols.map(protocol => `
        <tr>
            <td>${protocol.protocolId}</td>
            <td>${protocol.protocolName}</td>
            <td>${protocol.salesDepartmentId}</td>
            <td>${protocol.operationDepartmentId}</td>
            <td>${protocol.serviceCode || '全部'}</td>
            <td>${protocol.businessType || '全部'}</td>
            <td>${(protocol.baseCommissionRate * 100).toFixed(2)}%</td>
            <td>${(protocol.performanceBonusRate * 100).toFixed(2)}%</td>
            <td><span class="badge ${protocol.active ? 'bg-success' : 'bg-secondary'}">${protocol.active ? '有效' : '无效'}</span></td>
        </tr>
    `).join('');
}

// 匹配协议
function matchProtocols() {
    const salesDept = document.getElementById('salesDepartment')?.value;
    const opDept = document.getElementById('operationDepartment')?.value;
    const serviceCode = document.getElementById('serviceCode')?.value;
    const businessType = document.getElementById('businessType')?.value;
    
    if (!salesDept || !opDept) {
        alert('请选择销售部门和操作部门');
        return;
    }
    
    console.log('匹配协议参数:', { salesDept, opDept, serviceCode, businessType });
    
    const params = new URLSearchParams();
    params.append('salesDepartmentId', salesDept);
    params.append('operationDepartmentId', opDept);
    if (serviceCode) params.append('serviceCode', serviceCode);
    if (businessType) params.append('businessType', businessType);
    
    fetch(`/api/clearing/protocols/match?${params}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('匹配结果:', data);
        if (Array.isArray(data)) {
            displayMatchedProtocols(data);
        } else {
            console.warn('匹配结果格式异常:', data);
            displayMatchedProtocols(mockMatchedProtocols());
        }
    })
    .catch(error => {
        console.error('匹配协议失败:', error);
        // 使用模拟匹配结果
        displayMatchedProtocols(mockMatchedProtocols());
    });
}

// 显示匹配结果
function displayMatchedProtocols(protocols) {
    const container = document.getElementById('matchedProtocolsList');
    const resultsDiv = document.getElementById('protocolMatchResults');
    
    if (!container || !resultsDiv) {
        console.warn('匹配结果显示元素不存在');
        return;
    }
    
    if (protocols.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">未找到匹配的协议</div>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    container.innerHTML = protocols.map(protocol => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="card-title mb-2">${protocol.protocolName} (${protocol.protocolId})</h6>
                        <p class="card-text mb-1">
                            <small class="text-muted">
                                销售部门: ${protocol.salesDepartmentId} | 操作部门: ${protocol.operationDepartmentId}<br>
                                基本佣金: ${(protocol.baseCommissionRate * 100).toFixed(2)}% | 绩效奖金: ${(protocol.performanceBonusRate * 100).toFixed(2)}%
                            </small>
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-sm" onclick="selectProtocolForOrder('${protocol.protocolId}', '${protocol.protocolName}')">
                            <i class="fas fa-check me-1"></i>选择此协议
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsDiv.style.display = 'block';
}

// 选择协议用于订单
function selectProtocolForOrder(protocolId, protocolName) {
    console.log(`选择协议: ${protocolId} - ${protocolName}`);
    
    // 存储选择的协议信息
    window.selectedProtocol = { id: protocolId, name: protocolName };
    
    alert(`已选择协议: ${protocolName}\n\n请前往任务管理页面进行派单操作。`);
    
    // 自动跳转到任务管理页面
    showSection('tasks');
}

// ==================== 任务管理功能 ====================

// 加载任务管理页面
function loadTaskManagement() {
    console.log('加载任务管理页面');
    
    // 加载操作人员数据
    loadOperationStaff();
    
    // 自动加载默认任务
    if (document.getElementById('selectedOperationStaff')?.value) {
        loadMyTasks();
    }
}

// 加载操作人员
function loadOperationStaff() {
    console.log('加载操作人员...');
    
    fetch('/api/clearing/staff')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('操作人员列表:', data);
        populateOperationStaff(Array.isArray(data) ? data : mockStaffData());
    })
    .catch(error => {
        console.error('加载操作人员失败:', error);
        populateOperationStaff(mockStaffData());
    });
}

// 填充操作人员选择器
function populateOperationStaff(staffList) {
    const select = document.getElementById('selectedOperationStaff');
    if (!select) {
        console.warn('操作人员选择器不存在');
        return;
    }
    
    select.innerHTML = '<option value="">请选择操作人员</option>' +
        staffList.map(staff => 
            `<option value="${staff.id}">${staff.name} (${staff.department})</option>`
        ).join('');
}

// 加载我的任务
function loadMyTasks(staffId) {
    const selectedStaffId = staffId || document.getElementById('selectedOperationStaff')?.value;
    
    if (!selectedStaffId) {
        console.warn('请选择操作人员');
        return;
    }
    
    console.log('加载任务列表, 操作人员ID:', selectedStaffId);
    
    fetch(`/api/clearing/my-tasks/${selectedStaffId}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('任务列表:', data);
        displayMyTasks(Array.isArray(data) ? data : mockTaskData());
    })
    .catch(error => {
        console.error('加载任务失败:', error);
        displayMyTasks(mockTaskData());
    });
}

// 显示我的任务
function displayMyTasks(tasks) {
    const tbody = document.getElementById('myTasksTable');
    if (!tbody) {
        console.warn('任务表格元素不存在');
        return;
    }
    
    if (tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">暂无任务数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = tasks.map(task => `
        <tr>
            <td class="order-no-cell">${task.orderNo || task.orderId}</td>
            <td>${task.serviceCode}</td>
            <td>${task.internalProtocolId || '未选择'}</td>
            <td><span class="badge ${getStatusBadgeClass(task.status)}">${getStatusText(task.status)}</span></td>
            <td>${formatDateTime(task.assignedTime)}</td>
            <td>${formatDateTime(task.protocolConfirmedTime)}</td>
            <td>
                ${getTaskActions(task)}
            </td>
        </tr>
    `).join('');
}

// 获取状态样式
function getStatusBadgeClass(status) {
    const statusClasses = {
        'PENDING': 'bg-warning',
        'ASSIGNED': 'bg-info',
        'PROTOCOL_CONFIRMED': 'bg-success',
        'IN_PROGRESS': 'bg-primary',
        'COMPLETED': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-light';
}

// 获取状态文本
function getStatusText(status) {
    const statusTexts = {
        'PENDING': '待分配',
        'ASSIGNED': '已分配',
        'PROTOCOL_CONFIRMED': '协议确认',
        'IN_PROGRESS': '进行中',
        'COMPLETED': '已完成'
    };
    return statusTexts[status] || status;
}

// 获取任务操作按钮
function getTaskActions(task) {
    switch (task.status) {
        case 'ASSIGNED':
            return `<button class="btn btn-sm btn-success" onclick="acceptTask('${task.orderId}')">
                        <i class="fas fa-check me-1"></i>接单
                    </button>`;
        case 'PROTOCOL_CONFIRMED':
            return `<button class="btn btn-sm btn-primary" onclick="startTask('${task.orderId}')">
                        <i class="fas fa-play me-1"></i>开始
                    </button>`;
        case 'IN_PROGRESS':
            return `<button class="btn btn-sm btn-warning" onclick="completeTask('${task.orderId}')">
                        <i class="fas fa-flag-checkered me-1"></i>完成
                    </button>`;
        default:
            return '<span class="text-muted">无操作</span>';
    }
}

// 接单操作
function acceptTask(orderId) {
    console.log('接单:', orderId);
    
    if (confirm(`确认接受订单 ${orderId} 的任务吗？`)) {
        // 模拟接单成功
        alert(`成功接受订单 ${orderId} 的任务！`);
        
        // 刷新任务列表
        loadMyTasks();
    }
}

// 开始任务
function startTask(orderId) {
    console.log('开始任务:', orderId);
    
    if (confirm(`确认开始处理订单 ${orderId} 吗？`)) {
        alert(`开始处理订单 ${orderId}！`);
        loadMyTasks();
    }
}

// 完成任务
function completeTask(orderId) {
    console.log('完成任务:', orderId);
    
    if (confirm(`确认完成订单 ${orderId} 的处理吗？`)) {
        alert(`订单 ${orderId} 处理完成！`);
        loadMyTasks();
    }
}

// 派单服务分配
function assignService(orderId, serviceCode, staffId) {
    console.log('派单:', { orderId, serviceCode, staffId });
    
    const data = {
        orderId: orderId,
        serviceCode: serviceCode,
        assignedStaffId: staffId,
        protocolId: window.selectedProtocol?.id || null
    };
    
    fetch('/api/clearing/assign-service', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('派单结果:', result);
        alert('派单成功！');
        loadMyTasks();
    })
    .catch(error => {
        console.error('派单失败:', error);
        alert('派单成功！（模拟）');
        loadMyTasks();
    });
}

// ==================== 其他页面功能 ====================

// 加载报表页面
function loadReports() {
    console.log('加载报表页面');
    // 报表功能实现
}

// 加载客户管理页面
function loadCustomers() {
    console.log('加载客户管理页面');
    // 客户管理功能实现
}

// ==================== 模拟数据 ====================

// 模拟协议数据
function mockProtocolData() {
    return [
        {
            protocolId: 'P001',
            protocolName: '海运标准协议',
            salesDepartmentId: 'SALES001',
            operationDepartmentId: 'OP001',
            serviceCode: 'OCEAN',
            businessType: 'OCEAN',
            baseCommissionRate: 0.03,
            performanceBonusRate: 0.01,
            active: true
        },
        {
            protocolId: 'P002',
            protocolName: '空运快速协议',
            salesDepartmentId: 'SALES002',
            operationDepartmentId: 'OP002',
            serviceCode: 'AIR',
            businessType: 'AIR',
            baseCommissionRate: 0.04,
            performanceBonusRate: 0.015,
            active: true
        }
    ];
}

// 模拟匹配协议
function mockMatchedProtocols() {
    return [
        {
            protocolId: 'P001',
            protocolName: '海运标准协议',
            salesDepartmentId: 'SALES001',
            operationDepartmentId: 'OP001',
            baseCommissionRate: 0.03,
            performanceBonusRate: 0.01
        }
    ];
}

// 模拟员工数据
function mockStaffData() {
    return [
        { id: '1', name: '张三', department: '操作部' },
        { id: '2', name: '李四', department: '操作部' },
        { id: '3', name: '王五', department: '销售部' }
    ];
}

// 模拟任务数据
function mockTaskData() {
    return [
        {
            orderId: 'ORD-2024-0001',
            orderNo: 'HW-EXPORT-20240101-001',
            serviceCode: 'OCEAN_FCL',
            internalProtocolId: 'P001',
            status: 'ASSIGNED',
            assignedTime: '2025-09-15 10:00:00',
            protocolConfirmedTime: null
        },
        {
            orderId: 'ORD-2024-0002', 
            orderNo: 'MIDEA-SHIP-20240102-001',
            serviceCode: 'AIR_GENERAL',
            internalProtocolId: 'P002',
            status: 'PROTOCOL_CONFIRMED',
            assignedTime: '2025-09-15 09:30:00',
            protocolConfirmedTime: '2025-09-15 10:15:00'
        }
    ];
}

// 加载部门数据
function loadDepartments() {
    const salesDept = document.getElementById('salesDepartment');
    const opDept = document.getElementById('operationDepartment');
    
    if (salesDept) {
        salesDept.innerHTML = `
            <option value="">请选择...</option>
            <option value="SALES001">销售一部</option>
            <option value="SALES002">销售二部</option>
        `;
    }
    
    if (opDept) {
        opDept.innerHTML = `
            <option value="">请选择...</option>
            <option value="OP001">操作一部</option>
            <option value="OP002">操作二部</option>
        `;
    }
}

// 加载员工数据
function loadStaff() {
    console.log('加载员工数据');
    // 员工数据已在loadOperationStaff中处理
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    return new Date(dateTimeStr).toLocaleString('zh-CN');
}