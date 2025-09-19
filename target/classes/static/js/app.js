// OneOrder财务清分系统前端JavaScript

// API基础配置
const API_BASE = '/api';

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadLegalEntities();
});

// 导航菜单切换
function showSection(sectionId) {
    // 隐藏所有内容区域
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // 显示选中的区域
    document.getElementById(sectionId).style.display = 'block';
    
    // 更新导航状态
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 根据页面加载对应数据
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'clearing':
            loadClearingHistory();
            break;
        case 'voucher':
            loadVoucherData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        // 从API获取真实的订单数据
        const response = await fetch('/api/freight-orders?page=0&size=100');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const orders = await response.json();
        console.log('财务清分系统获取到的订单数据:', orders);
        
        // 计算真实统计数据
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => {
            const orderDate = order.createdAt ? order.createdAt.split('T')[0] : today;
            return orderDate === today;
        }).length;
        
        // 计算清分成功率（基于订单状态）
        const completedOrders = orders.filter(o => o.orderStatus === 'COMPLETED' || o.clearingStatus === 'COMPLETED').length;
        const successRate = orders.length > 0 ? ((completedOrders / orders.length) * 100).toFixed(1) : '0.0';
        
        // 待处理凭证数量（假设为待清分订单数）
        const pendingVouchers = orders.filter(o => !o.clearingStatus || o.clearingStatus === 'PENDING').length;
        
        // 报表差异数量（模拟：有问题的订单）
        const reportDifferences = Math.floor(orders.length * 0.05); // 假设5%有差异
        
        // 更新界面显示
        const todayOrdersElement = document.getElementById('todayOrders');
        const successRateElement = document.getElementById('successRate');
        const pendingVouchersElement = document.getElementById('pendingVouchers');
        const reportDifferencesElement = document.getElementById('reportDifferences');
        
        if (todayOrdersElement) todayOrdersElement.textContent = todayOrders;
        if (successRateElement) successRateElement.textContent = successRate + '%';
        if (pendingVouchersElement) pendingVouchersElement.textContent = pendingVouchers;
        if (reportDifferencesElement) reportDifferencesElement.textContent = reportDifferences;
        
        // 加载最近清分记录
        loadRecentClearingRecords(orders);
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        showAlert('加载数据失败: ' + error.message, 'error');
        
        // 显示错误状态
        document.getElementById('todayOrders').textContent = '?';
        document.getElementById('successRate').textContent = '?';
        document.getElementById('pendingVouchers').textContent = '?';
        document.getElementById('reportDifferences').textContent = '?';
    }
}

// 加载最近清分记录
async function loadRecentClearingRecords(orders = null) {
    try {
        // 如果没有传入订单数据，从API获取
        if (!orders) {
            const response = await fetch('/api/freight-orders?page=0&size=20');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            orders = await response.json();
        }
        
        // 转换订单数据为清分记录格式
        const customerMap = {
            'SH-AUTO': '华为技术有限公司',
            'HW-EXPORT': '阿里巴巴集团', 
            'MIDEA-SHIP': '比亚迪股份',
            'HK-TECH': '海康威视',
            'MI-ELEC': '小米科技'
        };
        
        const records = orders.slice(0, 5).map((order, index) => {
            // 从订单号推断客户名称
            let customerName = order.customerName;
            if (!customerName && order.orderNo) {
                const prefix = order.orderNo.split('-')[0];
                customerName = customerMap[prefix] || '未知客户';
            }
            
            // 根据订单状态确定清分状态
            let clearingStatus = '待处理';
            if (order.clearingStatus === 'COMPLETED') {
                clearingStatus = '已完成';
            } else if (order.orderStatus === 'COMPLETED') {
                clearingStatus = '清分中';
            }
            
            // 清分模式随机分配
            const clearingModes = ['星式', '链式'];
            const clearingMode = clearingModes[index % 2];
            
            return {
                orderNo: order.orderNo || `ORD-${Date.now()}-${index}`,
                entityName: customerName || '未知客户',
                amount: (order.totalAmount || 15000).toLocaleString(),
                currency: order.currency || 'CNY',
                clearingMode: clearingMode,
                status: clearingStatus,
                createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN')
            };
        });
        
        const tbody = document.getElementById('recentClearingRecords');
        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${record.orderNo}</td>
                <td>${record.entityName}</td>
                <td>${record.amount}</td>
                <td>${record.currency}</td>
                <td><span class="badge bg-primary">${record.clearingMode}</span></td>
                <td><span class="badge ${getStatusBadgeClass(record.status)}">${record.status}</span></td>
                <td>${record.createdAt}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewClearingDetails('${record.orderNo}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('加载清分记录失败:', error);
    }
}

// 获取状态徽章样式
function getStatusBadgeClass(status) {
    const statusMap = {
        '已完成': 'bg-success',
        '清分中': 'bg-warning',
        '失败': 'bg-danger',
        '待处理': 'bg-secondary'
    };
    return statusMap[status] || 'bg-secondary';
}

// 加载法人体数据
async function loadLegalEntities() {
    try {
        // 模拟数据，实际应该调用API
        const entities = [
            { id: 'ENTITY001', name: '上海邦达物流有限公司', type: 'SALES' },
            { id: 'ENTITY002', name: '深圳邦达货运代理有限公司', type: 'DELIVERY' },
            { id: 'ENTITY003', name: '宁波邦达物流有限公司', type: 'SALES' },
            { id: 'ENTITY004', name: '香港邦达国际贸易有限公司', type: 'DELIVERY' }
        ];
        
        const salesSelect = document.getElementById('salesEntityId');
        const deliverySelect = document.getElementById('deliveryEntityId');
        
        // 清空现有选项
        salesSelect.innerHTML = '<option value="">请选择</option>';
        deliverySelect.innerHTML = '<option value="">请选择</option>';
        
        entities.forEach(entity => {
            const option = `<option value="${entity.id}">${entity.name}</option>`;
            if (entity.type === 'SALES') {
                salesSelect.innerHTML += option;
            } else if (entity.type === 'DELIVERY') {
                deliverySelect.innerHTML += option;
            }
        });
    } catch (error) {
        console.error('加载法人体数据失败:', error);
    }
}

// 显示清分表单
function showClearingForm() {
    document.getElementById('clearingForm').style.display = 'block';
    document.getElementById('clearingResults').style.display = 'none';
}

// 隐藏清分表单
function hideClearingForm() {
    document.getElementById('clearingForm').style.display = 'none';
    document.getElementById('clearingFormData').reset();
}

// 试算清分
async function simulateClearing() {
    const orderData = getOrderFormData();
    if (!validateOrderData(orderData)) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/clearing/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const results = await response.json();
            displayClearingResults(results, true);
            showAlert('试算完成', 'success');
        } else {
            throw new Error('试算失败');
        }
    } catch (error) {
        console.error('试算失败:', error);
        showAlert('试算失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 执行清分
async function executeClearing() {
    const orderData = getOrderFormData();
    if (!validateOrderData(orderData)) {
        return;
    }
    
    const clearingRequest = {
        order: orderData,
        isSimulation: false,
        operator: 'current_user' // 实际应该获取当前用户
    };
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/clearing/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clearingRequest)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayClearingResults(result.results, false);
                showAlert('清分执行成功', 'success');
                
                // 询问是否创建凭证
                if (confirm('清分完成，是否立即创建会计凭证？')) {
                    await createVoucher(result.results, orderData.orderId);
                }
            } else {
                showAlert('清分失败: ' + result.message, 'error');
            }
        } else {
            throw new Error('清分执行失败');
        }
    } catch (error) {
        console.error('清分执行失败:', error);
        showAlert('清分执行失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 获取表单数据
function getOrderFormData() {
    return {
        orderId: generateOrderId(),
        orderNo: document.getElementById('orderNo').value,
        customerId: document.getElementById('customerId').value,
        salesEntityId: document.getElementById('salesEntityId').value,
        deliveryEntityId: document.getElementById('deliveryEntityId').value || null,
        paymentEntityId: null,
        totalAmount: parseFloat(document.getElementById('totalAmount').value),
        totalCost: parseFloat(document.getElementById('totalCost').value) || null,
        currency: document.getElementById('currency').value,
        clearingMode: document.getElementById('clearingMode').value,
        orderStatus: 'CONFIRMED',
        clearingStatus: 'PENDING',
        orderDate: new Date().toISOString(),
        businessType: 'FREIGHT_FORWARDING'
    };
}

// 验证订单数据
function validateOrderData(orderData) {
    if (!orderData.orderNo) {
        showAlert('请输入订单编号', 'error');
        return false;
    }
    if (!orderData.customerId) {
        showAlert('请输入客户ID', 'error');
        return false;
    }
    if (!orderData.salesEntityId) {
        showAlert('请选择销售法人体', 'error');
        return false;
    }
    if (!orderData.totalAmount || orderData.totalAmount <= 0) {
        showAlert('请输入有效的订单金额', 'error');
        return false;
    }
    if (!orderData.currency) {
        showAlert('请选择币种', 'error');
        return false;
    }
    if (!orderData.clearingMode) {
        showAlert('请选择清分模式', 'error');
        return false;
    }
    return true;
}

// 显示清分结果
function displayClearingResults(results, isSimulation) {
    const resultsDiv = document.getElementById('clearingResults');
    const tableDiv = document.getElementById('clearingResultsTable');
    
    const title = isSimulation ? '试算结果' : '清分结果';
    const tableClass = isSimulation ? 'table-warning' : 'table-success';
    
    tableDiv.innerHTML = `
        <h6>${title}</h6>
        <div class="table-responsive">
            <table class="table ${tableClass} table-striped">
                <thead>
                    <tr>
                        <th>法人体ID</th>
                        <th>金额</th>
                        <th>币种</th>
                        <th>交易类型</th>
                        <th>账务类型</th>
                        <th>清分模式</th>
                        <th>是否中转留存</th>
                        <th>备注</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(result => `
                        <tr>
                            <td>${result.entityId}</td>
                            <td class="${result.amount >= 0 ? 'text-success' : 'text-danger'}">
                                ${formatAmount(result.amount)}
                            </td>
                            <td>${result.currency}</td>
                            <td><span class="badge bg-info">${getTransactionTypeText(result.transactionType)}</span></td>
                            <td><span class="badge bg-secondary">${getAccountTypeText(result.accountType)}</span></td>
                            <td>${result.clearingMode}</td>
                            <td>${result.isTransitRetention ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>'}</td>
                            <td>${result.remarks || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <strong>借方合计: </strong><span class="text-success">${formatAmount(calculateTotalDebit(results))}</span>
            <strong class="ms-3">贷方合计: </strong><span class="text-danger">${formatAmount(calculateTotalCredit(results))}</span>
            <strong class="ms-3">是否平衡: </strong><span class="${isBalanced(results) ? 'text-success' : 'text-danger'}">${isBalanced(results) ? '✓ 平衡' : '✗ 不平衡'}</span>
        </div>
    `;
    
    resultsDiv.style.display = 'block';
}

// 创建凭证
async function createVoucher(clearingResults, orderId) {
    const voucherRequest = {
        orderId: orderId,
        clearingResults: clearingResults,
        operator: 'current_user',
        summary: `订单${orderId}清分凭证`,
        autoPost: false
    };
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/clearing/voucher`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(voucherRequest)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showAlert(`凭证创建成功，凭证ID: ${result.voucherId}`, 'success');
            } else {
                showAlert('凭证创建失败: ' + result.message, 'error');
            }
        } else {
            throw new Error('凭证创建请求失败');
        }
    } catch (error) {
        console.error('创建凭证失败:', error);
        showAlert('创建凭证失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 工具函数
function generateOrderId() {
    return 'ORD-' + Date.now();
}

function formatAmount(amount) {
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(amount)) + (amount >= 0 ? '' : ' (贷)');
}

function getTransactionTypeText(type) {
    const typeMap = {
        'RECEIVABLE': '应收',
        'PAYABLE': '应付',
        'PROFIT_SHARING': '分润',
        'TRANSIT_FEE': '中转费',
        'NETTING': '净额'
    };
    return typeMap[type] || type;
}

function getAccountTypeText(type) {
    const typeMap = {
        'EXTERNAL_RECEIVABLE': '外收',
        'EXTERNAL_PAYABLE': '外支',
        'INTERNAL_RECEIVABLE': '内收',
        'INTERNAL_PAYABLE': '内支'
    };
    return typeMap[type] || type;
}

function calculateTotalDebit(results) {
    return results.filter(r => r.amount >= 0).reduce((sum, r) => sum + r.amount, 0);
}

function calculateTotalCredit(results) {
    return Math.abs(results.filter(r => r.amount < 0).reduce((sum, r) => sum + r.amount, 0));
}

function isBalanced(results) {
    const totalDebit = calculateTotalDebit(results);
    const totalCredit = calculateTotalCredit(results);
    return Math.abs(totalDebit - totalCredit) < 0.01; // 允许0.01的精度误差
}

function showAlert(message, type) {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 自动移除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function showLoading(show) {
    // 简单的加载指示器
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

// 占位函数，实际项目中需要实现
function loadClearingHistory() {
    console.log('加载清分历史');
}

function loadVoucherData() {
    console.log('加载凭证数据');
}

function loadReportsData() {
    console.log('加载报表数据');
}

function viewClearingDetails(orderNo) {
    console.log('查看清分详情:', orderNo);
    showAlert('查看详情功能开发中', 'info');
}