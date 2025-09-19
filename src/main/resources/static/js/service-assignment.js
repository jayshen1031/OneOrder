// OneOrder 接派单管理系统
// 完整的派单功能支持

// 全局变量
let currentOrderId = null;
let currentServices = [];
let assignmentHistory = [];
let availableOperators = [];

// 服务状态持久化存储键名
const SERVICES_STATE_KEY = 'oneorder_services_state';

// 用户映射
const userMap = {
    'OP001': { id: 'OP001', name: '马晓东', department: '空运操作', role: 'OPERATOR' },
    'OP002': { id: 'OP002', name: '林芳', department: '海运操作', role: 'OPERATOR' },
    'OP008': { id: 'OP008', name: '高玲', department: '西区操作', role: 'OPERATOR' }
};

// 本地存储键名
const ASSIGNMENT_HISTORY_KEY = 'oneorder_assignment_history';

/**
 * 初始化接派单模块
 */
function initServiceAssignment() {
    console.log('🚀 初始化接派单模块...');
    
    // 加载保存的数据
    loadAssignmentHistoryFromStorage();
    console.log('📂 已加载派单历史:', assignmentHistory.length, '条记录');
    
    // 加载订单列表
    loadOrderList();
    loadAvailableOperators();
    
    // 显示历史记录
    displayAssignmentHistory();
    
    // 定期刷新（但不重新创建服务数据）
    setInterval(() => {
        loadAvailableOperators();
    }, 30000);
}

/**
 * 加载订单列表
 */
async function loadOrderList() {
    try {
        console.log('加载订单列表...');
        const response = await fetch('/api/freight-orders');
        const orders = await response.json();
        
        const orderSelect = document.getElementById('orderSelect');
        if (!orderSelect) return;
        
        orderSelect.innerHTML = '<option value="">请选择订单</option>';
        
        orders.forEach(order => {
            const option = document.createElement('option');
            option.value = order.orderId;
            option.textContent = `${order.orderNo} - ${order.portOfLoading} → ${order.portOfDischarge}`;
            orderSelect.appendChild(option);
        });
        
        console.log(`订单列表加载完成: ${orders.length} 个订单`);
        
    } catch (error) {
        console.error('加载订单列表失败:', error);
        showNotification('加载订单列表失败: ' + error.message, 'error');
    }
}

/**
 * 加载订单服务项目
 */
async function loadOrderServices() {
    const orderSelect = document.getElementById('orderSelect');
    if (!orderSelect || !orderSelect.value) {
        document.getElementById('servicesContainer').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                <p class="text-muted">请先选择订单以加载服务项目</p>
            </div>
        `;
        return;
    }
    
    currentOrderId = orderSelect.value;
    
    try {
        console.log('加载订单服务项目:', currentOrderId);
        
        // 先尝试从存储中加载该订单的服务状态
        const savedServicesState = loadServicesStateFromStorage();
        let orderServices = savedServicesState[currentOrderId];
        
        if (!orderServices) {
            // 如果没有保存的状态，创建初始服务数据
            orderServices = [
                { serviceCode: 'MBL_PROCESSING', serviceName: '海运MBL处理', status: 'PENDING', priority: 'HIGH' },
                { serviceCode: 'HBL_PROCESSING', serviceName: '海运HBL处理', status: 'PENDING', priority: 'HIGH' },
                { serviceCode: 'BOOKING', serviceName: '订舱服务', status: 'PENDING', priority: 'HIGH' },
                { serviceCode: 'CUSTOMS_CLEARANCE', serviceName: '报关服务', status: 'PENDING', priority: 'MEDIUM' },
                { serviceCode: 'TRANSPORTATION', serviceName: '运输服务', status: 'PENDING', priority: 'LOW' },
                { serviceCode: 'CARGO_LOADING', serviceName: '装货服务', status: 'PENDING', priority: 'MEDIUM' },
                { serviceCode: 'CONTAINER_LOADING', serviceName: '集装箱装货', status: 'PENDING', priority: 'MEDIUM' },
                { serviceCode: 'AWB_PROCESSING', serviceName: '空运单处理', status: 'PENDING', priority: 'HIGH' }
            ];
            
            console.log('🆕 创建新的服务状态');
        } else {
            console.log('📂 加载已保存的服务状态:', orderServices.length, '个服务');
        }
        
        currentServices = orderServices;
        displayServices(orderServices);
        
    } catch (error) {
        console.error('加载服务项目失败:', error);
        showNotification('加载服务项目失败: ' + error.message, 'error');
    }
}

/**
 * 从存储加载服务状态
 */
function loadServicesStateFromStorage() {
    const saved = localStorage.getItem(SERVICES_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
}

/**
 * 保存服务状态到存储
 */
function saveServicesStateToStorage() {
    if (!currentOrderId || !currentServices) return;
    
    const allServicesState = loadServicesStateFromStorage();
    allServicesState[currentOrderId] = [...currentServices]; // 深拷贝
    
    localStorage.setItem(SERVICES_STATE_KEY, JSON.stringify(allServicesState));
    console.log('💾 服务状态已保存到本地存储');
}

/**
 * 显示服务项目
 */
function displayServices(services) {
    const container = document.getElementById('servicesContainer');
    if (!container) return;
    
    if (services.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <p class="text-muted">当前订单无待派单服务</p>
            </div>
        `;
        return;
    }
    
    const servicesHtml = services.map(service => {
        // 获取派单信息（如果已派单）
        let assignmentInfo = '';
        if (service.status === 'ASSIGNED' && service.assignedTo) {
            const operator = availableOperators.find(op => op.operatorId === service.assignedTo);
            const operatorName = operator ? operator.operatorName : service.assignedTo;
            const assignTime = service.assignedTime ? new Date(service.assignedTime).toLocaleString() : '未知';
            assignmentInfo = `
                <div class="mt-3 p-2 bg-light rounded">
                    <small class="text-muted">
                        <i class="fas fa-user"></i> 已派给: <strong class="text-primary">${operatorName}</strong> 
                        <span class="ms-2"><i class="fas fa-clock"></i> ${assignTime}</span>
                    </small>
                </div>
            `;
        }
        
        return `
            <div class="service-card border rounded p-3 mb-3" data-service="${service.serviceCode}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${service.serviceName}</h6>
                        <small class="text-muted">服务代码: ${service.serviceCode}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${getPriorityClass(service.priority)} mb-2">${getPriorityText(service.priority)}</span><br>
                        <span class="badge ${getStatusClass(service.status)}">${getStatusText(service.status)}</span>
                    </div>
                </div>
                
                ${service.status === 'PENDING' ? `
                    <div class="mt-3">
                        <div class="row">
                            <div class="col-md-6">
                                <button class="btn btn-primary btn-sm w-100" onclick="openAssignModal('${service.serviceCode}', '${service.serviceName}')">
                                    <i class="fas fa-handshake"></i> 协议派单
                                </button>
                            </div>
                            <div class="col-md-6">
                                <button class="btn btn-outline-info btn-sm w-100" onclick="viewServiceDetail('${service.serviceCode}')">
                                    <i class="fas fa-eye"></i> 详情
                                </button>
                            </div>
                        </div>
                    </div>
                ` : service.status === 'ASSIGNED' ? `
                    <div class="mt-3">
                        <div class="row">
                            <div class="col-md-6">
                                <button class="btn btn-outline-success btn-sm w-100" onclick="viewServiceDetail('${service.serviceCode}')">
                                    <i class="fas fa-eye"></i> 查看详情
                                </button>
                            </div>
                            <div class="col-md-6">
                                <button class="btn btn-outline-warning btn-sm w-100" onclick="reassignService('${service.serviceCode}')">
                                    <i class="fas fa-redo"></i> 重新派单
                                </button>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="mt-3">
                        <button class="btn btn-outline-info btn-sm w-100" onclick="viewServiceDetail('${service.serviceCode}')">
                            <i class="fas fa-check-circle"></i> 查看详情
                        </button>
                    </div>
                `}
                ${assignmentInfo}
            </div>
        `;
    }).join('');
    
    container.innerHTML = servicesHtml;
}

/**
 * 更新操作人员选择器
 */
function updateOperatorSelectors() {
    const selectors = document.querySelectorAll('[id^="operator_"]');
    selectors.forEach(selector => {
        const serviceCode = selector.id.replace('operator_', '');
        selector.innerHTML = '<option value="">选择操作人员...</option>' +
            availableOperators.map(op => 
                `<option value="${op.operatorId}">${op.operatorName} (${op.department})</option>`
            ).join('');
    });
}

/**
 * 加载可用操作人员
 */
function loadAvailableOperators() {
    // 使用真实的操作人员数据
    availableOperators = Object.values(userMap).map(user => ({
        operatorId: user.id,
        operatorName: user.name,
        department: user.department,
        currentOrderCount: Math.floor(Math.random() * 5),
        workloadPercentage: Math.floor(Math.random() * 80) + 10,
        specialties: getOperatorSpecialties(user.id)
    }));
    
    displayOperators(availableOperators);
    updateOperatorSelectors();
}

/**
 * 获取操作人员专长
 */
function getOperatorSpecialties(operatorId) {
    const specialtiesMap = {
        'OP001': ['BOOKING', 'CARGO_LOADING', 'CUSTOMS_CLEARANCE'], // 马晓东-空运
        'OP002': ['MBL_PROCESSING', 'HBL_PROCESSING', 'BOOKING'], // 林芳-海运
        'OP008': ['TRANSPORTATION', 'CARGO_LOADING', 'CUSTOMS_CLEARANCE'] // 高玲-西区
    };
    return specialtiesMap[operatorId] || [];
}

/**
 * 显示操作人员
 */
function displayOperators(operators) {
    const container = document.getElementById('operatorsContainer');
    if (!container) return;
    
    const operatorsHtml = operators.map(op => `
        <div class="mb-3 p-2 border rounded">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${op.operatorName}</strong>
                    <br><small class="text-muted">${op.department}</small>
                </div>
                <span class="badge bg-info">${op.currentOrderCount}单</span>
            </div>
            <div class="mt-2">
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar" style="width: ${op.workloadPercentage}%"></div>
                </div>
                <small class="text-muted">工作负载: ${op.workloadPercentage}%</small>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = operatorsHtml;
}

/**
 * 派单给指定操作人员
 */
async function assignService(serviceCode) {
    const operatorSelect = document.getElementById(`operator_${serviceCode}`);
    if (!operatorSelect.value) {
        showNotification('请选择操作人员', 'warning');
        return;
    }
    
    const operatorId = operatorSelect.value;
    const operator = availableOperators.find(op => op.operatorId === operatorId);
    const service = currentServices.find(s => s.serviceCode === serviceCode);
    
    if (!operator || !service) {
        showNotification('操作人员或服务不存在', 'error');
        return;
    }
    
    try {
        // 模拟派单API调用
        console.log(`派单: ${service.serviceName} → ${operator.operatorName}`);
        
        // 更新服务状态
        service.status = 'ASSIGNED';
        service.assignedTo = operatorId;
        service.assignedTime = new Date().toISOString();
        
        // 更新操作人员工作负载
        operator.currentOrderCount++;
        operator.workloadPercentage = Math.min(90, operator.workloadPercentage + 10);
        
        // 记录派单历史
        const historyRecord = {
            assignmentTime: new Date().toISOString(),
            orderId: currentOrderId,
            assignmentType: 'MANUAL',
            successCount: 1,
            failedCount: 0,
            results: [{
                serviceCode: serviceCode,
                serviceName: service.serviceName,
                operatorId: operatorId,
                operatorName: operator.operatorName,
                status: 'SUCCESS'
            }],
            operator: '手动派单'
        };
        
        assignmentHistory.unshift(historyRecord);
        saveAssignmentHistoryToStorage();
        
        // 刷新显示
        displayServices(currentServices);
        displayOperators(availableOperators);
        displayAssignmentHistory();
        
        showNotification(`成功派单: ${service.serviceName} → ${operator.operatorName}`, 'success');
        
    } catch (error) {
        console.error('派单失败:', error);
        showNotification('派单失败: ' + error.message, 'error');
    }
}

/**
 * 智能自动派单
 */
async function autoAssignAll() {
    if (!currentOrderId) {
        showNotification('请先选择订单', 'warning');
        return;
    }
    
    const pendingServices = currentServices.filter(s => s.status === 'PENDING');
    if (pendingServices.length === 0) {
        showNotification('当前无待派单服务', 'info');
        return;
    }
    
    try {
        console.log('🎯 智能派单开始，可用操作人员:', availableOperators.map(op => `${op.operatorId}:${op.operatorName}`));
        
        const autoAssignments = [];
        const assignmentResults = [];
        let successCount = 0;
        let failedCount = 0;
        
        for (const service of pendingServices) {
            console.log(`🔍 为服务 ${service.serviceCode} 查找合适操作人员...`);
            
            // 智能匹配逻辑：优先选择专长匹配且工作负载较低的操作人员
            const suitableOperators = availableOperators
                .filter(op => op.specialties.includes(service.serviceCode))
                .sort((a, b) => a.workloadPercentage - b.workloadPercentage);
            
            let selectedOperator = suitableOperators[0];
            
            // 如果没有专长匹配的，选择工作负载最低的
            if (!selectedOperator) {
                selectedOperator = [...availableOperators].sort((a, b) => a.workloadPercentage - b.workloadPercentage)[0];
            }
            
            if (selectedOperator) {
                console.log(`✅ 匹配成功: ${service.serviceCode} → ${selectedOperator.operatorName}`);
                
                autoAssignments.push({
                    serviceCode: service.serviceCode,
                    operatorId: selectedOperator.operatorId,
                    reason: suitableOperators.length > 0 ? '专长匹配' : '负载均衡'
                });
                
                // 更新服务状态
                service.status = 'ASSIGNED';
                service.assignedTo = selectedOperator.operatorId;
                service.assignedTime = new Date().toISOString();
                
                // 更新操作人员负载
                selectedOperator.currentOrderCount++;
                selectedOperator.workloadPercentage = Math.min(90, selectedOperator.workloadPercentage + 10);
                
                assignmentResults.push({
                    serviceCode: service.serviceCode,
                    serviceName: service.serviceName,
                    operatorId: selectedOperator.operatorId,
                    operatorName: selectedOperator.operatorName,
                    status: 'SUCCESS',
                    reason: autoAssignments[autoAssignments.length - 1].reason
                });
                
                successCount++;
            } else {
                console.log(`❌ 匹配失败: ${service.serviceCode} - 无可用操作人员`);
                assignmentResults.push({
                    serviceCode: service.serviceCode,
                    serviceName: service.serviceName,
                    status: 'FAILED',
                    reason: '无可用操作人员'
                });
                failedCount++;
            }
        }
        
        // 记录派单历史
        const historyRecord = {
            assignmentTime: new Date().toISOString(),
            orderId: currentOrderId,
            assignmentType: 'AUTO',
            successCount: successCount,
            failedCount: failedCount,
            results: assignmentResults,
            operator: '智能派单'
        };
        
        assignmentHistory.unshift(historyRecord);
        saveAssignmentHistoryToStorage();
        
        // 刷新显示
        displayServices(currentServices);
        displayOperators(availableOperators);
        displayAssignmentHistory();
        
        showNotification(`智能派单完成: 成功${successCount}个, 失败${failedCount}个`, 'success');
        
    } catch (error) {
        console.error('智能派单失败:', error);
        showNotification('智能派单失败: ' + error.message, 'error');
    }
}

/**
 * 批量派单
 */
function batchAssign() {
    const pendingServices = currentServices.filter(s => s.status === 'PENDING');
    
    if (pendingServices.length === 0) {
        showNotification('当前无待派单服务', 'info');
        return;
    }
    
    // 构建批量派单界面
    const batchContent = pendingServices.map(service => `
        <div class="row mb-3 align-items-center">
            <div class="col-md-4">
                <strong>${service.serviceName}</strong><br>
                <small class="text-muted">${service.serviceCode}</small>
            </div>
            <div class="col-md-6">
                <select class="form-select batch-operator-select" data-service="${service.serviceCode}">
                    <option value="">选择操作人员...</option>
                    ${availableOperators.map(op => 
                        `<option value="${op.operatorId}">${op.operatorName} (${op.department})</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-md-2">
                <span class="badge ${getPriorityClass(service.priority)}">${getPriorityText(service.priority)}</span>
            </div>
        </div>
    `).join('');
    
    document.getElementById('batchAssignContainer').innerHTML = batchContent;
    new bootstrap.Modal(document.getElementById('batchAssignModal')).show();
}

/**
 * 确认批量派单
 */
async function confirmBatchAssign() {
    const selects = document.querySelectorAll('.batch-operator-select');
    const assignments = [];
    
    selects.forEach(select => {
        if (select.value) {
            assignments.push({
                serviceCode: select.dataset.service,
                operatorId: select.value,
                notes: `批量派单 - ${new Date().toLocaleString()}`
            });
        }
    });
    
    if (assignments.length === 0) {
        showNotification('请至少选择一个操作人员', 'warning');
        return;
    }
    
    try {
        const assignmentResults = [];
        let successCount = 0;
        let failedCount = 0;
        
        for (const assignment of assignments) {
            const service = currentServices.find(s => s.serviceCode === assignment.serviceCode);
            const operator = availableOperators.find(op => op.operatorId === assignment.operatorId);
            
            if (service && operator) {
                // 更新服务状态
                service.status = 'ASSIGNED';
                service.assignedTo = operator.operatorId;
                service.assignedTime = new Date().toISOString();
                
                // 更新操作人员负载
                operator.currentOrderCount++;
                operator.workloadPercentage = Math.min(90, operator.workloadPercentage + 10);
                
                assignmentResults.push({
                    serviceCode: assignment.serviceCode,
                    serviceName: service.serviceName,
                    operatorId: assignment.operatorId,
                    operatorName: operator.operatorName,
                    status: 'SUCCESS'
                });
                
                successCount++;
            } else {
                assignmentResults.push({
                    serviceCode: assignment.serviceCode,
                    status: 'FAILED',
                    reason: '服务或操作人员不存在'
                });
                failedCount++;
            }
        }
        
        // 记录派单历史
        const historyRecord = {
            assignmentTime: new Date().toISOString(),
            orderId: currentOrderId,
            assignmentType: 'BATCH',
            successCount: successCount,
            failedCount: failedCount,
            results: assignmentResults,
            operator: '手动批量派单'
        };
        
        assignmentHistory.unshift(historyRecord);
        saveAssignmentHistoryToStorage();
        
        // 关闭模态框
        bootstrap.Modal.getInstance(document.getElementById('batchAssignModal')).hide();
        
        // 刷新显示
        displayServices(currentServices);
        displayOperators(availableOperators);
        displayAssignmentHistory();
        
        showNotification(`批量派单完成: 成功${successCount}个, 失败${failedCount}个`, 'info');
        
    } catch (error) {
        console.error('批量派单失败:', error);
        showNotification('批量派单失败: ' + error.message, 'error');
    }
}

/**
 * 显示派单历史
 */
function displayAssignmentHistory() {
    const container = document.getElementById('assignmentHistoryTableBody');
    if (!container) return;
    
    if (assignmentHistory.length === 0) {
        container.innerHTML = `
            <tr>
                <td class="text-center py-4">
                    <i class="fas fa-history fa-2x text-muted mb-2 d-block"></i>
                    <p class="text-muted">暂无派单历史记录</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const historyHtml = assignmentHistory.slice(0, 10).map(record => {
        const orderInfo = `订单${record.orderId}`;
        return record.results.map((result, index) => `
            <tr>
                <td>
                    <small class="text-muted">${formatDateTime(record.assignmentTime)}</small>
                    ${index === 0 ? `<br><span class="badge bg-info">${record.operator}</span>` : ''}
                </td>
                <td>
                    <strong>${result.serviceName || result.serviceCode}</strong><br>
                    <small class="text-muted">${result.operatorName}</small>
                </td>
            </tr>
        `).join('');
    }).join('');
    
    container.innerHTML = historyHtml;
}

/**
 * 持久化存储派单历史
 */
function saveAssignmentHistoryToStorage() {
    const recentHistory = assignmentHistory.slice(0, 100); // 限制100条
    localStorage.setItem(ASSIGNMENT_HISTORY_KEY, JSON.stringify(recentHistory));
}

/**
 * 从存储加载派单历史
 */
function loadAssignmentHistoryFromStorage() {
    const saved = localStorage.getItem(ASSIGNMENT_HISTORY_KEY);
    if (saved) {
        assignmentHistory = JSON.parse(saved);
        displayAssignmentHistory();
    }
}

// 辅助函数
function getPriorityClass(priority) {
    const classes = { HIGH: 'bg-danger', MEDIUM: 'bg-warning text-dark', LOW: 'bg-info' };
    return classes[priority] || 'bg-secondary';
}

function getPriorityText(priority) {
    const texts = { HIGH: '高', MEDIUM: '中', LOW: '低' };
    return texts[priority] || '未知';
}

function getStatusClass(status) {
    const classes = { PENDING: 'bg-warning text-dark', ASSIGNED: 'bg-success', COMPLETED: 'bg-primary' };
    return classes[status] || 'bg-secondary';
}

function getStatusText(status) {
    const texts = { PENDING: '待派单', ASSIGNED: '已派单', COMPLETED: '已完成' };
    return texts[status] || '未知';
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('zh-CN', {
        month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit'
    });
}

// 协议派单相关变量
let currentAssignStep = 1;
let selectedProtocols = [];
let selectedProtocol = null;

/**
 * 打开协议派单模态框
 */
function openAssignModal(serviceCode, serviceName) {
    console.log('🔧 打开协议派单模态框:', serviceCode, serviceName);
    
    // 重置模态框状态
    currentAssignStep = 1;
    selectedProtocols = [];
    selectedProtocol = null;
    
    // 设置服务信息
    document.getElementById('serviceCodeInput').value = serviceCode;
    document.getElementById('serviceNameInput').value = serviceName;
    document.getElementById('assignServiceName').textContent = serviceName;
    
    // 重置步骤显示
    document.getElementById('assignStep1').style.display = 'block';
    document.getElementById('assignStep2').style.display = 'none';
    document.getElementById('assignStep3').style.display = 'none';
    
    // 重置按钮
    document.getElementById('prevStepBtn').style.display = 'none';
    document.getElementById('nextStepBtn').style.display = 'block';
    document.getElementById('confirmAssignBtn').style.display = 'none';
    
    // 重置步骤指示器
    updateStepIndicators();
    
    // 清空表单
    document.getElementById('operatorSelect').innerHTML = '<option value="">请选择要指派的操作人员</option>';
    document.getElementById('protocolSelect').innerHTML = '<option value="">请选择协议</option>';
    document.getElementById('assignmentNotes').value = '';
    document.getElementById('expectedCompleteTime').value = '';
    
    // 填充操作人员选项
    fillOperatorSelect();
    
    // 显示模态框
    new bootstrap.Modal(document.getElementById('assignServiceModal')).show();
}

/**
 * 填充操作人员选择框
 */
function fillOperatorSelect() {
    const operatorSelect = document.getElementById('operatorSelect');
    operatorSelect.innerHTML = '<option value="">请选择要指派的操作人员</option>';
    
    availableOperators.forEach(operator => {
        const option = document.createElement('option');
        option.value = operator.operatorId;
        option.textContent = `${operator.operatorName} (${operator.department})`;
        option.dataset.operatorName = operator.operatorName;
        option.dataset.operatorDept = operator.department;
        operatorSelect.appendChild(option);
    });
}

/**
 * 更新步骤指示器
 */
function updateStepIndicators() {
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step${i}Indicator`).querySelector('.rounded-circle');
        if (i <= currentAssignStep) {
            indicator.className = 'rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center';
        } else {
            indicator.className = 'rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center';
        }
    }
}

/**
 * 下一步
 */
function nextAssignStep() {
    if (currentAssignStep === 1) {
        // 验证第一步
        const operatorSelect = document.getElementById('operatorSelect');
        if (!operatorSelect.value) {
            showNotification('请选择操作人员', 'warning');
            return;
        }
        
        // 进入第二步：加载协议匹配
        currentAssignStep = 2;
        document.getElementById('assignStep1').style.display = 'none';
        document.getElementById('assignStep2').style.display = 'block';
        
        document.getElementById('prevStepBtn').style.display = 'block';
        
        // 触发协议匹配
        loadMatchingProtocols();
        
    } else if (currentAssignStep === 2) {
        // 验证第二步
        const protocolSelect = document.getElementById('protocolSelect');
        if (!protocolSelect.value) {
            showNotification('请选择内部协议', 'warning');
            return;
        }
        
        // 进入第三步：确认信息
        currentAssignStep = 3;
        document.getElementById('assignStep2').style.display = 'none';
        document.getElementById('assignStep3').style.display = 'block';
        
        document.getElementById('nextStepBtn').style.display = 'none';
        document.getElementById('confirmAssignBtn').style.display = 'block';
        
        // 填充确认信息
        fillConfirmationInfo();
    }
    
    updateStepIndicators();
}

/**
 * 上一步
 */
function previousAssignStep() {
    if (currentAssignStep === 2) {
        currentAssignStep = 1;
        document.getElementById('assignStep2').style.display = 'none';
        document.getElementById('assignStep1').style.display = 'block';
        
        document.getElementById('prevStepBtn').style.display = 'none';
        
    } else if (currentAssignStep === 3) {
        currentAssignStep = 2;
        document.getElementById('assignStep3').style.display = 'none';
        document.getElementById('assignStep2').style.display = 'block';
        
        document.getElementById('nextStepBtn').style.display = 'block';
        document.getElementById('confirmAssignBtn').style.display = 'none';
    }
    
    updateStepIndicators();
}

/**
 * 加载匹配的协议
 */
async function loadMatchingProtocols() {
    const operatorSelect = document.getElementById('operatorSelect');
    const selectedOperatorId = operatorSelect.value;
    const selectedOperatorName = operatorSelect.options[operatorSelect.selectedIndex].dataset.operatorName;
    const serviceCode = document.getElementById('serviceCodeInput').value;
    
    if (!selectedOperatorId) return;
    
    // 更新操作员名称显示
    document.getElementById('selectedOperatorName').textContent = selectedOperatorName;
    
    // 显示加载状态
    document.getElementById('protocolMatchResults').innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border text-primary" role="status"></div>
            <div class="mt-2">正在匹配协议...</div>
        </div>
    `;
    
    try {
        console.log('🔍 开始协议匹配:', { selectedOperatorId, serviceCode });
        
        // 使用模拟协议数据（实际项目中应调用API）
        selectedProtocols = generateMockProtocols(selectedOperatorId, serviceCode);
        displayProtocolMatchResults(selectedProtocols);
        fillProtocolSelect(selectedProtocols);
        
    } catch (error) {
        console.error('协议匹配失败:', error);
        showNotification('协议匹配失败: ' + error.message, 'error');
    }
}

/**
 * 生成模拟协议数据
 */
function generateMockProtocols(operatorId, serviceCode) {
    const operator = availableOperators.find(op => op.operatorId === operatorId);
    if (!operator) return [];
    
    console.log('🔍 协议匹配参数:', {
        operatorId,
        operatorName: operator.operatorName,
        department: operator.department,
        serviceCode
    });
    
    const protocols = [
        // 海运相关协议
        {
            protocolId: 'PROTO001',
            protocolName: '海运MBL处理标准协议',
            serviceCode: 'MBL_PROCESSING',
            businessType: 'OCEAN',
            baseCommissionRate: 15,
            bonusCommissionRate: 5,
            totalCommissionRate: 20,
            applicableDepartments: ['海运操作'],
            slaHours: 48,
            recommended: true,
            description: '专门针对海运MBL处理的标准协议，包含完整的业务流程和分润规则，适用于提单管理和货物跟踪'
        },
        {
            protocolId: 'PROTO002',
            protocolName: '海运HBL处理专项协议',
            serviceCode: 'HBL_PROCESSING',
            businessType: 'OCEAN',
            baseCommissionRate: 12,
            bonusCommissionRate: 4,
            totalCommissionRate: 16,
            applicableDepartments: ['海运操作'],
            slaHours: 24,
            recommended: true,
            description: '针对海运分单处理的专项协议，涵盖货物分拣、标签管理和交付确认'
        },
        {
            protocolId: 'PROTO003',
            protocolName: '海运订舱服务协议',
            serviceCode: 'BOOKING',
            businessType: 'OCEAN',
            baseCommissionRate: 10,
            bonusCommissionRate: 3,
            totalCommissionRate: 13,
            applicableDepartments: ['海运操作'],
            slaHours: 12,
            recommended: true,
            description: '海运订舱服务的标准协议，包括舱位预订、船期确认和舱单管理'
        },
        {
            protocolId: 'PROTO004',
            protocolName: '集装箱装货作业协议',
            serviceCode: 'CONTAINER_LOADING',
            businessType: 'OCEAN',
            baseCommissionRate: 8,
            bonusCommissionRate: 2,
            totalCommissionRate: 10,
            applicableDepartments: ['海运操作'],
            slaHours: 6,
            recommended: true,
            description: '集装箱装货作业的专项协议，涵盖货物装箱、封条管理和装箱清单确认'
        },
        // 空运相关协议
        {
            protocolId: 'PROTO005',
            protocolName: '空运操作专用协议',
            serviceCode: 'AWB_PROCESSING',
            businessType: 'AIR',
            baseCommissionRate: 18,
            bonusCommissionRate: 7,
            totalCommissionRate: 25,
            applicableDepartments: ['空运操作'],
            slaHours: 24,
            recommended: operator.department === '空运操作',
            description: '针对空运业务优化的专用协议，时效要求高，佣金率优厚'
        },
        // 通用服务协议
        {
            protocolId: 'PROTO006',
            protocolName: '报关服务标准协议',
            serviceCode: 'CUSTOMS_CLEARANCE',
            businessType: 'ALL',
            baseCommissionRate: 14,
            bonusCommissionRate: 4,
            totalCommissionRate: 18,
            applicableDepartments: ['海运操作', '空运操作', '西区操作'],
            slaHours: 48,
            recommended: true,
            description: '标准报关服务协议，适用于进出口报关业务，包含文件准备和清关跟踪'
        },
        {
            protocolId: 'PROTO007',
            protocolName: '运输服务通用协议',
            serviceCode: 'TRANSPORTATION',
            businessType: 'ALL',
            baseCommissionRate: 10,
            bonusCommissionRate: 3,
            totalCommissionRate: 13,
            applicableDepartments: ['海运操作', '空运操作', '西区操作'],
            slaHours: 24,
            recommended: true,
            description: '通用运输服务协议，适用于各种运输方式的货物配送和跟踪'
        },
        {
            protocolId: 'PROTO008',
            protocolName: '装货作业通用协议',
            serviceCode: 'CARGO_LOADING',
            businessType: 'ALL',
            baseCommissionRate: 8,
            bonusCommissionRate: 2,
            totalCommissionRate: 10,
            applicableDepartments: ['海运操作', '空运操作', '西区操作'],
            slaHours: 8,
            recommended: false,
            description: '通用装货作业协议，适用于各种货物的装卸和搬运作业'
        },
        {
            protocolId: 'PROTO009',
            protocolName: '通用货代服务协议',
            serviceCode: 'ALL',
            businessType: 'ALL',
            baseCommissionRate: 12,
            bonusCommissionRate: 3,
            totalCommissionRate: 15,
            applicableDepartments: ['海运操作', '空运操作', '西区操作'],
            slaHours: 72,
            recommended: false,
            description: '适用于所有货代服务的通用协议，灵活性高但佣金率较低，作为备选方案'
        }
    ];
    
    // 根据操作员部门和服务代码筛选协议
    const matchedProtocols = protocols.filter(protocol => {
        const deptMatch = protocol.applicableDepartments.includes(operator.department);
        const serviceMatch = protocol.serviceCode === serviceCode || protocol.serviceCode === 'ALL';
        return deptMatch && serviceMatch;
    }).sort((a, b) => {
        // 推荐协议排在前面，然后按佣金率排序
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return b.totalCommissionRate - a.totalCommissionRate;
    });
    
    console.log('🎯 匹配到的协议:', matchedProtocols.map(p => `${p.protocolName}(${p.totalCommissionRate}%)`));
    
    return matchedProtocols;
}

/**
 * 显示协议匹配结果
 */
function displayProtocolMatchResults(protocols) {
    if (protocols.length === 0) {
        document.getElementById('protocolMatchResults').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                未找到适用的协议，请联系管理员配置相关协议
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>
            <strong>匹配成功！</strong> 找到 ${protocols.length} 个适用协议
            <div class="mt-2">
                <small class="text-muted">
                    • 优先推荐：${protocols.filter(p => p.recommended).length} 个精确匹配协议<br>
                    • 备选方案：${protocols.filter(p => !p.recommended).length} 个通用协议
                </small>
            </div>
        </div>
    `;
    
    document.getElementById('protocolMatchResults').innerHTML = html;
}

/**
 * 填充协议选择下拉框
 */
function fillProtocolSelect(protocols) {
    const protocolSelect = document.getElementById('protocolSelect');
    protocolSelect.innerHTML = '<option value="">请选择协议</option>';
    
    protocols.forEach(protocol => {
        const option = document.createElement('option');
        option.value = protocol.protocolId;
        option.textContent = `${protocol.protocolName} - 佣金${protocol.totalCommissionRate}% ${protocol.recommended ? '(推荐)' : ''}`;
        option.dataset.protocolData = JSON.stringify(protocol);
        protocolSelect.appendChild(option);
    });
}

/**
 * 显示协议详情
 */
function showProtocolDetails() {
    const protocolSelect = document.getElementById('protocolSelect');
    const selectedProtocolId = protocolSelect.value;
    
    if (!selectedProtocolId) {
        document.getElementById('protocolDetails').style.display = 'none';
        return;
    }
    
    const protocolData = JSON.parse(protocolSelect.options[protocolSelect.selectedIndex].dataset.protocolData);
    selectedProtocol = protocolData;
    
    const html = `
        <div class="card">
            <div class="card-header">
                <h6 class="mb-0">协议详情</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-sm">
                            <tr><td><strong>协议名称:</strong></td><td>${protocolData.protocolName}</td></tr>
                            <tr><td><strong>适用服务:</strong></td><td>${protocolData.serviceCode || '通用'}</td></tr>
                            <tr><td><strong>业务类型:</strong></td><td>${protocolData.businessType || '通用'}</td></tr>
                            <tr><td><strong>基础佣金率:</strong></td><td class="text-success">${protocolData.baseCommissionRate}%</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-sm">
                            <tr><td><strong>绩效奖金率:</strong></td><td class="text-success">${protocolData.bonusCommissionRate}%</td></tr>
                            <tr><td><strong>总佣金率:</strong></td><td class="text-primary fw-bold">${protocolData.totalCommissionRate}%</td></tr>
                            <tr><td><strong>SLA时效:</strong></td><td>${protocolData.slaHours}小时</td></tr>
                            <tr><td><strong>推荐等级:</strong></td><td>${protocolData.recommended ? '<span class="badge bg-success">推荐</span>' : '<span class="badge bg-secondary">备选</span>'}</td></tr>
                        </table>
                    </div>
                </div>
                <div class="mt-3">
                    <strong>协议说明:</strong>
                    <p class="text-muted small">${protocolData.description}</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('protocolDetails').innerHTML = html;
    document.getElementById('protocolDetails').style.display = 'block';
}

/**
 * 填充确认信息
 */
function fillConfirmationInfo() {
    const operatorSelect = document.getElementById('operatorSelect');
    const selectedOperator = operatorSelect.options[operatorSelect.selectedIndex];
    
    // 派单信息
    document.getElementById('confirmServiceName').textContent = document.getElementById('serviceNameInput').value;
    document.getElementById('confirmOperatorName').textContent = selectedOperator.dataset.operatorName;
    document.getElementById('confirmExpectedTime').textContent = document.getElementById('expectedCompleteTime').value || '未设置';
    document.getElementById('confirmAssignmentNotes').textContent = document.getElementById('assignmentNotes').value || '无';
    
    // 协议信息
    if (selectedProtocol) {
        document.getElementById('confirmProtocolName').textContent = selectedProtocol.protocolName;
        document.getElementById('confirmBaseCommission').textContent = selectedProtocol.baseCommissionRate + '%';
        document.getElementById('confirmBonusCommission').textContent = selectedProtocol.bonusCommissionRate + '%';
        document.getElementById('confirmProtocolScope').textContent = selectedProtocol.businessType;
    }
}

/**
 * 确认派单
 */
async function confirmAssignment() {
    const serviceCode = document.getElementById('serviceCodeInput').value;
    const operatorSelect = document.getElementById('operatorSelect');
    const operatorId = operatorSelect.value;
    const operatorName = operatorSelect.options[operatorSelect.selectedIndex].dataset.operatorName;
    
    // 禁用按钮，显示处理状态
    document.getElementById('confirmAssignBtn').innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>派单中...';
    document.getElementById('confirmAssignBtn').disabled = true;
    
    try {
        console.log('🎯 开始协议派单:', { serviceCode, operatorId, protocol: selectedProtocol.protocolId });
        
        // 更新服务状态
        const service = currentServices.find(s => s.serviceCode === serviceCode);
        if (service) {
            service.status = 'ASSIGNED';
            service.assignedTo = operatorId;
            service.assignedTime = new Date().toISOString();
            service.assignedProtocol = selectedProtocol;
            
            console.log('🎯 服务状态已更新:', {
                serviceCode: service.serviceCode,
                status: service.status,
                assignedTo: service.assignedTo,
                protocol: selectedProtocol.protocolName
            });
        }
        
        // 立即保存服务状态
        saveServicesStateToStorage();
        
        // 更新操作人员工作负载
        const operator = availableOperators.find(op => op.operatorId === operatorId);
        if (operator) {
            operator.currentOrderCount++;
            operator.workloadPercentage = Math.min(90, operator.workloadPercentage + 10);
        }
        
        // 记录派单历史
        const historyRecord = {
            assignmentTime: new Date().toISOString(),
            orderId: currentOrderId,
            assignmentType: 'PROTOCOL',
            successCount: 1,
            failedCount: 0,
            results: [{
                serviceCode: serviceCode,
                serviceName: service ? service.serviceName : serviceCode,
                operatorId: operatorId,
                operatorName: operatorName,
                status: 'SUCCESS',
                protocolId: selectedProtocol.protocolId,
                protocolName: selectedProtocol.protocolName
            }],
            operator: '协议派单'
        };
        
        assignmentHistory.unshift(historyRecord);
        saveAssignmentHistoryToStorage();
        
        // 关闭模态框
        bootstrap.Modal.getInstance(document.getElementById('assignServiceModal')).hide();
        
        // 刷新显示
        displayServices(currentServices);
        displayOperators(availableOperators);
        displayAssignmentHistory();
        
        showNotification(`协议派单成功！${service.serviceName} → ${operatorName}（应用协议：${selectedProtocol.protocolName}）`, 'success');
        
    } catch (error) {
        console.error('协议派单失败:', error);
        showNotification('协议派单失败: ' + error.message, 'error');
    } finally {
        // 恢复按钮状态
        document.getElementById('confirmAssignBtn').innerHTML = '<i class="fas fa-check me-2"></i>确认派单';
        document.getElementById('confirmAssignBtn').disabled = false;
    }
}

/**
 * 查看服务详情
 */
function viewServiceDetail(serviceCode) {
    const service = currentServices.find(s => s.serviceCode === serviceCode);
    if (!service) {
        showNotification('未找到服务信息', 'error');
        return;
    }
    
    // 查找该服务的派单历史
    const serviceAssignments = assignmentHistory.filter(record => 
        record.results.some(result => result.serviceCode === serviceCode)
    );
    
    let assignmentHistoryHtml = '';
    if (serviceAssignments.length > 0) {
        assignmentHistoryHtml = `
            <h6 class="text-primary mt-4">派单历史</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr><th>时间</th><th>操作人员</th><th>协议</th><th>状态</th></tr>
                    </thead>
                    <tbody>
                        ${serviceAssignments.map(record => {
                            const result = record.results.find(r => r.serviceCode === serviceCode);
                            return `
                                <tr>
                                    <td>${formatDateTime(record.assignmentTime)}</td>
                                    <td>${result.operatorName}</td>
                                    <td>${result.protocolName || '无协议'}</td>
                                    <td><span class="badge bg-success">已派单</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // 填充详情内容
    document.getElementById('serviceDetailContent').innerHTML = `
        <div class="mb-4">
            <h6 class="text-primary">基本信息</h6>
            <div class="row">
                <div class="col-md-6">
                    <strong>服务名称:</strong> ${service.serviceName}<br>
                    <strong>服务代码:</strong> <code>${service.serviceCode}</code><br>
                    <strong>当前状态:</strong> <span class="badge ${getStatusClass(service.status)}">${getStatusText(service.status)}</span><br>
                    <strong>优先级:</strong> <span class="badge ${getPriorityClass(service.priority)}">${getPriorityText(service.priority)}</span>
                </div>
                <div class="col-md-6">
                    ${service.assignedTo ? `
                        <strong>指派给:</strong> ${availableOperators.find(op => op.operatorId === service.assignedTo)?.operatorName || service.assignedTo}<br>
                        <strong>派单时间:</strong> ${service.assignedTime ? formatDateTime(service.assignedTime) : '未知'}<br>
                        ${service.assignedProtocol ? `
                            <strong>应用协议:</strong> ${service.assignedProtocol.protocolName}<br>
                            <strong>协议佣金:</strong> ${service.assignedProtocol.totalCommissionRate}%
                        ` : ''}
                    ` : '<em class="text-muted">尚未派单</em>'}
                </div>
            </div>
        </div>
        ${assignmentHistoryHtml}
    `;
    
    // 显示模态框
    new bootstrap.Modal(document.getElementById('serviceDetailModal')).show();
}

/**
 * 重新派单
 */
function reassignService(serviceCode) {
    const service = currentServices.find(s => s.serviceCode === serviceCode);
    if (!service) {
        showNotification('未找到服务信息', 'error');
        return;
    }
    
    console.log('🔄 重新派单:', service.serviceName);
    
    // 重置服务状态为待派单
    service.status = 'PENDING';
    service.assignedTo = null;
    service.assignedTime = null;
    service.assignedProtocol = null;
    
    // 立即保存状态
    saveServicesStateToStorage();
    
    // 刷新显示
    displayServices(currentServices);
    
    showNotification(`${service.serviceName} 已重置为待派单状态`, 'info');
}

// 初始化函数
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保页面元素已加载
    setTimeout(() => {
        if (document.getElementById('orderSelect')) {
            initServiceAssignment();
        }
    }, 1000);
});

console.log('Service Assignment 模块已加载');