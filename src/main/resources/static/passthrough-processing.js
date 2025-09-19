/**
 * 过账处理前端脚本
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-09-16
 */

// 全局变量
let currentInstruction = null;
let routingRules = [];
let nettingRules = [];
let currentExecutionResult = null;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('过账处理页面初始化');
    loadStatistics();
    loadRoutingRules();
    loadNettingRules();
    
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
 * 加载过账处理统计
 */
function loadStatistics() {
    fetch('/api/api/passthrough-processing/statistics')
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
    document.getElementById('totalOriginalAmount').textContent = formatCurrency(stats.totalOriginalAmount);
    document.getElementById('totalPassthroughAmount').textContent = formatCurrency(stats.totalPassthroughAmount);
    document.getElementById('totalRetentionAmount').textContent = formatCurrency(stats.totalRetentionAmount);
}

/**
 * 检查是否已存在过账指令
 */
function checkExistingInstruction(orderId) {
    fetch(`/api/api/passthrough-processing/instruction/${orderId}`)
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
            console.error('检查过账指令失败:', error);
        });
}

/**
 * 显示过账指令信息
 */
function showInstructionInfo(instruction) {
    document.getElementById('instructionWorkflow').style.display = 'block';
    document.getElementById('currentInstruction').style.display = 'block';
    
    document.getElementById('instructionId').textContent = instruction.instructionId;
    document.getElementById('instructionMode').innerHTML = getModeBadge(instruction.passthroughMode);
    document.getElementById('originalAmount').textContent = formatCurrency(instruction.originalTotalAmount);
    document.getElementById('passthroughAmount').textContent = formatCurrency(instruction.passthroughTotalAmount);
    document.getElementById('retentionAmount').textContent = formatCurrency(instruction.retentionTotalAmount);
    document.getElementById('instructionStatus').innerHTML = getStatusBadge(instruction.instructionStatus);
    
    // 更新工作流状态
    updateWorkflowSteps(instruction.instructionStatus);
    
    // 根据状态启用/禁用按钮
    const status = instruction.instructionStatus;
    document.getElementById('executeBtn').disabled = (status === 'COMPLETED' || status === 'PROCESSING');
    document.getElementById('dryRunBtn').disabled = false;
    document.getElementById('detailsBtn').disabled = false;
    document.getElementById('routingBtn').disabled = false;
    document.getElementById('logsBtn').disabled = false;
}

/**
 * 隐藏过账指令信息
 */
function hideInstructionInfo() {
    document.getElementById('instructionWorkflow').style.display = 'none';
    document.getElementById('currentInstruction').style.display = 'none';
    document.getElementById('passthroughDetailsCard').style.display = 'none';
    document.getElementById('routingPathCard').style.display = 'none';
    document.getElementById('nettingResultCard').style.display = 'none';
    document.getElementById('executionResultCard').style.display = 'none';
}

/**
 * 更新工作流步骤状态
 */
function updateWorkflowSteps(status) {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    steps.forEach(step => {
        const element = document.getElementById(step);
        element.className = 'workflow-step';
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
 * 生成过账处理指令
 */
function generatePassthroughInstruction() {
    const orderId = document.getElementById('orderSelect').value;
    const passthroughMode = document.getElementById('passthroughModeSelect').value;
    
    if (!orderId) {
        showAlert('请先选择订单', 'warning');
        return;
    }
    
    // 检查是否有清分指令
    const clearingInstructionId = `CLEARING_${orderId}_${formatDateTime(new Date(), 'yyyyMMddHHmmss')}`;
    
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>生成中...';
    generateBtn.disabled = true;
    
    fetch('/api/api/passthrough-processing/generate-instruction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            orderId: orderId,
            clearingInstructionId: clearingInstructionId,
            passthroughMode: passthroughMode,
            createdBy: 'current_user'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            showAlert('过账处理指令生成成功', 'success');
            
            // 重新加载指令信息
            setTimeout(() => {
                checkExistingInstruction(orderId);
                loadStatistics();
            }, 1000);
        } else {
            showAlert('生成过账处理指令失败: ' + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('生成过账处理指令失败:', error);
        showAlert('生成过账处理指令失败', 'danger');
    })
    .finally(() => {
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    });
}

/**
 * 执行过账处理指令
 */
function executePassthroughInstruction(dryRun = false) {
    if (!currentInstruction) {
        showAlert('无过账处理指令可执行', 'warning');
        return;
    }
    
    const instructionId = currentInstruction.instructionId;
    const btnId = dryRun ? 'dryRunBtn' : 'executeBtn';
    const button = document.getElementById(btnId);
    const originalText = button.innerHTML;
    
    button.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${dryRun ? '试算中...' : '执行中...'}`;
    button.disabled = true;
    
    fetch(`/api/api/passthrough-processing/execute/${instructionId}?dryRun=${dryRun}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            showAlert(dryRun ? '过账处理试算完成' : '过账处理指令执行完成', 'success');
            currentExecutionResult = data.data;
            displayExecutionResult(data.data, dryRun);
            
            // 显示轧差结果
            if (data.data.nettingResults && data.data.nettingResults.length > 0) {
                displayNettingResults(data.data.nettingResults);
            }
            
            if (!dryRun) {
                // 重新加载指令信息和统计
                setTimeout(() => {
                    checkExistingInstruction(currentInstruction.orderId);
                    loadStatistics();
                }, 1000);
            }
        } else {
            showAlert((dryRun ? '过账处理试算失败: ' : '过账处理执行失败: ') + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error(dryRun ? '过账处理试算失败:' : '过账处理执行失败:', error);
        showAlert(dryRun ? '过账处理试算失败' : '过账处理执行失败', 'danger');
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
        
        const detailTypeClass = getDetailTypeClass(result.detailType);
        timelineItem.classList.add(detailTypeClass);
        
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
 * 查看过账明细
 */
function viewInstructionDetails() {
    if (!currentInstruction) {
        showAlert('无过账指令信息', 'warning');
        return;
    }
    
    const orderId = currentInstruction.orderId;
    
    fetch(`/api/api/passthrough-processing/instruction/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayPassthroughDetails(data.data.details);
            } else {
                showAlert('获取过账明细失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('获取过账明细失败:', error);
            showAlert('获取过账明细失败', 'danger');
        });
}

/**
 * 显示过账明细
 */
function displayPassthroughDetails(details) {
    document.getElementById('passthroughDetailsCard').style.display = 'block';
    document.getElementById('detailsCount').textContent = `${details.length} 条明细`;
    
    const container = document.getElementById('passthroughDetailsList');
    
    if (!details || details.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无过账明细</div>';
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
                        ${detail.detailType === 'RETENTION' ? 
                            `<div><strong>留存法人:</strong> ${detail.retentionEntityName || detail.actualPayerEntityName}</div>` :
                            `<div><strong>从:</strong> ${detail.actualPayerEntityName}</div>
                             <div><strong>到:</strong> ${detail.actualPayeeEntityName}</div>`
                        }
                    </div>
                    <div class="col-md-2">
                        ${detail.routingPath ? `<div class="routing-path">${detail.routingPath}</div>` : ''}
                        ${detail.appliedRuleId ? `<small class="text-muted">规则: ${detail.appliedRuleId}</small>` : ''}
                    </div>
                    <div class="col-md-2 text-end">
                        <div class="amount-positive">¥${formatNumber(detail.actualAmount || detail.retentionAmount)}</div>
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
 * 查看路由路径
 */
function viewRoutingPath() {
    if (!currentInstruction) {
        showAlert('无过账指令信息', 'warning');
        return;
    }
    
    // 获取过账明细数据来构建路由可视化
    const orderId = currentInstruction.orderId;
    
    fetch(`/api/api/passthrough-processing/instruction/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                displayRoutingPathVisualization(data.data.details);
            } else {
                showAlert('获取路由路径失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('获取路由路径失败:', error);
            showAlert('获取路由路径失败', 'danger');
        });
}

/**
 * 显示路由路径可视化
 */
function displayRoutingPathVisualization(details) {
    document.getElementById('routingPathCard').style.display = 'block';
    const container = document.getElementById('routingPathVisualization');
    
    if (!details || details.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无路由路径</div>';
        return;
    }
    
    // 按路由路径分组
    const routingGroups = {};
    details.forEach(detail => {
        if (detail.routingPath) {
            if (!routingGroups[detail.routingPath]) {
                routingGroups[detail.routingPath] = [];
            }
            routingGroups[detail.routingPath].push(detail);
        }
    });
    
    container.innerHTML = Object.entries(routingGroups).map(([path, pathDetails]) => {
        const totalAmount = pathDetails.reduce((sum, detail) => 
            sum + parseFloat(detail.actualAmount || detail.retentionAmount || 0), 0);
        
        // 解析路由路径
        const entities = path.split(' → ');
        const flowHtml = entities.map((entity, index) => {
            let entityClass = 'flow-entity';
            if (index === 0) entityClass += ' payer';
            else if (index === entities.length - 1) entityClass += ' payee';
            else entityClass += ' routing';
            
            return `<div class="${entityClass}">${entity}</div>`;
        }).join('<i class="fas fa-arrow-right flow-arrow"></i>');
        
        return `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between">
                    <h6 class="mb-0">路由路径 ${Object.keys(routingGroups).indexOf(path) + 1}</h6>
                    <span class="badge bg-info">总金额: ¥${formatNumber(totalAmount)}</span>
                </div>
                <div class="card-body">
                    <div class="routing-flow">
                        ${flowHtml}
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">${pathDetails.length} 笔交易</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 显示轧差结果
 */
function displayNettingResults(nettingResults) {
    document.getElementById('nettingResultCard').style.display = 'block';
    const container = document.getElementById('nettingResultsList');
    
    container.innerHTML = nettingResults.map(result => `
        <div class="card mb-3">
            <div class="card-header">
                <h6 class="mb-0">
                    <i class="fas fa-balance-scale me-2"></i>
                    ${result.entityAName} ⇄ ${result.entityBName} 轧差结果
                </h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="netting-comparison">
                            <h6>轧差前</h6>
                            <div class="mb-2">
                                <span class="badge bg-primary">${result.entityAName}</span> 
                                付 <span class="badge bg-success">${result.entityBName}</span>: 
                                <span class="amount-positive">¥${formatNumber(result.entityAPayBAmount)}</span>
                            </div>
                            <div>
                                <span class="badge bg-success">${result.entityBName}</span> 
                                付 <span class="badge bg-primary">${result.entityAName}</span>: 
                                <span class="amount-positive">¥${formatNumber(result.entityBPayAAmount)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>轧差后</h6>
                        <div class="alert alert-success mb-2">
                            <strong>净额结果:</strong><br>
                            <span class="badge bg-primary">${result.netPayerEntityName}</span> 
                            付 <span class="badge bg-success">${result.netPayeeEntityName}</span>: 
                            <span class="amount-positive">¥${formatNumber(result.netAmount)}</span>
                        </div>
                        <div class="text-muted">
                            <small>
                                <i class="fas fa-check-circle text-success me-1"></i>
                                节省 ${result.savedTransactionsCount} 笔交易，
                                节省金额 ¥${formatNumber(result.savedAmount)}
                            </small>
                        </div>
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
        showAlert('无过账指令信息', 'warning');
        return;
    }
    
    const instructionId = currentInstruction.instructionId;
    
    fetch(`/api/api/passthrough-processing/logs/${instructionId}`)
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
        <div class="log-entry log-${log.logLevel.toLowerCase()} mb-2 p-2 border-start border-3">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <span class="badge bg-${getLogLevelBadgeClass(log.logLevel)} me-2">${log.logLevel}</span>
                    <span class="badge bg-secondary me-2">${log.logType}</span>
                    <small class="text-muted">${formatDateTime(log.createdTime)}</small>
                </div>
            </div>
            <div class="mt-1">${log.logMessage}</div>
        </div>
    `).join('');
}

/**
 * 加载过账路由规则
 */
function loadRoutingRules() {
    fetch('/api/api/passthrough-processing/routing-rules')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                routingRules = data.data;
                displayRoutingRules();
            } else {
                showAlert('加载路由规则失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('加载路由规则失败:', error);
        });
}

/**
 * 显示过账路由规则
 */
function displayRoutingRules() {
    const container = document.getElementById('routingRulesList');
    if (routingRules.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">暂无路由规则</div>';
        return;
    }

    container.innerHTML = routingRules.map(rule => `
        <div class="col-md-6 mb-3">
            <div class="card rule-card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${rule.ruleName}</h6>
                    <span class="badge ${rule.ruleStatus === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                        ${rule.ruleStatus === 'ACTIVE' ? '生效' : '停用'}
                    </span>
                </div>
                <div class="card-body">
                    <div class="mb-2">
                        <strong>路由规则:</strong><br>
                        <div class="routing-flow mt-2">
                            <div class="flow-entity payer">${rule.payerLegalEntityName}</div>
                            <i class="fas fa-arrow-right flow-arrow"></i>
                            <div class="flow-entity routing">${rule.routingEntity1Name}</div>
                            ${rule.routingEntity2Name ? 
                                `<i class="fas fa-arrow-right flow-arrow"></i>
                                 <div class="flow-entity routing">${rule.routingEntity2Name}</div>` : ''}
                            <i class="fas fa-arrow-right flow-arrow"></i>
                            <div class="flow-entity payee">${rule.payeeLegalEntityName}</div>
                        </div>
                    </div>
                    <div class="row text-sm">
                        <div class="col-6">
                            <small class="text-muted">币种</small><br>
                            <span class="badge bg-info">${rule.currencyCode}</span>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">优先级</small><br>
                            <span class="badge bg-secondary">${rule.rulePriority}</span>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">留存比例:</small><br>
                        <small>
                            ${rule.routingEntity1Name}: ${(rule.routing1RetentionRate * 100).toFixed(2)}%
                            ${rule.routingEntity2Name ? 
                                `, ${rule.routingEntity2Name}: ${(rule.routing2RetentionRate * 100).toFixed(2)}%` : ''}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 加载轧差规则
 */
function loadNettingRules() {
    fetch('/api/api/passthrough-processing/netting-rules')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                nettingRules = data.data;
                displayNettingRules();
            } else {
                console.error('加载轧差规则失败:', data.message);
            }
        })
        .catch(error => {
            console.error('加载轧差规则失败:', error);
        });
}

/**
 * 显示轧差规则
 */
function displayNettingRules() {
    const tbody = document.getElementById('nettingRulesTableBody');
    if (nettingRules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">暂无轧差规则</td></tr>';
        return;
    }

    tbody.innerHTML = nettingRules.map(rule => `
        <tr>
            <td>${rule.ruleName}</td>
            <td><span class="badge bg-primary">${rule.passthroughEntityName}</span></td>
            <td><span class="badge bg-success">${rule.targetEntityName}</span></td>
            <td><span class="badge bg-info">${rule.currencyCode}</span></td>
            <td>
                <span class="badge ${rule.nettingMode === 'FULL_NETTING' ? 'bg-warning' : 'bg-secondary'}">
                    ${rule.nettingMode === 'FULL_NETTING' ? '轧差' : '分开'}
                </span>
            </td>
            <td>¥${formatNumber(rule.minNettingAmount)}</td>
            <td>
                <span class="badge ${rule.ruleStatus === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                    ${rule.ruleStatus === 'ACTIVE' ? '生效' : '停用'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editNettingRule('${rule.ruleId}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 显示批量处理模态框
 */
function showBatchModal() {
    const modal = new bootstrap.Modal(document.getElementById('batchProcessModal'));
    modal.show();
}

/**
 * 执行批量处理
 */
function executeBatchProcessing() {
    const orderIdsText = document.getElementById('batchOrderIds').value.trim();
    const passthroughMode = document.getElementById('batchPassthroughMode').value;
    const dryRun = document.getElementById('batchDryRun').checked;
    
    if (!orderIdsText) {
        showAlert('请输入订单ID列表', 'warning');
        return;
    }
    
    const orderIds = orderIdsText.split('\n').map(id => id.trim()).filter(id => id);
    
    if (orderIds.length === 0) {
        showAlert('订单ID列表不能为空', 'warning');
        return;
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('batchProcessModal'));
    modal.hide();
    
    showAlert(`开始批量处理${orderIds.length}个订单...`, 'info');
    
    fetch('/api/api/passthrough-processing/batch-execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            orderIds: orderIds,
            passthroughMode: passthroughMode,
            dryRun: dryRun,
            createdBy: 'current_user'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            const summary = data.data;
            showAlert(
                `批量处理完成: 成功${summary.successCount}笔, 失败${summary.failureCount}笔, 成功率${summary.successRate}%`,
                'success'
            );
            
            // 刷新统计
            loadStatistics();
        } else {
            showAlert('批量处理失败: ' + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('批量处理失败:', error);
        showAlert('批量处理失败', 'danger');
    });
}

/**
 * 显示差异处理模态框
 */
function showDifferentialModal() {
    const modal = new bootstrap.Modal(document.getElementById('differentialProcessModal'));
    modal.show();
}

/**
 * 处理差异账单
 */
function processDifferentialBilling() {
    const orderId = document.getElementById('diffOrderId').value.trim();
    const originalInstructionId = document.getElementById('diffOriginalInstructionId').value.trim();
    const diffType = document.getElementById('diffType').value;
    const diffReason = document.getElementById('diffReason').value.trim();
    const processingMode = document.getElementById('diffProcessingMode').value;
    
    if (!orderId || !originalInstructionId) {
        showAlert('请填写订单ID和原始指令ID', 'warning');
        return;
    }
    
    if (!diffReason) {
        showAlert('请填写差异原因', 'warning');
        return;
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('differentialProcessModal'));
    modal.hide();
    
    showAlert('开始处理差异账单...', 'info');
    
    fetch('/api/api/passthrough-processing/process-differential', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            orderId: orderId,
            originalInstructionId: originalInstructionId,
            diffType: diffType,
            diffReason: diffReason,
            processingMode: processingMode,
            createdBy: 'current_user'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            const result = data.data;
            showAlert(
                `差异账单处理完成: 差异金额¥${formatNumber(result.diffAmount)}, 模式: ${processingMode}`,
                'success'
            );
            
            // 刷新统计
            loadStatistics();
        } else {
            showAlert('差异账单处理失败: ' + data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('差异账单处理失败:', error);
        showAlert('差异账单处理失败', 'danger');
    });
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
        'REPLACED': '<span class="status-badge status-replaced">已替换</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

/**
 * 获取过账模式徽章
 */
function getModeBadge(mode) {
    const badges = {
        'ROUTING': '<span class="badge mode-routing">路由过账</span>',
        'NETTING': '<span class="badge mode-netting">轧差结算</span>',
        'DIFFERENTIAL': '<span class="badge mode-differential">差异处理</span>'
    };
    return badges[mode] || `<span class="badge bg-secondary">${mode}</span>`;
}

/**
 * 获取明细类型图标
 */
function getDetailTypeIcon(detailType) {
    const icons = {
        'ROUTING': 'fas fa-route',
        'RETENTION': 'fas fa-piggy-bank',
        'PASSTHROUGH': 'fas fa-arrow-right',
        'NETTING': 'fas fa-balance-scale'
    };
    return icons[detailType] || 'fas fa-circle';
}

/**
 * 获取明细类型名称
 */
function getDetailTypeName(detailType) {
    const names = {
        'ROUTING': '路由过账',
        'RETENTION': '过账留存',
        'PASSTHROUGH': '直接过账',
        'NETTING': '轧差处理'
    };
    return names[detailType] || detailType;
}

/**
 * 获取明细类型样式类
 */
function getDetailTypeClass(detailType) {
    return detailType ? detailType.toLowerCase() : '';
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
function formatDateTime(dateTime, format = 'default') {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    
    if (format === 'yyyyMMddHHmmss') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    
    return date.toLocaleString('zh-CN');
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

// 占位函数
function showRuleModal() {
    showAlert('路由规则管理功能开发中...', 'info');
}

function showNettingRuleModal() {
    showAlert('轧差规则管理功能开发中...', 'info');
}

function editNettingRule(ruleId) {
    showAlert('轧差规则编辑功能开发中...', 'info');
}