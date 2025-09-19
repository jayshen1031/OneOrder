// 服务管理 JavaScript

// 全局变量
let allServices = [];
let filteredServices = [];
let currentService = null;
let deleteServiceId = null;
let workflowStepCounter = 1;

// API基础URL
const API_BASE = '/api/service-management';

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    loadServices();
    loadDependencyOptions();
    bindEvents();
});

/**
 * 绑定事件监听器
 */
function bindEvents() {
    // 搜索框实时搜索
    document.getElementById('searchKeyword').addEventListener('input', debounce(searchServices, 300));
    
    // 筛选器变化
    document.getElementById('businessTypeFilter').addEventListener('change', searchServices);
    document.getElementById('statusFilter').addEventListener('change', searchServices);
    document.getElementById('categoryFilter').addEventListener('change', searchServices);
    
    // 依赖选择器变化
    document.getElementById('dependencySelector').addEventListener('change', updateSelectedDependencies);
    
    // 表单验证
    document.getElementById('serviceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveService();
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
 * 加载所有服务
 */
async function loadServices() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/services`);
        const result = await response.json();
        
        if (result.success) {
            allServices = result.data || [];
            filteredServices = [...allServices];
            displayServices(filteredServices);
            updateStatistics();
        } else {
            showNotification('加载服务失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('加载服务失败:', error);
        // 如果API不可用，使用模拟数据
        loadMockServices();
    } finally {
        showLoading(false);
    }
}

/**
 * 加载模拟数据
 */
function loadMockServices() {
    allServices = [
        {
            serviceId: 'SVC001',
            serviceCode: 'BOOKING',
            serviceName: '订舱服务',
            serviceNameEn: 'Booking Service',
            abbreviation: 'BKG',
            serviceDescription: '为客户提供船期查询、舱位预订、订舱确认等服务',
            businessType: 'OCEAN',
            serviceCategory: 'CORE',
            priority: 1,
            processingType: 'MANUAL',
            estimatedDuration: 2.0,
            maxConcurrency: 5,
            requiredSkills: ['船期查询', '舱位管理', '客户沟通'],
            riskLevel: 'MEDIUM',
            isActive: true,
            autoAssign: false,
            requiresApproval: true,
            trackable: true,
            workflowSteps: [
                { stepName: '客户需求确认', stepDescription: '确认客户的货物信息和运输需求' },
                { stepName: '船期查询', stepDescription: '查询合适的船期和航线' },
                { stepName: '舱位预订', stepDescription: '向船公司预订舱位' },
                { stepName: '订舱确认', stepDescription: '确认订舱并发送确认书给客户' }
            ],
            dependencies: [],
            createdTime: '2024-01-01T00:00:00',
            lastModified: '2024-09-18T15:00:00'
        },
        {
            serviceId: 'SVC002',
            serviceCode: 'MBL_PROCESSING',
            serviceName: 'MBL处理',
            serviceNameEn: 'Master Bill of Lading Processing',
            abbreviation: 'MBL',
            serviceDescription: '处理海运主单，包括制作、修改、确认等操作',
            businessType: 'OCEAN',
            serviceCategory: 'CORE',
            priority: 1,
            processingType: 'MANUAL',
            estimatedDuration: 1.5,
            maxConcurrency: 3,
            requiredSkills: ['单证制作', '船公司系统', '英文能力'],
            riskLevel: 'HIGH',
            isActive: true,
            autoAssign: false,
            requiresApproval: true,
            trackable: true,
            workflowSteps: [
                { stepName: 'MBL信息收集', stepDescription: '收集制作MBL所需的基础信息' },
                { stepName: 'MBL制作', stepDescription: '在船公司系统中制作MBL' },
                { stepName: 'MBL确认', stepDescription: '确认MBL信息无误并提交' },
                { stepName: 'MBL发放', stepDescription: '将确认的MBL发送给相关方' }
            ],
            dependencies: ['SVC001'],
            createdTime: '2024-01-02T00:00:00',
            lastModified: '2024-09-18T15:00:00'
        },
        {
            serviceId: 'SVC003',
            serviceCode: 'CUSTOMS_CLEARANCE',
            serviceName: '清关服务',
            serviceNameEn: 'Customs Clearance',
            abbreviation: 'CUS',
            serviceDescription: '提供进出口清关服务，包括报关、查验、放行等',
            businessType: 'OCEAN',
            serviceCategory: 'CORE',
            priority: 1,
            processingType: 'MANUAL',
            estimatedDuration: 4.0,
            maxConcurrency: 2,
            requiredSkills: ['报关操作', '海关政策', '单证审核'],
            riskLevel: 'HIGH',
            isActive: true,
            autoAssign: false,
            requiresApproval: true,
            trackable: true,
            workflowSteps: [
                { stepName: '单证准备', stepDescription: '准备报关所需的各类单证' },
                { stepName: '报关申报', stepDescription: '在海关系统中进行报关申报' },
                { stepName: '海关查验', stepDescription: '配合海关进行货物查验（如需要）' },
                { stepName: '税费缴纳', stepDescription: '缴纳相关税费' },
                { stepName: '放行提货', stepDescription: '获得放行通知，安排提货' }
            ],
            dependencies: ['SVC002'],
            createdTime: '2024-01-03T00:00:00',
            lastModified: '2024-09-18T15:00:00'
        },
        {
            serviceId: 'SVC004',
            serviceCode: 'CARGO_LOADING',
            serviceName: '内装服务',
            serviceNameEn: 'Container Loading',
            abbreviation: 'CLD',
            serviceDescription: '提供集装箱内装服务，包括装柜、加固、封箱等',
            businessType: 'OCEAN',
            serviceCategory: 'CORE',
            priority: 2,
            processingType: 'MANUAL',
            estimatedDuration: 3.0,
            maxConcurrency: 4,
            requiredSkills: ['装柜操作', '货物加固', '安全规范'],
            riskLevel: 'MEDIUM',
            isActive: true,
            autoAssign: true,
            requiresApproval: false,
            trackable: true,
            workflowSteps: [
                { stepName: '装柜准备', stepDescription: '准备集装箱和装柜工具' },
                { stepName: '货物装载', stepDescription: '按要求将货物装入集装箱' },
                { stepName: '货物加固', stepDescription: '对货物进行加固防护' },
                { stepName: '集装箱封箱', stepDescription: '封箱并记录封条号' }
            ],
            dependencies: ['SVC001'],
            createdTime: '2024-01-04T00:00:00',
            lastModified: '2024-09-18T15:00:00'
        },
        {
            serviceId: 'SVC005',
            serviceCode: 'INSURANCE_SERVICE',
            serviceName: '货运保险',
            serviceNameEn: 'Cargo Insurance',
            abbreviation: 'INS',
            serviceDescription: '为客户提供货运保险服务，包括保险咨询、投保、理赔等',
            businessType: 'OCEAN',
            serviceCategory: 'ADDON',
            priority: 3,
            processingType: 'HYBRID',
            estimatedDuration: 1.0,
            maxConcurrency: 10,
            requiredSkills: ['保险知识', '风险评估', '理赔处理'],
            riskLevel: 'LOW',
            isActive: true,
            autoAssign: true,
            requiresApproval: false,
            trackable: true,
            workflowSteps: [
                { stepName: '保险需求评估', stepDescription: '评估货物保险需求和风险' },
                { stepName: '保险方案制定', stepDescription: '制定合适的保险方案' },
                { stepName: '保险投保', stepDescription: '办理保险投保手续' },
                { stepName: '保单确认', stepDescription: '确认保单信息并发送给客户' }
            ],
            dependencies: [],
            createdTime: '2024-01-05T00:00:00',
            lastModified: '2024-09-18T15:00:00'
        }
    ];
    
    filteredServices = [...allServices];
    displayServices(filteredServices);
    updateStatistics();
    showNotification('已加载演示数据', 'info');
}

/**
 * 显示服务列表
 */
function displayServices(services) {
    const container = document.getElementById('servicesList');
    
    if (services.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    document.getElementById('emptyState').style.display = 'none';
    
    // 按业务类型分组
    const groupedServices = {};
    services.forEach(service => {
        const type = service.businessType || '未分类';
        if (!groupedServices[type]) {
            groupedServices[type] = [];
        }
        groupedServices[type].push(service);
    });
    
    let html = '';
    Object.keys(groupedServices).sort().forEach(type => {
        html += `
            <div class="service-category">
                <div class="p-3">
                    <h5 class="mb-0">
                        <i class="fas fa-${getBusinessTypeIcon(type)} me-2"></i>
                        ${getBusinessTypeName(type)}
                        <span class="badge bg-light text-dark ms-2">${groupedServices[type].length}</span>
                    </h5>
                </div>
            </div>
            <div class="row mb-4">
        `;
        
        groupedServices[type].forEach(service => {
            html += createServiceCard(service);
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

/**
 * 创建服务卡片
 */
function createServiceCard(service) {
    const statusClass = service.isActive ? 'active' : 'inactive';
    const categoryBadge = getCategoryBadge(service.serviceCategory);
    const priorityBadge = getPriorityBadge(service.priority);
    const riskBadge = getRiskBadge(service.riskLevel);
    
    return `
        <div class="col-lg-6 col-xl-4 mb-3">
            <div class="card service-card ${statusClass} h-100">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${service.serviceName}</h6>
                            <small class="text-muted">${service.serviceCode}</small>
                        </div>
                        <div>
                            ${categoryBadge}
                            ${priorityBadge}
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <p class="text-muted small mb-3">${service.serviceDescription}</p>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">预计耗时</small>
                            <div class="fw-bold">${service.estimatedDuration || '-'}小时</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">最大并发</small>
                            <div class="fw-bold">${service.maxConcurrency || '-'}</div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">处理方式</small>
                        <div>
                            <span class="badge service-type-badge ${getProcessingTypeBadgeClass(service.processingType)}">
                                ${getProcessingTypeName(service.processingType)}
                            </span>
                            ${riskBadge}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">工作流步骤 (${service.workflowSteps?.length || 0})</small>
                        <div class="small">
                            ${service.workflowSteps?.slice(0, 2).map(step => 
                                `<div class="text-truncate">• ${step.stepName}</div>`
                            ).join('') || '暂无步骤'}
                            ${service.workflowSteps?.length > 2 ? '<div class="text-muted">...</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">服务特性</small>
                        <div>
                            ${service.autoAssign ? '<span class="badge bg-info me-1">自动派单</span>' : ''}
                            ${service.requiresApproval ? '<span class="badge bg-warning me-1">需要审批</span>' : ''}
                            ${service.trackable ? '<span class="badge bg-success me-1">可追踪</span>' : ''}
                        </div>
                    </div>
                    
                    ${service.dependencies?.length > 0 ? `
                        <div class="mb-3">
                            <small class="text-muted">依赖服务 (${service.dependencies.length})</small>
                            <div class="small text-truncate">
                                ${service.dependencies.map(dep => {
                                    const depService = allServices.find(s => s.serviceId === dep);
                                    return depService ? depService.serviceName : dep;
                                }).join(', ')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewServiceDetails('${service.serviceId}')">
                            <i class="fas fa-eye me-1"></i>详情
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="editService('${service.serviceId}')">
                            <i class="fas fa-edit me-1"></i>编辑
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="showDeleteConfirm('${service.serviceId}', '${service.serviceName}')">
                            <i class="fas fa-trash me-1"></i>删除
                        </button>
                    </div>
                    
                    <div class="mt-2 text-center">
                        <button class="btn btn-primary btn-sm" onclick="toggleServiceStatus('${service.serviceId}', ${!service.isActive})">
                            <i class="fas fa-power-off me-1"></i>
                            ${service.isActive ? '停用' : '启用'}
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
    const total = allServices.length;
    const active = allServices.filter(s => s.isActive).length;
    const categories = new Set(allServices.map(s => s.serviceCategory)).size;
    const totalSteps = allServices.reduce((sum, s) => sum + (s.workflowSteps?.length || 0), 0);
    
    document.getElementById('totalServices').textContent = total;
    document.getElementById('activeServices').textContent = active;
    document.getElementById('serviceCategories').textContent = categories;
    document.getElementById('workflowSteps').textContent = totalSteps;
}

/**
 * 搜索服务
 */
function searchServices() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    const businessType = document.getElementById('businessTypeFilter').value;
    const status = document.getElementById('statusFilter').value;
    const category = document.getElementById('categoryFilter').value;
    
    filteredServices = allServices.filter(service => {
        // 关键词搜索
        const matchKeyword = !keyword || 
            service.serviceName.toLowerCase().includes(keyword) ||
            service.serviceCode.toLowerCase().includes(keyword) ||
            service.serviceNameEn?.toLowerCase().includes(keyword) ||
            service.serviceDescription?.toLowerCase().includes(keyword);
        
        // 业务类型筛选
        const matchBusinessType = !businessType || service.businessType === businessType;
        
        // 状态筛选
        let matchStatus = true;
        if (status === 'active') {
            matchStatus = service.isActive;
        } else if (status === 'inactive') {
            matchStatus = !service.isActive;
        }
        
        // 分类筛选
        const matchCategory = !category || service.serviceCategory === category;
        
        return matchKeyword && matchBusinessType && matchStatus && matchCategory;
    });
    
    displayServices(filteredServices);
}

/**
 * 显示新建服务表单
 */
function showCreateServiceForm() {
    currentService = null;
    document.getElementById('serviceModalTitle').innerHTML = '<i class="fas fa-cogs me-2"></i>新建服务';
    clearServiceForm();
    resetWorkflowSteps();
    
    // 生成服务代码
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = (allServices.length + 1).toString().padStart(3, '0');
    document.getElementById('serviceCode').value = `SVC${sequence}`;
}

/**
 * 编辑服务
 */
function editService(serviceId) {
    currentService = allServices.find(s => s.serviceId === serviceId);
    if (!currentService) {
        showNotification('服务不存在', 'error');
        return;
    }
    
    document.getElementById('serviceModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>编辑服务';
    populateServiceForm(currentService);
    
    const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
    modal.show();
}

/**
 * 填充服务表单
 */
function populateServiceForm(service) {
    document.getElementById('serviceId').value = service.serviceId;
    document.getElementById('serviceCode').value = service.serviceCode;
    document.getElementById('serviceName').value = service.serviceName;
    document.getElementById('serviceNameEn').value = service.serviceNameEn || '';
    document.getElementById('abbreviation').value = service.abbreviation || '';
    document.getElementById('serviceDescription').value = service.serviceDescription || '';
    document.getElementById('businessType').value = service.businessType;
    document.getElementById('serviceCategory').value = service.serviceCategory;
    document.getElementById('priority').value = service.priority;
    document.getElementById('processingType').value = service.processingType;
    document.getElementById('estimatedDuration').value = service.estimatedDuration || '';
    document.getElementById('maxConcurrency').value = service.maxConcurrency || 1;
    document.getElementById('requiredSkills').value = service.requiredSkills?.join(', ') || '';
    document.getElementById('riskLevel').value = service.riskLevel;
    document.getElementById('isActive').checked = service.isActive;
    document.getElementById('autoAssign').checked = service.autoAssign;
    document.getElementById('requiresApproval').checked = service.requiresApproval;
    document.getElementById('trackable').checked = service.trackable;
    
    // 设置工作流步骤
    populateWorkflowSteps(service.workflowSteps || []);
    
    // 设置依赖关系
    populateServiceDependencies(service.dependencies || []);
}

/**
 * 清空服务表单
 */
function clearServiceForm() {
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    document.getElementById('isActive').checked = true;
    document.getElementById('trackable').checked = true;
    document.getElementById('maxConcurrency').value = 1;
    document.getElementById('priority').value = 2;
    document.getElementById('processingType').value = 'MANUAL';
    document.getElementById('riskLevel').value = 'MEDIUM';
}

/**
 * 重置工作流步骤
 */
function resetWorkflowSteps() {
    workflowStepCounter = 1;
    const container = document.getElementById('workflowStepsContainer');
    container.innerHTML = `
        <div class="workflow-step active" data-step="1">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>步骤 1</strong>
                    <input type="text" class="form-control form-control-sm mt-1" placeholder="步骤名称" name="stepName">
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeWorkflowStep(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <textarea class="form-control form-control-sm mt-2" placeholder="步骤描述" rows="2" name="stepDescription"></textarea>
        </div>
    `;
}

/**
 * 填充工作流步骤
 */
function populateWorkflowSteps(steps) {
    const container = document.getElementById('workflowStepsContainer');
    container.innerHTML = '';
    
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        const stepHtml = `
            <div class="workflow-step ${index === 0 ? 'active' : ''}" data-step="${stepNumber}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>步骤 ${stepNumber}</strong>
                        <input type="text" class="form-control form-control-sm mt-1" placeholder="步骤名称" 
                               name="stepName" value="${step.stepName}">
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeWorkflowStep(${stepNumber})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <textarea class="form-control form-control-sm mt-2" placeholder="步骤描述" rows="2" 
                          name="stepDescription">${step.stepDescription}</textarea>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', stepHtml);
    });
    
    workflowStepCounter = steps.length;
}

/**
 * 添加工作流步骤
 */
function addWorkflowStep() {
    workflowStepCounter++;
    const container = document.getElementById('workflowStepsContainer');
    
    const stepHtml = `
        <div class="workflow-step" data-step="${workflowStepCounter}">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>步骤 ${workflowStepCounter}</strong>
                    <input type="text" class="form-control form-control-sm mt-1" placeholder="步骤名称" name="stepName">
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeWorkflowStep(${workflowStepCounter})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <textarea class="form-control form-control-sm mt-2" placeholder="步骤描述" rows="2" name="stepDescription"></textarea>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', stepHtml);
}

/**
 * 移除工作流步骤
 */
function removeWorkflowStep(stepNumber) {
    const step = document.querySelector(`[data-step="${stepNumber}"]`);
    if (step) {
        step.remove();
    }
    
    // 重新编号
    const steps = document.querySelectorAll('.workflow-step');
    steps.forEach((step, index) => {
        const newStepNumber = index + 1;
        step.setAttribute('data-step', newStepNumber);
        step.querySelector('strong').textContent = `步骤 ${newStepNumber}`;
        step.querySelector('button').setAttribute('onclick', `removeWorkflowStep(${newStepNumber})`);
    });
    
    workflowStepCounter = steps.length;
}

/**
 * 加载依赖选择器选项
 */
function loadDependencyOptions() {
    const selector = document.getElementById('dependencySelector');
    
    // 这里应该从API加载所有可用服务
    // 暂时使用模拟数据
    const options = allServices.map(service => 
        `<option value="${service.serviceId}">${service.serviceName} (${service.serviceCode})</option>`
    ).join('');
    
    selector.innerHTML = options;
}

/**
 * 更新已选依赖
 */
function updateSelectedDependencies() {
    const selector = document.getElementById('dependencySelector');
    const container = document.getElementById('selectedDependencies');
    const selectedOptions = Array.from(selector.selectedOptions);
    
    if (selectedOptions.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">暂无依赖服务</div>';
        return;
    }
    
    const html = selectedOptions.map(option => {
        return `
            <div class="dependency-item">
                <div>
                    <strong>${option.text}</strong>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" 
                        onclick="removeDependency('${option.value}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

/**
 * 移除依赖
 */
function removeDependency(serviceId) {
    const selector = document.getElementById('dependencySelector');
    const option = selector.querySelector(`[value="${serviceId}"]`);
    if (option) {
        option.selected = false;
    }
    updateSelectedDependencies();
}

/**
 * 填充服务依赖
 */
function populateServiceDependencies(dependencies) {
    const selector = document.getElementById('dependencySelector');
    
    // 清除所有选择
    Array.from(selector.options).forEach(option => {
        option.selected = dependencies.includes(option.value);
    });
    
    updateSelectedDependencies();
}

/**
 * 保存服务
 */
async function saveService() {
    if (!validateServiceForm()) {
        return;
    }
    
    const formData = collectServiceFormData();
    
    try {
        const isEdit = !!currentService;
        const url = isEdit ? `${API_BASE}/services/${currentService.serviceId}` : `${API_BASE}/services`;
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
            showNotification(isEdit ? '服务更新成功' : '服务创建成功', 'success');
            
            // 更新本地数据
            if (isEdit) {
                const index = allServices.findIndex(s => s.serviceId === currentService.serviceId);
                if (index !== -1) {
                    allServices[index] = { ...allServices[index], ...formData, lastModified: new Date().toISOString() };
                }
            } else {
                const newService = {
                    ...formData,
                    serviceId: formData.serviceCode || 'SVC' + Date.now(),
                    createdTime: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                allServices.push(newService);
            }
            
            // 刷新显示
            searchServices();
            updateStatistics();
            loadDependencyOptions();
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
            modal.hide();
            
        } else {
            showNotification('保存失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('保存服务失败:', error);
        
        // 模拟保存成功
        const isEdit = !!currentService;
        if (isEdit) {
            const index = allServices.findIndex(s => s.serviceId === currentService.serviceId);
            if (index !== -1) {
                allServices[index] = { ...allServices[index], ...formData, lastModified: new Date().toISOString() };
            }
        } else {
            const newService = {
                ...formData,
                serviceId: formData.serviceCode || 'SVC' + Date.now(),
                createdTime: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            allServices.push(newService);
        }
        
        searchServices();
        updateStatistics();
        loadDependencyOptions();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
        modal.hide();
        
        showNotification(isEdit ? '服务更新成功 (演示模式)' : '服务创建成功 (演示模式)', 'success');
    }
}

/**
 * 验证服务表单
 */
function validateServiceForm() {
    const requiredFields = [
        { id: 'serviceCode', name: '服务代码' },
        { id: 'serviceName', name: '服务名称' },
        { id: 'businessType', name: '业务类型' },
        { id: 'serviceCategory', name: '服务分类' }
    ];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            showNotification(`请填写${field.name}`, 'warning');
            element.focus();
            return false;
        }
    }
    
    // 验证工作流步骤
    const workflowSteps = document.querySelectorAll('.workflow-step');
    if (workflowSteps.length === 0) {
        showNotification('请至少添加一个工作流步骤', 'warning');
        return false;
    }
    
    // 验证每个步骤都有名称
    for (let i = 0; i < workflowSteps.length; i++) {
        const stepName = workflowSteps[i].querySelector('[name="stepName"]').value.trim();
        if (!stepName) {
            showNotification(`请填写步骤 ${i + 1} 的名称`, 'warning');
            return false;
        }
    }
    
    return true;
}

/**
 * 收集表单数据
 */
function collectServiceFormData() {
    // 收集工作流步骤
    const workflowSteps = [];
    document.querySelectorAll('.workflow-step').forEach(stepElement => {
        const stepName = stepElement.querySelector('[name="stepName"]').value.trim();
        const stepDescription = stepElement.querySelector('[name="stepDescription"]').value.trim();
        if (stepName) {
            workflowSteps.push({ stepName, stepDescription });
        }
    });
    
    // 收集依赖关系
    const dependencies = Array.from(document.getElementById('dependencySelector').selectedOptions)
        .map(option => option.value);
    
    // 收集技能标签
    const skillsText = document.getElementById('requiredSkills').value.trim();
    const requiredSkills = skillsText ? skillsText.split(',').map(skill => skill.trim()).filter(skill => skill) : [];
    
    return {
        serviceCode: document.getElementById('serviceCode').value.trim(),
        serviceName: document.getElementById('serviceName').value.trim(),
        serviceNameEn: document.getElementById('serviceNameEn').value.trim(),
        abbreviation: document.getElementById('abbreviation').value.trim(),
        serviceDescription: document.getElementById('serviceDescription').value.trim(),
        businessType: document.getElementById('businessType').value,
        serviceCategory: document.getElementById('serviceCategory').value,
        priority: parseInt(document.getElementById('priority').value),
        processingType: document.getElementById('processingType').value,
        estimatedDuration: parseFloat(document.getElementById('estimatedDuration').value) || null,
        maxConcurrency: parseInt(document.getElementById('maxConcurrency').value) || 1,
        requiredSkills: requiredSkills,
        riskLevel: document.getElementById('riskLevel').value,
        isActive: document.getElementById('isActive').checked,
        autoAssign: document.getElementById('autoAssign').checked,
        requiresApproval: document.getElementById('requiresApproval').checked,
        trackable: document.getElementById('trackable').checked,
        workflowSteps: workflowSteps,
        dependencies: dependencies
    };
}

/**
 * 显示删除确认
 */
function showDeleteConfirm(serviceId, serviceName) {
    deleteServiceId = serviceId;
    document.getElementById('deleteServiceName').textContent = serviceName;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

/**
 * 确认删除服务
 */
async function confirmDeleteService() {
    if (!deleteServiceId) return;
    
    try {
        const response = await fetch(`${API_BASE}/services/${deleteServiceId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('服务删除成功', 'success');
        } else {
            showNotification('删除失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('删除服务失败:', error);
        showNotification('服务删除成功 (演示模式)', 'success');
    } finally {
        // 无论API是否成功，都从本地数据中移除
        allServices = allServices.filter(s => s.serviceId !== deleteServiceId);
        searchServices();
        updateStatistics();
        loadDependencyOptions();
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        deleteServiceId = null;
    }
}

/**
 * 切换服务状态
 */
async function toggleServiceStatus(serviceId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/services/${serviceId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`服务已${newStatus ? '启用' : '停用'}`, 'success');
        } else {
            showNotification('状态更新失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('更新服务状态失败:', error);
        showNotification(`服务已${newStatus ? '启用' : '停用'} (演示模式)`, 'success');
    } finally {
        // 更新本地数据
        const service = allServices.find(s => s.serviceId === serviceId);
        if (service) {
            service.isActive = newStatus;
            service.lastModified = new Date().toISOString();
        }
        
        searchServices();
        updateStatistics();
    }
}

/**
 * 查看服务详情
 */
function viewServiceDetails(serviceId) {
    const service = allServices.find(s => s.serviceId === serviceId);
    if (!service) {
        showNotification('服务不存在', 'error');
        return;
    }
    
    // 可以在这里显示详细的服务信息模态框，或跳转到详情页面
    showNotification(`查看服务详情: ${service.serviceName}`, 'info');
}

/**
 * 工具函数：获取业务类型图标
 */
function getBusinessTypeIcon(businessType) {
    const icons = {
        'OCEAN': 'ship',
        'AIR': 'plane',
        'TRUCK': 'truck',
        'RAIL': 'train',
        'MULTIMODAL': 'route'
    };
    return icons[businessType] || 'cogs';
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
 * 获取分类徽章
 */
function getCategoryBadge(category) {
    const config = {
        'CORE': { class: 'bg-primary', name: '核心' },
        'ADDON': { class: 'bg-info', name: '增值' },
        'SUPPORT': { class: 'bg-secondary', name: '支持' }
    };
    const c = config[category] || { class: 'bg-secondary', name: category };
    return `<span class="badge ${c.class} service-type-badge">${c.name}</span>`;
}

/**
 * 获取优先级徽章
 */
function getPriorityBadge(priority) {
    const config = {
        1: { class: 'bg-danger', name: '高' },
        2: { class: 'bg-warning', name: '中' },
        3: { class: 'bg-success', name: '低' }
    };
    const p = config[priority] || { class: 'bg-secondary', name: '未知' };
    return `<span class="badge ${p.class} service-type-badge">${p.name}</span>`;
}

/**
 * 获取风险徽章
 */
function getRiskBadge(riskLevel) {
    const config = {
        'LOW': { class: 'bg-success', name: '低风险' },
        'MEDIUM': { class: 'bg-warning', name: '中风险' },
        'HIGH': { class: 'bg-danger', name: '高风险' }
    };
    const r = config[riskLevel] || { class: 'bg-secondary', name: riskLevel };
    return `<span class="badge ${r.class} service-type-badge">${r.name}</span>`;
}

/**
 * 获取处理方式名称
 */
function getProcessingTypeName(processingType) {
    const names = {
        'MANUAL': '手动处理',
        'AUTO': '自动处理',
        'HYBRID': '混合处理'
    };
    return names[processingType] || processingType;
}

/**
 * 获取处理方式徽章样式
 */
function getProcessingTypeBadgeClass(processingType) {
    const classes = {
        'MANUAL': 'bg-primary',
        'AUTO': 'bg-success',
        'HYBRID': 'bg-info'
    };
    return classes[processingType] || 'bg-secondary';
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
window.loadServices = loadServices;
window.searchServices = searchServices;
window.showCreateServiceForm = showCreateServiceForm;
window.editService = editService;
window.saveService = saveService;
window.viewServiceDetails = viewServiceDetails;
window.showDeleteConfirm = showDeleteConfirm;
window.confirmDeleteService = confirmDeleteService;
window.toggleServiceStatus = toggleServiceStatus;
window.addWorkflowStep = addWorkflowStep;
window.removeWorkflowStep = removeWorkflowStep;
window.updateSelectedDependencies = updateSelectedDependencies;
window.removeDependency = removeDependency;