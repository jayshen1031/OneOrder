/**
 * 费用明细录入管理JavaScript
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-20
 */

// 全局变量
let currentOrderId = '';
let currentSuggestion = null;
let deleteEntryId = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

/**
 * 初始化页面
 */
async function initializePage() {
    try {
        // 加载订单列表
        await loadOrders();
        
        // 加载费用科目
        await loadFeeCodes();
        
        // 加载服务项目
        await loadServiceCodes();
        
        // 加载法人实体
        await loadLegalEntities();
        
        // 绑定表单提交事件
        document.getElementById('expenseEntryForm').addEventListener('submit', handleFormSubmit);
        
        console.log('页面初始化完成');
        
    } catch (error) {
        console.error('页面初始化失败:', error);
        showToast('页面初始化失败: ' + error.message, 'error');
    }
}

/**
 * 加载订单列表
 */
async function loadOrders() {
    try {
        const response = await fetch('/api/freight-orders?page=0&size=100');
        const result = await response.json();
        
        const orderSelect = document.getElementById('orderSelect');
        orderSelect.innerHTML = '<option value="">请选择订单</option>';
        
        if (result.code === 200 && result.data && result.data.content) {
            result.data.content.forEach(order => {
                const option = document.createElement('option');
                option.value = order.orderNo;
                option.textContent = `${order.orderNo} - ${order.customerName}`;
                orderSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('加载订单列表失败:', error);
        // 使用模拟数据
        const orderSelect = document.getElementById('orderSelect');
        orderSelect.innerHTML = `
            <option value="">请选择订单</option>
            <option value="HW-EXPORT-20240101-001">HW-EXPORT-20240101-001 - 华为技术有限公司</option>
            <option value="MIDEA-SHIP-20240102-001">MIDEA-SHIP-20240102-001 - 美的集团股份有限公司</option>
            <option value="SH-AUTO-20240103-001">SH-AUTO-20240103-001 - 上汽集团</option>
        `;
    }
}

/**
 * 加载费用科目
 */
async function loadFeeCodes() {
    try {
        const response = await fetch('/api/expense-entries/fee-codes');
        const result = await response.json();
        
        const feeCodeSelect = document.getElementById('feeCode');
        feeCodeSelect.innerHTML = '<option value="">请选择费用科目</option>';
        
        if (result.code === 200 && result.data) {
            result.data.forEach(fee => {
                const option = document.createElement('option');
                option.value = fee.feeCode;
                option.textContent = `${fee.feeCode} - ${fee.feeName}`;
                option.dataset.category = fee.category;
                feeCodeSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('加载费用科目失败:', error);
    }
}

/**
 * 加载服务项目
 */
async function loadServiceCodes() {
    try {
        const response = await fetch('/api/expense-entries/service-codes');
        const result = await response.json();
        
        const serviceCodeSelect = document.getElementById('serviceCode');
        serviceCodeSelect.innerHTML = '<option value="">请选择服务项目</option>';
        
        if (result.code === 200 && result.data) {
            result.data.forEach(service => {
                const option = document.createElement('option');
                option.value = service.serviceCode;
                option.textContent = `${service.serviceCode} - ${service.serviceName}`;
                option.dataset.businessType = service.businessType;
                serviceCodeSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('加载服务项目失败:', error);
    }
}

/**
 * 加载法人实体
 */
async function loadLegalEntities() {
    try {
        const response = await fetch('/api/expense-entries/legal-entities');
        const result = await response.json();
        
        const ourEntitySelect = document.getElementById('ourEntityId');
        ourEntitySelect.innerHTML = '<option value="">请选择我方法人</option>';
        
        if (result.code === 200 && result.data) {
            result.data.forEach(entity => {
                const option = document.createElement('option');
                option.value = entity.entityId;
                option.textContent = entity.entityName;
                option.dataset.canReceive = entity.canReceive;
                option.dataset.canPay = entity.canPay;
                option.dataset.isTransitEntity = entity.isTransitEntity;
                ourEntitySelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('加载法人实体失败:', error);
    }
}

/**
 * 刷新订单列表
 */
async function refreshOrders() {
    await loadOrders();
    showToast('订单列表已刷新', 'success');
}

/**
 * 加载订单费用明细
 */
async function loadOrderExpenseEntries() {
    const orderId = document.getElementById('orderSelect').value;
    
    if (!orderId) {
        hideOrderInfo();
        return;
    }
    
    currentOrderId = orderId;
    
    try {
        const response = await fetch(`/api/expense-entries/order/${orderId}`);
        const result = await response.json();
        
        if (result.code === 200) {
            displayOrderInfo(result.data.orderInfo);
            displayExpenseEntries(result.data.entries || []);
            showEntryForm();
        } else {
            showToast('加载订单费用明细失败: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('加载订单费用明细失败:', error);
        showToast('加载订单费用明细失败: ' + error.message, 'error');
    }
}

/**
 * 显示订单信息
 */
function displayOrderInfo(orderInfo) {
    document.getElementById('orderSummary').style.display = 'block';
    
    // 从订单号推断客户名称
    const customerNames = {
        'HW-EXPORT-20240101-001': '华为技术有限公司',
        'MIDEA-SHIP-20240102-001': '美的集团股份有限公司',
        'SH-AUTO-20240103-001': '上汽集团'
    };
    
    document.getElementById('customerName').textContent = customerNames[currentOrderId] || '未知客户';
    document.getElementById('receivableCount').textContent = orderInfo.receivableCount || 0;
    document.getElementById('payableCount').textContent = orderInfo.payableCount || 0;
    document.getElementById('totalReceivable').textContent = (orderInfo.totalReceivable || 0).toFixed(2);
    document.getElementById('totalPayable').textContent = (orderInfo.totalPayable || 0).toFixed(2);
    
    const statusBadge = document.getElementById('entryStatus');
    const status = orderInfo.entryStatus || 'IN_PROGRESS';
    statusBadge.textContent = getStatusText(status);
    statusBadge.className = `badge ${getStatusBadgeClass(status)}`;
    
    // 显示完成按钮
    const completeButton = document.getElementById('completeButton');
    if (status === 'IN_PROGRESS' && (orderInfo.receivableCount > 0 || orderInfo.payableCount > 0)) {
        completeButton.style.display = 'inline-block';
    } else {
        completeButton.style.display = 'none';
    }
}

/**
 * 隐藏订单信息
 */
function hideOrderInfo() {
    document.getElementById('orderSummary').style.display = 'none';
    document.getElementById('entryFormCard').style.display = 'none';
    document.getElementById('entryListCard').style.display = 'none';
    currentOrderId = '';
}

/**
 * 显示录入表单
 */
function showEntryForm() {
    document.getElementById('entryFormCard').style.display = 'block';
    document.getElementById('entryListCard').style.display = 'block';
}

/**
 * 显示费用明细列表
 */
function displayExpenseEntries(entries) {
    const tbody = document.getElementById('entryTableBody');
    tbody.innerHTML = '';
    
    if (entries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted">暂无费用明细</td>
            </tr>
        `;
        return;
    }
    
    entries.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <span class="badge ${entry.entryType === 'RECEIVABLE' ? 'bg-success' : 'bg-warning text-dark'}">
                    ${entry.entryType === 'RECEIVABLE' ? '收款' : '付款'}
                </span>
            </td>
            <td>
                <div>${entry.feeCode}</div>
                <small class="text-muted">${entry.feeName || ''}</small>
            </td>
            <td>
                <div>${entry.serviceCode}</div>
                <small class="text-muted">${entry.serviceName || ''}</small>
            </td>
            <td>${entry.counterpartEntity}</td>
            <td class="text-end">
                <strong>${formatAmount(entry.amount, entry.currency)}</strong>
            </td>
            <td>${entry.currency}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(entry.entryStatus)}">
                    ${getStatusText(entry.entryStatus)}
                </span>
            </td>
            <td>
                <span class="badge ${getValidationBadgeClass(entry.validationStatus)}">
                    ${getValidationText(entry.validationStatus)}
                </span>
            </td>
            <td class="entry-actions">
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="editEntry('${entry.id}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="confirmDeleteEntry('${entry.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * 处理收付类型变化
 */
function handleEntryTypeChange() {
    const entryType = document.getElementById('entryType').value;
    const supplierTypeGroup = document.getElementById('supplierType').closest('.col-md-6');
    
    if (entryType === 'PAYABLE') {
        supplierTypeGroup.querySelector('label').innerHTML = '供应商类型 <span class="text-danger">*</span>';
        document.getElementById('supplierType').required = true;
    } else {
        supplierTypeGroup.querySelector('label').innerHTML = '供应商类型';
        document.getElementById('supplierType').required = false;
    }
    
    validateForm();
}

/**
 * 处理费用科目变化
 */
async function handleFeeCodeChange() {
    const feeCode = document.getElementById('feeCode').value;
    
    if (feeCode && currentOrderId) {
        // 获取智能服务推荐
        await getServiceSuggestion(currentOrderId, feeCode);
    }
    
    validateForm();
}

/**
 * 处理服务项目变化
 */
function handleServiceCodeChange() {
    validateForm();
}

/**
 * 处理供应商类型变化
 */
function handleSupplierTypeChange() {
    validateForm();
}

/**
 * 处理我方法人变化
 */
function handleOurEntityChange() {
    const entityId = document.getElementById('ourEntityId').value;
    const departmentSelect = document.getElementById('ourDepartmentId');
    
    // 清空部门选择
    departmentSelect.innerHTML = '<option value="">请选择我方部门</option>';
    
    if (entityId) {
        // 根据法人实体加载对应部门
        loadDepartmentsByEntity(entityId);
    }
}

/**
 * 处理借抬头变化
 */
function handleTransitEntityChange() {
    const isTransitEntity = document.getElementById('isTransitEntity').checked;
    const transitSection = document.getElementById('transitEntitySection');
    const transitReason = document.getElementById('transitReason');
    
    if (isTransitEntity) {
        transitSection.style.display = 'block';
        transitReason.required = true;
    } else {
        transitSection.style.display = 'none';
        transitReason.required = false;
        transitReason.value = '';
    }
}

/**
 * 获取智能服务推荐
 */
async function getServiceSuggestion(orderId, feeCode) {
    try {
        const response = await fetch(`/api/expense-entries/suggest-service?orderId=${orderId}&feeCode=${feeCode}`);
        const result = await response.json();
        
        if (result.code === 200) {
            displayServiceSuggestion(result.data);
        }
        
    } catch (error) {
        console.error('获取服务推荐失败:', error);
    }
}

/**
 * 显示服务推荐
 */
function displayServiceSuggestion(suggestion) {
    const suggestionDiv = document.getElementById('smartSuggestion');
    const suggestionText = document.getElementById('suggestionText');
    const applyButton = document.getElementById('applySuggestion');
    
    currentSuggestion = suggestion;
    suggestionText.textContent = suggestion.reason;
    suggestionDiv.style.display = 'block';
    
    if (suggestion.canAutoSelect && suggestion.suggestedService) {
        applyButton.style.display = 'inline-block';
        applyButton.textContent = `应用建议: ${suggestion.suggestedService}`;
    } else {
        applyButton.style.display = 'none';
    }
}

/**
 * 应用建议
 */
function applySuggestion() {
    if (currentSuggestion && currentSuggestion.canAutoSelect) {
        document.getElementById('serviceCode').value = currentSuggestion.suggestedService;
        showToast('已应用智能推荐的服务项目', 'success');
        validateForm();
    }
}

/**
 * 表单校验
 */
async function validateForm() {
    const feeCode = document.getElementById('feeCode').value;
    const serviceCode = document.getElementById('serviceCode').value;
    const supplierType = document.getElementById('supplierType').value;
    
    if (feeCode && serviceCode) {
        try {
            const response = await fetch('/api/expense-entries/validate-fee-service', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feeCode: feeCode,
                    serviceCode: serviceCode,
                    supplierType: supplierType
                })
            });
            
            const result = await response.json();
            
            if (result.code === 200) {
                displayValidationResult(result.data);
            }
            
        } catch (error) {
            console.error('表单校验失败:', error);
        }
    } else {
        hideValidationResult();
    }
}

/**
 * 显示校验结果
 */
function displayValidationResult(validationData) {
    const resultDiv = document.getElementById('validationResult');
    const status = validationData.validationResult;
    const message = validationData.warningMessage;
    
    if (message) {
        resultDiv.textContent = message;
        resultDiv.className = `validation-message validation-${status.toLowerCase()}`;
        resultDiv.style.display = 'block';
    } else {
        hideValidationResult();
    }
}

/**
 * 隐藏校验结果
 */
function hideValidationResult() {
    document.getElementById('validationResult').style.display = 'none';
}

/**
 * 处理表单提交
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = collectFormData();
    
    try {
        const response = await fetch('/api/expense-entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            showToast('费用明细保存成功', 'success');
            resetForm();
            await loadOrderExpenseEntries(); // 重新加载列表
        } else {
            showToast('保存失败: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('提交表单失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

/**
 * 收集表单数据
 */
function collectFormData() {
    return {
        orderId: currentOrderId,
        serviceCode: document.getElementById('serviceCode').value,
        feeCode: document.getElementById('feeCode').value,
        entryType: document.getElementById('entryType').value,
        counterpartEntity: document.getElementById('counterpartEntity').value,
        counterpartDepartment: document.getElementById('counterpartDepartment').value,
        counterpartSupplierType: document.getElementById('supplierType').value,
        ourEntityId: document.getElementById('ourEntityId').value,
        ourDepartmentId: document.getElementById('ourDepartmentId').value,
        amount: parseFloat(document.getElementById('amount').value),
        currency: document.getElementById('currency').value,
        isTransitEntity: document.getElementById('isTransitEntity').checked,
        transitReason: document.getElementById('transitReason').value,
        remarks: document.getElementById('remarks').value,
        createdBy: document.getElementById('currentUser').textContent
    };
}

/**
 * 重置表单
 */
function resetForm() {
    document.getElementById('expenseEntryForm').reset();
    document.getElementById('smartSuggestion').style.display = 'none';
    document.getElementById('validationResult').style.display = 'none';
    document.getElementById('transitEntitySection').style.display = 'none';
    document.getElementById('supplierType').required = false;
    document.getElementById('transitReason').required = false;
    
    // 重置标签
    const supplierLabel = document.getElementById('supplierType').closest('.col-md-6').querySelector('label');
    supplierLabel.innerHTML = '供应商类型';
}

/**
 * 完成录费
 */
async function completeExpenseEntry() {
    if (!currentOrderId) {
        showToast('请先选择订单', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/expense-entries/complete/${currentOrderId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            showToast('录费已完成！可以开始分润和清分', 'success');
            await loadOrderExpenseEntries();
        } else {
            showToast('完成录费失败: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('完成录费失败:', error);
        showToast('完成录费失败: ' + error.message, 'error');
    }
}

/**
 * 编辑费用明细
 */
function editEntry(entryId) {
    // TODO: 实现编辑功能
    showToast('编辑功能开发中...', 'info');
}

/**
 * 确认删除费用明细
 */
function confirmDeleteEntry(entryId) {
    deleteEntryId = entryId;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
    
    document.getElementById('confirmDeleteBtn').onclick = function() {
        deleteEntry();
        modal.hide();
    };
}

/**
 * 删除费用明细
 */
async function deleteEntry() {
    if (!deleteEntryId) return;
    
    try {
        const response = await fetch(`/api/expense-entries/${deleteEntryId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            showToast('费用明细删除成功', 'success');
            await loadOrderExpenseEntries();
        } else {
            showToast('删除失败: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('删除费用明细失败:', error);
        showToast('删除失败: ' + error.message, 'error');
    }
    
    deleteEntryId = null;
}

/**
 * 导出Excel
 */
function exportToExcel() {
    // TODO: 实现Excel导出功能
    showToast('Excel导出功能开发中...', 'info');
}

/**
 * 根据法人实体加载部门
 */
async function loadDepartmentsByEntity(entityId) {
    // 模拟部门数据
    const departments = {
        'HCBD_SHANGHAI': [
            { id: 'DEPT_SH_SALES', name: '上海销售部' },
            { id: 'DEPT_SH_OPERATION', name: '上海操作部' },
            { id: 'DEPT_SH_FINANCE', name: '上海财务部' }
        ],
        'HCBD_BEIJING': [
            { id: 'DEPT_BJ_SALES', name: '北京销售部' },
            { id: 'DEPT_BJ_OPERATION', name: '北京操作部' }
        ],
        'HCBD_SHENZHEN': [
            { id: 'DEPT_SZ_SALES', name: '深圳销售部' },
            { id: 'DEPT_SZ_OPERATION', name: '深圳操作部' }
        ]
    };
    
    const departmentSelect = document.getElementById('ourDepartmentId');
    const entityDepartments = departments[entityId] || [];
    
    entityDepartments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
    });
}

// ===== 工具函数 =====

/**
 * 格式化金额
 */
function formatAmount(amount, currency) {
    const symbols = {
        'CNY': '¥',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'HKD': 'HK$'
    };
    
    const symbol = symbols[currency] || currency + ' ';
    return symbol + parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
    const statusMap = {
        'DRAFT': '草稿',
        'CONFIRMED': '已确认',
        'LOCKED': '已锁定',
        'IN_PROGRESS': '录费中',
        'COMPLETED': '已完成'
    };
    return statusMap[status] || status;
}

/**
 * 获取状态徽章样式
 */
function getStatusBadgeClass(status) {
    const classMap = {
        'DRAFT': 'bg-secondary',
        'CONFIRMED': 'bg-success',
        'LOCKED': 'bg-dark',
        'IN_PROGRESS': 'bg-warning text-dark',
        'COMPLETED': 'bg-success'
    };
    return classMap[status] || 'bg-secondary';
}

/**
 * 获取校验状态文本
 */
function getValidationText(status) {
    const statusMap = {
        'VALID': '通过',
        'WARNING': '警告',
        'ERROR': '错误'
    };
    return statusMap[status] || status;
}

/**
 * 获取校验状态徽章样式
 */
function getValidationBadgeClass(status) {
    const classMap = {
        'VALID': 'bg-success',
        'WARNING': 'bg-warning text-dark',
        'ERROR': 'bg-danger'
    };
    return classMap[status] || 'bg-secondary';
}

/**
 * 显示Toast消息
 */
function showToast(message, type = 'info') {
    const toastBody = document.getElementById('toastBody');
    const toast = document.getElementById('toast');
    
    toastBody.textContent = message;
    
    // 设置Toast样式
    toast.className = 'toast';
    if (type === 'success') {
        toast.classList.add('bg-success', 'text-white');
    } else if (type === 'error') {
        toast.classList.add('bg-danger', 'text-white');
    } else if (type === 'warning') {
        toast.classList.add('bg-warning', 'text-dark');
    } else {
        toast.classList.add('bg-info', 'text-white');
    }
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}