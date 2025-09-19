// 客服接单功能 JavaScript

// 全局变量
let availableServices = [];
let selectedServices = [];
let currentOrderId = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomerServiceInterface();
    loadCustomerOptions();
});

/**
 * 初始化客服界面
 */
function initializeCustomerServiceInterface() {
    // 获取当前用户角色
    const userRole = getCurrentUserRole(); // 假设这个函数已存在
    
    if (userRole === 'CUSTOMER_SERVICE') {
        console.log('客服界面初始化');
        // 客服特有功能初始化
    }
}

/**
 * 加载客户选项
 */
function loadCustomerOptions() {
    const customerSelect = document.getElementById('customerId');
    if (!customerSelect) return;
    
    // 模拟客户数据，实际应该从API获取
    const customers = [
        { id: 'CUST001', name: '华为技术有限公司' },
        { id: 'CUST002', name: '阿里巴巴集团' },
        { id: 'CUST003', name: '比亚迪股份' },
        { id: 'CUST004', name: '海康威视' },
        { id: 'CUST005', name: '小米科技' }
    ];
    
    customerSelect.innerHTML = '<option value="">请选择客户</option>' +
        customers.map(customer => 
            `<option value="${customer.id}">${customer.name}</option>`
        ).join('');
}

/**
 * 业务类型改变时加载对应的服务选项
 */
function loadServiceOptions() {
    const businessType = document.getElementById('businessType').value;
    if (!businessType) {
        document.getElementById('serviceSelection').innerHTML = '';
        return;
    }
    
    console.log('加载服务选项 - 业务类型:', businessType);
    
    // 调用API获取可选服务
    fetch(`/api/customer-service/services/available?businessType=${businessType}`)
    .then(response => response.json())
    .then(services => {
        availableServices = services;
        displayServiceSelection(services);
    })
    .catch(error => {
        console.error('加载服务选项失败:', error);
        showNotification('加载服务选项失败: ' + error.message, 'error');
    });
}

/**
 * 显示服务选择界面
 */
function displayServiceSelection(services) {
    const container = document.getElementById('serviceSelection');
    
    if (services.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">该业务类型暂无可选服务</div>';
        return;
    }
    
    const servicesByCategory = groupServicesByCategory(services);
    
    let html = '<div class="row">';
    
    Object.keys(servicesByCategory).forEach(category => {
        const categoryServices = servicesByCategory[category];
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0 text-primary">
                            <i class="fas fa-cog me-2"></i>${category}
                        </h6>
                    </div>
                    <div class="card-body">
        `;
        
        categoryServices.forEach(service => {
            html += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" 
                           value="${service.serviceCode}" 
                           id="service_${service.serviceCode}"
                           onchange="updateServiceSelection()">
                    <label class="form-check-label" for="service_${service.serviceCode}">
                        <strong>${service.serviceName}</strong>
                        <small class="d-block text-muted">${service.description || ''}</small>
                        <span class="badge bg-secondary">${service.priceRange}</span>
                    </label>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * 按类别分组服务
 */
function groupServicesByCategory(services) {
    const categories = {
        '主运费用': [],
        '港口费用': [],
        '单证费用': [],
        '集装箱费用': [],
        '陆运费用': [],
        '关检费用': [],
        '仓储费用': [],
        '其他费用': []
    };
    
    services.forEach(service => {
        // 根据服务代码或名称判断类别
        const category = determineServiceCategory(service);
        if (categories[category]) {
            categories[category].push(service);
        } else {
            categories['其他费用'].push(service);
        }
    });
    
    // 移除空类别
    Object.keys(categories).forEach(key => {
        if (categories[key].length === 0) {
            delete categories[key];
        }
    });
    
    return categories;
}

/**
 * 确定服务类别
 */
function determineServiceCategory(service) {
    const code = service.serviceCode.toUpperCase();
    const name = service.serviceName;
    
    if (code.includes('FREIGHT') || name.includes('运费')) return '主运费用';
    if (code.includes('THC') || code.includes('PORT') || name.includes('港口') || name.includes('码头')) return '港口费用';
    if (code.includes('DOC') || code.includes('BILL') || name.includes('单证') || name.includes('文件')) return '单证费用';
    if (code.includes('CONTAINER') || name.includes('集装箱') || name.includes('箱')) return '集装箱费用';
    if (code.includes('TRUCK') || name.includes('拖车') || name.includes('陆运')) return '陆运费用';
    if (code.includes('CUSTOMS') || name.includes('报关') || name.includes('清关')) return '关检费用';
    if (code.includes('WAREHOUSE') || name.includes('仓储') || name.includes('仓库')) return '仓储费用';
    
    return '其他费用';
}

/**
 * 更新服务选择
 */
function updateServiceSelection() {
    const checkboxes = document.querySelectorAll('#serviceSelection input[type="checkbox"]');
    selectedServices = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedServices.push(checkbox.value);
        }
    });
    
    console.log('已选择服务:', selectedServices);
    updateFeeBreakdown();
}

/**
 * 更新费用明细
 */
function updateFeeBreakdown() {
    const container = document.getElementById('feeBreakdown');
    const totalAmountSpan = document.getElementById('totalAmount');
    
    if (selectedServices.length === 0) {
        container.innerHTML = '<div class="alert alert-info">请先选择服务项</div>';
        totalAmountSpan.textContent = '¥ 0.00';
        return;
    }
    
    let totalAmount = 0;
    let html = '<div class="table-responsive"><table class="table table-sm">';
    html += '<thead><tr><th>服务项</th><th>描述</th><th>价格</th></tr></thead><tbody>';
    
    selectedServices.forEach(serviceCode => {
        const service = availableServices.find(s => s.serviceCode === serviceCode);
        if (service) {
            const amount = estimateServiceAmount(service);
            totalAmount += amount;
            
            html += `
                <tr>
                    <td><strong>${service.serviceName}</strong></td>
                    <td>${service.description || ''}</td>
                    <td class="text-end">¥ ${amount.toLocaleString()}</td>
                </tr>
            `;
        }
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    totalAmountSpan.textContent = `¥ ${totalAmount.toLocaleString()}`;
}

/**
 * 估算服务金额
 */
function estimateServiceAmount(service) {
    // 简化的估算逻辑
    if (service.fixedPrice && service.fixedPrice > 0) {
        return service.fixedPrice;
    }
    
    if (service.minPrice && service.maxPrice) {
        return (service.minPrice + service.maxPrice) / 2;
    }
    
    // 根据服务类型返回默认估算值
    const estimates = {
        'OCEAN_FREIGHT': 20000,
        'AIR_FREIGHT': 15000,
        'TRUCK_FREIGHT': 1500,
        'CUSTOMS_DECLARATION': 500,
        'WAREHOUSE_STORAGE': 300
    };
    
    return estimates[service.serviceCode] || 1000;
}

/**
 * 提交订单 - 客服接单的核心功能
 */
function submitOrder() {
    if (!validateOrderForm()) {
        return;
    }
    
    const orderData = collectOrderData();
    
    console.log('提交订单数据:', orderData);
    showNotification('正在创建订单...', 'info');
    
    // 调用客服接单API
    fetch('/api/customer-service/orders/create-with-services', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('订单创建成功！', 'success');
            currentOrderId = data.data.orderId;
            
            // 显示创建结果
            displayOrderCreationResult(data.data);
            
            // 跳转到派单界面
            setTimeout(() => {
                showServiceAssignmentInterface(data.data.orderId);
            }, 2000);
            
        } else {
            showNotification('订单创建失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('创建订单失败:', error);
        showNotification('创建订单失败: ' + error.message, 'error');
    });
}

/**
 * 验证订单表单
 */
function validateOrderForm() {
    const customerId = document.getElementById('customerId').value;
    const businessType = document.getElementById('businessType').value;
    
    if (!customerId) {
        showNotification('请选择客户', 'warning');
        return false;
    }
    
    if (!businessType) {
        showNotification('请选择业务类型', 'warning');
        return false;
    }
    
    if (selectedServices.length === 0) {
        showNotification('请至少选择一个服务项', 'warning');
        return false;
    }
    
    return true;
}

/**
 * 收集订单数据
 */
function collectOrderData() {
    return {
        customerServiceId: getCurrentUserId(), // 假设这个函数已存在
        customerId: document.getElementById('customerId').value,
        businessType: document.getElementById('businessType').value,
        selectedServices: selectedServices,
        portOfLoading: document.getElementById('portOfLoading').value,
        portOfDischarge: document.getElementById('portOfDischarge').value,
        estimatedDeparture: document.getElementById('estimatedDeparture').value ? 
            new Date(document.getElementById('estimatedDeparture').value).toISOString() : null,
        estimatedArrival: document.getElementById('estimatedArrival').value ? 
            new Date(document.getElementById('estimatedArrival').value).toISOString() : null,
        cargoDescription: document.getElementById('cargoDescription').value,
        packageCount: document.getElementById('packageCount').value ? 
            parseInt(document.getElementById('packageCount').value) : null,
        weight: document.getElementById('weight').value ? 
            parseFloat(document.getElementById('weight').value) : null,
        volume: document.getElementById('volume').value ? 
            parseFloat(document.getElementById('volume').value) : null
    };
}

/**
 * 显示订单创建结果
 */
function displayOrderCreationResult(orderData) {
    const modal = new bootstrap.Modal(document.getElementById('orderCreationResultModal'));
    
    // 更新模态框内容
    document.getElementById('resultOrderId').textContent = orderData.orderId;
    document.getElementById('resultOrderNo').textContent = orderData.orderNo;
    document.getElementById('resultTotalAmount').textContent = '¥ ' + orderData.totalAmount.toLocaleString();
    document.getElementById('resultServiceCount').textContent = orderData.serviceCount;
    
    modal.show();
}

/**
 * 显示服务派单界面
 */
function showServiceAssignmentInterface(orderId) {
    // 隐藏订单创建表单
    document.getElementById('newOrderForm').style.display = 'none';
    
    // 显示派单界面
    const assignmentSection = document.getElementById('serviceAssignmentSection');
    if (assignmentSection) {
        assignmentSection.style.display = 'block';
        loadPendingServices(orderId);
    } else {
        // 如果没有派单界面，可以跳转到任务管理页面
        showSection('tasks');
        showNotification('订单创建完成，请在任务管理中进行派单', 'info');
    }
}

/**
 * 加载待派单服务
 */
function loadPendingServices(orderId) {
    fetch(`/api/customer-service/orders/${orderId}/pending-services`)
    .then(response => response.json())
    .then(services => {
        displayPendingServices(services);
    })
    .catch(error => {
        console.error('加载待派单服务失败:', error);
        showNotification('加载待派单服务失败: ' + error.message, 'error');
    });
}

/**
 * 显示待派单服务
 */
function displayPendingServices(services) {
    const container = document.getElementById('pendingServicesList');
    if (!container) return;
    
    if (services.length === 0) {
        container.innerHTML = '<div class="alert alert-info">没有待派单的服务</div>';
        return;
    }
    
    let html = '';
    services.forEach(service => {
        html += createServiceAssignmentCard(service);
    });
    
    container.innerHTML = html;
}

/**
 * 创建服务派单卡片
 */
function createServiceAssignmentCard(service) {
    return `
        <div class="card mb-3 border-warning" id="service_${service.serviceId}">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <h6 class="mb-1">${service.serviceName}</h6>
                        <small class="text-muted">${service.serviceCode}</small>
                        <div class="mt-1">
                            <span class="badge bg-success">¥ ${service.amount ? service.amount.toLocaleString() : '待计算'}</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small">选择操作人员</label>
                        <select class="form-select form-select-sm" 
                                id="staff_${service.serviceId}" 
                                onchange="loadProtocolsForStaff('${service.serviceId}')">
                            <option value="">请选择...</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small">选择内部协议</label>
                        <div class="input-group input-group-sm">
                            <select class="form-select" 
                                    id="protocol_${service.serviceId}"
                                    onchange="updateAssignButtonState('${service.serviceId}')">
                                <option value="">请先选择操作人员</option>
                            </select>
                            <button class="btn btn-outline-info" type="button" 
                                    onclick="showProtocolDetails('${service.serviceId}')"
                                    title="查看协议详情">
                                <i class="fas fa-info"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary btn-sm w-100" 
                                onclick="assignService('${service.serviceId}')"
                                id="assignBtn_${service.serviceId}" disabled>
                            <i class="fas fa-paper-plane me-1"></i>派单
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 工具函数 (假设已存在)
function getCurrentUserId() {
    // 返回当前登录用户ID
    return 'CS001'; // 示例值
}

function getCurrentUserRole() {
    // 返回当前用户角色
    return 'CUSTOMER_SERVICE'; // 示例值
}

function showNotification(message, type) {
    // 显示通知消息
    console.log(`[${type.toUpperCase()}] ${message}`);
    // 实际实现应该显示Toast或Alert
}

// 导出函数供HTML使用
window.loadServiceOptions = loadServiceOptions;
window.updateServiceSelection = updateServiceSelection;
window.submitOrder = submitOrder;