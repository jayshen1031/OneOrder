/**
 * 管理账分润计算前端脚本
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */

// 全局变量
let currentOrderId = '';
let calculationResult = null;
let profitSharingRules = [];

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('管理账分润计算页面初始化');
    loadProfitSharingRules();
});

/**
 * 返回首页
 */
function goBack() {
    window.location.href = 'freight-order.html';
}

/**
 * 加载分润规则
 */
function loadProfitSharingRules() {
    fetch('/api/api/profit-sharing/rules')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                profitSharingRules = data.data;
                displayProfitSharingRules();
            } else {
                showAlert('加载分润规则失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('加载分润规则失败:', error);
            showAlert('加载分润规则失败', 'danger');
        });
}

/**
 * 显示分润规则
 */
function displayProfitSharingRules() {
    const tbody = document.getElementById('rulesTableBody');
    if (profitSharingRules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">暂无分润规则</td></tr>';
        return;
    }

    tbody.innerHTML = profitSharingRules.map(rule => `
        <tr>
            <td><code>${rule.ruleCode}</code></td>
            <td>${rule.ruleName}</td>
            <td>
                <span class="badge ${getRuleTypeBadgeClass(rule.ruleType)}">
                    ${getRuleTypeDisplayName(rule.ruleType)}
                </span>
            </td>
            <td class="text-end">${(rule.salesRatio * 100).toFixed(1)}%</td>
            <td class="text-end">${(rule.operationRatio * 100).toFixed(1)}%</td>
            <td class="text-center">
                <span class="badge bg-secondary">${rule.rulePriority}</span>
            </td>
            <td>
                <span class="badge ${rule.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                    ${rule.status === 'ACTIVE' ? '生效' : '停用'}
                </span>
            </td>
            <td>
                <small class="text-muted">
                    ${rule.applicableServiceCodes || '所有服务'}
                </small>
            </td>
        </tr>
    `).join('');
}

/**
 * 获取规则类型样式类
 */
function getRuleTypeBadgeClass(ruleType) {
    const classMap = {
        'STANDARD': 'bg-primary',
        'SERVICE_SPECIFIC': 'bg-info',
        'DEPARTMENT_SPECIFIC': 'bg-warning'
    };
    return classMap[ruleType] || 'bg-secondary';
}

/**
 * 获取规则类型显示名称
 */
function getRuleTypeDisplayName(ruleType) {
    const nameMap = {
        'STANDARD': '标准规则',
        'SERVICE_SPECIFIC': '服务专用',
        'DEPARTMENT_SPECIFIC': '部门专用'
    };
    return nameMap[ruleType] || ruleType;
}

/**
 * 加载订单费用明细
 */
function loadOrderExpenses() {
    const orderSelect = document.getElementById('orderSelect');
    const orderId = orderSelect.value;
    
    if (!orderId) {
        document.getElementById('orderInfo').style.display = 'none';
        document.getElementById('calculateBtn').disabled = true;
        hideResultsAndLogs();
        return;
    }
    
    currentOrderId = orderId;
    
    // 查询订单费用明细
    fetch(`/api/api/expense-entries/order/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayOrderExpenseInfo(data.data);
                document.getElementById('calculateBtn').disabled = false;
                
                // 检查是否已有分润计算结果
                checkExistingProfitSharing(orderId);
            } else {
                showAlert('获取订单信息失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('获取订单信息失败:', error);
            showAlert('获取订单信息失败', 'danger');
        });
}

/**
 * 显示订单费用信息
 */
function displayOrderExpenseInfo(data) {
    const orderInfo = data.orderInfo;
    const entries = data.entries;
    
    document.getElementById('receivableCount').textContent = orderInfo.receivableCount;
    document.getElementById('payableCount').textContent = orderInfo.payableCount;
    document.getElementById('totalReceivable').textContent = formatCurrency(orderInfo.totalReceivable);
    document.getElementById('totalPayable').textContent = formatCurrency(orderInfo.totalPayable);
    
    document.getElementById('orderInfo').style.display = 'block';
    
    // 如果录费状态为已完成，显示可以开始分润计算
    if (orderInfo.entryStatus === 'COMPLETED') {
        showAlert('订单录费已完成，可以开始分润计算', 'success');
    }
}

/**
 * 检查是否已有分润计算结果
 */
function checkExistingProfitSharing(orderId) {
    fetch(`/api/api/profit-sharing/result/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                calculationResult = data.data;
                displayProfitSharingResults(data.data);
                document.getElementById('recalculateBtn').disabled = false;
                document.getElementById('validateBtn').disabled = false;
                loadCalculationLogs(orderId);
            } else if (data.code === 404) {
                // 没有计算结果，这是正常情况
                hideResultsAndLogs();
            }
        })
        .catch(error => {
            console.error('检查分润计算结果失败:', error);
        });
}

/**
 * 开始分润计算
 */
function calculateProfitSharing() {
    if (!currentOrderId) {
        showAlert('请先选择订单', 'warning');
        return;
    }
    
    const calculateBtn = document.getElementById('calculateBtn');
    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>计算中...';
    calculateBtn.disabled = true;
    
    fetch(`/api/api/profit-sharing/calculate/${currentOrderId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            calculationResult = data.data;
            showAlert('分润计算完成', 'success');
            displayProfitSharingResults(data.data);
            document.getElementById('recalculateBtn').disabled = false;
            document.getElementById('validateBtn').disabled = false;
            loadCalculationLogs(currentOrderId);
        } else {
            showAlert('分润计算失败: ' + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('分润计算失败:', error);
        showAlert('分润计算失败', 'danger');
    })
    .finally(() => {
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
    });
}

/**
 * 重新计算分润
 */
function recalculateProfit() {
    if (!currentOrderId) return;
    
    if (confirm('确定要重新计算分润吗？这将覆盖现有的计算结果。')) {
        const recalculateBtn = document.getElementById('recalculateBtn');
        const originalText = recalculateBtn.innerHTML;
        recalculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>重新计算...';
        recalculateBtn.disabled = true;
        
        fetch(`/api/api/profit-sharing/calculate/${currentOrderId}?forceRecalculate=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                calculationResult = data.data;
                showAlert('分润重新计算完成', 'success');
                displayProfitSharingResults(data.data);
                loadCalculationLogs(currentOrderId);
            } else {
                showAlert('重新计算失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('重新计算失败:', error);
            showAlert('重新计算失败', 'danger');
        })
        .finally(() => {
            recalculateBtn.innerHTML = originalText;
            recalculateBtn.disabled = false;
        });
    }
}

/**
 * 显示分润计算结果
 */
function displayProfitSharingResults(data) {
    // 显示汇总信息
    const summary = data.summary;
    document.getElementById('totalGrossProfit').textContent = formatCurrency(summary.totalGrossProfit);
    document.getElementById('involvedDepartments').textContent = summary.involvedDepartmentsCount;
    document.getElementById('totalServices').textContent = summary.totalServicesCount;
    document.getElementById('calculationTime').textContent = formatDateTime(summary.calculatedTime);
    
    // 显示部门分润明细
    displayDepartmentResults(data.departmentResults);
    
    // 获取并显示部门汇总
    loadDepartmentSummary(currentOrderId);
    
    document.getElementById('profitResultsCard').style.display = 'block';
}

/**
 * 显示部门分润明细
 */
function displayDepartmentResults(departmentResults) {
    const container = document.getElementById('departmentResults');
    
    if (!departmentResults || departmentResults.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">暂无分润明细</div>';
        return;
    }
    
    // 按服务分组显示
    const serviceGroups = {};
    departmentResults.forEach(result => {
        const serviceCode = result.serviceCode;
        if (!serviceGroups[serviceCode]) {
            serviceGroups[serviceCode] = [];
        }
        serviceGroups[serviceCode].push(result);
    });
    
    container.innerHTML = Object.entries(serviceGroups).map(([serviceCode, results]) => `
        <div class="service-group">
            <h6 class="mb-3">
                <i class="fas fa-cube me-2"></i>
                ${results[0].serviceName} (${serviceCode})
                <small class="text-muted ms-2">
                    服务毛利: <strong class="profit-amount">¥${formatNumber(results[0].serviceGrossProfit)}</strong>
                </small>
            </h6>
            <div class="row">
                ${results.map(result => `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">${result.departmentName}</h6>
                                    <span class="badge dept-type-${result.departmentType.toLowerCase()}">
                                        ${result.departmentType === 'SALES' ? '销售' : '操作'}
                                    </span>
                                </div>
                                <div class="row g-2 text-sm">
                                    <div class="col-6">
                                        <small class="text-muted">外部收入</small><br>
                                        <strong>¥${formatNumber(result.externalRevenue)}</strong>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted">外部支出</small><br>
                                        <strong>¥${formatNumber(result.externalCost)}</strong>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted">内部收入</small><br>
                                        <strong>¥${formatNumber(result.internalIncome)}</strong>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted">内部支出</small><br>
                                        <strong>¥${formatNumber(result.internalPayment)}</strong>
                                    </div>
                                </div>
                                <hr class="my-2">
                                <div class="text-center">
                                    <small class="text-muted">部门利润</small><br>
                                    <strong class="profit-amount ${result.departmentProfit < 0 ? 'negative-profit' : ''}">
                                        ¥${formatNumber(result.departmentProfit)}
                                    </strong>
                                    <small class="text-muted d-block">
                                        分润比例: ${(result.profitSharingRatio * 100).toFixed(1)}%
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * 加载部门汇总信息
 */
function loadDepartmentSummary(orderId) {
    fetch(`/api/api/profit-sharing/department-summary/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayDepartmentSummary(data.data);
            }
        })
        .catch(error => {
            console.error('获取部门汇总失败:', error);
        });
}

/**
 * 显示部门汇总
 */
function displayDepartmentSummary(summaryData) {
    const container = document.getElementById('departmentSummary');
    
    if (!summaryData || summaryData.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无汇总数据</div>';
        return;
    }
    
    container.innerHTML = summaryData.map(summary => `
        <div class="card mb-2">
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <h6 class="mb-0">${summary.departmentName}</h6>
                    <span class="badge dept-type-${summary.departmentType.toLowerCase()}">
                        ${summary.departmentType === 'SALES' ? '销售' : '操作'}
                    </span>
                </div>
                <div class="row g-1 text-sm">
                    <div class="col-12">
                        <small class="text-muted">总利润:</small>
                        <strong class="float-end profit-amount ${summary.totalDepartmentProfit < 0 ? 'negative-profit' : ''}">
                            ¥${formatNumber(summary.totalDepartmentProfit)}
                        </strong>
                    </div>
                    <div class="col-12">
                        <small class="text-muted">服务项数:</small>
                        <strong class="float-end">${summary.serviceCount}</strong>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 校验平衡性
 */
function validateBalance() {
    if (!currentOrderId) return;
    
    const validateBtn = document.getElementById('validateBtn');
    const originalText = validateBtn.innerHTML;
    validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>校验中...';
    validateBtn.disabled = true;
    
    fetch(`/api/api/profit-sharing/validate/${currentOrderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayBalanceCheck(data.data);
            } else {
                showAlert('平衡校验失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('平衡校验失败:', error);
            showAlert('平衡校验失败', 'danger');
        })
        .finally(() => {
            validateBtn.innerHTML = originalText;
            validateBtn.disabled = false;
        });
}

/**
 * 显示平衡校验结果
 */
function displayBalanceCheck(balanceData) {
    const container = document.getElementById('balanceCheck');
    const isBalanced = balanceData.overallBalanced;
    
    container.innerHTML = `
        <div class="balance-check ${isBalanced ? 'balance-success' : 'balance-error'}">
            <h6>
                <i class="fas ${isBalanced ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                平衡校验结果: ${isBalanced ? '通过' : '不通过'}
            </h6>
            <div class="row">
                <div class="col-md-6">
                    <small class="text-muted">外部收入总计:</small>
                    <strong class="float-end">¥${formatNumber(balanceData.totalExternalRevenue)}</strong><br>
                    <small class="text-muted">外部支出总计:</small>
                    <strong class="float-end">¥${formatNumber(balanceData.totalExternalCost)}</strong><br>
                    <small class="text-muted">订单总毛利:</small>
                    <strong class="float-end profit-amount">¥${formatNumber(balanceData.orderGrossProfit)}</strong>
                </div>
                <div class="col-md-6">
                    <small class="text-muted">内部流转差额:</small>
                    <strong class="float-end ${balanceData.internalBalanced ? 'text-success' : 'text-danger'}">
                        ¥${formatNumber(balanceData.internalBalance)}
                    </strong><br>
                    <small class="text-muted">部门利润总计:</small>
                    <strong class="float-end">¥${formatNumber(balanceData.totalDepartmentProfit)}</strong><br>
                    <small class="text-muted">利润分配平衡:</small>
                    <strong class="float-end ${balanceData.profitBalanced ? 'text-success' : 'text-danger'}">
                        ${balanceData.profitBalanced ? '是' : '否'}
                    </strong>
                </div>
            </div>
        </div>
    `;
    
    container.style.display = 'block';
}

/**
 * 加载计算日志
 */
function loadCalculationLogs(orderId) {
    fetch(`/api/api/profit-sharing/logs/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayCalculationLogs(data.data);
                document.getElementById('calculationLogCard').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('获取计算日志失败:', error);
        });
}

/**
 * 显示计算日志
 */
function displayCalculationLogs(logs) {
    const container = document.getElementById('calculationLog');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-muted">暂无计算日志</div>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="log-entry log-${log.logLevel.toLowerCase()}">
            <small class="text-muted">${formatDateTime(log.createdTime)}</small>
            <span class="badge bg-${getLogLevelBadgeClass(log.logLevel)} ms-2">${log.logLevel}</span>
            <span class="ms-2">${log.message}</span>
        </div>
    `).join('');
}

/**
 * 获取日志级别样式类
 */
function getLogLevelBadgeClass(level) {
    const classMap = {
        'INFO': 'primary',
        'WARN': 'warning',
        'ERROR': 'danger',
        'DEBUG': 'secondary'
    };
    return classMap[level] || 'secondary';
}

/**
 * 隐藏结果和日志
 */
function hideResultsAndLogs() {
    document.getElementById('profitResultsCard').style.display = 'none';
    document.getElementById('calculationLogCard').style.display = 'none';
    document.getElementById('recalculateBtn').disabled = true;
    document.getElementById('validateBtn').disabled = true;
}

/**
 * 格式化货币
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * 格式化数字
 */
function formatNumber(number) {
    if (number === null || number === undefined) return '0.00';
    return parseFloat(number).toFixed(2);
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateTime) {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleString('zh-CN');
}

/**
 * 显示提示信息
 */
function showAlert(message, type = 'info') {
    // 移除现有的alert
    const existingAlert = document.querySelector('.alert-dismissible');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // 5秒后自动消失
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}