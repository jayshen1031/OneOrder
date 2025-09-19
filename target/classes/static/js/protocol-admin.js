// 内部协议管理 JavaScript

// 全局变量
let allProtocols = [];
let filteredProtocols = [];
let currentProtocol = null;
let deleteProtocolId = null;

// API基础URL
const API_BASE = '/api/internal-contracts';

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    loadProtocols();
    bindEvents();
    
    // 设置默认日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('effectiveDate').value = today;
});

/**
 * 绑定事件监听器
 */
function bindEvents() {
    // 搜索框实时搜索
    document.getElementById('searchKeyword').addEventListener('input', debounce(searchProtocols, 300));
    
    // 筛选器变化
    document.getElementById('statusFilter').addEventListener('change', searchProtocols);
    document.getElementById('deptFilter').addEventListener('change', searchProtocols);
    document.getElementById('minCommission').addEventListener('input', debounce(searchProtocols, 500));
    document.getElementById('maxCommission').addEventListener('input', debounce(searchProtocols, 500));
    
    // 表单验证
    document.getElementById('protocolForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProtocol();
    });
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 加载所有协议
 */
async function loadProtocols() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/protocols`);
        const result = await response.json();
        
        if (result.success) {
            allProtocols = result.data || [];
            filteredProtocols = [...allProtocols];
            displayProtocols(filteredProtocols);
            updateStatistics();
        } else {
            showNotification('加载协议失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('加载协议失败:', error);
        // 如果API不可用，使用模拟数据
        loadMockProtocols();
    } finally {
        showLoading(false);
    }
}

/**
 * 加载模拟数据
 */
function loadMockProtocols() {
    allProtocols = [
        {
            protocolId: 'PROT001',
            protocolName: '海运出口标准协议',
            protocolCode: 'OCEAN-EXPORT-STD',
            description: '适用于海运出口业务的标准分润协议',
            salesDepartmentId: 'SALES_OCEAN',
            operationDepartmentId: 'OPERATION_OCEAN',
            baseCommissionRate: 15.0,
            performanceBonusRate: 5.0,
            minimumAmount: 500.00,
            businessTypes: ['OCEAN'],
            applicableServiceCodes: ['OCEAN_EXPORT', 'BOOKING', 'MBL_PROCESSING'],
            effectiveDate: '2024-01-01',
            expiryDate: '2024-12-31',
            isActive: true,
            createdTime: '2024-01-01T00:00:00',
            lastModified: '2024-09-18T14:00:00'
        },
        {
            protocolId: 'PROT002',
            protocolName: '空运进口协议',
            protocolCode: 'AIR-IMPORT-STD',
            description: '空运进口业务专用协议，包含清关服务',
            salesDepartmentId: 'SALES_AIR',
            operationDepartmentId: 'OPERATION_AIR',
            baseCommissionRate: 12.0,
            performanceBonusRate: 3.0,
            minimumAmount: 300.00,
            businessTypes: ['AIR'],
            applicableServiceCodes: ['AIR_IMPORT', 'CUSTOMS_CLEARANCE'],
            effectiveDate: '2024-01-01',
            expiryDate: '2024-12-31',
            isActive: true,
            createdTime: '2024-01-15T00:00:00',
            lastModified: '2024-09-18T14:00:00'
        },
        {
            protocolId: 'PROT003',
            protocolName: '多式联运协议',
            protocolCode: 'MULTIMODAL-STD',
            description: '多式联运业务协议，覆盖海运+陆运组合',
            salesDepartmentId: 'SALES_MULTIMODAL',
            operationDepartmentId: 'OPERATION_MULTIMODAL',
            baseCommissionRate: 18.0,
            performanceBonusRate: 7.0,
            minimumAmount: 800.00,
            businessTypes: ['MULTIMODAL', 'OCEAN', 'TRUCK'],
            applicableServiceCodes: ['OCEAN_EXPORT', 'TRUCK_DOMESTIC', 'CARGO_LOADING'],
            effectiveDate: '2024-01-01',
            expiryDate: '2025-06-30',
            isActive: true,
            createdTime: '2024-02-01T00:00:00',
            lastModified: '2024-09-18T14:00:00'
        },
        {
            protocolId: 'PROT004',
            protocolName: '过期协议示例',
            protocolCode: 'EXPIRED-DEMO',
            description: '已过期的协议示例',
            salesDepartmentId: 'SALES_OCEAN',
            operationDepartmentId: 'OPERATION_OCEAN',
            baseCommissionRate: 10.0,
            performanceBonusRate: 2.0,
            minimumAmount: 200.00,
            businessTypes: ['OCEAN'],
            applicableServiceCodes: ['OCEAN_EXPORT'],
            effectiveDate: '2023-01-01',
            expiryDate: '2023-12-31',
            isActive: false,
            createdTime: '2023-01-01T00:00:00',
            lastModified: '2024-01-01T00:00:00'
        }
    ];
    
    filteredProtocols = [...allProtocols];
    displayProtocols(filteredProtocols);
    updateStatistics();
    showNotification('已加载演示数据', 'info');
}

/**
 * 显示协议列表
 */
function displayProtocols(protocols) {
    const container = document.getElementById('protocolsList');
    
    if (protocols.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    document.getElementById('emptyState').style.display = 'none';
    
    container.innerHTML = protocols.map(protocol => createProtocolCard(protocol)).join('');
}

/**
 * 创建协议卡片
 */
function createProtocolCard(protocol) {
    const isActive = protocol.isActive && new Date(protocol.expiryDate) > new Date();
    const isExpiring = protocol.isActive && isExpiringWithin30Days(protocol.expiryDate);
    const totalCommission = protocol.baseCommissionRate + protocol.performanceBonusRate;
    
    const statusClass = isActive ? 'protocol-status-active' : 'protocol-status-inactive';
    const statusText = isActive ? '有效' : '无效';
    const statusIcon = isActive ? 'fa-check-circle' : 'fa-times-circle';
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card protocol-card h-100">
                <div class="card-header ${statusClass}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${protocol.protocolName}</h6>
                            <small>${protocol.protocolCode}</small>
                        </div>
                        <div class="text-end">
                            <i class="fas ${statusIcon}"></i>
                            <div><small>${statusText}</small></div>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-6">
                            <div class="commission-rate">${totalCommission.toFixed(1)}%</div>
                            <small class="text-muted">总佣金率</small>
                        </div>
                        <div class="col-6 text-end">
                            <div class="text-muted">
                                ${protocol.baseCommissionRate}% + ${protocol.performanceBonusRate}%
                            </div>
                            <small class="text-muted">基础+绩效</small>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="badge bg-primary dept-badge">${getDepartmentName(protocol.salesDepartmentId)}</span>
                            <span class="badge bg-secondary dept-badge">${getDepartmentName(protocol.operationDepartmentId)}</span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex flex-wrap gap-1">
                            ${protocol.businessTypes.map(type => 
                                `<span class="badge bg-info">${getBusinessTypeName(type)}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${protocol.effectiveDate} ~ ${protocol.expiryDate}
                        </small>
                        ${isExpiring ? '<div><span class="badge bg-warning">即将到期</span></div>' : ''}
                    </div>
                    
                    <div class="mb-2">
                        <small class="text-muted">${protocol.description}</small>
                    </div>
                </div>
                
                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewProtocolDetails('${protocol.protocolId}')">
                            <i class="fas fa-eye me-1"></i>详情
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="editProtocol('${protocol.protocolId}')">
                            <i class="fas fa-edit me-1"></i>编辑
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="showDeleteConfirm('${protocol.protocolId}', '${protocol.protocolName}')">
                            <i class="fas fa-trash me-1"></i>删除
                        </button>
                    </div>
                    
                    <div class="mt-2 text-center">
                        <button class="btn btn-primary btn-sm" onclick="toggleProtocolStatus('${protocol.protocolId}', ${!protocol.isActive})">
                            <i class="fas fa-power-off me-1"></i>
                            ${protocol.isActive ? '停用' : '启用'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 更新统计信息
 */
function updateStatistics() {
    const total = allProtocols.length;
    const active = allProtocols.filter(p => p.isActive && new Date(p.expiryDate) > new Date()).length;
    const expiring = allProtocols.filter(p => p.isActive && isExpiringWithin30Days(p.expiryDate)).length;
    const avgCommission = allProtocols.length > 0 ? 
        allProtocols.reduce((sum, p) => sum + p.baseCommissionRate + p.performanceBonusRate, 0) / allProtocols.length : 0;
    
    document.getElementById('totalProtocols').textContent = total;
    document.getElementById('activeProtocols').textContent = active;
    document.getElementById('expiringSoon').textContent = expiring;
    document.getElementById('averageCommission').textContent = avgCommission.toFixed(1) + '%';
}

/**
 * 搜索协议
 */
function searchProtocols() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const deptFilter = document.getElementById('deptFilter').value;
    const minCommission = parseFloat(document.getElementById('minCommission').value) || 0;
    const maxCommission = parseFloat(document.getElementById('maxCommission').value) || 100;
    
    filteredProtocols = allProtocols.filter(protocol => {
        // 关键词搜索
        const matchKeyword = !keyword || 
            protocol.protocolName.toLowerCase().includes(keyword) ||
            protocol.protocolCode.toLowerCase().includes(keyword) ||
            protocol.description.toLowerCase().includes(keyword);
        
        // 状态筛选
        const now = new Date();
        const expiryDate = new Date(protocol.expiryDate);
        let matchStatus = true;
        
        if (statusFilter === 'active') {
            matchStatus = protocol.isActive && expiryDate > now;
        } else if (statusFilter === 'inactive') {
            matchStatus = !protocol.isActive || expiryDate <= now;
        } else if (statusFilter === 'expiring') {
            matchStatus = protocol.isActive && isExpiringWithin30Days(protocol.expiryDate);
        }
        
        // 部门筛选
        const matchDept = !deptFilter || 
            protocol.salesDepartmentId.includes(deptFilter) ||
            protocol.operationDepartmentId.includes(deptFilter);
        
        // 佣金率筛选
        const totalCommission = protocol.baseCommissionRate + protocol.performanceBonusRate;
        const matchCommission = totalCommission >= minCommission && totalCommission <= maxCommission;
        
        return matchKeyword && matchStatus && matchDept && matchCommission;
    });
    
    displayProtocols(filteredProtocols);
}

/**
 * 显示新建协议表单
 */
function showCreateProtocolForm() {
    currentProtocol = null;
    document.getElementById('protocolModalTitle').innerHTML = '<i class="fas fa-handshake me-2"></i>新建内部协议';
    clearProtocolForm();
    
    // 生成协议编号
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = (allProtocols.length + 1).toString().padStart(3, '0');
    document.getElementById('protocolCode').value = `PROT-${timestamp}-${sequence}`;
}

/**
 * 编辑协议
 */
function editProtocol(protocolId) {
    currentProtocol = allProtocols.find(p => p.protocolId === protocolId);
    if (!currentProtocol) {
        showNotification('协议不存在', 'error');
        return;
    }
    
    document.getElementById('protocolModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>编辑内部协议';
    populateProtocolForm(currentProtocol);
    
    const modal = new bootstrap.Modal(document.getElementById('protocolModal'));
    modal.show();
}

/**
 * 填充协议表单
 */
function populateProtocolForm(protocol) {
    document.getElementById('protocolId').value = protocol.protocolId;
    document.getElementById('protocolName').value = protocol.protocolName;
    document.getElementById('protocolCode').value = protocol.protocolCode;
    document.getElementById('protocolDescription').value = protocol.description;
    document.getElementById('salesDepartmentId').value = protocol.salesDepartmentId;
    document.getElementById('operationDepartmentId').value = protocol.operationDepartmentId;
    document.getElementById('baseCommissionRate').value = protocol.baseCommissionRate;
    document.getElementById('performanceBonusRate').value = protocol.performanceBonusRate;
    document.getElementById('minimumAmount').value = protocol.minimumAmount;
    document.getElementById('effectiveDate').value = protocol.effectiveDate;
    document.getElementById('expiryDate').value = protocol.expiryDate;
    document.getElementById('isActive').checked = protocol.isActive;
    
    // 设置业务类型复选框
    ['OCEAN', 'AIR', 'TRUCK', 'RAIL', 'MULTIMODAL'].forEach(type => {
        const checkbox = document.getElementById(`businessType_${type}`);
        if (checkbox) {
            checkbox.checked = protocol.businessTypes.includes(type);
        }
    });
    
    // 设置适用服务代码
    document.getElementById('applicableServiceCodes').value = protocol.applicableServiceCodes.join('\n');
}

/**
 * 清空协议表单
 */
function clearProtocolForm() {
    document.getElementById('protocolForm').reset();
    document.getElementById('protocolId').value = '';
    
    // 清空业务类型复选框
    ['OCEAN', 'AIR', 'TRUCK', 'RAIL', 'MULTIMODAL'].forEach(type => {
        const checkbox = document.getElementById(`businessType_${type}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    });
    
    // 设置默认日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('effectiveDate').value = today;
    document.getElementById('isActive').checked = true;
}

/**
 * 保存协议
 */
async function saveProtocol() {
    if (!validateProtocolForm()) {
        return;
    }
    
    const formData = collectProtocolFormData();
    
    try {
        const isEdit = !!currentProtocol;
        const url = isEdit ? `${API_BASE}/protocols/${currentProtocol.protocolId}` : `${API_BASE}/protocols`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(isEdit ? '协议更新成功' : '协议创建成功', 'success');
            
            // 更新本地数据
            if (isEdit) {
                const index = allProtocols.findIndex(p => p.protocolId === currentProtocol.protocolId);
                if (index !== -1) {
                    allProtocols[index] = { ...allProtocols[index], ...formData, lastModified: new Date().toISOString() };
                }
            } else {
                const newProtocol = {
                    ...formData,
                    protocolId: formData.protocolCode || 'PROT' + Date.now(),
                    createdTime: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                allProtocols.push(newProtocol);
            }
            
            // 刷新显示
            searchProtocols();
            updateStatistics();
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('protocolModal'));
            modal.hide();
            
        } else {
            showNotification('保存失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('保存协议失败:', error);
        
        // 模拟保存成功
        const isEdit = !!currentProtocol;
        if (isEdit) {
            const index = allProtocols.findIndex(p => p.protocolId === currentProtocol.protocolId);
            if (index !== -1) {
                allProtocols[index] = { ...allProtocols[index], ...formData, lastModified: new Date().toISOString() };
            }
        } else {
            const newProtocol = {
                ...formData,
                protocolId: formData.protocolCode || 'PROT' + Date.now(),
                createdTime: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            allProtocols.push(newProtocol);
        }
        
        searchProtocols();
        updateStatistics();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('protocolModal'));
        modal.hide();
        
        showNotification(isEdit ? '协议更新成功 (演示模式)' : '协议创建成功 (演示模式)', 'success');
    }
}

/**
 * 验证协议表单
 */
function validateProtocolForm() {
    const requiredFields = [
        { id: 'protocolName', name: '协议名称' },
        { id: 'salesDepartmentId', name: '销售部门' },
        { id: 'operationDepartmentId', name: '操作部门' },
        { id: 'baseCommissionRate', name: '基础佣金率' }
    ];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            showNotification(`请填写${field.name}`, 'warning');
            element.focus();
            return false;
        }
    }
    
    // 验证佣金率
    const baseRate = parseFloat(document.getElementById('baseCommissionRate').value);
    const bonusRate = parseFloat(document.getElementById('performanceBonusRate').value) || 0;
    
    if (baseRate < 0 || baseRate > 100) {
        showNotification('基础佣金率必须在0-100之间', 'warning');
        return false;
    }
    
    if (bonusRate < 0 || bonusRate > 100) {
        showNotification('绩效奖金率必须在0-100之间', 'warning');
        return false;
    }
    
    if (baseRate + bonusRate > 100) {
        showNotification('总佣金率不能超过100%', 'warning');
        return false;
    }
    
    // 验证日期
    const effectiveDate = document.getElementById('effectiveDate').value;
    const expiryDate = document.getElementById('expiryDate').value;
    
    if (effectiveDate && expiryDate && new Date(effectiveDate) >= new Date(expiryDate)) {
        showNotification('到期日期必须晚于生效日期', 'warning');
        return false;
    }
    
    return true;
}

/**
 * 收集表单数据
 */
function collectProtocolFormData() {
    // 收集选中的业务类型
    const businessTypes = [];
    ['OCEAN', 'AIR', 'TRUCK', 'RAIL', 'MULTIMODAL'].forEach(type => {
        const checkbox = document.getElementById(`businessType_${type}`);
        if (checkbox && checkbox.checked) {
            businessTypes.push(type);
        }
    });
    
    // 收集适用服务代码
    const serviceCodesText = document.getElementById('applicableServiceCodes').value.trim();
    const applicableServiceCodes = serviceCodesText ? 
        serviceCodesText.split('\n').map(code => code.trim()).filter(code => code) : [];
    
    return {
        protocolName: document.getElementById('protocolName').value.trim(),
        protocolCode: document.getElementById('protocolCode').value.trim(),
        description: document.getElementById('protocolDescription').value.trim(),
        salesDepartmentId: document.getElementById('salesDepartmentId').value,
        operationDepartmentId: document.getElementById('operationDepartmentId').value,
        baseCommissionRate: parseFloat(document.getElementById('baseCommissionRate').value),
        performanceBonusRate: parseFloat(document.getElementById('performanceBonusRate').value) || 0,
        minimumAmount: parseFloat(document.getElementById('minimumAmount').value) || 0,
        businessTypes: businessTypes,
        applicableServiceCodes: applicableServiceCodes,
        effectiveDate: document.getElementById('effectiveDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        isActive: document.getElementById('isActive').checked
    };
}

/**
 * 显示删除确认
 */
function showDeleteConfirm(protocolId, protocolName) {
    deleteProtocolId = protocolId;
    document.getElementById('deleteProtocolName').textContent = protocolName;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

/**
 * 确认删除协议
 */
async function confirmDeleteProtocol() {
    if (!deleteProtocolId) return;
    
    try {
        const response = await fetch(`${API_BASE}/protocols/${deleteProtocolId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('协议删除成功', 'success');
        } else {
            showNotification('删除失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('删除协议失败:', error);
        showNotification('协议删除成功 (演示模式)', 'success');
    } finally {
        // 无论API是否成功，都从本地数据中移除
        allProtocols = allProtocols.filter(p => p.protocolId !== deleteProtocolId);
        searchProtocols();
        updateStatistics();
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        deleteProtocolId = null;
    }
}

/**
 * 切换协议状态
 */
async function toggleProtocolStatus(protocolId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/protocols/${protocolId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`协议已${newStatus ? '启用' : '停用'}`, 'success');
        } else {
            showNotification('状态更新失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('更新协议状态失败:', error);
        showNotification(`协议已${newStatus ? '启用' : '停用'} (演示模式)`, 'success');
    } finally {
        // 更新本地数据
        const protocol = allProtocols.find(p => p.protocolId === protocolId);
        if (protocol) {
            protocol.isActive = newStatus;
            protocol.lastModified = new Date().toISOString();
        }
        
        searchProtocols();
        updateStatistics();
    }
}

/**
 * 查看协议详情
 */
function viewProtocolDetails(protocolId) {
    const protocol = allProtocols.find(p => p.protocolId === protocolId);
    if (!protocol) {
        showNotification('协议不存在', 'error');
        return;
    }
    
    // 可以在这里显示详细的协议信息模态框，或跳转到详情页面
    showNotification(`查看协议详情: ${protocol.protocolName}`, 'info');
}

/**
 * 工具函数：判断是否在30天内到期
 */
function isExpiringWithin30Days(expiryDate) {
    if (!expiryDate) return false;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 30;
}

/**
 * 获取部门显示名称
 */
function getDepartmentName(departmentId) {
    const names = {
        'SALES_OCEAN': '海运销售',
        'SALES_AIR': '空运销售',
        'SALES_TRUCK': '陆运销售',
        'SALES_RAIL': '铁运销售',
        'SALES_MULTIMODAL': '多式联运销售',
        'OPERATION_OCEAN': '海运操作',
        'OPERATION_AIR': '空运操作',
        'OPERATION_TRUCK': '陆运操作',
        'OPERATION_RAIL': '铁运操作',
        'OPERATION_MULTIMODAL': '多式联运操作'
    };
    return names[departmentId] || departmentId;
}

/**
 * 获取业务类型显示名称
 */
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

/**
 * 显示加载状态
 */
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const toastIcon = document.getElementById('toastIcon');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // 设置图标和样式
    const config = {
        'success': { icon: 'fas fa-check-circle text-success', title: '成功' },
        'error': { icon: 'fas fa-times-circle text-danger', title: '错误' },
        'warning': { icon: 'fas fa-exclamation-triangle text-warning', title: '警告' },
        'info': { icon: 'fas fa-info-circle text-info', title: '提示' }
    };
    
    const { icon, title } = config[type] || config['info'];
    
    toastIcon.className = icon;
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// 导出主要函数供HTML使用
window.loadProtocols = loadProtocols;
window.searchProtocols = searchProtocols;
window.showCreateProtocolForm = showCreateProtocolForm;
window.editProtocol = editProtocol;
window.saveProtocol = saveProtocol;
window.viewProtocolDetails = viewProtocolDetails;
window.showDeleteConfirm = showDeleteConfirm;
window.confirmDeleteProtocol = confirmDeleteProtocol;
window.toggleProtocolStatus = toggleProtocolStatus;