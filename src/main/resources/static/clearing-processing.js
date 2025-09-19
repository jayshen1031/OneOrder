/**
 * 清分处理前端脚本
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */

// 全局变量
let currentInstruction = null;
let clearingRules = [];
let clearingBatches = [];
let currentExecutionResult = null;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('清分处理页面初始化');
    loadStatistics();
    loadClearingRules();
    loadClearingBatches();
    
    // 订单选择事件
    document.getElementById('orderSelect').addEventListener('change', function() {
        const orderId = this.value;
        if (orderId) {
            document.getElementById('generateBtn').disabled = false;
            checkExistingInstruction(orderId);
        } else {
            document.getElementById('generateBtn').disabled = true;
            hideInstructionInfo();
        }
    });
});

/**
 * 返回首页
 */
function goBack() {
    window.location.href = 'freight-order.html';
}

/**
 * 加载清分统计
 */
function loadStatistics() {
    fetch('/api/api/clearing-processing/statistics')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayStatistics(data.data);
            } else {
                console.error('加载统计失败:', data.message);
            }
        })
        .catch(error => {
            console.error('加载统计失败:', error);
        });
}

/**
 * 显示统计信息
 */
function displayStatistics(stats) {
    document.getElementById('totalInstructions').textContent = stats.totalInstructions;
    document.getElementById('pendingInstructions').textContent = stats.pendingInstructions;
    document.getElementById('completedInstructions').textContent = stats.completedInstructions;
    document.getElementById('totalAmount').textContent = formatCurrency(stats.totalClearingAmount);
}

/**
 * 检查是否已存在清分指令
 */
function checkExistingInstruction(orderId) {
    fetch(`/api/api/clearing-processing/instruction/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                currentInstruction = data.data.instruction;
                showInstructionInfo(data.data.instruction);
            } else if (data.code === 404) {
                hideInstructionInfo();
                currentInstruction = null;
            }
        })
        .catch(error => {
            console.error('检查清分指令失败:', error);
        });
}

/**
 * 显示清分指令信息
 */
function showInstructionInfo(instruction) {
    document.getElementById('instructionFlow').style.display = 'block';
    document.getElementById('currentInstruction').style.display = 'block';
    
    document.getElementById('instructionId').textContent = instruction.instructionId;
    document.getElementById('instructionMode').innerHTML = getModeBadge(instruction.clearingMode);
    document.getElementById('instructionAmount').textContent = formatCurrency(instruction.clearingAmount);
    document.getElementById('instructionStatus').innerHTML = getStatusBadge(instruction.instructionStatus);
    
    // 更新流程状态
    updateFlowSteps(instruction.instructionStatus);
    
    // 根据状态启用/禁用按钮
    const status = instruction.instructionStatus;
    document.getElementById('executeBtn').disabled = (status === 'COMPLETED' || status === 'PROCESSING');
    document.getElementById('dryRunBtn').disabled = false;
    document.getElementById('detailsBtn').disabled = false;
    document.getElementById('logsBtn').disabled = false;
}

/**
 * 隐藏清分指令信息
 */
function hideInstructionInfo() {
    document.getElementById('instructionFlow').style.display = 'none';
    document.getElementById('currentInstruction').style.display = 'none';
    document.getElementById('clearingDetailsCard').style.display = 'none';
    document.getElementById('executionResultCard').style.display = 'none';
}

/**
 * 更新流程步骤状态
 */
function updateFlowSteps(status) {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    steps.forEach(step => {
        const element = document.getElementById(step);
        element.className = 'flow-step';
    });
    
    // 根据状态设置步骤样式
    document.getElementById('step1').classList.add('completed'); // 指令已生成
    
    switch (status) {
        case 'PENDING':
            document.getElementById('step2').classList.add('active');
            break;
        case 'PROCESSING':
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');
            break;
        case 'COMPLETED':
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('completed');
            document.getElementById('step4').classList.add('completed');
            break;
    }
}

/**
 * 生成清分指令
 */
function generateInstruction() {
    const orderId = document.getElementById('orderSelect').value;
    const clearingMode = document.getElementById('clearingModeSelect').value;
    
    if (!orderId) {
        showAlert('请先选择订单', 'warning');
        return;
    }
    
    // 检查是否有分润计算结果
    fetch(`/api/api/profit-sharing/result/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code !== 200) {
                showAlert('请先完成订单的分润计算', 'warning');
                return;
            }
            
            const calculationId = data.data.summary.calculationId;
            
            // 生成清分指令
            const generateBtn = document.getElementById('generateBtn');
            const originalText = generateBtn.innerHTML;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>生成中...';
            generateBtn.disabled = true;
            
            fetch('/api/api/clearing-processing/generate-instruction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    calculationId: calculationId,
                    clearingMode: clearingMode,
                    createdBy: 'current_user'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    showAlert('清分指令生成成功', 'success');
                    
                    // 重新加载指令信息
                    setTimeout(() => {
                        checkExistingInstruction(orderId);
                        loadStatistics();
                        loadClearingBatches();
                    }, 1000);
                } else {
                    showAlert('生成清分指令失败: ' + data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('生成清分指令失败:', error);
                showAlert('生成清分指令失败', 'danger');
            })
            .finally(() => {
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
            });
        })
        .catch(error => {
            console.error('检查分润计算结果失败:', error);
            showAlert('检查分润计算结果失败', 'danger');
        });
}

/**
 * 执行清分指令
 */
function executeInstruction(dryRun = false) {
    if (!currentInstruction) {
        showAlert('无清分指令可执行', 'warning');
        return;
    }
    
    const instructionId = currentInstruction.instructionId;
    const btnId = dryRun ? 'dryRunBtn' : 'executeBtn';
    const button = document.getElementById(btnId);
    const originalText = button.innerHTML;
    
    button.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${dryRun ? '试算中...' : '执行中...'}`;
    button.disabled = true;
    
    fetch(`/api/api/clearing-processing/execute/${instructionId}?dryRun=${dryRun}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            showAlert(dryRun ? '清分试算完成' : '清分指令执行完成', 'success');
            currentExecutionResult = data.data;
            displayExecutionResult(data.data, dryRun);
            
            if (!dryRun) {
                // 重新加载指令信息和统计
                setTimeout(() => {
                    checkExistingInstruction(currentInstruction.orderId);
                    loadStatistics();
                }, 1000);
            }
        } else {
            showAlert((dryRun ? '清分试算失败: ' : '清分执行失败: ') + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error(dryRun ? '清分试算失败:' : '清分执行失败:', error);
        showAlert(dryRun ? '清分试算失败' : '清分执行失败', 'danger');
    })
    .finally(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    });
}

/**
 * 显示执行结果
 */
function displayExecutionResult(result, dryRun) {
    document.getElementById('executionResultCard').style.display = 'block';
    
    document.getElementById('successCount').textContent = result.successCount;
    document.getElementById('failureCount').textContent = result.failureCount;
    document.getElementById('successRate').textContent = result.successRate.toFixed(1) + '%';
    document.getElementById('executedAmount').textContent = formatCurrency(result.totalExecutedAmount);
    
    // 显示执行时间线
    displayExecutionTimeline(result.executionResults, dryRun);
}

/**
 * 显示执行时间线
 */
function displayExecutionTimeline(executionResults, dryRun) {
    const timeline = document.getElementById('executionTimeline');
    timeline.innerHTML = '';
    
    executionResults.forEach((result, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item ${result.status === 'SUCCESS' ? 'completed' : 'failed'}`;
        
        timelineItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">
                        ${getDetailTypeIcon(result.detailType)} 
                        ${getDetailTypeName(result.detailType)} #${result.detailSequence}
                        <span class="badge ${result.status === 'SUCCESS' ? 'bg-success' : 'bg-danger'} ms-2">
                            ${result.status === 'SUCCESS' ? '成功' : '失败'}
                        </span>
                    </h6>
                    <p class="mb-1 text-muted">${result.message}</p>
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>${formatDateTime(result.executedTime)}
                    </small>
                </div>
                <div class="text-end">
                    <div class="amount-positive">¥${formatNumber(result.amount)}</div>
                    ${dryRun ? '<small class="text-muted">(试算模式)</small>' : ''}
                </div>
            </div>
        `;
        
        timeline.appendChild(timelineItem);
    });
}

/**
 * 查看清分明细
 */
function viewInstructionDetails() {
    if (!currentInstruction) {
        showAlert('无清分指令信息', 'warning');
        return;
    }
    
    const orderId = currentInstruction.orderId;
    
    fetch(`/api/api/clearing-processing/instruction/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayClearingDetails(data.data.details);
            } else {
                showAlert('获取清分明细失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('获取清分明细失败:', error);
            showAlert('获取清分明细失败', 'danger');
        });
}

/**
 * 显示清分明细
 */
function displayClearingDetails(details) {
    document.getElementById('clearingDetailsCard').style.display = 'block';
    document.getElementById('detailsCount').textContent = `${details.length} 条明细`;
    
    const container = document.getElementById('clearingDetailsList');
    
    if (!details || details.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无清分明细</div>';
        return;
    }
    
    // 按执行顺序排序
    details.sort((a, b) => a.executionOrder - b.executionOrder);
    
    container.innerHTML = details.map(detail => `
        <div class="card mb-2 detail-type-${detail.detailType.toLowerCase()}">
            <div class="card-body py-2">
                <div class="row align-items-center">
                    <div class="col-md-1 text-center">
                        <i class="${getDetailTypeIcon(detail.detailType)} fa-lg"></i>
                    </div>
                    <div class="col-md-2">
                        <div class="badge bg-secondary">#${detail.detailSequence}</div>
                        <div><strong>${getDetailTypeName(detail.detailType)}</strong></div>
                    </div>
                    <div class="col-md-3">
                        <div><strong>从:</strong> ${detail.fromEntityName}</div>
                        <div><strong>到:</strong> ${detail.toEntityName}</div>
                    </div>
                    <div class="col-md-2">
                        <div>${detail.serviceName}</div>
                        <div class="text-muted">${detail.serviceCode}</div>
                    </div>
                    <div class="col-md-2 text-end">
                        <div class="amount-positive">¥${formatNumber(detail.detailAmount)}</div>
                        <div class="text-muted">${detail.currencyCode}</div>
                    </div>
                    <div class="col-md-2 text-end">
                        ${getStatusBadge(detail.detailStatus)}
                        <div class="text-muted">顺序: ${detail.executionOrder}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 查看执行日志
 */
function viewExecutionLogs() {
    if (!currentInstruction) {
        showAlert('无清分指令信息', 'warning');
        return;
    }
    
    const instructionId = currentInstruction.instructionId;
    
    fetch(`/api/api/clearing-processing/logs/${instructionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayExecutionLogs(data.data);
                const modal = new bootstrap.Modal(document.getElementById('logsModal'));
                modal.show();
            } else {
                showAlert('获取执行日志失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('获取执行日志失败:', error);
            showAlert('获取执行日志失败', 'danger');
        });
}

/**
 * 显示执行日志
 */
function displayExecutionLogs(logs) {
    const container = document.getElementById('executionLogs');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="text-muted">暂无执行日志</div>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="log-entry log-${log.logLevel.toLowerCase()}">
            <small class="text-muted">${formatDateTime(log.createdTime)}</small>
            <span class="badge bg-${getLogLevelBadgeClass(log.logLevel)} ms-2">${log.logLevel}</span>
            <span class="badge bg-secondary ms-1">${log.logType}</span>
            <div class="mt-1">${log.logMessage}</div>
        </div>
    `).join('');
}

/**
 * 加载清分规则
 */
function loadClearingRules() {
    fetch('/api/api/clearing-processing/rules')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                clearingRules = data.data;
                displayClearingRules();
            } else {
                showAlert('加载清分规则失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('加载清分规则失败:', error);
        });
}

/**
 * 显示清分规则
 */
function displayClearingRules() {
    const tbody = document.getElementById('rulesTableBody');
    if (clearingRules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">暂无清分规则</td></tr>';
        return;
    }

    tbody.innerHTML = clearingRules.map(rule => `
        <tr>
            <td><code>${rule.ruleCode}</code></td>
            <td>${rule.ruleName}</td>
            <td>
                <span class="badge ${getRuleCategoryBadgeClass(rule.ruleCategory)}">
                    ${getRuleCategoryDisplayName(rule.ruleCategory)}
                </span>
            </td>
            <td>
                ${rule.applicableClearingMode ? 
                    `<span class="badge clearing-mode-${rule.applicableClearingMode.toLowerCase()}">${rule.applicableClearingMode}</span>` : 
                    '<span class="text-muted">通用</span>'}
            </td>
            <td class="text-center">
                <span class="badge bg-secondary">${rule.rulePriority}</span>
            </td>
            <td>
                <span class="badge ${rule.ruleStatus === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                    ${rule.ruleStatus === 'ACTIVE' ? '生效' : '停用'}
                </span>
            </td>
            <td>
                <small class="text-muted">${JSON.stringify(rule.ruleParameters)}</small>
            </td>
        </tr>
    `).join('');
}

/**
 * 加载清分批次
 */
function loadClearingBatches() {
    fetch('/api/api/clearing-processing/batches?limit=6')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                clearingBatches = data.data;
                displayClearingBatches();
            } else {
                console.error('加载清分批次失败:', data.message);
            }
        })
        .catch(error => {
            console.error('加载清分批次失败:', error);
        });
}

/**
 * 显示清分批次
 */
function displayClearingBatches() {
    const container = document.getElementById('batchesList');
    
    if (!clearingBatches || clearingBatches.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">暂无清分批次</div>';
        return;
    }
    
    container.innerHTML = clearingBatches.map(batch => `
        <div class="col-md-4 mb-3">
            <div class="card batch-card h-100" onclick="selectBatch('${batch.batchId}')">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">${batch.batchName}</h6>
                        ${getStatusBadge(batch.batchStatus)}
                    </div>
                    <div class="row g-2 text-sm">
                        <div class="col-6">
                            <small class="text-muted">批次类型</small><br>
                            <span class="badge bg-info">${getBatchTypeDisplayName(batch.batchType)}</span>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">风险级别</small><br>
                            <span class="badge ${getRiskLevelBadgeClass(batch.riskLevel)}">${batch.riskLevel}</span>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">指令数量</small><br>
                            <strong>${batch.totalInstructionsCount}</strong>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">清分总额</small><br>
                            <strong>¥${formatNumber(batch.totalClearingAmount)}</strong>
                        </div>
                    </div>
                    <hr class="my-2">
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        ${formatDateTime(batch.createdTime)}
                    </small>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 执行今日批次
 */
function executeTodayBatch(dryRun = false) {
    // 找到今日批次
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todayBatch = clearingBatches.find(batch => batch.batchId.includes(today));
    
    if (!todayBatch) {
        showAlert('未找到今日清分批次', 'warning');
        return;
    }
    
    if (todayBatch.batchStatus === 'COMPLETED') {
        showAlert('今日批次已执行完成', 'info');
        return;
    }
    
    executeBatch(todayBatch.batchId, dryRun);
}

/**
 * 执行批次清分
 */
function executeBatch(batchId, dryRun = false) {
    showAlert(dryRun ? '开始批次试算...' : '开始批次执行...', 'info');
    
    fetch(`/api/api/clearing-processing/execute-batch/${batchId}?dryRun=${dryRun}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            const result = data.data;
            showAlert(
                `${dryRun ? '批次试算' : '批次执行'}完成：${result.completedInstructions}/${result.totalInstructions} 指令处理，成功率 ${result.batchSuccessRate.toFixed(1)}%`, 
                'success'
            );
            
            if (!dryRun) {
                // 重新加载批次和统计信息
                setTimeout(() => {
                    loadClearingBatches();
                    loadStatistics();
                }, 1000);
            }
        } else {
            showAlert((dryRun ? '批次试算失败: ' : '批次执行失败: ') + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error(dryRun ? '批次试算失败:' : '批次执行失败:', error);
        showAlert(dryRun ? '批次试算失败' : '批次执行失败', 'danger');
    });
}

/**
 * 选择批次
 */
function selectBatch(batchId) {
    const batch = clearingBatches.find(b => b.batchId === batchId);
    if (batch) {
        showAlert(`已选择批次: ${batch.batchName}`, 'info');
        // 可以在这里添加更多批次操作
    }
}

// ===== 辅助函数 =====

/**
 * 获取状态徽章
 */
function getStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="status-badge status-pending">待处理</span>',
        'PROCESSING': '<span class="status-badge status-processing">处理中</span>',
        'COMPLETED': '<span class="status-badge status-completed">已完成</span>',
        'FAILED': '<span class="status-badge status-failed">失败</span>',
        'PREPARING': '<span class="status-badge status-pending">准备中</span>',
        'READY': '<span class="status-badge status-processing">就绪</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

/**
 * 获取清分模式徽章
 */
function getModeBadge(mode) {
    return mode === 'STAR' ? 
        '<span class="badge clearing-mode-star">星式清分</span>' :
        '<span class="badge clearing-mode-chain">链式清分</span>';
}

/**
 * 获取明细类型图标
 */
function getDetailTypeIcon(detailType) {
    const icons = {
        'RECEIVABLE': 'fas fa-arrow-down',
        'PAYABLE': 'fas fa-arrow-up',
        'INTERNAL_TRANSFER': 'fas fa-exchange-alt',
        'RETENTION': 'fas fa-piggy-bank',
        'NETTING': 'fas fa-balance-scale'
    };
    return icons[detailType] || 'fas fa-circle';
}

/**
 * 获取明细类型名称
 */
function getDetailTypeName(detailType) {
    const names = {
        'RECEIVABLE': '应收款',
        'PAYABLE': '应付款',
        'INTERNAL_TRANSFER': '内部流转',
        'RETENTION': '留存',
        'NETTING': '抵消'
    };
    return names[detailType] || detailType;
}

/**
 * 获取日志级别样式类
 */
function getLogLevelBadgeClass(level) {
    const classMap = {
        'INFO': 'primary',
        'WARN': 'warning',
        'ERROR': 'danger',
        'DEBUG': 'secondary',
        'FATAL': 'dark'
    };
    return classMap[level] || 'secondary';
}

/**
 * 获取规则分类样式类
 */
function getRuleCategoryBadgeClass(category) {
    const classMap = {
        'CLEARING_MODE': 'bg-primary',
        'ENTITY_FLOW': 'bg-info',
        'NETTING': 'bg-warning',
        'RETENTION': 'bg-success',
        'VALIDATION': 'bg-secondary'
    };
    return classMap[category] || 'bg-secondary';
}

/**
 * 获取规则分类显示名称
 */
function getRuleCategoryDisplayName(category) {
    const nameMap = {
        'CLEARING_MODE': '清分模式',
        'ENTITY_FLOW': '实体流转',
        'NETTING': '净额抵消',
        'RETENTION': '留存规则',
        'VALIDATION': '校验规则'
    };
    return nameMap[category] || category;
}

/**
 * 获取批次类型显示名称
 */
function getBatchTypeDisplayName(batchType) {
    const nameMap = {
        'DAILY': '日常',
        'WEEKLY': '周度',
        'MANUAL': '手动',
        'URGENT': '紧急'
    };
    return nameMap[batchType] || batchType;
}

/**
 * 获取风险级别样式类
 */
function getRiskLevelBadgeClass(riskLevel) {
    const classMap = {
        'LOW': 'bg-success',
        'MEDIUM': 'bg-warning',
        'HIGH': 'bg-danger',
        'CRITICAL': 'bg-dark'
    };
    return classMap[riskLevel] || 'bg-secondary';
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