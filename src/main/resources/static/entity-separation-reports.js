// 管法分离报表前端逻辑
const API_BASE_URL = '/api/entity-separation-reports';

// 全局状态
let currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM格式
let dashboardData = null;

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // 绑定期间选择器变更事件
    document.getElementById('periodSelector').addEventListener('change', function() {
        currentPeriod = this.value;
        refreshAllData();
    });
    
    // 绑定筛选器变更事件
    document.getElementById('flowTypeFilter')?.addEventListener('change', refreshFundFlowData);
    document.getElementById('riskLevelFilter')?.addEventListener('change', refreshComplianceData);
    
    // 绑定选项卡切换事件
    const tabElements = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target').replace('#', '');
            handleTabSwitch(targetId);
        });
    });
});

// ========== 页面初始化函数 ==========
async function initializePage() {
    initializePeriodSelector();
    await loadDashboardStatistics();
    await loadLegalEntities();
    await loadManagementEntities();
    await loadEntityMappings();
    showSuccessMessage('管法分离报表系统初始化完成');
}

function initializePeriodSelector() {
    const selector = document.getElementById('periodSelector');
    const currentDate = new Date();
    
    // 生成最近12个月的选项
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const period = date.toISOString().slice(0, 7);
        const displayText = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
        
        const option = document.createElement('option');
        option.value = period;
        option.textContent = displayText;
        if (i === 0) option.selected = true;
        
        selector.appendChild(option);
    }
    
    currentPeriod = selector.value;
}

// ========== 仪表盘统计 ==========
async function loadDashboardStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard-statistics?period=${currentPeriod}`);
        const result = await response.json();
        
        if (result.code === 200) {
            dashboardData = result.data;
            renderDashboardStatistics(dashboardData);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载仪表盘统计失败:', error);
        showErrorMessage('加载仪表盘统计失败: ' + error.message);
    }
}

function renderDashboardStatistics(data) {
    const container = document.getElementById('dashboardStats');
    
    // 法人实体统计
    const entityStats = data.entityCounts.reduce((acc, item) => {
        acc[item.entity_type] = item.count;
        return acc;
    }, {});
    
    // 过账处理统计
    const passthroughStats = data.passthroughStats || {};
    
    // 资金流向统计
    const flowStats = data.flowStats.reduce((acc, item) => {
        acc.totalTransactions = (acc.totalTransactions || 0) + parseInt(item.transaction_count || 0);
        acc.totalAmount = (acc.totalAmount || 0) + parseFloat(item.total_amount || 0);
        return acc;
    }, {});
    
    // 合规风险统计
    const complianceStats = data.complianceStats.reduce((acc, item) => {
        acc[item.risk_level] = item.count;
        return acc;
    }, {});
    
    const statsCards = [
        {
            title: '境内法人实体',
            value: entityStats.DOMESTIC || 0,
            icon: 'fas fa-building',
            color: '#28a745'
        },
        {
            title: '境外法人实体', 
            value: entityStats.OVERSEAS || 0,
            icon: 'fas fa-globe',
            color: '#007bff'
        },
        {
            title: '过账指令总数',
            value: passthroughStats.total_instructions || 0,
            icon: 'fas fa-route',
            color: '#6f42c1'
        },
        {
            title: '过账成功率',
            value: passthroughStats.total_instructions > 0 ? 
                Math.round(passthroughStats.completed_instructions / passthroughStats.total_instructions * 100) + '%' : '0%',
            icon: 'fas fa-check-circle',
            color: '#28a745'
        },
        {
            title: '资金流向交易',
            value: flowStats.totalTransactions || 0,
            icon: 'fas fa-exchange-alt',
            color: '#17a2b8'
        },
        {
            title: '资金流向总额',
            value: formatCurrency(flowStats.totalAmount || 0),
            icon: 'fas fa-coins',
            color: '#fd7e14'
        },
        {
            title: '高风险问题',
            value: (complianceStats.HIGH || 0) + (complianceStats.CRITICAL || 0),
            icon: 'fas fa-exclamation-triangle',
            color: '#dc3545'
        },
        {
            title: '合规检查通过率',
            value: calculateCompliancePassRate(data.complianceStats),
            icon: 'fas fa-shield-alt',
            color: '#28a745'
        }
    ];
    
    container.innerHTML = statsCards.map(card => `
        <div class="stat-card">
            <div class="stat-number" style="color: ${card.color}">
                <i class="${card.icon} me-2"></i>${card.value}
            </div>
            <div class="stat-label">${card.title}</div>
        </div>
    `).join('');
}

function calculateCompliancePassRate(complianceStats) {
    const total = complianceStats.reduce((sum, item) => sum + parseInt(item.count), 0);
    const passed = complianceStats.find(item => item.risk_level === 'PASSED')?.count || 0;
    return total > 0 ? Math.round(passed / total * 100) + '%' : '100%';
}

// ========== 法人实体管理 ==========
async function loadLegalEntities() {
    try {
        const response = await fetch(`${API_BASE_URL}/legal-entities`);
        const result = await response.json();
        
        if (result.code === 200) {
            renderLegalEntitiesTable(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载法人实体失败:', error);
        document.getElementById('legalEntitiesTable').innerHTML = 
            '<tr><td colspan="5" class="text-center text-danger">加载失败: ' + error.message + '</td></tr>';
    }
}

function renderLegalEntitiesTable(entities) {
    const tableBody = document.getElementById('legalEntitiesTable');
    
    if (entities.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">暂无数据</td></tr>';
        return;
    }
    
    tableBody.innerHTML = entities.map(entity => `
        <tr>
            <td>
                <div class="fw-bold">${entity.entityName}</div>
                <small class="text-muted">${entity.taxId || '-'}</small>
            </td>
            <td><code>${entity.entityCode}</code></td>
            <td>
                <span class="entity-badge entity-${entity.entityType.toLowerCase()}">
                    ${entity.entityTypeDisplay}
                </span>
            </td>
            <td>${entity.countryCode || '-'}</td>
            <td>${entity.currencyCode}</td>
        </tr>
    `).join('');
}

// ========== 管理实体管理 ==========
async function loadManagementEntities() {
    try {
        const response = await fetch(`${API_BASE_URL}/management-entities`);
        const result = await response.json();
        
        if (result.code === 200) {
            renderManagementEntitiesHierarchy(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载管理实体失败:', error);
        document.getElementById('managementEntitiesHierarchy').innerHTML = 
            '<div class="text-center text-danger">加载失败: ' + error.message + '</div>';
    }
}

function renderManagementEntitiesHierarchy(entities) {
    const container = document.getElementById('managementEntitiesHierarchy');
    
    if (entities.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">暂无数据</div>';
        return;
    }
    
    // 按层级和路径排序
    entities.sort((a, b) => {
        if (a.entityLevel !== b.entityLevel) {
            return a.entityLevel - b.entityLevel;
        }
        return (a.entityPath || '').localeCompare(b.entityPath || '');
    });
    
    container.innerHTML = entities.map(entity => `
        <div class="entity-hierarchy entity-level-${entity.entityLevel} mb-2">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-sitemap me-2"></i>
                    <strong>${entity.mgmtEntityName}</strong>
                    <code class="ms-2">${entity.mgmtEntityCode}</code>
                </div>
                <div class="text-end">
                    <small class="text-muted">${entity.entityLevelDisplay}</small>
                    ${entity.managerName ? `<br><small>负责人: ${entity.managerName}</small>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ========== 管法对应关系 ==========
async function loadEntityMappings() {
    try {
        const response = await fetch(`${API_BASE_URL}/entity-mappings`);
        const result = await response.json();
        
        if (result.code === 200) {
            renderEntityMappingsTable(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载管法对应关系失败:', error);
        document.getElementById('entityMappingsTable').innerHTML = 
            '<tr><td colspan="6" class="text-center text-danger">加载失败: ' + error.message + '</td></tr>';
    }
}

function renderEntityMappingsTable(mappings) {
    const tableBody = document.getElementById('entityMappingsTable');
    
    if (mappings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">暂无数据</td></tr>';
        return;
    }
    
    tableBody.innerHTML = mappings.map(mapping => `
        <tr>
            <td>
                <div class="fw-bold">${mapping.mgmtEntityName}</div>
                <small class="text-muted">${mapping.mgmtEntityCode}</small>
            </td>
            <td>
                <div>${mapping.legalEntityName}</div>
                <small class="text-muted">${mapping.legalEntityCode}</small>
            </td>
            <td>
                <span class="mapping-ratio">${mapping.allocationPercentage}%</span>
            </td>
            <td>${formatDate(mapping.effectiveDate)}</td>
            <td>
                <span class="badge ${mapping.mappingStatus === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                    ${mapping.mappingStatus === 'ACTIVE' ? '有效' : '过期'}
                </span>
            </td>
            <td>
                ${mapping.isPrimary ? '<i class="fas fa-star text-warning" title="主要归属"></i>' : '-'}
            </td>
        </tr>
    `).join('');
}

// ========== 资金流向报表 ==========
async function refreshFundFlowData() {
    const flowType = document.getElementById('flowTypeFilter').value;
    await loadFundFlowReports(flowType);
}

async function loadFundFlowReports(flowType = '') {
    try {
        let url = `${API_BASE_URL}/fund-flow-reports?period=${currentPeriod}`;
        if (flowType) {
            url += `&flowType=${flowType}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.code === 200) {
            renderFundFlowReports(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载资金流向报表失败:', error);
        document.getElementById('fundFlowReportsTable').innerHTML = 
            '<div class="text-center text-danger">加载失败: ' + error.message + '</div>';
    }
}

function renderFundFlowReports(data) {
    const container = document.getElementById('fundFlowReportsTable');
    const summaryContainer = document.getElementById('flowSummary');
    
    // 渲染汇总信息
    const summary = data.summary || {};
    summaryContainer.innerHTML = `
        <div class="text-center">
            <div class="fw-bold text-primary">${summary.totalTransactions || 0}</div>
            <small>总交易数</small>
        </div>
        <div class="text-center">
            <div class="fw-bold text-success">${formatCurrency(summary.totalAmount || 0)}</div>
            <small>总金额</small>
        </div>
        <div class="text-center">
            <div class="fw-bold text-info">${summary.reportCount || 0}</div>
            <small>流向记录</small>
        </div>
    `;
    
    // 渲染详细报表
    const details = data.details || [];
    if (details.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">暂无数据</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table data-table">
                <thead>
                    <tr>
                        <th>资金流向</th>
                        <th>管理归属</th>
                        <th>流向类型</th>
                        <th>交易数量</th>
                        <th>总金额</th>
                        <th>平均金额</th>
                        <th>币种</th>
                    </tr>
                </thead>
                <tbody>
                    ${details.map(detail => `
                        <tr>
                            <td>
                                <div class="flow-direction">
                                    <div class="flow-entity">${detail.sourceEntityCode}</div>
                                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                                    <div class="flow-entity">${detail.targetEntityCode}</div>
                                </div>
                                <small class="text-muted">
                                    ${detail.sourceEntityName} → ${detail.targetEntityName}
                                </small>
                            </td>
                            <td>${detail.mgmtEntityName || '-'}</td>
                            <td>
                                <span class="badge bg-primary">${detail.flowTypeDisplay}</span>
                            </td>
                            <td class="text-center">${detail.transactionCount}</td>
                            <td class="amount-highlight amount-large">${formatCurrency(detail.totalAmount)}</td>
                            <td class="amount-highlight">${formatCurrency(detail.averageAmount)}</td>
                            <td>${detail.flowCurrency}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ========== 损益分析 ==========
async function loadProfitLossReports() {
    try {
        const response = await fetch(`${API_BASE_URL}/profit-loss-reports?period=${currentPeriod}`);
        const result = await response.json();
        
        if (result.code === 200) {
            renderProfitLossTable(result.data.reports);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载损益报表失败:', error);
        document.getElementById('profitLossTable').innerHTML = 
            '<tr><td colspan="9" class="text-center text-danger">加载失败: ' + error.message + '</td></tr>';
    }
}

function renderProfitLossTable(reports) {
    const tableBody = document.getElementById('profitLossTable');
    
    if (reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">暂无数据</td></tr>';
        return;
    }
    
    tableBody.innerHTML = reports.map(report => `
        <tr>
            <td>
                <div class="fw-bold">${report.mgmtEntityName || '-'}</div>
                <small class="text-muted">${report.mgmtEntityCode || '-'}</small>
            </td>
            <td>
                <div>${report.legalEntityName || '-'}</div>
                <small class="text-muted">${report.legalEntityCode || '-'}</small>
            </td>
            <td class="amount-highlight">${formatCurrency(report.totalRevenue)}</td>
            <td class="amount-highlight">${formatCurrency(report.totalExpense)}</td>
            <td class="amount-highlight ${getProfitClass(report.netProfit)}">
                ${formatCurrency(report.netProfit)}
            </td>
            <td class="${getProfitClass(report.profitMargin)}">
                ${formatPercentage(report.profitMargin)}
            </td>
            <td class="amount-highlight">${formatCurrency(report.mgmtPerspectiveTotal)}</td>
            <td class="amount-highlight">${formatCurrency(report.legalPerspectiveTotal)}</td>
            <td class="amount-highlight ${getAdjustmentClass(report.totalAdjustments)}">
                ${formatCurrency(report.totalAdjustments)}
            </td>
        </tr>
    `).join('');
}

// ========== 过账统计 ==========
async function loadPassthroughEntityStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/passthrough-entity-stats?period=${currentPeriod}`);
        const result = await response.json();
        
        if (result.code === 200) {
            renderPassthroughStatsTable(result.data.stats);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载过账统计失败:', error);
        document.getElementById('passthroughStatsTable').innerHTML = 
            '<tr><td colspan="10" class="text-center text-danger">加载失败: ' + error.message + '</td></tr>';
    }
}

function renderPassthroughStatsTable(stats) {
    const tableBody = document.getElementById('passthroughStatsTable');
    
    if (stats.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">暂无数据</td></tr>';
        return;
    }
    
    tableBody.innerHTML = stats.map(stat => `
        <tr>
            <td>
                <div class="fw-bold">${stat.entityName}</div>
                <small class="text-muted">${stat.entityCode}</small>
            </td>
            <td>${stat.mgmtEntityName || '-'}</td>
            <td class="text-center">
                <span class="badge bg-info">${stat.totalInstructions}</span>
            </td>
            <td class="${getSuccessRateClass(stat.successRate)}">
                ${formatPercentage(stat.successRate)}
            </td>
            <td class="amount-highlight">${formatCurrency(stat.totalOriginalAmount)}</td>
            <td class="amount-highlight amount-large">${formatCurrency(stat.totalPassthroughAmount)}</td>
            <td class="amount-highlight text-success">${formatCurrency(stat.totalRetentionAmount)}</td>
            <td class="text-info">${formatPercentage(stat.retentionRate)}</td>
            <td class="amount-highlight ${getNetFlowClass(stat.netFlowAmount)}">
                ${formatCurrency(stat.netFlowAmount)}
            </td>
            <td class="text-center">
                ${stat.complianceIssues > 0 ? 
                    `<span class="badge bg-warning">${stat.complianceIssues}</span>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
        </tr>
    `).join('');
}

// ========== 合规检查 ==========
async function refreshComplianceData() {
    const riskLevel = document.getElementById('riskLevelFilter').value;
    await loadComplianceReports(riskLevel);
}

async function loadComplianceReports(riskLevel = '') {
    try {
        let url = `${API_BASE_URL}/compliance-reports?period=${currentPeriod}`;
        if (riskLevel) {
            url += `&riskLevel=${riskLevel}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.code === 200) {
            renderComplianceReportsTable(result.data.reports);
            updateComplianceOverview(result.data.reports);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载合规检查报告失败:', error);
        document.getElementById('complianceReportsTable').innerHTML = 
            '<tr><td colspan="9" class="text-center text-danger">加载失败: ' + error.message + '</td></tr>';
    }
}

function renderComplianceReportsTable(reports) {
    const tableBody = document.getElementById('complianceReportsTable');
    
    if (reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">暂无数据</td></tr>';
        return;
    }
    
    tableBody.innerHTML = reports.map(report => `
        <tr>
            <td>
                <div class="fw-bold">${report.entityName}</div>
                <small class="text-muted">${report.entityCode}</small>
            </td>
            <td>
                <span class="badge bg-secondary">${report.checkTypeDisplay}</span>
            </td>
            <td>
                <span class="compliance-status status-${report.checkResult.toLowerCase()}">
                    ${report.checkResultDisplay}
                </span>
            </td>
            <td>
                <span class="risk-level risk-${report.riskLevel.toLowerCase()}">
                    ${report.riskLevel}
                </span>
            </td>
            <td>
                <div class="text-truncate" style="max-width: 200px;" title="${report.identifiedIssues}">
                    ${report.identifiedIssues || '-'}
                </div>
            </td>
            <td>${report.complianceOfficer || '-'}</td>
            <td>${formatDate(report.checkDate)}</td>
            <td>${formatDate(report.dueDate) || '-'}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(report.status)}">
                    ${getStatusDisplayName(report.status)}
                </span>
            </td>
        </tr>
    `).join('');
}

function updateComplianceOverview(reports) {
    const container = document.getElementById('complianceOverview');
    
    // 计算统计
    const stats = reports.reduce((acc, report) => {
        acc.total++;
        acc[report.checkResult] = (acc[report.checkResult] || 0) + 1;
        acc[report.riskLevel] = (acc[report.riskLevel] || 0) + 1;
        return acc;
    }, { total: 0 });
    
    container.innerHTML = `
        <div class="text-center">
            <div class="fw-bold text-primary">${stats.total}</div>
            <small>总检查数</small>
        </div>
        <div class="text-center">
            <div class="fw-bold text-success">${stats.PASSED || 0}</div>
            <small>通过</small>
        </div>
        <div class="text-center">
            <div class="fw-bold text-danger">${(stats.HIGH || 0) + (stats.CRITICAL || 0)}</div>
            <small>高风险</small>
        </div>
    `;
}

// ========== 选项卡切换处理 ==========
function handleTabSwitch(tabId) {
    switch(tabId) {
        case 'fund-flow':
            loadFundFlowReports();
            break;
        case 'profit-loss':
            loadProfitLossReports();
            break;
        case 'passthrough-stats':
            loadPassthroughEntityStats();
            break;
        case 'compliance':
            loadComplianceReports();
            break;
    }
}

// ========== 数据刷新 ==========
async function refreshAllData() {
    await loadDashboardStatistics();
    
    // 根据当前激活的选项卡刷新对应数据
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab) {
        const targetId = activeTab.getAttribute('data-bs-target').replace('#', '');
        handleTabSwitch(targetId);
    }
}

// ========== 导出功能 ==========
function exportFundFlowReport() {
    const flowType = document.getElementById('flowTypeFilter').value;
    let filename = `资金流向报表_${currentPeriod}`;
    if (flowType) {
        filename += `_${flowType}`;
    }
    filename += '.csv';
    
    // 这里应该调用后端API生成CSV文件
    showInfoMessage('正在生成资金流向报表...');
}

function exportProfitLossReport() {
    const filename = `管法分离损益报表_${currentPeriod}.xlsx`;
    showInfoMessage('正在生成损益报表...');
}

function exportPassthroughStats() {
    const filename = `过账处理统计_${currentPeriod}.xlsx`;
    showInfoMessage('正在生成过账统计报表...');
}

function exportComplianceReport() {
    const riskLevel = document.getElementById('riskLevelFilter').value;
    let filename = `合规检查报告_${currentPeriod}`;
    if (riskLevel) {
        filename += `_${riskLevel}`;
    }
    filename += '.pdf';
    
    showInfoMessage('正在生成合规检查报告...');
}

// ========== 辅助功能 ==========
function generatePassthroughReport() {
    showInfoMessage('正在生成过账处理统计图表...');
    // 这里可以集成图表库如Chart.js生成可视化图表
}

function generateComplianceAlert() {
    showWarningMessage('正在生成合规风险预警报告...');
    // 这里可以生成风险预警报告
}

// ========== 工具函数 ==========
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    return '¥' + parseFloat(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercentage(value) {
    if (value === null || value === undefined) return '-';
    return parseFloat(value).toFixed(2) + '%';
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
}

function getProfitClass(value) {
    if (value === null || value === undefined) return 'profit-neutral';
    return parseFloat(value) > 0 ? 'profit-positive' : 'profit-negative';
}

function getAdjustmentClass(value) {
    if (value === null || value === undefined || parseFloat(value) === 0) return 'profit-neutral';
    return parseFloat(value) > 0 ? 'profit-positive' : 'profit-negative';
}

function getSuccessRateClass(rate) {
    const value = parseFloat(rate) || 0;
    if (value >= 90) return 'text-success';
    if (value >= 70) return 'text-warning';
    return 'text-danger';
}

function getNetFlowClass(amount) {
    if (amount === null || amount === undefined) return '';
    return parseFloat(amount) >= 0 ? 'text-success' : 'text-danger';
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'OPEN': 'bg-warning',
        'IN_PROGRESS': 'bg-info',
        'RESOLVED': 'bg-success',
        'CLOSED': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
}

function getStatusDisplayName(status) {
    const statusNames = {
        'OPEN': '待处理',
        'IN_PROGRESS': '处理中',
        'RESOLVED': '已解决',
        'CLOSED': '已关闭'
    };
    return statusNames[status] || status;
}

// ========== 消息提示 ==========
function showSuccessMessage(message) {
    console.log('✅ ' + message);
    // 这里可以集成Toast组件显示成功消息
}

function showErrorMessage(message) {
    console.error('❌ ' + message);
    // 这里可以集成Toast组件显示错误消息
}

function showInfoMessage(message) {
    console.info('ℹ️ ' + message);
    // 这里可以集成Toast组件显示信息消息
}

function showWarningMessage(message) {
    console.warn('⚠️ ' + message);
    // 这里可以集成Toast组件显示警告消息
}

function goBack() {
    window.location.href = 'freight-order.html';
}