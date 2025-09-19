/**
 * 内部合约管理系统前端脚本
 * 集成集团级内部合约管理功能
 */

// 全局变量
let currentPage = 0;
let currentSize = 20;
let currentFilters = {};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadStatistics();
    loadMasterContracts();
    initializeFormHandlers();
});

/**
 * 初始化页面
 */
function initializePage() {
    console.log('初始化内部合约管理系统...');
    
    // 初始化日期控件默认值
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('executionDate').value = today;
    
    // 加载选项数据
    loadCostCenters();
    loadServices();
    loadCustomers();
    loadLegalEntities();
    
    // 绑定标签页切换事件
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (e) {
            const targetId = e.target.getAttribute('data-bs-target');
            handleTabSwitch(targetId);
        });
    });
}

/**
 * 处理标签页切换
 */
function handleTabSwitch(targetId) {
    switch(targetId) {
        case '#master-contracts':
            loadMasterContracts();
            break;
        case '#contract-terms':
            loadContractTerms();
            break;
        case '#intercompany-rules':
            loadIntercompanyRules();
            break;
        case '#subsidy-rules':
            loadSubsidyRules();
            break;
        case '#retention-rules':
            loadRetentionRules();
            break;
        case '#fund-routing':
            loadFundRoutingRules();
            break;
    }
}

/**
 * 初始化表单处理器
 */
function initializeFormHandlers() {
    // 长期合约勾选框事件
    document.getElementById('isLongTermContract').addEventListener('change', function() {
        const expirationDateDiv = document.getElementById('expirationDateDiv');
        const expirationDateInput = document.getElementById('expirationDate');
        
        if (this.checked) {
            expirationDateDiv.style.display = 'none';
            expirationDateInput.removeAttribute('required');
        } else {
            expirationDateDiv.style.display = 'block';
            expirationDateInput.setAttribute('required', 'required');
        }
    });
}

// ==================== 统计数据加载 ====================

/**
 * 加载统计数据
 */
async function loadStatistics() {
    try {
        const response = await fetch('/api/contract-management/statistics');
        if (!response.ok) throw new Error('获取统计数据失败');
        
        const statistics = await response.json();
        updateStatisticsDisplay(statistics);
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showErrorToast('加载统计数据失败: ' + error.message);
    }
}

/**
 * 更新统计数据显示
 */
function updateStatisticsDisplay(statistics) {
    document.getElementById('totalMasterContracts').textContent = statistics.totalMasterContracts || 0;
    document.getElementById('activeMasterContracts').textContent = statistics.activeMasterContracts || 0;
    document.getElementById('totalContractTerms').textContent = statistics.totalContractTerms || 0;
    document.getElementById('totalSubsidyRules').textContent = statistics.totalSubsidyRules || 0;
    document.getElementById('totalIntercompanyRules').textContent = statistics.totalIntercompanyRules || 0;
    document.getElementById('totalFundRoutingRules').textContent = statistics.totalFundRoutingRules || 0;
}

// ==================== 内部主合约管理 ====================

/**
 * 加载内部主合约列表
 */
async function loadMasterContracts() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            size: currentSize,
            ...currentFilters
        });
        
        const response = await fetch(`/api/contract-management/master-contracts?${params}`);
        if (!response.ok) throw new Error('获取主合约列表失败');
        
        const data = await response.json();
        updateMasterContractsTable(data.content);
        updatePagination(data, 'masterContractsPagination');
    } catch (error) {
        console.error('加载主合约列表失败:', error);
        showErrorToast('加载主合约列表失败: ' + error.message);
    }
}

/**
 * 更新主合约表格
 */
function updateMasterContractsTable(contracts) {
    const tbody = document.getElementById('masterContractsTableBody');
    tbody.innerHTML = '';
    
    contracts.forEach(contract => {
        const row = createMasterContractRow(contract);
        tbody.appendChild(row);
    });
}

/**
 * 创建主合约表格行
 */
function createMasterContractRow(contract) {
    const row = document.createElement('tr');
    
    const statusBadge = contract.isCurrentlyActive 
        ? '<span class="badge bg-success">有效</span>'
        : '<span class="badge bg-secondary">无效</span>';
    
    const contractType = contract.isLongTermContract 
        ? '<span class="badge bg-info">长期</span>'
        : '<span class="badge bg-warning">短期</span>';
    
    const reciprocalBadge = contract.isReciprocalContract 
        ? '<i class="fas fa-check text-success" title="对等合约"></i>'
        : '<i class="fas fa-times text-muted" title="非对等合约"></i>';
    
    row.innerHTML = `
        <td>${contract.contractId}</td>
        <td>
            <small class="text-muted">${formatCostCenterList(contract.salesCostCenterList)}</small>
        </td>
        <td>
            <small class="text-muted">${formatCostCenterList(contract.deliveryCostCenterList)}</small>
        </td>
        <td class="text-center">${reciprocalBadge}</td>
        <td>${contractType}</td>
        <td>${formatDate(contract.executionDate)}</td>
        <td>${contract.expirationDate ? formatDate(contract.expirationDate) : '<span class="text-muted">永久</span>'}</td>
        <td>${statusBadge}</td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-info" onclick="viewMasterContract('${contract.contractId}')" title="查看详情">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="editMasterContract('${contract.contractId}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteMasterContract('${contract.contractId}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * 显示创建主合约模态框
 */
function showCreateMasterContractModal() {
    // 重置表单
    document.getElementById('createMasterContractForm').reset();
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('createMasterContractModal'));
    modal.show();
}

/**
 * 创建主合约
 */
async function createMasterContract() {
    try {
        const formData = getMasterContractFormData();
        
        // 验证表单数据
        if (!validateMasterContractForm(formData)) return;
        
        const response = await fetch('/api/contract-management/master-contracts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '创建主合约失败');
        }
        
        const result = await response.json();
        
        // 关闭模态框
        bootstrap.Modal.getInstance(document.getElementById('createMasterContractModal')).hide();
        
        // 刷新列表
        loadMasterContracts();
        loadStatistics();
        
        showSuccessToast('主合约创建成功: ' + result.contractId);
    } catch (error) {
        console.error('创建主合约失败:', error);
        showErrorToast('创建主合约失败: ' + error.message);
    }
}

/**
 * 获取主合约表单数据
 */
function getMasterContractFormData() {
    const salesCostCenterSelect = document.getElementById('salesCostCenter');
    const deliveryCostCenterSelect = document.getElementById('deliveryCostCenter');
    
    return {
        contractName: document.getElementById('contractName').value,
        salesCostCenter: JSON.stringify(Array.from(salesCostCenterSelect.selectedOptions).map(option => option.value)),
        deliveryCostCenter: JSON.stringify(Array.from(deliveryCostCenterSelect.selectedOptions).map(option => option.value)),
        isReciprocalContract: document.getElementById('isReciprocalContract').checked,
        liabilityClause: document.getElementById('liabilityClause').value,
        exemptionClause: document.getElementById('exemptionClause').value,
        executionDate: document.getElementById('executionDate').value,
        isLongTermContract: document.getElementById('isLongTermContract').checked,
        expirationDate: document.getElementById('expirationDate').value || null,
        createdBy: 'SYSTEM' // 应该从当前用户会话获取
    };
}

/**
 * 验证主合约表单
 */
function validateMasterContractForm(formData) {
    if (!formData.contractName) {
        showErrorToast('请输入合约名称');
        return false;
    }
    
    if (!formData.salesCostCenter || JSON.parse(formData.salesCostCenter).length === 0) {
        showErrorToast('请选择销售核算单元');
        return false;
    }
    
    if (!formData.deliveryCostCenter || JSON.parse(formData.deliveryCostCenter).length === 0) {
        showErrorToast('请选择交付核算单元');
        return false;
    }
    
    if (!formData.executionDate) {
        showErrorToast('请选择生效时间');
        return false;
    }
    
    if (!formData.isLongTermContract && !formData.expirationDate) {
        showErrorToast('非长期合约必须设置到期时间');
        return false;
    }
    
    return true;
}

// ==================== 合约条款管理 ====================

/**
 * 加载合约条款列表
 */
async function loadContractTerms() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            size: currentSize
        });
        
        const response = await fetch(`/api/contract-management/contract-terms?${params}`);
        if (!response.ok) throw new Error('获取合约条款列表失败');
        
        const data = await response.json();
        updateContractTermsTable(data.content);
    } catch (error) {
        console.error('加载合约条款列表失败:', error);
        showErrorToast('加载合约条款列表失败: ' + error.message);
    }
}

/**
 * 更新合约条款表格
 */
function updateContractTermsTable(terms) {
    const tbody = document.getElementById('contractTermsTableBody');
    tbody.innerHTML = '';
    
    terms.forEach(term => {
        const row = createContractTermRow(term);
        tbody.appendChild(row);
    });
}

/**
 * 创建合约条款表格行
 */
function createContractTermRow(term) {
    const row = document.createElement('tr');
    
    const profitSharingTypeMap = {
        'BUY_SELL_PRICE': '买卖价',
        'COST_PLUS_FEE': '成本+操作费',
        'RATIO_SHARING': '按比例分润',
        'CUSTOM': '自定义'
    };
    
    row.innerHTML = `
        <td>${term.termsId}</td>
        <td>
            <span class="badge bg-primary">${profitSharingTypeMap[term.profitSharingType] || term.profitSharingType}</span>
        </td>
        <td>${term.salesProfitRatio ? term.salesProfitRatio + '%' : '-'}</td>
        <td>${term.deliveryProfitRatio ? term.deliveryProfitRatio + '%' : '-'}</td>
        <td>
            <small class="text-muted">${formatServiceList(term.applicableServicesList)}</small>
        </td>
        <td>
            <small class="text-muted">${formatCustomerList(term.applicableCustomersList)}</small>
        </td>
        <td>${formatDateTime(term.createdTime)}</td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-info" onclick="viewContractTerms('${term.termsId}')" title="查看详情">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="editContractTerms('${term.termsId}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * 显示创建合约条款模态框
 */
function showCreateContractTermsModal() {
    // 重置表单
    document.getElementById('createContractTermsForm').reset();
    document.getElementById('profitSharingConfig').style.display = 'none';
    
    // 清除分润类型选择
    document.querySelectorAll('.profit-sharing-type').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('createContractTermsModal'));
    modal.show();
}

/**
 * 选择分润模型
 */
function selectProfitSharingType(type) {
    // 更新选择状态
    document.querySelectorAll('.profit-sharing-type').forEach(el => {
        el.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // 设置隐藏字段值
    document.getElementById('profitSharingType').value = type;
    
    // 显示对应的配置区域
    showProfitSharingConfig(type);
}

/**
 * 显示分润配置
 */
function showProfitSharingConfig(type) {
    const configDiv = document.getElementById('profitSharingConfig');
    const ratioConfig = document.getElementById('ratioSharingConfig');
    const costPlusConfig = document.getElementById('costPlusFeeConfig');
    const customConfig = document.getElementById('customScriptConfig');
    
    // 隐藏所有配置
    ratioConfig.style.display = 'none';
    costPlusConfig.style.display = 'none';
    customConfig.style.display = 'none';
    
    // 显示对应配置
    switch(type) {
        case 'RATIO_SHARING':
            ratioConfig.style.display = 'block';
            break;
        case 'COST_PLUS_FEE':
            costPlusConfig.style.display = 'block';
            break;
        case 'CUSTOM':
            customConfig.style.display = 'block';
            break;
    }
    
    configDiv.style.display = 'block';
}

/**
 * 更新交付部门分润比例
 */
function updateDeliveryRatio() {
    const salesRatio = parseFloat(document.getElementById('salesProfitRatio').value) || 0;
    const deliveryRatio = 100 - salesRatio;
    document.getElementById('deliveryProfitRatio').value = deliveryRatio;
}

/**
 * 创建合约条款
 */
async function createContractTerms() {
    try {
        const formData = getContractTermsFormData();
        
        // 验证表单数据
        if (!validateContractTermsForm(formData)) return;
        
        const response = await fetch('/api/contract-management/contract-terms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '创建合约条款失败');
        }
        
        const result = await response.json();
        
        // 关闭模态框
        bootstrap.Modal.getInstance(document.getElementById('createContractTermsModal')).hide();
        
        // 刷新列表
        loadContractTerms();
        loadStatistics();
        
        showSuccessToast('合约条款创建成功: ' + result.termsId);
    } catch (error) {
        console.error('创建合约条款失败:', error);
        showErrorToast('创建合约条款失败: ' + error.message);
    }
}

/**
 * 获取合约条款表单数据
 */
function getContractTermsFormData() {
    const applicableServicesSelect = document.getElementById('applicableServices');
    const applicableCustomersSelect = document.getElementById('applicableCustomers');
    
    const formData = {
        applicableServices: JSON.stringify(Array.from(applicableServicesSelect.selectedOptions).map(option => option.value)),
        applicableCustomers: JSON.stringify(Array.from(applicableCustomersSelect.selectedOptions).map(option => option.value)),
        applicableConditions: document.getElementById('applicableConditions').value,
        profitSharingType: document.getElementById('profitSharingType').value
    };
    
    // 根据分润类型添加对应字段
    switch(formData.profitSharingType) {
        case 'RATIO_SHARING':
            formData.salesProfitRatio = parseFloat(document.getElementById('salesProfitRatio').value);
            formData.deliveryProfitRatio = parseFloat(document.getElementById('deliveryProfitRatio').value);
            break;
        case 'COST_PLUS_FEE':
            formData.operatingFeeCurrency = document.getElementById('operatingFeeCurrency').value;
            formData.unitOfMeasurement = document.getElementById('unitOfMeasurement').value;
            formData.unitPrice = parseFloat(document.getElementById('unitPrice').value);
            formData.minimumPerOrder = parseFloat(document.getElementById('minimumPerOrder').value);
            formData.maximumPerOrder = parseFloat(document.getElementById('maximumPerOrder').value);
            break;
        case 'CUSTOM':
            formData.deptTypeForScript = document.getElementById('deptTypeForScript').value;
            formData.calculationScript = document.getElementById('calculationScript').value;
            formData.costPriceDisclosure = document.getElementById('costPriceDisclosure').checked;
            break;
    }
    
    return formData;
}

/**
 * 验证合约条款表单
 */
function validateContractTermsForm(formData) {
    if (!formData.profitSharingType) {
        showErrorToast('请选择分润模型');
        return false;
    }
    
    if (!formData.applicableServices || JSON.parse(formData.applicableServices).length === 0) {
        showErrorToast('请选择适用服务');
        return false;
    }
    
    // 根据分润类型验证对应字段
    switch(formData.profitSharingType) {
        case 'RATIO_SHARING':
            if (!formData.salesProfitRatio || !formData.deliveryProfitRatio) {
                showErrorToast('请设置分润比例');
                return false;
            }
            if (formData.salesProfitRatio + formData.deliveryProfitRatio !== 100) {
                showErrorToast('分润比例总和必须为100%');
                return false;
            }
            break;
        case 'COST_PLUS_FEE':
            if (!formData.operatingFeeCurrency || !formData.unitOfMeasurement || !formData.unitPrice) {
                showErrorToast('请完善成本+操作费配置');
                return false;
            }
            break;
        case 'CUSTOM':
            if (!formData.calculationScript) {
                showErrorToast('请输入分润计算脚本');
                return false;
            }
            break;
    }
    
    return true;
}

// ==================== 数据加载辅助函数 ====================

/**
 * 加载核算单元选项
 */
async function loadCostCenters() {
    try {
        // 这里应该调用实际的API获取核算单元列表
        const costCenters = [
            { id: 'SALES_001', name: '华南销售中心' },
            { id: 'SALES_002', name: '华东销售中心' },
            { id: 'OCEAN_OP_001', name: '深圳海运操作中心' },
            { id: 'AIR_OP_001', name: '上海空运操作中心' }
        ];
        
        const salesSelect = document.getElementById('salesCostCenter');
        const deliverySelect = document.getElementById('deliveryCostCenter');
        const filterSalesSelect = document.getElementById('filterSalesCostCenter');
        const filterDeliverySelect = document.getElementById('filterDeliveryCostCenter');
        
        [salesSelect, deliverySelect, filterSalesSelect, filterDeliverySelect].forEach(select => {
            if (select) {
                select.innerHTML = '';
                if (select.id.startsWith('filter')) {
                    select.innerHTML = '<option value="">全部</option>';
                }
                costCenters.forEach(center => {
                    const option = document.createElement('option');
                    option.value = center.id;
                    option.textContent = center.name;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('加载核算单元失败:', error);
    }
}

/**
 * 加载服务选项
 */
async function loadServices() {
    try {
        // 这里应该调用实际的API获取服务列表
        const services = [
            { code: 'OCEAN_FCL', name: '海运整柜' },
            { code: 'OCEAN_LCL', name: '海运拼箱' },
            { code: 'AIR_CARGO', name: '空运货物' },
            { code: 'CUSTOMS_EXPORT', name: '出口报关' },
            { code: 'CUSTOMS_IMPORT', name: '进口报关' }
        ];
        
        const applicableServicesSelect = document.getElementById('applicableServices');
        if (applicableServicesSelect) {
            applicableServicesSelect.innerHTML = '';
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.code;
                option.textContent = `${service.code} - ${service.name}`;
                applicableServicesSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载服务列表失败:', error);
    }
}

/**
 * 加载客户选项
 */
async function loadCustomers() {
    try {
        // 这里应该调用实际的API获取客户列表
        const customers = [
            { id: 'CUST_001', name: '深圳华为技术有限公司' },
            { id: 'CUST_002', name: '广州汽车集团股份有限公司' },
            { id: 'CUST_003', name: '美的集团股份有限公司' }
        ];
        
        const applicableCustomersSelect = document.getElementById('applicableCustomers');
        if (applicableCustomersSelect) {
            applicableCustomersSelect.innerHTML = '';
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                applicableCustomersSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载客户列表失败:', error);
    }
}

/**
 * 加载法人实体选项
 */
async function loadLegalEntities() {
    try {
        // 这里应该调用实际的API获取法人实体列表
        const entities = [
            { id: 'ENTITY_001', name: '海程邦达国际物流有限公司' },
            { id: 'ENTITY_002', name: '深圳邦达物流有限公司' },
            { id: 'ENTITY_003', name: '上海邦达货运代理有限公司' }
        ];
        
        // 这里可以为其他需要法人实体选项的下拉框添加选项
    } catch (error) {
        console.error('加载法人实体列表失败:', error);
    }
}

// ==================== 其他标签页内容加载 ====================

/**
 * 加载关联交易规则
 */
async function loadIntercompanyRules() {
    console.log('加载关联交易规则...');
    // 实现关联交易规则加载逻辑
}

/**
 * 加载补贴规则
 */
async function loadSubsidyRules() {
    console.log('加载补贴规则...');
    // 实现补贴规则加载逻辑
}

/**
 * 加载借抬头规则
 */
async function loadRetentionRules() {
    console.log('加载借抬头规则...');
    // 实现借抬头规则加载逻辑
}

/**
 * 加载资金路由规则
 */
async function loadFundRoutingRules() {
    console.log('加载资金路由规则...');
    // 实现资金路由规则加载逻辑
}

// ==================== 模态框显示函数 ====================

function showCreateIntercompanyRuleModal() {
    console.log('显示创建关联交易规则模态框');
    // 实现模态框显示逻辑
}

function showCreateSubsidyRuleModal() {
    console.log('显示创建补贴规则模态框');
    // 实现模态框显示逻辑
}

function showCreateRetentionRuleModal() {
    console.log('显示创建借抬头规则模态框');
    // 实现模态框显示逻辑
}

function showCreateFundRoutingRuleModal() {
    console.log('显示创建资金路由规则模态框');
    // 实现模态框显示逻辑
}

// ==================== 操作函数 ====================

/**
 * 查看主合约详情
 */
function viewMasterContract(contractId) {
    console.log('查看主合约详情:', contractId);
    // 实现查看详情逻辑
}

/**
 * 编辑主合约
 */
function editMasterContract(contractId) {
    console.log('编辑主合约:', contractId);
    // 实现编辑逻辑
}

/**
 * 删除主合约
 */
async function deleteMasterContract(contractId) {
    if (!confirm('确定要删除此主合约吗？此操作不可恢复。')) return;
    
    try {
        const response = await fetch(`/api/contract-management/master-contracts/${contractId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('删除主合约失败');
        
        loadMasterContracts();
        loadStatistics();
        showSuccessToast('主合约删除成功');
    } catch (error) {
        console.error('删除主合约失败:', error);
        showErrorToast('删除主合约失败: ' + error.message);
    }
}

/**
 * 查看合约条款详情
 */
function viewContractTerms(termsId) {
    console.log('查看合约条款详情:', termsId);
    // 实现查看详情逻辑
}

/**
 * 编辑合约条款
 */
function editContractTerms(termsId) {
    console.log('编辑合约条款:', termsId);
    // 实现编辑逻辑
}

/**
 * 筛选主合约
 */
function filterMasterContracts() {
    currentFilters = {
        salesCostCenter: document.getElementById('filterSalesCostCenter').value,
        deliveryCostCenter: document.getElementById('filterDeliveryCostCenter').value,
        isActive: document.getElementById('filterContractStatus').value,
        isLongTerm: document.getElementById('filterContractType').value
    };
    
    // 移除空值
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) delete currentFilters[key];
    });
    
    currentPage = 0;
    loadMasterContracts();
}

/**
 * 刷新主合约列表
 */
function refreshMasterContracts() {
    currentPage = 0;
    currentFilters = {};
    
    // 重置筛选条件
    document.getElementById('filterSalesCostCenter').value = '';
    document.getElementById('filterDeliveryCostCenter').value = '';
    document.getElementById('filterContractStatus').value = '';
    document.getElementById('filterContractType').value = '';
    
    loadMasterContracts();
}

/**
 * 刷新合约条款列表
 */
function refreshContractTerms() {
    currentPage = 0;
    loadContractTerms();
}

// ==================== 辅助函数 ====================

/**
 * 格式化核算单元列表
 */
function formatCostCenterList(list) {
    if (!list || list.length === 0) return '-';
    return list.slice(0, 2).join(', ') + (list.length > 2 ? `等${list.length}个` : '');
}

/**
 * 格式化服务列表
 */
function formatServiceList(list) {
    if (!list || list.length === 0) return '全部服务';
    return list.slice(0, 2).join(', ') + (list.length > 2 ? `等${list.length}个` : '');
}

/**
 * 格式化客户列表
 */
function formatCustomerList(list) {
    if (!list || list.length === 0) return '全部客户';
    return list.slice(0, 2).join(', ') + (list.length > 2 ? `等${list.length}个` : '');
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toLocaleString('zh-CN');
}

/**
 * 更新分页组件
 */
function updatePagination(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const totalPages = data.totalPages;
    const currentPageNum = data.number;
    
    // 上一页
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPageNum === 0 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPageNum - 1})">上一页</a>`;
    container.appendChild(prevLi);
    
    // 页码
    for (let i = Math.max(0, currentPageNum - 2); i <= Math.min(totalPages - 1, currentPageNum + 2); i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPageNum ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i + 1}</a>`;
        container.appendChild(li);
    }
    
    // 下一页
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPageNum === totalPages - 1 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPageNum + 1})">下一页</a>`;
    container.appendChild(nextLi);
}

/**
 * 切换页面
 */
function changePage(page) {
    currentPage = page;
    
    // 根据当前活动标签页重新加载数据
    const activeTab = document.querySelector('.nav-pills .nav-link.active');
    if (activeTab) {
        const targetId = activeTab.getAttribute('data-bs-target');
        handleTabSwitch(targetId);
    }
}

/**
 * 显示成功消息
 */
function showSuccessToast(message) {
    document.getElementById('successToastBody').textContent = message;
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
}

/**
 * 显示错误消息
 */
function showErrorToast(message) {
    document.getElementById('errorToastBody').textContent = message;
    const toast = new bootstrap.Toast(document.getElementById('errorToast'));
    toast.show();
}