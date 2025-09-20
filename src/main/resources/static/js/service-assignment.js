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
    loadAssignmentHistoryFromDatabase();
    console.log('📂 正在加载派单历史...');
    
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
        
        // 保存到数据库
        saveAssignmentHistoryToDatabase(historyRecord);
        
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
                
                // 智能协议匹配
                let selectedProtocol = null;
                let protocolId = null;
                let protocolName = '无协议';
                
                if (window.protocolManager) {
                    const matchingProtocols = window.protocolManager.getMatchingProtocols(
                        selectedOperator.department, 
                        service.serviceCode
                    );
                    
                    if (matchingProtocols && matchingProtocols.length > 0) {
                        // 选择推荐的或者佣金率最高的协议
                        selectedProtocol = matchingProtocols.find(p => p.recommended) || matchingProtocols[0];
                        protocolId = selectedProtocol.protocolId;
                        protocolName = selectedProtocol.protocolName;
                        console.log(`🔗 智能匹配协议: ${protocolName} (${selectedProtocol.totalCommissionRate}%)`);
                    } else {
                        console.log(`⚠️ 未找到适用协议: ${selectedOperator.department} + ${service.serviceCode}`);
                    }
                }
                
                autoAssignments.push({
                    serviceCode: service.serviceCode,
                    operatorId: selectedOperator.operatorId,
                    reason: suitableOperators.length > 0 ? '专长匹配' : '负载均衡',
                    protocolId: protocolId,
                    protocolName: protocolName
                });
                
                // 更新服务状态
                service.status = 'ASSIGNED';
                service.assignedTo = selectedOperator.operatorId;
                service.assignedTime = new Date().toISOString();
                service.assignedProtocol = protocolId;
                
                // 更新操作人员负载
                selectedOperator.currentOrderCount++;
                selectedOperator.workloadPercentage = Math.min(90, selectedOperator.workloadPercentage + 10);
                
                assignmentResults.push({
                    serviceCode: service.serviceCode,
                    serviceName: service.serviceName,
                    operatorId: selectedOperator.operatorId,
                    operatorName: selectedOperator.operatorName,
                    protocolId: protocolId,
                    protocolName: protocolName,
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
        
        // 保存到数据库
        saveAssignmentHistoryToDatabase(historyRecord);
        
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
        
        // 保存到数据库
        saveAssignmentHistoryToDatabase(historyRecord);
        
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
    if (!container) {
        console.log('❌ 未找到历史记录容器 assignmentHistoryTableBody');
        return;
    }
    
    console.log('📚 显示派单历史:', assignmentHistory.length, '条记录');
    
    if (assignmentHistory.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="fas fa-history fa-2x mb-2 d-block"></i>
                    <p>暂无派单历史记录</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // 生成表格行HTML (不包含table结构，因为容器是tbody)
    const historyHtml = assignmentHistory.slice(0, 10).map(record => {
        return record.results.map(result => {
            // 协议信息显示
            const protocolDisplay = result.protocolName && result.protocolName !== 'N/A' && result.protocolName !== '无协议' ? `
                <span class="badge bg-info">${result.protocolName}</span>
                ${result.protocolCommission ? `<br><small class="text-muted">佣金: ${result.protocolCommission}%</small>` : ''}
            ` : '<span class="text-muted">无协议</span>';
            
            return `
                <tr>
                    <td>
                        <div class="fw-bold">${formatDateTime(record.assignmentTime || record.timestamp)}</div>
                        <small class="text-muted">${record.orderNo || record.orderId}</small>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-user-circle text-primary me-2"></i>
                            <span class="fw-bold">${result.operatorName}</span>
                        </div>
                    </td>
                    <td>${protocolDisplay}</td>
                    <td><span class="badge bg-success">已派单</span></td>
                </tr>
            `;
        }).join('');
    }).join('');
    
    container.innerHTML = historyHtml;
    console.log('✅ 历史记录显示完成');
}

/**
 * 保存单个派单历史记录到数据库
 */
async function saveAssignmentHistoryToDatabase(historyRecord) {
    try {
        console.log('📤 保存派单历史到数据库:', historyRecord);
        
        // 根据是否有多个results决定使用单个还是批量API
        if (historyRecord.results && historyRecord.results.length > 1) {
            // 批量保存
            const response = await fetch('/api/assignment-history/save-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(historyRecord)
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ 批量派单历史保存成功:', result.message);
            } else {
                console.error('❌ 批量派单历史保存失败:', result.message);
            }
            return result;
        } else {
            // 单个保存
            const singleRecord = historyRecord.results && historyRecord.results.length > 0 ? 
                historyRecord.results[0] : {};
            
            const saveData = {
                orderId: historyRecord.orderId,
                orderNo: historyRecord.orderNo,
                assignmentType: historyRecord.assignmentType,
                operatorName: historyRecord.operator,
                assignmentTime: historyRecord.assignmentTime,
                successCount: historyRecord.successCount,
                failedCount: historyRecord.failedCount,
                serviceCode: singleRecord.serviceCode,
                serviceName: singleRecord.serviceName,
                assignedOperatorId: singleRecord.operatorId,
                assignedOperatorName: singleRecord.operatorName,
                protocolId: singleRecord.protocolId,
                protocolName: singleRecord.protocolName,
                protocolCommission: singleRecord.protocolCommission,
                status: singleRecord.status,
                reason: singleRecord.reason,
                assignmentNotes: singleRecord.assignmentNotes
            };
            
            const response = await fetch('/api/assignment-history/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ 派单历史保存成功:', result.message);
            } else {
                console.error('❌ 派单历史保存失败:', result.message);
            }
            return result;
        }
        
    } catch (error) {
        console.error('❌ 保存派单历史时发生错误:', error);
        
        // 如果数据库保存失败，降级到localStorage
        console.log('📥 降级到localStorage保存');
        saveAssignmentHistoryToLocalStorage();
        
        return { success: false, message: error.message };
    }
}

/**
 * 从数据库加载派单历史
 */
async function loadAssignmentHistoryFromDatabase() {
    try {
        console.log('📥 从数据库加载派单历史...');
        
        const response = await fetch('/api/assignment-history/recent?page=0&size=50');
        const result = await response.json();
        
        if (result.success && result.data) {
            // 转换数据库格式到前端格式
            assignmentHistory = result.data.map(dbRecord => {
                return {
                    assignmentTime: dbRecord.assignmentTime,
                    orderId: dbRecord.orderId,
                    orderNo: dbRecord.orderNo,
                    assignmentType: dbRecord.assignmentType,
                    operator: dbRecord.operatorName,
                    successCount: dbRecord.successCount || 1,
                    failedCount: dbRecord.failedCount || 0,
                    results: [{
                        serviceCode: dbRecord.serviceCode,
                        serviceName: dbRecord.serviceName,
                        operatorId: dbRecord.assignedOperatorId,
                        operatorName: dbRecord.assignedOperatorName,
                        protocolId: dbRecord.protocolId,
                        protocolName: dbRecord.protocolName,
                        protocolCommission: dbRecord.protocolCommission,
                        status: dbRecord.status,
                        reason: dbRecord.reason,
                        assignmentNotes: dbRecord.assignmentNotes
                    }]
                };
            });
            
            console.log('✅ 派单历史加载成功:', assignmentHistory.length, '条记录');
            displayAssignmentHistory();
        } else {
            console.warn('⚠️ 数据库加载派单历史失败:', result.message);
            // 降级到localStorage
            loadAssignmentHistoryFromLocalStorage();
        }
        
    } catch (error) {
        console.error('❌ 从数据库加载派单历史失败:', error);
        // 降级到localStorage
        loadAssignmentHistoryFromLocalStorage();
    }
}

/**
 * 持久化存储派单历史（localStorage备用）
 */
function saveAssignmentHistoryToLocalStorage() {
    const recentHistory = assignmentHistory.slice(0, 100); // 限制100条
    localStorage.setItem(ASSIGNMENT_HISTORY_KEY, JSON.stringify(recentHistory));
}

/**
 * 从存储加载派单历史（localStorage备用）
 */
function loadAssignmentHistoryFromLocalStorage() {
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

/**
 * 获取服务规格详情
 */
function getServiceSpecifications(serviceCode) {
    const serviceSpecsDatabase = {
        'BOOKING': {
            serviceType: '预订服务',
            requiredSkills: ['船务操作', '舱位管理', '客户沟通'],
            estimatedHours: 2,
            difficultyLevel: 'MEDIUM',
            documentRequirements: ['订舱委托书', '货物清单', '特殊要求说明'],
            qualityStandard: '100%舱位确认，24小时内回复',
            customerVisible: true,
            billingMethod: '按票计费',
            description: '为客户预订船舶舱位，确保货物运输时间和空间安排。包括舱位查询、预订确认、特殊货物安排等。'
        },
        'MBL_PROCESSING': {
            serviceType: '主单处理',
            requiredSkills: ['海运单证', '系统操作', '英文读写'],
            estimatedHours: 3,
            difficultyLevel: 'HIGH',
            documentRequirements: ['主提单草本', '舱单信息', '货物描述'],
            qualityStandard: 'MBL信息100%准确，符合SOLAS要求',
            customerVisible: false,
            billingMethod: '按票计费',
            description: '处理海运主提单(MBL)的制作、审核、修改和签发。确保MBL信息准确无误，符合国际海运规范。'
        },
        'HBL_PROCESSING': {
            serviceType: '分单处理',
            requiredSkills: ['货代业务', '单证操作', '客户服务'],
            estimatedHours: 2,
            difficultyLevel: 'MEDIUM',
            documentRequirements: ['分提单模板', '客户资料', 'MBL信息'],
            qualityStandard: 'HBL与MBL信息匹配，客户确认',
            customerVisible: true,
            billingMethod: '按票计费',
            description: '制作和处理货代提单(HBL)，确保与主单信息一致，满足客户特殊要求和展示需求。'
        },
        'CUSTOMS_CLEARANCE': {
            serviceType: '报关服务',
            requiredSkills: ['报关业务', '政策法规', '系统操作'],
            estimatedHours: 4,
            difficultyLevel: 'HIGH',
            documentRequirements: ['报关委托书', '发票', '装箱单', '许可证'],
            qualityStandard: '一次性通关，无查验风险',
            customerVisible: true,
            billingMethod: '按票计费',
            description: '办理进出口货物的海关申报手续，包括单证审核、申报录入、税费计算、查验配合等全流程服务。'
        },
        'CARGO_LOADING': {
            serviceType: '装货监装',
            requiredSkills: ['现场操作', '货物检验', '安全管理'],
            estimatedHours: 6,
            difficultyLevel: 'MEDIUM',
            documentRequirements: ['装货清单', '现场照片', '装货报告'],
            qualityStandard: '货物安全装载，符合配载要求',
            customerVisible: true,
            billingMethod: '按小时计费',
            description: '现场监督货物装载过程，确保货物安全、合理配载，记录装载过程并出具装货报告。'
        },
        'CONTAINER_LOADING': {
            serviceType: '集装箱装货',
            requiredSkills: ['集装箱操作', '货物配载', '现场管理'],
            estimatedHours: 4,
            difficultyLevel: 'MEDIUM',
            documentRequirements: ['装箱单', '现场照片', '封条记录'],
            qualityStandard: '集装箱利用率>95%，货物无损坏',
            customerVisible: true,
            billingMethod: '按箱计费',
            description: '专业的集装箱装载服务，包括货物配载优化、装箱监督、封条管理等，确保运输安全。'
        },
        'TRANSPORTATION': {
            serviceType: '运输配送',
            requiredSkills: ['运输管理', '路线规划', '车辆调度'],
            estimatedHours: 8,
            difficultyLevel: 'MEDIUM',
            documentRequirements: ['运输委托书', '货物清单', '收货确认'],
            qualityStandard: '准时送达率>98%，货物完好率100%',
            customerVisible: true,
            billingMethod: '按公里计费',
            description: '提供门到门运输服务，包括车辆安排、路线优化、在途跟踪、收货确认等全程物流服务。'
        },
        'AWB_PROCESSING': {
            serviceType: '空运单处理',
            requiredSkills: ['空运业务', '单证制作', 'IATA规范'],
            estimatedHours: 2,
            difficultyLevel: 'MEDIUM',
            documentRequirements: ['空运委托书', '货物信息', '特殊声明'],
            qualityStandard: 'AWB信息准确，符合IATA标准',
            customerVisible: true,
            billingMethod: '按票计费',
            description: '制作和处理空运提单(AWB)，确保符合国际航空运输协会规范，满足航空运输要求。'
        }
    };
    
    return serviceSpecsDatabase[serviceCode] || null;
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
 * 获取匹配的协议（使用统一协议管理器）
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
    
    // 使用统一协议管理器获取匹配的协议
    if (typeof protocolManager !== 'undefined') {
        const matchedProtocols = protocolManager.getMatchingProtocols(operator.department, serviceCode);
        console.log('🎯 从协议管理器匹配到的协议:', matchedProtocols.map(p => `${p.protocolName}(${p.totalCommissionRate}%)`));
        
        // 显示匹配过程信息
        if (matchedProtocols.length > 0) {
            const bestProtocol = matchedProtocols[0];
            console.log(`✨ 自动匹配结果: ${operator.operatorName}(${operator.department}) + ${getServiceName(serviceCode)} → ${bestProtocol.protocolName} (佣金:${bestProtocol.totalCommissionRate}%)`);
        } else {
            console.log(`⚠️ 自动匹配失败: ${operator.operatorName}(${operator.department}) + ${getServiceName(serviceCode)} → 无适用协议`);
        }
        
        return matchedProtocols;
    } else {
        console.warn('⚠️ 协议管理器未加载，使用备用协议数据');
        return getFallbackProtocols(operator, serviceCode);
    }
}

/**
 * 备用协议数据（当协议管理器未加载时使用）
 */
function getFallbackProtocols(operator, serviceCode) {
    const fallbackProtocols = [
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
            status: 'ACTIVE',
            description: '专门针对海运MBL处理的标准协议，包含完整的业务流程和分润规则。'
        },
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
            status: 'ACTIVE',
            description: '标准报关服务协议，适用于进出口报关业务。'
        }
    ];
    
    return fallbackProtocols.filter(protocol => {
        const deptMatch = protocol.applicableDepartments.includes(operator.department);
        const serviceMatch = protocol.serviceCode === serviceCode || protocol.serviceCode === 'ALL';
        return deptMatch && serviceMatch;
    });
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
        
        // 添加调试日志
        console.log('💾 服务状态已保存到localStorage:', {
            orderId: currentOrderId,
            serviceCode: service.serviceCode,
            assignedProtocol: service.assignedProtocol ? {
                protocolId: service.assignedProtocol.protocolId,
                protocolName: service.assignedProtocol.protocolName,
                totalCommissionRate: service.assignedProtocol.totalCommissionRate
            } : null
        });
        
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
            operator: UserState.getCurrentUser().name || '张美华',
            successCount: 1,
            failedCount: 0,
            results: [{
                serviceCode: serviceCode,
                serviceName: service ? service.serviceName : serviceCode,
                operatorId: operatorId,
                operatorName: operatorName,
                status: 'SUCCESS',
                protocolId: selectedProtocol.protocolId,
                protocolName: selectedProtocol.protocolName,
                protocolCommission: selectedProtocol.totalCommissionRate,
                assignmentNotes: document.getElementById('assignmentNotes').value || '',
                expectedCompleteTime: document.getElementById('expectedCompleteTime').value || '',
                assignmentMethod: 'PROTOCOL_ASSIGNMENT'
            }],
            operator: '协议派单'
        };
        
        assignmentHistory.unshift(historyRecord);
        
        // 保存到数据库
        saveAssignmentHistoryToDatabase(historyRecord);
        
        // 添加调试日志
        console.log('📚 协议派单历史已记录:', {
            orderId: historyRecord.orderId,
            assignmentType: historyRecord.assignmentType,
            protocolName: historyRecord.results[0].protocolName,
            protocolCommission: historyRecord.results[0].protocolCommission,
            assignmentNotes: historyRecord.results[0].assignmentNotes
        });
        
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
    
    // 获取服务详细规格信息
    const serviceSpecs = getServiceSpecifications(service.serviceCode);
    
    let assignmentHistoryHtml = '';
    if (serviceAssignments.length > 0) {
        assignmentHistoryHtml = `
            <h6 class="text-primary mt-4"><i class="fas fa-history me-2"></i>派单历史</h6>
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead class="table-light">
                        <tr>
                            <th><i class="fas fa-clock me-1"></i>时间</th>
                            <th><i class="fas fa-user me-1"></i>操作人员</th>
                            <th><i class="fas fa-file-contract me-1"></i>协议</th>
                            <th><i class="fas fa-tag me-1"></i>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${serviceAssignments.map(record => {
                            const result = record.results.find(r => r.serviceCode === serviceCode);
                            return `
                                <tr>
                                    <td>${record.timestamp || formatDateTime(record.assignmentTime)}</td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-user-circle text-muted me-2"></i>
                                            ${result.operatorName}
                                        </div>
                                    </td>
                                    <td>
                                        ${result.protocolName ? `
                                            <span class="badge bg-info">${result.protocolName}</span>
                                            ${result.protocolCommission ? `<br><small class="text-muted">佣金: ${result.protocolCommission}%</small>` : ''}
                                        ` : '<span class="text-muted">无协议</span>'}
                                    </td>
                                    <td><span class="badge bg-success">已派单</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // 当前协议详情
    let currentProtocolHtml = '';
    if (service.assignedProtocol) {
        currentProtocolHtml = `
            <h6 class="text-primary mt-4"><i class="fas fa-file-contract me-2"></i>当前应用协议</h6>
            <div class="card border-info">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <table class="table table-sm table-borderless">
                                <tr><td><strong>协议名称:</strong></td><td>${service.assignedProtocol.protocolName}</td></tr>
                                <tr><td><strong>适用范围:</strong></td><td>${service.assignedProtocol.businessType || '通用'}</td></tr>
                                <tr><td><strong>基础佣金率:</strong></td><td class="text-success fw-bold">${service.assignedProtocol.baseCommissionRate}%</td></tr>
                                <tr><td><strong>绩效奖金率:</strong></td><td class="text-success fw-bold">${service.assignedProtocol.bonusCommissionRate}%</td></tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table table-sm table-borderless">
                                <tr><td><strong>总佣金率:</strong></td><td class="text-primary fw-bold">${service.assignedProtocol.totalCommissionRate}%</td></tr>
                                <tr><td><strong>SLA时效:</strong></td><td>${service.assignedProtocol.slaHours}小时</td></tr>
                                <tr><td><strong>推荐等级:</strong></td><td>${service.assignedProtocol.recommended ? '<span class="badge bg-success">推荐</span>' : '<span class="badge bg-secondary">备选</span>'}</td></tr>
                                <tr><td><strong>协议状态:</strong></td><td><span class="badge bg-success">生效中</span></td></tr>
                            </table>
                        </div>
                    </div>
                    <div class="mt-3">
                        <strong class="text-primary">协议说明:</strong>
                        <p class="text-muted small mt-2 mb-0">${service.assignedProtocol.description || '暂无详细说明'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // 服务规格详情
    let serviceSpecsHtml = '';
    if (serviceSpecs) {
        serviceSpecsHtml = `
            <h6 class="text-primary mt-4"><i class="fas fa-cogs me-2"></i>服务规格说明</h6>
            <div class="card border-light">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <table class="table table-sm table-borderless">
                                <tr><td><strong>服务类型:</strong></td><td>${serviceSpecs.serviceType}</td></tr>
                                <tr><td><strong>所需技能:</strong></td><td>${serviceSpecs.requiredSkills.join(', ')}</td></tr>
                                <tr><td><strong>预计工时:</strong></td><td>${serviceSpecs.estimatedHours}小时</td></tr>
                                <tr><td><strong>难度等级:</strong></td><td>
                                    ${serviceSpecs.difficultyLevel === 'HIGH' ? '<span class="badge bg-danger">高</span>' : 
                                      serviceSpecs.difficultyLevel === 'MEDIUM' ? '<span class="badge bg-warning text-dark">中</span>' : 
                                      '<span class="badge bg-success">低</span>'}
                                </td></tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table table-sm table-borderless">
                                <tr><td><strong>文档要求:</strong></td><td>${serviceSpecs.documentRequirements.join(', ')}</td></tr>
                                <tr><td><strong>质量标准:</strong></td><td>${serviceSpecs.qualityStandard}</td></tr>
                                <tr><td><strong>客户可见:</strong></td><td>${serviceSpecs.customerVisible ? '<span class="badge bg-info">是</span>' : '<span class="badge bg-secondary">否</span>'}</td></tr>
                                <tr><td><strong>计费方式:</strong></td><td>${serviceSpecs.billingMethod}</td></tr>
                            </table>
                        </div>
                    </div>
                    ${serviceSpecs.description ? `
                        <div class="mt-3">
                            <strong class="text-primary">服务描述:</strong>
                            <p class="text-muted small mt-2 mb-0">${serviceSpecs.description}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // 填充详情内容
    document.getElementById('serviceDetailContent').innerHTML = `
        <div class="mb-4">
            <h6 class="text-primary"><i class="fas fa-info-circle me-2"></i>基本信息</h6>
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td><strong>服务名称:</strong></td><td>${service.serviceName}</td></tr>
                        <tr><td><strong>服务代码:</strong></td><td><code class="text-primary">${service.serviceCode}</code></td></tr>
                        <tr><td><strong>当前状态:</strong></td><td><span class="badge ${getStatusClass(service.status)}">${getStatusText(service.status)}</span></td></tr>
                        <tr><td><strong>优先级:</strong></td><td><span class="badge ${getPriorityClass(service.priority)}">${getPriorityText(service.priority)}</span></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        ${service.assignedTo ? `
                            <tr><td><strong>指派给:</strong></td><td>
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-user-circle text-primary me-2"></i>
                                    ${availableOperators.find(op => op.operatorId === service.assignedTo)?.operatorName || service.assignedTo}
                                </div>
                            </td></tr>
                            <tr><td><strong>派单时间:</strong></td><td>${service.assignedTime ? formatDateTime(service.assignedTime) : '未知'}</td></tr>
                            ${service.expectedCompleteTime ? `<tr><td><strong>预期完成:</strong></td><td>${formatDateTime(service.expectedCompleteTime)}</td></tr>` : ''}
                            ${service.assignmentNotes ? `<tr><td><strong>派单备注:</strong></td><td class="text-muted small">${service.assignmentNotes}</td></tr>` : ''}
                        ` : `
                            <tr><td colspan="2"><em class="text-muted">
                                <i class="fas fa-clock me-2"></i>尚未派单
                            </em></td></tr>
                        `}
                    </table>
                </div>
            </div>
        </div>
        ${currentProtocolHtml}
        ${serviceSpecsHtml}
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