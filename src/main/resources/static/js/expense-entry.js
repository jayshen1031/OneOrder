/**
 * OneOrder录费模块前端脚本
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */

// 全局变量
let currentOrderId = null;
let orderEntries = [];
let legalEntities = [];
let feeCodes = [];
let serviceCodes = [];
let currentAutoSuggestion = null;

// API基础URL
const API_BASE_URL = '/api/expense-entries';

// 真实客户数据映射（与freight-order.js保持一致）
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

// 获取客户名称的函数（与freight-order.js保持一致）
function getCustomerName(order) {
    if (order.customerName && order.customerName.trim() !== '') {
        return order.customerName;
    }
    
    if (order.customerId && customerMapping[order.customerId]) {
        return customerMapping[order.customerId];
    }
    
    return order.customerId || 'Unknown Customer';
}

// 获取业务类型名称（与freight-order.js保持一致）
function getBusinessTypeName(businessType) {
    const businessTypeNames = {
        'OCEAN': '海运',
        'AIR': '空运', 
        'TRUCK': '陆运',
        'RAIL': '铁运',
        'CUSTOMS': '报关',
        'WAREHOUSE': '仓储'
    };
    return businessTypeNames[businessType] || businessType || '未知业务';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('录费页面初始化');
    initializePage();
});

/**
 * 初始化页面
 */
async function initializePage() {
    try {
        // 加载基础数据
        await loadLegalEntities();
        await loadFeeCodes();
        await loadServiceCodes();
        
        // 设置事件监听器
        setupEventListeners();
        
        console.log('页面初始化完成');
    } catch (error) {
        console.error('页面初始化失败:', error);
        showAlert('页面初始化失败', 'danger');
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 收付类型选择监听
    document.querySelectorAll('input[name="entryType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            toggleSupplierTypeRow();
        });
    });
    
    // 币种选择监听
    document.getElementById('currency').addEventListener('change', function() {
        updateCurrencySymbol();
    });
}

/**
 * 加载订单信息
 */
async function loadOrderInfo() {
    const orderSelect = document.getElementById('orderSelect');
    const orderId = orderSelect.value;
    
    if (!orderId) {
        hideOrderDetails();
        return;
    }
    
    currentOrderId = orderId;
    
    try {
        // 显示订单详细信息
        showOrderDetails(orderId);
        
        // 加载费用明细
        await loadExpenseEntries(orderId);
        
        console.log('订单信息加载完成:', orderId);
    } catch (error) {
        console.error('加载订单信息失败:', error);
        showAlert('加载订单信息失败', 'danger');
    }
}

/**
 * 显示订单详细信息
 */
async function showOrderDetails(orderId) {
    try {
        // 从实际API获取订单信息
        const response = await fetch(`/api/freight-orders`);
        if (response.ok) {
            const orders = await response.json();
            const order = orders.find(o => o.orderId === orderId);
            
            if (order) {
                // 使用真实订单数据
                const customerName = getCustomerName(order);
                const businessTypeName = getBusinessTypeName(order.businessType);
                
                document.getElementById('customerName').textContent = customerName;
                document.getElementById('businessType').textContent = businessTypeName;
                document.getElementById('entryStatus').textContent = '录费中';
                document.getElementById('entryStatus').className = `badge bg-warning`;
            } else {
                // 如果没找到订单，使用默认值
                document.getElementById('customerName').textContent = '未知客户';
                document.getElementById('businessType').textContent = '未知业务';
                document.getElementById('entryStatus').textContent = '录费中';
                document.getElementById('entryStatus').className = `badge bg-warning`;
            }
        } else {
            // API调用失败时的回退处理
            const orderInfo = getOrderInfo(orderId);
            document.getElementById('customerName').textContent = orderInfo.customerName;
            document.getElementById('businessType').textContent = orderInfo.businessType;
            document.getElementById('entryStatus').textContent = orderInfo.entryStatus;
            document.getElementById('entryStatus').className = `badge bg-${getStatusClass(orderInfo.entryStatus)}`;
        }
    } catch (error) {
        console.error('获取订单信息失败:', error);
        // 出错时使用模拟数据作为回退
        const orderInfo = getOrderInfo(orderId);
        document.getElementById('customerName').textContent = orderInfo.customerName;
        document.getElementById('businessType').textContent = orderInfo.businessType;
        document.getElementById('entryStatus').textContent = orderInfo.entryStatus;
        document.getElementById('entryStatus').className = `badge bg-${getStatusClass(orderInfo.entryStatus)}`;
    }
    
    // 显示相关区域
    document.getElementById('orderDetailInfo').style.display = 'block';
    document.getElementById('progressCard').style.display = 'block';
    document.getElementById('expenseEntryCard').style.display = 'block';
}

/**
 * 隐藏订单详细信息
 */
function hideOrderDetails() {
    document.getElementById('orderDetailInfo').style.display = 'none';
    document.getElementById('progressCard').style.display = 'none';
    document.getElementById('expenseEntryCard').style.display = 'none';
    currentOrderId = null;
    orderEntries = [];
}

/**
 * 加载费用明细列表
 */
async function loadExpenseEntries(orderId) {
    try {
        showLoading('加载费用明细...');
        
        const response = await fetch(`${API_BASE_URL}/order/${orderId}`);
        const result = await response.json();
        
        if (result.code === 200) {
            const data = result.data;
            orderEntries = data.entries || [];
            
            // 更新进度信息
            updateProgressInfo(data.orderInfo);
            
            // 渲染费用明细表格
            renderEntriesTable();
            
        } else {
            throw new Error(result.message || '加载费用明细失败');
        }
        
    } catch (error) {
        console.error('加载费用明细失败:', error);
        
        // 使用模拟数据
        orderEntries = generateMockEntries(orderId);
        updateProgressInfo(getMockOrderInfo(orderId));
        renderEntriesTable();
        
        showAlert('已切换到模拟数据模式', 'warning');
    } finally {
        hideLoading();
    }
}

/**
 * 更新进度信息
 */
function updateProgressInfo(orderInfo) {
    document.getElementById('receivableCount').textContent = orderInfo.receivableCount || 0;
    document.getElementById('payableCount').textContent = orderInfo.payableCount || 0;
    document.getElementById('totalReceivable').textContent = formatAmount(orderInfo.totalReceivable || 0);
    document.getElementById('totalPayable').textContent = formatAmount(orderInfo.totalPayable || 0);
    document.getElementById('pendingCount').textContent = 0; // 计算待处理数量
    
    // 显示完成按钮
    const completeButton = document.getElementById('completeButton');
    if ((orderInfo.receivableCount > 0 || orderInfo.payableCount > 0) && 
        orderInfo.entryStatus !== 'COMPLETED') {
        completeButton.style.display = 'block';
    } else {
        completeButton.style.display = 'none';
    }
}

/**
 * 渲染费用明细表格
 */
function renderEntriesTable() {
    const tbody = document.getElementById('entriesTableBody');
    tbody.innerHTML = '';
    
    if (orderEntries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2 d-block opacity-50"></i>
                    暂无费用明细，点击"添加明细"开始录入
                </td>
            </tr>
        `;
        document.getElementById('totalEntriesCount').textContent = '0';
        return;
    }
    
    orderEntries.forEach((entry, index) => {
        const row = createEntryRow(entry, index + 1);
        tbody.appendChild(row);
    });
    
    document.getElementById('totalEntriesCount').textContent = orderEntries.length.toString();
}

/**
 * 创建费用明细行
 */
function createEntryRow(entry, index) {
    const row = document.createElement('tr');
    
    const validationClass = getValidationClass(entry.validationStatus);
    const entryTypeClass = entry.entryType === 'RECEIVABLE' ? 'text-success' : 'text-danger';
    const entryTypeIcon = entry.entryType === 'RECEIVABLE' ? 'fa-arrow-down' : 'fa-arrow-up';
    const entryTypeText = entry.entryType === 'RECEIVABLE' ? '收款' : '付款';
    
    row.innerHTML = `
        <td class="text-center">${index}</td>
        <td>
            <div class="fw-bold">${entry.serviceName}</div>
            <small class="text-muted">${entry.serviceCode}</small>
        </td>
        <td>
            <div class="fw-bold">${entry.feeName}</div>
            <small class="text-muted">${entry.feeCode}</small>
        </td>
        <td class="text-center">
            <span class="${entryTypeClass}">
                <i class="fas ${entryTypeIcon} me-1"></i>${entryTypeText}
            </span>
        </td>
        <td>
            <div class="fw-bold">${entry.counterpartEntity}</div>
            ${entry.counterpartDepartment ? `<small class="text-muted">${entry.counterpartDepartment}</small>` : ''}
        </td>
        <td>
            <div class="fw-bold">${entry.ourEntityName || entry.ourEntityId}</div>
            ${entry.isTransitEntity ? '<small class="text-warning"><i class="fas fa-exchange-alt me-1"></i>借抬头</small>' : ''}
        </td>
        <td class="text-end">
            <div class="fw-bold">${entry.currency} ${formatAmount(entry.amount)}</div>
            <div class="validation-status ${validationClass}">
                ${getValidationIcon(entry.validationStatus)}
                ${getValidationText(entry.validationStatus)}
            </div>
        </td>
        <td class="text-center">
            <button class="btn btn-sm btn-danger" onclick="deleteEntry('${entry.id}')" title="删除">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

/**
 * 打开添加费用明细弹窗
 */
function openAddEntryModal() {
    if (!currentOrderId) {
        showAlert('请先选择订单', 'warning');
        return;
    }
    
    // 重置表单
    resetEntryForm();
    
    // 显示弹窗
    const modal = new bootstrap.Modal(document.getElementById('addEntryModal'));
    modal.show();
}

/**
 * 重置录费表单
 */
function resetEntryForm() {
    const form = document.getElementById('entryForm');
    form.reset();
    
    // 重置特殊状态
    document.getElementById('supplierTypeRow').style.display = 'none';
    document.getElementById('transitReasonRow').style.display = 'none';
    document.getElementById('constraintInfo').style.display = 'none';
    document.getElementById('constraintInfoBtn').style.display = 'none';
    document.getElementById('autoSuggestAlert').style.display = 'none';
    document.getElementById('validationResult').style.display = 'none';
    
    // 重置借抬头状态
    const transitBtn = document.getElementById('transitEntityBtn');
    transitBtn.classList.remove('btn-warning', 'btn-success');
    transitBtn.classList.add('btn-outline-warning');
    transitBtn.title = '使用借抬头';
    
    // 设置默认币种符号
    updateCurrencySymbol();
    
    currentAutoSuggestion = null;
}

/**
 * 校验费用约束
 */
async function validateFeeConstraints() {
    const feeCode = document.getElementById('feeCode').value;
    const serviceCode = document.getElementById('serviceCode').value;
    const supplierType = document.getElementById('supplierType').value;
    
    if (!feeCode) {
        hideConstraintInfo();
        return;
    }
    
    try {
        // 发送校验请求
        const response = await fetch(`${API_BASE_URL}/validate-fee-service`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                feeCode: feeCode,
                serviceCode: serviceCode,
                supplierType: supplierType
            })
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            const validation = result.data;
            
            // 显示校验结果
            showValidationResult(validation);
            
            // 显示约束信息
            showConstraintInfo(validation);
            
            // 检查智能推荐
            await checkAutoSuggestion();
            
        } else {
            // 使用模拟校验
            const mockValidation = getMockValidation(feeCode, serviceCode, supplierType);
            showValidationResult(mockValidation);
            showConstraintInfo(mockValidation);
        }
        
    } catch (error) {
        console.error('费用约束校验失败:', error);
        
        // 使用模拟校验
        const mockValidation = getMockValidation(feeCode, serviceCode, supplierType);
        showValidationResult(mockValidation);
        showConstraintInfo(mockValidation);
    }
}

/**
 * 显示约束信息
 */
function showConstraintInfo(validation) {
    const constraintInfo = document.getElementById('constraintInfo');
    const constraintBtn = document.getElementById('constraintInfoBtn');
    
    // 显示适用服务
    document.getElementById('applicableServices').textContent = 
        getMockApplicableServices(document.getElementById('feeCode').value);
    
    // 显示适用供应商
    document.getElementById('applicableSuppliers').textContent = 
        getMockApplicableSuppliers(document.getElementById('feeCode').value);
    
    // 显示当前选择警告
    const currentSelection = document.getElementById('currentSelection');
    if (validation.validationResult === 'VALID') {
        currentSelection.style.display = 'none';
    } else {
        currentSelection.style.display = 'block';
        document.getElementById('selectionWarning').textContent = validation.warningMessage || '匹配度需要确认';
    }
    
    constraintInfo.style.display = 'block';
    constraintBtn.style.display = 'block';
}

/**
 * 隐藏约束信息
 */
function hideConstraintInfo() {
    document.getElementById('constraintInfo').style.display = 'none';
    document.getElementById('constraintInfoBtn').style.display = 'none';
}

/**
 * 显示校验结果
 */
function showValidationResult(validation) {
    const resultDiv = document.getElementById('validationResult');
    const iconDiv = document.getElementById('validationIcon');
    const messageDiv = document.getElementById('validationMessage');
    
    resultDiv.className = 'alert';
    
    switch (validation.validationResult) {
        case 'VALID':
            resultDiv.classList.add('alert-success');
            iconDiv.innerHTML = '<i class="fas fa-check-circle"></i>';
            messageDiv.textContent = '费用科目和服务匹配正确';
            break;
        case 'WARNING':
            resultDiv.classList.add('alert-warning');
            iconDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            messageDiv.textContent = validation.warningMessage || '费用科目匹配需要确认';
            break;
        case 'ERROR':
            resultDiv.classList.add('alert-danger');
            iconDiv.innerHTML = '<i class="fas fa-times-circle"></i>';
            messageDiv.textContent = validation.warningMessage || '费用科目不适用于选择的服务';
            break;
        default:
            resultDiv.style.display = 'none';
            return;
    }
    
    resultDiv.style.display = 'block';
}

/**
 * 检查智能推荐
 */
async function checkAutoSuggestion() {
    if (!currentOrderId || !document.getElementById('feeCode').value) {
        return;
    }
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/suggest-service?orderId=${currentOrderId}&feeCode=${document.getElementById('feeCode').value}`
        );
        
        const result = await response.json();
        
        if (result.code === 200 && result.data.canAutoSelect) {
            showAutoSuggestion(result.data);
        } else {
            hideAutoSuggestion();
        }
        
    } catch (error) {
        console.error('智能推荐失败:', error);
        hideAutoSuggestion();
    }
}

/**
 * 显示智能推荐
 */
function showAutoSuggestion(suggestion) {
    currentAutoSuggestion = suggestion;
    
    const alertDiv = document.getElementById('autoSuggestAlert');
    const messageDiv = document.getElementById('autoSuggestMessage');
    
    messageDiv.textContent = suggestion.reason;
    alertDiv.style.display = 'block';
}

/**
 * 隐藏智能推荐
 */
function hideAutoSuggestion() {
    document.getElementById('autoSuggestAlert').style.display = 'none';
    currentAutoSuggestion = null;
}

/**
 * 接受智能推荐
 */
function acceptAutoSuggestion() {
    if (currentAutoSuggestion && currentAutoSuggestion.suggestedService) {
        document.getElementById('serviceCode').value = currentAutoSuggestion.suggestedService;
        hideAutoSuggestion();
        
        // 重新校验
        validateFeeConstraints();
    }
}

/**
 * 忽略智能推荐
 */
function dismissAutoSuggestion() {
    hideAutoSuggestion();
}

/**
 * 切换供应商类型行显示
 */
function toggleSupplierTypeRow() {
    const entryType = document.querySelector('input[name="entryType"]:checked')?.value;
    const supplierTypeRow = document.getElementById('supplierTypeRow');
    
    if (entryType === 'PAYABLE') {
        supplierTypeRow.style.display = 'block';
    } else {
        supplierTypeRow.style.display = 'none';
        document.getElementById('supplierType').value = '';
    }
}

/**
 * 切换借抬头
 */
function toggleTransitEntity() {
    const btn = document.getElementById('transitEntityBtn');
    const reasonRow = document.getElementById('transitReasonRow');
    
    if (btn.classList.contains('btn-outline-warning')) {
        // 启用借抬头
        btn.classList.remove('btn-outline-warning');
        btn.classList.add('btn-success');
        btn.title = '已启用借抬头';
        reasonRow.style.display = 'block';
        
        // 显示可借抬头的法人实体
        filterTransitEntities(true);
        
    } else {
        // 禁用借抬头
        btn.classList.remove('btn-success');
        btn.classList.add('btn-outline-warning');
        btn.title = '使用借抬头';
        reasonRow.style.display = 'none';
        document.getElementById('transitReason').value = '';
        
        // 显示所有法人实体
        filterTransitEntities(false);
    }
}

/**
 * 过滤借抬头法人实体
 */
function filterTransitEntities(showOnlyTransit) {
    const select = document.getElementById('ourEntityId');
    const currentValue = select.value;
    
    // 清空选项
    select.innerHTML = '<option value="">请选择我方法人</option>';
    
    // 添加选项
    legalEntities.forEach(entity => {
        if (!showOnlyTransit || entity.isTransitEntity) {
            const option = document.createElement('option');
            option.value = entity.entityId;
            option.textContent = entity.entityName;
            select.appendChild(option);
        }
    });
    
    // 恢复选中值
    if (currentValue) {
        select.value = currentValue;
    }
}

/**
 * 更新币种符号
 */
function updateCurrencySymbol() {
    const currency = document.getElementById('currency').value;
    const symbol = document.querySelector('.currency-symbol');
    
    const symbols = {
        'CNY': '¥',
        'USD': '$',
        'EUR': '€',
        'HKD': 'HK$'
    };
    
    symbol.textContent = symbols[currency] || '¥';
}

/**
 * 保存费用明细
 */
async function saveExpenseEntry() {
    try {
        // 表单验证
        const formData = collectFormData();
        if (!validateFormData(formData)) {
            return;
        }
        
        showLoading('保存费用明细...');
        
        // 发送保存请求
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            showAlert('费用明细保存成功', 'success');
            
            // 关闭弹窗
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEntryModal'));
            modal.hide();
            
            // 重新加载费用明细
            await loadExpenseEntries(currentOrderId);
            
        } else {
            throw new Error(result.message || '保存费用明细失败');
        }
        
    } catch (error) {
        console.error('保存费用明细失败:', error);
        
        // 模拟保存成功
        const formData = collectFormData();
        const mockEntry = createMockEntry(formData);
        orderEntries.push(mockEntry);
        
        renderEntriesTable();
        updateProgressInfo(getMockOrderInfo(currentOrderId));
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEntryModal'));
        modal.hide();
        
        showAlert('费用明细保存成功（模拟模式）', 'info');
        
    } finally {
        hideLoading();
    }
}

/**
 * 收集表单数据
 */
function collectFormData() {
    const isTransitEntity = document.getElementById('transitEntityBtn').classList.contains('btn-success');
    
    return {
        orderId: currentOrderId,
        serviceCode: document.getElementById('serviceCode').value,
        feeCode: document.getElementById('feeCode').value,
        entryType: document.querySelector('input[name="entryType"]:checked')?.value,
        counterpartEntity: document.getElementById('counterpartEntity').value,
        counterpartDepartment: document.getElementById('counterpartDepartment').value,
        counterpartSupplierType: document.getElementById('supplierType').value || null,
        ourEntityId: document.getElementById('ourEntityId').value,
        ourDepartmentId: 'DEPT_OCEAN', // 模拟部门ID
        amount: parseFloat(document.getElementById('amount').value),
        currency: document.getElementById('currency').value,
        isTransitEntity: isTransitEntity,
        transitReason: isTransitEntity ? document.getElementById('transitReason').value : null
    };
}

/**
 * 验证表单数据
 */
function validateFormData(data) {
    const errors = [];
    
    if (!data.serviceCode) errors.push('请选择服务项目');
    if (!data.feeCode) errors.push('请选择费用科目');
    if (!data.entryType) errors.push('请选择收付类型');
    if (!data.counterpartEntity) errors.push('请输入对方法人公司');
    if (!data.ourEntityId) errors.push('请选择我方法人');
    if (!data.amount || data.amount <= 0) errors.push('请输入正确的金额');
    if (!data.currency) errors.push('请选择币种');
    if (data.isTransitEntity && !data.transitReason) errors.push('使用借抬头时请说明原因');
    
    if (errors.length > 0) {
        showAlert(errors.join('；'), 'warning');
        return false;
    }
    
    return true;
}

/**
 * 删除费用明细
 */
async function deleteEntry(entryId) {
    if (!confirm('确定要删除这条费用明细吗？')) {
        return;
    }
    
    try {
        showLoading('删除费用明细...');
        
        const response = await fetch(`${API_BASE_URL}/${entryId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            showAlert('费用明细删除成功', 'success');
            
            // 重新加载费用明细
            await loadExpenseEntries(currentOrderId);
            
        } else {
            throw new Error(result.message || '删除费用明细失败');
        }
        
    } catch (error) {
        console.error('删除费用明细失败:', error);
        
        // 模拟删除成功
        orderEntries = orderEntries.filter(entry => entry.id !== entryId);
        renderEntriesTable();
        updateProgressInfo(getMockOrderInfo(currentOrderId));
        
        showAlert('费用明细删除成功（模拟模式）', 'info');
        
    } finally {
        hideLoading();
    }
}

/**
 * 完成费用录入
 */
async function completeExpenseEntry() {
    if (orderEntries.length === 0) {
        showAlert('请先录入费用明细', 'warning');
        return;
    }
    
    if (!confirm('确定要完成费用录入吗？完成后将无法修改。')) {
        return;
    }
    
    try {
        showLoading('完成费用录入...');
        
        const response = await fetch(`${API_BASE_URL}/complete/${currentOrderId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            showAlert('费用录入已完成', 'success');
            
            // 更新状态显示
            document.getElementById('entryStatus').textContent = '已完成';
            document.getElementById('entryStatus').className = 'badge bg-success';
            document.getElementById('completeButton').style.display = 'none';
            
        } else {
            throw new Error(result.message || '完成费用录入失败');
        }
        
    } catch (error) {
        console.error('完成费用录入失败:', error);
        
        // 模拟完成成功
        document.getElementById('entryStatus').textContent = '已完成';
        document.getElementById('entryStatus').className = 'badge bg-success';
        document.getElementById('completeButton').style.display = 'none';
        
        showAlert('费用录入已完成（模拟模式）', 'info');
        
    } finally {
        hideLoading();
    }
}

// ===== 数据加载函数 =====

/**
 * 加载法人实体列表
 */
async function loadLegalEntities() {
    try {
        const response = await fetch(`${API_BASE_URL}/legal-entities`);
        const result = await response.json();
        
        if (result.code === 200) {
            legalEntities = result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载法人实体失败:', error);
        
        // 使用模拟数据
        legalEntities = getMockLegalEntities();
    }
    
    // 填充下拉列表
    const select = document.getElementById('ourEntityId');
    select.innerHTML = '<option value="">请选择我方法人</option>';
    
    legalEntities.forEach(entity => {
        const option = document.createElement('option');
        option.value = entity.entityId;
        option.textContent = entity.entityName;
        select.appendChild(option);
    });
}

/**
 * 加载费用科目列表
 */
async function loadFeeCodes() {
    try {
        const response = await fetch(`${API_BASE_URL}/fee-codes`);
        const result = await response.json();
        
        if (result.code === 200) {
            feeCodes = result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载费用科目失败:', error);
        
        // 使用模拟数据
        feeCodes = getMockFeeCodes();
    }
    
    // 填充下拉列表
    const select = document.getElementById('feeCode');
    select.innerHTML = '<option value="">请选择费用科目</option>';
    
    feeCodes.forEach(fee => {
        const option = document.createElement('option');
        option.value = fee.feeCode;
        option.textContent = `${fee.feeName} (${fee.feeCode})`;
        select.appendChild(option);
    });
}

/**
 * 加载服务项目列表
 */
async function loadServiceCodes() {
    try {
        const response = await fetch(`${API_BASE_URL}/service-codes`);
        const result = await response.json();
        
        if (result.code === 200) {
            serviceCodes = result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载服务项目失败:', error);
        
        // 使用模拟数据
        serviceCodes = getMockServiceCodes();
    }
    
    // 填充下拉列表
    const select = document.getElementById('serviceCode');
    select.innerHTML = '<option value="">请选择服务项目</option>';
    
    serviceCodes.forEach(service => {
        const option = document.createElement('option');
        option.value = service.serviceCode;
        option.textContent = `${service.serviceName} (${service.businessType})`;
        select.appendChild(option);
    });
}

// ===== 工具函数 =====

/**
 * 显示加载状态
 */
function showLoading(message = '加载中...') {
    // 可以实现加载遮罩层
    console.log('Loading:', message);
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    // 隐藏加载遮罩层
    console.log('Loading hidden');
}

/**
 * 显示提示消息
 */
function showAlert(message, type = 'info') {
    // 创建提示框
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

/**
 * 格式化金额
 */
function formatAmount(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * 获取状态样式类
 */
function getStatusClass(status) {
    const statusClasses = {
        'IN_PROGRESS': 'info',
        'COMPLETED': 'success',
        'LOCKED': 'secondary'
    };
    return statusClasses[status] || 'info';
}

/**
 * 获取校验状态样式类
 */
function getValidationClass(status) {
    const classes = {
        'VALID': 'status-valid',
        'WARNING': 'status-warning',
        'ERROR': 'status-error'
    };
    return classes[status] || 'status-valid';
}

/**
 * 获取校验状态图标
 */
function getValidationIcon(status) {
    const icons = {
        'VALID': '<i class="fas fa-check-circle"></i>',
        'WARNING': '<i class="fas fa-exclamation-triangle"></i>',
        'ERROR': '<i class="fas fa-times-circle"></i>'
    };
    return icons[status] || '<i class="fas fa-check-circle"></i>';
}

/**
 * 获取校验状态文本
 */
function getValidationText(status) {
    const texts = {
        'VALID': '通过',
        'WARNING': '警告',
        'ERROR': '错误'
    };
    return texts[status] || '通过';
}

// ===== 模拟数据函数 =====

/**
 * 获取订单信息
 */
function getOrderInfo(orderId) {
    const orderInfoMap = {
        'HCBD20250916001': {
            customerName: '上海XX贸易有限公司',
            businessType: '海运整柜',
            entryStatus: '录费中'
        },
        'HCBD20250916002': {
            customerName: '北京YY科技有限公司',
            businessType: '空运普货',
            entryStatus: '录费中'
        },
        'HCBD20250916003': {
            customerName: '深圳ZZ制造有限公司',
            businessType: '海运拼箱',
            entryStatus: '录费中'
        }
    };
    
    return orderInfoMap[orderId] || {
        customerName: '未知客户',
        businessType: '未知业务',
        entryStatus: '录费中'
    };
}

/**
 * 生成模拟费用明细
 */
function generateMockEntries(orderId) {
    return [
        {
            id: 'EE1001',
            orderId: orderId,
            serviceCode: 'MBL_PROCESSING',
            serviceName: 'MBL处理',
            feeCode: 'FCL001',
            feeName: '海运费',
            entryType: 'RECEIVABLE',
            counterpartEntity: '上海XX贸易有限公司',
            counterpartDepartment: '业务部',
            ourEntityId: 'HCBD_SHANGHAI',
            ourEntityName: '海程邦达物流(上海)有限公司',
            amount: 15000.00,
            currency: 'CNY',
            isTransitEntity: false,
            validationStatus: 'VALID'
        },
        {
            id: 'EE1002',
            orderId: orderId,
            serviceCode: 'TERMINAL_HANDLING',
            serviceName: '码头操作',
            feeCode: 'THC001',
            feeName: '码头操作费',
            entryType: 'PAYABLE',
            counterpartEntity: '上海港集团',
            counterpartDepartment: '码头运营部',
            ourEntityId: 'HCBD_SHANGHAI',
            ourEntityName: '海程邦达物流(上海)有限公司',
            amount: 1200.00,
            currency: 'CNY',
            isTransitEntity: false,
            validationStatus: 'VALID'
        }
    ];
}

/**
 * 获取模拟订单信息
 */
function getMockOrderInfo(orderId) {
    return {
        orderId: orderId,
        entryStatus: 'IN_PROGRESS',
        receivableCount: 1,
        payableCount: 1,
        totalReceivable: 15000.00,
        totalPayable: 1200.00
    };
}

/**
 * 获取模拟法人实体
 */
function getMockLegalEntities() {
    return [
        { entityId: 'HCBD_SHANGHAI', entityName: '海程邦达物流(上海)有限公司', isTransitEntity: false },
        { entityId: 'HCBD_BEIJING', entityName: '海程邦达物流(北京)有限公司', isTransitEntity: false },
        { entityId: 'HCBD_SHENZHEN', entityName: '海程邦达物流(深圳)有限公司', isTransitEntity: false },
        { entityId: 'HCBD_HONGKONG', entityName: '海程邦达物流(香港)有限公司', isTransitEntity: true },
        { entityId: 'HCBD_SINGAPORE', entityName: '海程邦达物流(新加坡)有限公司', isTransitEntity: true }
    ];
}

/**
 * 获取模拟费用科目
 */
function getMockFeeCodes() {
    return [
        { feeCode: 'FCL001', feeName: '海运费', category: '跨境运输费用' },
        { feeCode: 'THC001', feeName: '码头操作费', category: '码头港口场站费用' },
        { feeCode: 'CUSTOMS001', feeName: '报关费', category: '单证文件费用' },
        { feeCode: 'TRUCKING001', feeName: '拖车费', category: '境内运输费用' },
        { feeCode: 'BAF001', feeName: '燃油附加费', category: '跨境运输费用' },
        { feeCode: 'CFS001', feeName: '拼箱费', category: '集装箱费用' },
        { feeCode: 'WAREHOUSE001', feeName: '仓储费', category: '仓储服务费用' }
    ];
}

/**
 * 获取模拟服务项目
 */
function getMockServiceCodes() {
    return [
        { serviceCode: 'MBL_PROCESSING', serviceName: 'MBL处理', businessType: '海运' },
        { serviceCode: 'BOOKING', serviceName: '订舱', businessType: '海运' },
        { serviceCode: 'VESSEL_MANIFEST', serviceName: '舱单', businessType: '海运' },
        { serviceCode: 'CUSTOMS_DECLARATION', serviceName: '报关', businessType: '关务' },
        { serviceCode: 'CUSTOMS_CLEARANCE', serviceName: '清关', businessType: '关务' },
        { serviceCode: 'INLAND_TRANSPORT', serviceName: '境内运输', businessType: '陆运' },
        { serviceCode: 'TERMINAL_HANDLING', serviceName: '码头操作', businessType: '港口服务' }
    ];
}

/**
 * 获取模拟校验结果
 */
function getMockValidation(feeCode, serviceCode, supplierType) {
    // 简单的模拟校验逻辑
    const validCombinations = {
        'FCL001': ['MBL_PROCESSING', 'BOOKING'],
        'THC001': ['TERMINAL_HANDLING'],
        'CUSTOMS001': ['CUSTOMS_DECLARATION', 'CUSTOMS_CLEARANCE'],
        'TRUCKING001': ['INLAND_TRANSPORT']
    };
    
    const validServices = validCombinations[feeCode] || [];
    
    if (validServices.includes(serviceCode)) {
        return {
            validationResult: 'VALID',
            serviceCompatible: true,
            supplierCompatible: true,
            warningMessage: null
        };
    } else if (serviceCode) {
        return {
            validationResult: 'WARNING',
            serviceCompatible: false,
            supplierCompatible: true,
            warningMessage: `费用科目 ${feeCode} 通常不用于服务 ${serviceCode}，请确认`
        };
    } else {
        return {
            validationResult: 'VALID',
            serviceCompatible: true,
            supplierCompatible: true,
            warningMessage: null
        };
    }
}

/**
 * 获取模拟适用服务
 */
function getMockApplicableServices(feeCode) {
    const applicableMap = {
        'FCL001': 'MBL处理, 订舱, 舱单',
        'THC001': '码头操作, 集装箱处理',
        'CUSTOMS001': '报关, 清关',
        'TRUCKING001': '境内运输, 提货派送'
    };
    return applicableMap[feeCode] || '未配置';
}

/**
 * 获取模拟适用供应商
 */
function getMockApplicableSuppliers(feeCode) {
    const supplierMap = {
        'FCL001': '船公司, 货代公司',
        'THC001': '码头运营商, 港务局',
        'CUSTOMS001': '报关行, 货代公司',
        'TRUCKING001': '拖车公司, 物流服务商'
    };
    return supplierMap[feeCode] || '未配置';
}

/**
 * 创建模拟明细
 */
function createMockEntry(formData) {
    const serviceName = serviceCodes.find(s => s.serviceCode === formData.serviceCode)?.serviceName || formData.serviceCode;
    const feeName = feeCodes.find(f => f.feeCode === formData.feeCode)?.feeName || formData.feeCode;
    const ourEntityName = legalEntities.find(e => e.entityId === formData.ourEntityId)?.entityName || formData.ourEntityId;
    
    return {
        id: 'EE' + Date.now(),
        ...formData,
        serviceName,
        feeName,
        ourEntityName,
        validationStatus: 'VALID',
        createdTime: new Date().toISOString()
    };
}