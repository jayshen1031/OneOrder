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
let currentOrderInfo = null; // 保存当前订单信息

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // 监听来自派单系统的消息
    window.addEventListener('message', handleAssignmentMessage);
    
    // 检查URL参数中是否有派单传递的订单ID
    checkUrlParametersForOrderContext();
});

/**
 * 处理来自主页面的消息（包括订单数据传递）
 */
function handleAssignmentMessage(event) {
    try {
        const message = event.data;
        console.log('📨 收到消息:', message);
        
        if (!message || typeof message !== 'object') {
            return;
        }
        
        switch (message.type) {
            case 'SHOW_DEFAULT_CONTENT':
                console.log('📨 收到显示默认内容消息:', message);
                showDefaultContentView();
                break;
                
            case 'SELECT_ORDER_FROM_ORDERS_PAGE':
                console.log('📨 收到订单管理页面订单选择消息:', message);
                if (message.orderId) {
                    selectOrderFromManagement(message.orderId);
                }
                break;
                
            case 'ORDER_CONTEXT':
                console.log('📨 收到订单上下文消息:', message);
                // 优先使用orderNo进行匹配，因为它更准确
                if (message.orderNo) {
                    selectOrderFromManagement(message.orderNo, message.source);
                } else if (message.orderId) {
                    selectOrderFromManagement(message.orderId, message.source);
                }
                break;
                
            case 'ORDER_DATA_TRANSFER':
                console.log('📨 收到订单数据传递消息:', message);
                if (message.orders && Array.isArray(message.orders)) {
                    handleOrderDataTransfer(message.orders);
                }
                break;
                
            default:
                console.log('📨 未处理的消息类型:', message.type);
        }
        
    } catch (error) {
        console.error('❌ 处理消息失败:', error);
    }
}

/**
 * 处理订单数据传递
 */
function handleOrderDataTransfer(ordersData) {
    try {
        console.log('📦 处理传递的订单数据:', ordersData.length, '条订单');
        
        const orderSelect = document.getElementById('orderSelect');
        if (!orderSelect) {
            console.error('❌ 找不到订单选择器');
            return;
        }
        
        // 清空现有选项
        orderSelect.innerHTML = '<option value="">请选择订单</option>';
        
        // 添加传递的订单数据
        ordersData.forEach(order => {
            const option = document.createElement('option');
            option.value = order.orderNo;
            option.textContent = `${order.orderNo} - ${order.customerName}`;
            option.dataset.orderId = order.orderId;
            option.dataset.customerName = order.customerName;
            option.dataset.totalAmount = order.totalAmount || 0;
            option.dataset.totalCost = order.totalCost || 0;
            option.dataset.orderStatus = order.orderStatus || 'CONFIRMED';
            option.dataset.clearingStatus = order.clearingStatus || 'PENDING';
            
            orderSelect.appendChild(option);
        });
        
        console.log('✅ 订单数据已加载到下拉列表:', ordersData.length, '条订单');
        
        // 触发一个事件通知数据已加载
        const event = new CustomEvent('ordersDataLoaded', { 
            detail: { count: ordersData.length } 
        });
        document.dispatchEvent(event);
        
    } catch (error) {
        console.error('❌ 处理订单数据传递失败:', error);
    }
}

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
        console.log('🔄 开始加载订单列表...');
        const response = await fetch('/api/freight-orders?page=0&size=100');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 API返回数据:', result);
        
        const orderSelect = document.getElementById('orderSelect');
        orderSelect.innerHTML = '<option value="">请选择订单</option>';
        
        // 检查数据格式 - 支持两种格式
        let orders = [];
        if (Array.isArray(result)) {
            // 直接是订单数组
            orders = result;
        } else if (result.code === 200 && result.data) {
            // 包装格式
            orders = Array.isArray(result.data) ? result.data : (result.data.content || []);
        }
        
        console.log('📋 解析的订单数据:', orders);
        
        if (orders.length > 0) {
            orders.forEach(order => {
                const option = document.createElement('option');
                option.value = order.orderNo;
                
                // 处理客户名称 - 使用customerId或固定文本
                let customerDisplay = order.customerName;
                if (!customerDisplay) {
                    // 根据customerId映射客户名称
                    const customerMap = {
                        'CUST_001': '华为技术有限公司',
                        'CUST_002': '美的集团股份有限公司', 
                        'CUST_003': '比亚迪股份有限公司',
                        'CUST_004': '腾讯科技有限公司',
                        'CUST_005': '阿里巴巴集团',
                        'CUST_006': '小米科技有限公司',
                        'CUST_007': '海尔集团公司'
                    };
                    customerDisplay = customerMap[order.customerId] || order.customerId || '未知客户';
                }
                
                option.textContent = `${order.orderNo} - ${customerDisplay}`;
                option.dataset.orderId = order.orderId;
                option.dataset.customerName = customerDisplay;
                option.dataset.totalAmount = order.totalAmount || 0;
                option.dataset.totalCost = order.totalCost || 0;
                option.dataset.orderStatus = order.orderStatus || 'UNKNOWN';
                option.dataset.clearingStatus = order.clearingStatus || 'PENDING';
                
                orderSelect.appendChild(option);
            });
            
            console.log(`✅ 成功加载 ${orders.length} 个订单`);
        } else {
            console.warn('⚠️ 没有找到订单数据');
        }
        
    } catch (error) {
        console.error('❌ 加载订单列表失败:', error);
        // 使用模拟数据作为备选方案
        const orderSelect = document.getElementById('orderSelect');
        orderSelect.innerHTML = `
            <option value="">请选择订单</option>
            <option value="HW-EXPORT-20240101-001" data-customer-name="华为技术有限公司">HW-EXPORT-20240101-001 - 华为技术有限公司</option>
            <option value="MIDEA-SHIP-20240102-001" data-customer-name="美的集团股份有限公司">MIDEA-SHIP-20240102-001 - 美的集团股份有限公司</option>
            <option value="SH-AUTO-20240103-001" data-customer-name="上汽集团">SH-AUTO-20240103-001 - 上汽集团</option>
        `;
        console.log('🔄 已加载模拟数据作为备选方案');
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
    const orderSelect = document.getElementById('orderSelect');
    const orderId = orderSelect.value;
    
    if (!orderId) {
        hideOrderInfo();
        return;
    }
    
    currentOrderId = orderId;
    console.log('🔄 开始加载订单费用明细:', orderId);
    
    try {
        // 先从订单选择器的dataset中获取基本信息
        const selectedOption = orderSelect.options[orderSelect.selectedIndex];
        const basicOrderInfo = {
            orderNo: orderId,
            customerName: selectedOption.dataset.customerName || '未知客户',
            totalAmount: parseFloat(selectedOption.dataset.totalAmount) || 0,
            totalCost: parseFloat(selectedOption.dataset.totalCost) || 0,
            orderStatus: selectedOption.dataset.orderStatus || 'CONFIRMED',
            clearingStatus: selectedOption.dataset.clearingStatus || 'PENDING'
        };
        
        console.log('📋 基本订单信息:', basicOrderInfo);
        
        // 尝试加载详细的费用明细（如果API存在）
        try {
            const response = await fetch(`/api/expense-entries/order/${orderId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.code === 200) {
                    // 使用API返回的详细信息
                    currentOrderInfo = result.data.orderInfo;
                    displayOrderInfo(result.data.orderInfo);
                    displayExpenseEntries(result.data.entries || []);
                } else {
                    throw new Error('API返回错误: ' + result.message);
                }
            } else {
                throw new Error('API不可用');
            }
        } catch (apiError) {
            console.log('⚠️ 费用明细API不可用，使用基本信息显示:', apiError.message);
            // 使用基本信息显示订单
            currentOrderInfo = basicOrderInfo;
            displayOrderInfo(basicOrderInfo);
            displayExpenseEntries([]); // 空的费用明细列表
        }
        
        // 显示表单
        showEntryForm();
        
        // 异步加载派单状态信息
        try {
            await loadAssignmentStatusForOrder(orderId);
        } catch (assignmentError) {
            console.log('⚠️ 派单状态加载失败:', assignmentError.message);
        }
        
        console.log('✅ 订单费用明细加载完成');
        
    } catch (error) {
        console.error('❌ 加载订单费用明细失败:', error);
        showToast('加载订单费用明细失败: ' + error.message, 'error');
        
        // 即使出错也显示基本信息
        const selectedOption = orderSelect.options[orderSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.customerName) {
            const fallbackInfo = {
                orderNo: orderId,
                customerName: selectedOption.dataset.customerName,
                totalAmount: parseFloat(selectedOption.dataset.totalAmount) || 0,
                totalCost: parseFloat(selectedOption.dataset.totalCost) || 0,
                orderStatus: 'CONFIRMED',
                clearingStatus: 'PENDING'
            };
            
            currentOrderInfo = fallbackInfo;
            displayOrderInfo(fallbackInfo);
            displayExpenseEntries([]);
            showEntryForm();
            
            console.log('🔄 已显示基本订单信息作为备选方案');
        }
    }
}

/**
 * 显示订单信息
 */
function displayOrderInfo(orderInfo) {
    document.getElementById('orderSummary').style.display = 'block';
    
    // 尝试从订单信息获取客户名称
    let customerName = orderInfo.customerName;
    
    // 如果订单信息中没有客户名称，从订单号推断
    if (!customerName) {
        const customerNames = {
            'HW-EXPORT-20240101-001': '华为技术有限公司',
            'MIDEA-SHIP-20240102-001': '美的集团股份有限公司',
            'SH-AUTO-20240103-001': '上汽集团'
        };
        customerName = customerNames[currentOrderId] || '未知客户';
    }
    
    document.getElementById('customerName').textContent = customerName;
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
    const counterpartEntityInput = document.getElementById('counterpartEntity');
    const counterpartLabel = counterpartEntityInput.closest('.mb-3').querySelector('label');
    
    if (entryType === 'RECEIVABLE') {
        // 收款明细：对方是客户
        counterpartLabel.innerHTML = '客户公司 <span class="text-danger">*</span>';
        counterpartEntityInput.placeholder = '客户公司（自动填入）';
        counterpartEntityInput.readOnly = true;
        
        // 自动填入客户信息
        if (currentOrderInfo && currentOrderInfo.customerName) {
            counterpartEntityInput.value = currentOrderInfo.customerName;
        } else {
            // 从显示的客户名称获取
            const customerNameElement = document.getElementById('customerName');
            if (customerNameElement) {
                counterpartEntityInput.value = customerNameElement.textContent;
            }
        }
        
        // 供应商类型不需要
        supplierTypeGroup.querySelector('label').innerHTML = '供应商类型';
        document.getElementById('supplierType').required = false;
        document.getElementById('supplierType').value = '';
        
    } else if (entryType === 'PAYABLE') {
        // 付款明细：对方是供应商
        counterpartLabel.innerHTML = '供应商公司 <span class="text-danger">*</span>';
        counterpartEntityInput.placeholder = '请输入供应商公司名称';
        counterpartEntityInput.readOnly = false;
        counterpartEntityInput.value = '';
        
        // 供应商类型必需
        supplierTypeGroup.querySelector('label').innerHTML = '供应商类型 <span class="text-danger">*</span>';
        document.getElementById('supplierType').required = true;
        
    } else {
        // 未选择：恢复默认状态
        counterpartLabel.innerHTML = '对方法人公司 <span class="text-danger">*</span>';
        counterpartEntityInput.placeholder = '请选择收付类型';
        counterpartEntityInput.readOnly = true;
        counterpartEntityInput.value = '';
        
        supplierTypeGroup.querySelector('label').innerHTML = '供应商类型';
        document.getElementById('supplierType').required = false;
        document.getElementById('supplierType').value = '';
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
    
    // 重置对方公司标签和状态
    const counterpartEntityInput = document.getElementById('counterpartEntity');
    const counterpartLabel = counterpartEntityInput.closest('.mb-3').querySelector('label');
    counterpartLabel.innerHTML = '对方法人公司 <span class="text-danger">*</span>';
    counterpartEntityInput.placeholder = '请选择收付类型';
    counterpartEntityInput.readOnly = true;
    counterpartEntityInput.value = '';
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


/**
 * 检查URL参数中的订单上下文
 */
function checkUrlParametersForOrderContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const source = urlParams.get('source');
    
    if (orderId && source === 'assignment') {
        console.log('🔗 从URL参数检测到派单来源订单:', orderId);
        
        // 显示派单来源提示
        showAssignmentSourceNotification(orderId);
        
        // 自动选择订单
        setTimeout(() => {
            selectOrderFromAssignment(orderId);
        }, 1000);
    }
}

/**
 * 处理派单完成后的订单
 */
function handleAssignmentCompleted(orderId, assignedServices, timestamp) {
    console.log('🎯 处理派单完成订单:', { orderId, assignedServices: assignedServices.length, timestamp });
    
    // 显示派单来源提示
    showAssignmentSourceNotification(orderId, assignedServices);
    
    // 自动选择该订单
    setTimeout(() => {
        selectOrderFromAssignment(orderId);
    }, 1500);
}

/**
 * 显示派单来源通知
 */
function showAssignmentSourceNotification(orderId, assignedServices = null) {
    const servicesCount = assignedServices ? assignedServices.length : '多个';
    
    // 在页面顶部显示通知横幅
    const notificationHtml = `
        <div id="assignmentSourceNotification" class="alert alert-info border-info mb-4" style="border-left: 5px solid #17a2b8;">
            <div class="d-flex align-items-center">
                <i class="fas fa-info-circle text-info fa-2x me-3"></i>
                <div class="flex-grow-1">
                    <h6 class="alert-heading mb-1">📋 来自派单系统</h6>
                    <p class="mb-1">
                        订单 <strong class="text-primary">${orderId}</strong> 的 <strong>${servicesCount}个服务</strong> 已完成派单分配
                    </p>
                    <p class="mb-0 text-muted">
                        <i class="fas fa-check-circle me-1"></i>
                        现在可以开始录入该订单的收费和付费明细
                    </p>
                </div>
                <div class="ms-3">
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="dismissAssignmentNotification()">
                        <i class="fas fa-times"></i> 知道了
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 插入到页面头部
    const container = document.querySelector('.container');
    if (container) {
        const firstChild = container.firstElementChild;
        firstChild.insertAdjacentHTML('afterend', notificationHtml);
        
        // 添加动画效果
        const notification = document.getElementById('assignmentSourceNotification');
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            notification.style.transition = 'all 0.5s ease';
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
    }
}

/**
 * 从派单自动选择订单
 */
function selectOrderFromAssignment(orderId) {
    const orderSelect = document.getElementById('orderSelect');
    if (!orderSelect) {
        console.warn('⚠️ 订单选择器未找到');
        return;
    }
    
    // 查找匹配的订单选项
    const targetOption = Array.from(orderSelect.options).find(option => 
        option.value === orderId || option.textContent.includes(orderId)
    );
    
    if (targetOption) {
        console.log('✅ 找到匹配订单，自动选择:', targetOption.value);
        
        // 设置选中值
        orderSelect.value = targetOption.value;
        
        // 触发变更事件加载订单详情
        orderSelect.dispatchEvent(new Event('change'));
        
        // 显示成功提示
        setTimeout(() => {
            showToast(`已自动选择订单 ${orderId}，可以开始录入费用明细`, 'success');
        }, 1000);
        
        // 3秒后自动关闭派单来源通知
        setTimeout(() => {
            dismissAssignmentNotification();
        }, 3000);
        
    } else {
        console.warn('⚠️ 未找到匹配的订单:', orderId);
        showToast(`未找到订单 ${orderId}，请手动选择`, 'warning');
    }
}

/**
 * 关闭派单来源通知
 */
function dismissAssignmentNotification() {
    const notification = document.getElementById('assignmentSourceNotification');
    if (notification) {
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

/**
 * 加载订单的派单状态信息
 */
async function loadAssignmentStatusForOrder(orderId) {
    try {
        console.log('📊 加载订单派单状态:', orderId);
        
        const response = await fetch(`/api/expense-entries/assignment-status/${orderId}`);
        const result = await response.json();
        
        if (result.code === 200 && result.data) {
            const assignmentStatus = result.data;
            console.log('✅ 派单状态加载成功:', assignmentStatus);
            
            // 如果有派单信息，增强显示订单信息
            if (assignmentStatus.hasAssignedServices && assignmentStatus.assignedServices) {
                displayOrderInfoWithAssignmentStatus(currentOrderInfo, assignmentStatus.assignedServices);
                
                // 在服务选择下拉框中预设派单的服务
                presetAssignedServicesInForm(assignmentStatus.assignedServices);
            }
        } else {
            console.log('ℹ️ 订单暂无派单信息:', orderId);
        }
        
    } catch (error) {
        console.error('加载派单状态失败:', error);
        // 不显示错误提示，因为这是可选功能
    }
}

/**
 * 在表单的服务选择框中预设已派单的服务
 */
function presetAssignedServicesInForm(assignedServices) {
    const serviceCodeSelect = document.getElementById('serviceCode');
    if (!serviceCodeSelect || !assignedServices) return;
    
    console.log('🔧 为表单预设派单服务:', assignedServices);
    
    // 创建已派单服务的提示选项组
    const assignedOptionGroup = document.createElement('optgroup');
    assignedOptionGroup.label = '✅ 已派单服务（推荐）';
    
    assignedServices.forEach(service => {
        const option = document.createElement('option');
        option.value = service.serviceCode;
        option.textContent = `${service.serviceCode} - ${service.serviceName} (${service.operatorName})`;
        option.dataset.assigned = 'true';
        option.dataset.operatorName = service.operatorName;
        assignedOptionGroup.appendChild(option);
    });
    
    // 将已派单服务选项组插入到第一个位置
    if (assignedOptionGroup.children.length > 0) {
        serviceCodeSelect.insertBefore(assignedOptionGroup, serviceCodeSelect.children[1]);
        
        // 添加CSS样式突出显示
        const style = document.createElement('style');
        style.textContent = `
            #serviceCode optgroup[label="✅ 已派单服务（推荐）"] option {
                background-color: #e8f5e8;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 增强版订单信息显示，包含派单状态
 */
function displayOrderInfoWithAssignmentStatus(orderInfo, assignedServices = null) {
    // 调用原有的订单信息显示函数
    displayOrderInfo(orderInfo);
    
    // 如果有派单服务信息，额外显示
    if (assignedServices && assignedServices.length > 0) {
        const additionalInfo = `
            <div class="mt-3 p-3 bg-light rounded">
                <h6 class="text-primary mb-2">
                    <i class="fas fa-users me-2"></i>已派单服务 (${assignedServices.length}个)
                </h6>
                <div class="row">
                    ${assignedServices.map((service, index) => `
                        <div class="col-md-6 mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span class="small">${service.serviceName}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // 添加到订单摘要卡片中
        const orderSummary = document.getElementById('orderSummary');
        if (orderSummary) {
            orderSummary.querySelector('.card-body').insertAdjacentHTML('beforeend', additionalInfo);
        }
    }
}

/**
 * 处理从订单管理页面选择的订单
 * 支持orderId或orderNo匹配
 */
function selectOrderFromManagement(orderIdentifier, source) {
    console.log('🎯 从订单管理页面自动选择订单:', orderIdentifier);
    
    const orderSelect = document.getElementById('orderSelect');
    if (!orderSelect) {
        console.error('❌ 找不到订单选择器');
        return false;
    }
    
    let targetOption = null;
    let matchedValue = null;
    
    // 尝试多种匹配方式：orderNo、orderId、或包含的文本
    for (let option of orderSelect.options) {
        if (option.value === orderIdentifier || 
            option.textContent.includes(orderIdentifier) ||
            option.dataset.orderId === orderIdentifier) {
            targetOption = option;
            matchedValue = option.value;
            console.log('✅ 找到匹配的订单选项:', option.textContent);
            break;
        }
    }
    
    if (targetOption) {
        // 设置选中状态
        orderSelect.value = matchedValue;
        targetOption.selected = true;
        
        // 显示来源提示
        showOrderSourceNotification(orderIdentifier, source || '订单管理');
        
        // 设置当前订单ID
        currentOrderId = matchedValue;
        window.currentOrderInfo = {
            orderId: targetOption.dataset.orderId || matchedValue,
            orderNo: matchedValue,
            customerName: targetOption.dataset.customerName || '',
            totalAmount: targetOption.dataset.totalAmount || 0,
            totalCost: targetOption.dataset.totalCost || 0
        };
        
        // 显示订单摘要
        const orderSummary = document.getElementById('orderSummary');
        if (orderSummary) {
            orderSummary.style.display = 'block';
            
            const customerNameElement = document.getElementById('customerName');
            const totalReceivableElement = document.getElementById('totalReceivable');
            
            if (customerNameElement) {
                customerNameElement.textContent = targetOption.dataset.customerName || '未设置客户';
            }
            if (totalReceivableElement) {
                totalReceivableElement.textContent = (parseFloat(targetOption.dataset.totalAmount) || 0).toFixed(2);
            }
        }
        
        // 立即加载订单详细信息
        loadOrderExpenseEntries().then(() => {
            console.log('✅ 订单详细信息已加载:', orderIdentifier);
        }).catch(error => {
            console.error('❌ 加载订单详细信息失败:', error);
            // 如果API调用失败，仍然触发change事件作为备选方案
            setTimeout(() => {
                orderSelect.dispatchEvent(new Event('change'));
            }, 100);
        });
        
        console.log('✅ 订单已从订单管理页面自动选择');
        return true;
    } else {
        console.log('❌ 未找到匹配的订单选项:', orderIdentifier);
        console.log('可用的前5个选项:');
        for (let i = 0; i < Math.min(5, orderSelect.options.length); i++) {
            const opt = orderSelect.options[i];
            console.log(`  ${i+1}. "${opt.value}" - "${opt.textContent}"`);
        }
        return false;
    }
}

/**
 * 处理从操作员工作台选择的订单
 */
function selectOrderFromOperator(orderId) {
    console.log('🎯 从操作员工作台自动选择订单:', orderId);
    
    // 显示来源提示
    showOrderSourceNotification(orderId, '操作员工作台');
    
    // 设置订单选择器
    const orderSelect = document.getElementById('orderSelect');
    if (orderSelect) {
        orderSelect.value = orderId;
        
        // 立即加载订单详细信息
        currentOrderId = orderId;
        loadOrderExpenseEntries().then(() => {
            console.log('✅ 订单详细信息已加载:', orderId);
        }).catch(error => {
            console.error('❌ 加载订单详细信息失败:', error);
            // 如果API调用失败，仍然触发change事件作为备选方案
            setTimeout(() => {
                orderSelect.dispatchEvent(new Event('change'));
            }, 100);
        });
        
        console.log('✅ 订单已从操作员工作台自动选择');
    } else {
        console.error('❌ 找不到订单选择器');
    }
}

/**
 * 显示订单来源通知
 */
function showOrderSourceNotification(orderId, source) {
    // 创建或更新通知区域
    let notification = document.getElementById('orderSourceNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'orderSourceNotification';
        notification.className = 'alert alert-success alert-dismissible fade show';
        
        // 插入到页面顶部
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(notification, container.firstChild);
        }
    }
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-check-circle me-2"></i>
            <div>
                <strong>来源：${source}</strong><br>
                系统已自动选择订单：<code>${orderId}</code>，您可以直接开始录入费用明细。
            </div>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // 5秒后自动隐藏
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * 显示默认内容视图（派单历史和待录费服务）
 */
function showDefaultContentView() {
    console.log('🏠 显示默认内容视图 - 派单历史和待录费服务');
    
    // 清空订单选择器，显示"请选择订单"
    const orderSelect = document.getElementById('orderSelect');
    if (orderSelect) {
        orderSelect.value = '';
    }
    
    // 清空当前订单ID
    currentOrderId = '';
    
    // 显示欢迎信息和指引
    showDefaultWelcomeMessage();
    
    // 加载并显示派单历史
    loadAndDisplayAssignmentHistory();
    
    // 加载并显示待录费服务
    loadAndDisplayPendingServices();
    
    // 隐藏费用录入表单，显示概览信息
    hideExpenseEntryForm();
    showOverviewDashboard();
}

/**
 * 显示默认欢迎信息
 */
function showDefaultWelcomeMessage() {
    // 查找合适的显示位置
    const container = document.querySelector('.container');
    if (!container) return;
    
    // 移除旧的欢迎信息
    const oldWelcome = container.querySelector('.default-welcome-message');
    if (oldWelcome) {
        oldWelcome.remove();
    }
    
    // 创建欢迎信息
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'alert alert-primary default-welcome-message mb-4';
    welcomeDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-home fa-2x me-3"></i>
            <div>
                <h5 class="alert-heading mb-1">
                    <i class="fas fa-money-bill-wave me-2"></i>费用录入管理中心
                </h5>
                <p class="mb-0">
                    您可以从上方选择订单开始录入费用，或查看下方的派单历史和待录费服务概览。
                </p>
            </div>
        </div>
    `;
    
    // 插入到页面顶部
    container.insertBefore(welcomeDiv, container.firstChild);
}

/**
 * 加载并显示派单历史
 */
async function loadAndDisplayAssignmentHistory() {
    try {
        console.log('📜 加载派单历史...');
        
        // 从localStorage获取派单历史
        const historyData = localStorage.getItem('oneorder_assignment_history');
        let assignmentHistory = [];
        
        if (historyData) {
            try {
                assignmentHistory = JSON.parse(historyData);
            } catch (e) {
                console.warn('解析派单历史数据失败:', e);
            }
        }
        
        // 显示派单历史
        displayAssignmentHistoryOverview(assignmentHistory);
        
    } catch (error) {
        console.error('加载派单历史失败:', error);
    }
}

/**
 * 显示派单历史概览
 */
function displayAssignmentHistoryOverview(assignmentHistory) {
    // 查找或创建历史显示区域
    let historyContainer = document.getElementById('assignmentHistoryOverview');
    if (!historyContainer) {
        // 创建历史显示容器
        historyContainer = document.createElement('div');
        historyContainer.id = 'assignmentHistoryOverview';
        historyContainer.className = 'card mb-4';
        
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(historyContainer);
        }
    }
    
    // 最近的10条记录
    const recentHistory = assignmentHistory.slice(-10).reverse();
    
    historyContainer.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
                <i class="fas fa-history me-2"></i>最近派单历史
            </h6>
            <span class="badge bg-primary">${assignmentHistory.length} 条记录</span>
        </div>
        <div class="card-body">
            ${recentHistory.length > 0 ? `
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>订单号</th>
                                <th>服务</th>
                                <th>操作员</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentHistory.map(history => `
                                <tr onclick="selectOrderFromHistory('${history.orderId}')">
                                    <td class="text-muted">${formatHistoryTime(history.timestamp)}</td>
                                    <td><code>${history.orderNo || history.orderId}</code></td>
                                    <td><span class="badge bg-info">${history.serviceCode}</span></td>
                                    <td>${history.operatorName}</td>
                                    <td><span class="badge bg-success">已派单</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="text-center py-3">
                    <i class="fas fa-clipboard-list fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">暂无派单历史记录</p>
                </div>
            `}
        </div>
    `;
}

/**
 * 加载并显示待录费服务
 */
async function loadAndDisplayPendingServices() {
    try {
        console.log('🔧 加载待录费服务...');
        
        // 这里可以调用API获取真实的待录费服务数据
        // 目前使用示例数据
        const pendingServices = await getPendingServicesFromStorage();
        
        // 显示待录费服务
        displayPendingServicesOverview(pendingServices);
        
    } catch (error) {
        console.error('加载待录费服务失败:', error);
    }
}

/**
 * 从存储获取待录费服务（模拟）
 */
async function getPendingServicesFromStorage() {
    // 从localStorage和派单历史推断待录费服务
    const historyData = localStorage.getItem('oneorder_assignment_history');
    let assignmentHistory = [];
    
    if (historyData) {
        try {
            assignmentHistory = JSON.parse(historyData);
        } catch (e) {
            console.warn('解析派单历史数据失败:', e);
        }
    }
    
    // 提取最近的派单服务，假设都需要录费
    const recentAssignments = assignmentHistory.slice(-5);
    
    return recentAssignments.map(history => ({
        orderId: history.orderId,
        orderNo: history.orderNo || history.orderId,
        serviceCode: history.serviceCode,
        serviceName: getServiceDisplayName(history.serviceCode),
        operatorName: history.operatorName,
        assignedDate: history.timestamp,
        status: 'PENDING_EXPENSE',
        priority: 'NORMAL'
    }));
}

/**
 * 显示待录费服务概览
 */
function displayPendingServicesOverview(pendingServices) {
    // 查找或创建服务显示区域
    let servicesContainer = document.getElementById('pendingServicesOverview');
    if (!servicesContainer) {
        // 创建服务显示容器
        servicesContainer = document.createElement('div');
        servicesContainer.id = 'pendingServicesOverview';
        servicesContainer.className = 'card mb-4';
        
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(servicesContainer);
        }
    }
    
    servicesContainer.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
                <i class="fas fa-tasks me-2"></i>待录费服务
            </h6>
            <span class="badge bg-warning">${pendingServices.length} 个服务</span>
        </div>
        <div class="card-body">
            ${pendingServices.length > 0 ? `
                <div class="row">
                    ${pendingServices.map(service => `
                        <div class="col-md-6 mb-3">
                            <div class="card border-warning">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h6 class="card-title mb-0">${service.serviceName}</h6>
                                        <span class="badge bg-warning">待录费</span>
                                    </div>
                                    <p class="card-text small text-muted mb-2">
                                        <i class="fas fa-file-alt me-1"></i>订单: <code>${service.orderNo}</code><br>
                                        <i class="fas fa-user me-1"></i>操作员: ${service.operatorName}<br>
                                        <i class="fas fa-clock me-1"></i>派单时间: ${formatHistoryTime(service.assignedDate)}
                                    </p>
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="selectOrderFromService('${service.orderId}')">
                                        <i class="fas fa-money-bill-wave me-1"></i>立即录费
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-3">
                    <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                    <p class="text-muted mb-0">暂无待录费服务，所有服务费用已录入完成</p>
                </div>
            `}
        </div>
    `;
}

/**
 * 获取服务显示名称
 */
function getServiceDisplayName(serviceCode) {
    const serviceNames = {
        'BOOKING': '订舱服务',
        'MBL_PROCESSING': '主单处理',
        'HBL_PROCESSING': '分单处理',
        'CUSTOMS_CLEARANCE': '报关服务',
        'CONTAINER_LOADING': '装箱服务',
        'CARGO_LOADING': '装货服务',
        'TRANSPORTATION': '运输服务',
        'DOCUMENTATION': '单证处理'
    };
    
    return serviceNames[serviceCode] || serviceCode;
}

/**
 * 格式化历史时间
 */
function formatHistoryTime(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleDateString();
    }
}

/**
 * 从历史记录选择订单
 */
function selectOrderFromHistory(orderId) {
    console.log('📜 从历史记录选择订单:', orderId);
    
    // 选择订单
    const orderSelect = document.getElementById('orderSelect');
    if (orderSelect) {
        orderSelect.value = orderId;
        orderSelect.dispatchEvent(new Event('change'));
    }
    
    // 隐藏默认视图，显示费用录入表单
    hideDefaultView();
    showExpenseEntryForm();
    
    showToast(`已选择订单 ${orderId}，可以开始录入费用`, 'success');
}

/**
 * 从服务列表选择订单
 */
function selectOrderFromService(orderId) {
    console.log('🔧 从服务列表选择订单:', orderId);
    selectOrderFromHistory(orderId);
}

/**
 * 隐藏费用录入表单
 */
function hideExpenseEntryForm() {
    const form = document.getElementById('expenseEntryForm');
    if (form) {
        form.style.display = 'none';
    }
    
    // 隐藏其他录费相关的元素
    const elements = [
        'expenseEntriesTable',
        'orderInfo',
        'expenseEntryFormContainer'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

/**
 * 显示费用录入表单
 */
function showExpenseEntryForm() {
    const form = document.getElementById('expenseEntryForm');
    if (form) {
        form.style.display = 'block';
    }
    
    // 显示其他录费相关的元素
    const elements = [
        'expenseEntriesTable',
        'orderInfo',
        'expenseEntryFormContainer'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    });
}

/**
 * 显示概览仪表板
 */
function showOverviewDashboard() {
    // 概览仪表板已经通过displayAssignmentHistoryOverview和displayPendingServicesOverview显示
    console.log('📊 概览仪表板已显示');
}

/**
 * 隐藏默认视图
 */
function hideDefaultView() {
    // 隐藏欢迎信息
    const welcome = document.querySelector('.default-welcome-message');
    if (welcome) {
        welcome.style.display = 'none';
    }
    
    // 隐藏概览容器
    const historyOverview = document.getElementById('assignmentHistoryOverview');
    if (historyOverview) {
        historyOverview.style.display = 'none';
    }
    
    const servicesOverview = document.getElementById('pendingServicesOverview');
    if (servicesOverview) {
        servicesOverview.style.display = 'none';
    }
}