/**
 * 协议管理统一模块 - 实现配置页面与派单页面的数据联动
 * 作者: OneOrder系统
 * 创建日期: 2025-09-20
 */

// 协议存储键名
const PROTOCOL_STORAGE_KEY = 'oneorder_internal_protocols';
const PROTOCOL_HISTORY_KEY = 'oneorder_protocol_history';

/**
 * 协议管理器类
 */
class ProtocolManager {
    constructor() {
        this.protocols = [];
        this.listeners = [];
        this.init();
    }

    /**
     * 初始化协议管理器
     */
    async init() {
        await this.loadProtocols();
        this.initDefaultProtocols();
        console.log('🔧 协议管理器已初始化，协议数量:', this.protocols.length);
    }

    /**
     * 从数据库或本地存储加载协议
     */
    async loadProtocols() {
        try {
            // 优先从API加载
            const response = await fetch('/api/internal-protocols');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.protocols = this.convertFromAPI(result.data);
                    this.saveProtocols(); // 同步到本地存储作为缓存
                    console.log('📡 从API加载协议:', this.protocols.length);
                    return;
                }
            }
            
            // API不可用时从本地存储加载
            const saved = localStorage.getItem(PROTOCOL_STORAGE_KEY);
            if (saved) {
                this.protocols = JSON.parse(saved);
                console.log('📂 从本地存储加载协议:', this.protocols.length);
            }
        } catch (error) {
            console.error('❌ 加载协议失败:', error);
            // 降级到本地存储
            try {
                const saved = localStorage.getItem(PROTOCOL_STORAGE_KEY);
                if (saved) {
                    this.protocols = JSON.parse(saved);
                    console.log('📂 降级使用本地存储协议:', this.protocols.length);
                }
            } catch (localError) {
                console.error('❌ 本地存储也失败:', localError);
                this.protocols = [];
            }
        }
    }

    /**
     * 保存协议到本地存储
     */
    saveProtocols() {
        try {
            localStorage.setItem(PROTOCOL_STORAGE_KEY, JSON.stringify(this.protocols));
            console.log('💾 协议已保存到本地存储');
            this.notifyListeners('protocols_updated', this.protocols);
        } catch (error) {
            console.error('❌ 保存协议失败:', error);
        }
    }

    /**
     * 初始化默认协议（如果本地没有数据）
     */
    initDefaultProtocols() {
        if (this.protocols.length === 0) {
            this.protocols = [
                {
                    protocolId: 'PROTO001',
                    protocolName: '海运MBL处理标准协议',
                    serviceCode: 'MBL_PROCESSING',
                    businessType: 'OCEAN',
                    baseCommissionRate: 15,
                    bonusCommissionRate: 5,
                    totalCommissionRate: 20,
                    applicableDepartments: ['海运操作'],
                    slaHours: 48,
                    recommended: true,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '专门针对海运MBL处理的标准协议，包含完整的业务条款和佣金规则。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO002',
                    protocolName: '海运HBL处理专项协议',
                    serviceCode: 'HBL_PROCESSING',
                    businessType: 'OCEAN',
                    baseCommissionRate: 12,
                    bonusCommissionRate: 4,
                    totalCommissionRate: 16,
                    applicableDepartments: ['海运操作'],
                    slaHours: 24,
                    recommended: true,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '针对海运分单处理的专项协议，涵盖货物分拣、标签管理和交付确认。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO003',
                    protocolName: '海运订舱服务协议',
                    serviceCode: 'BOOKING',
                    businessType: 'OCEAN',
                    baseCommissionRate: 10,
                    bonusCommissionRate: 3,
                    totalCommissionRate: 13,
                    applicableDepartments: ['海运操作'],
                    slaHours: 12,
                    recommended: true,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '海运订舱服务的标准协议，包括舱位预订、船期确认和舱单管理。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO004',
                    protocolName: '集装箱装货作业协议',
                    serviceCode: 'CONTAINER_LOADING',
                    businessType: 'OCEAN',
                    baseCommissionRate: 8,
                    bonusCommissionRate: 2,
                    totalCommissionRate: 10,
                    applicableDepartments: ['海运操作'],
                    slaHours: 6,
                    recommended: true,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '集装箱装货作业的专项协议，涵盖货物装箱、封条管理和装箱清单确认。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO005',
                    protocolName: '空运操作专用协议',
                    serviceCode: 'AWB_PROCESSING',
                    businessType: 'AIR',
                    baseCommissionRate: 18,
                    bonusCommissionRate: 7,
                    totalCommissionRate: 25,
                    applicableDepartments: ['空运操作'],
                    slaHours: 24,
                    recommended: true,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '针对空运业务优化的专用协议，时效要求高，佣金率优厚。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO006',
                    protocolName: '报关服务标准协议',
                    serviceCode: 'CUSTOMS_CLEARANCE',
                    businessType: 'ALL',
                    baseCommissionRate: 14,
                    bonusCommissionRate: 4,
                    totalCommissionRate: 18,
                    applicableDepartments: ['海运操作', '空运操作', '西区操作'],
                    slaHours: 48,
                    recommended: true,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '标准报关服务协议，适用于进出口报关业务，包含文件准备和清关跟踪。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO007',
                    protocolName: '运输服务通用协议',
                    serviceCode: 'TRANSPORTATION',
                    businessType: 'ALL',
                    baseCommissionRate: 10,
                    bonusCommissionRate: 3,
                    totalCommissionRate: 13,
                    applicableDepartments: ['海运操作', '空运操作', '西区操作'],
                    slaHours: 24,
                    recommended: true,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '通用运输服务协议，适用于各种运输方式的货物配送和跟踪。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO008',
                    protocolName: '装货作业通用协议',
                    serviceCode: 'CARGO_LOADING',
                    businessType: 'ALL',
                    baseCommissionRate: 8,
                    bonusCommissionRate: 2,
                    totalCommissionRate: 10,
                    applicableDepartments: ['海运操作', '空运操作', '西区操作'],
                    slaHours: 8,
                    recommended: false,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '通用装货作业协议，适用于各种货物的装卸和搬运作业。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    protocolId: 'PROTO009',
                    protocolName: '通用货代服务协议',
                    serviceCode: 'ALL',
                    businessType: 'ALL',
                    baseCommissionRate: 12,
                    bonusCommissionRate: 3,
                    totalCommissionRate: 15,
                    applicableDepartments: ['海运操作', '空运操作', '西区操作'],
                    slaHours: 72,
                    recommended: false,
                    status: 'ACTIVE',
                    effectiveDate: '2025-01-01',
                    expiryDate: '2025-12-31',
                    description: '适用于所有货代服务的通用协议，灵活性高但佣金率较低，作为备选方案。',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            this.saveProtocols();
            console.log('✅ 初始化默认协议完成');
        }
    }

    /**
     * 获取所有协议
     */
    getAllProtocols() {
        return [...this.protocols];
    }

    /**
     * 根据条件筛选协议
     */
    getMatchingProtocols(operatorDepartment, serviceCode) {
        const activeProtocols = this.protocols.filter(protocol => 
            protocol.status === 'ACTIVE' && 
            this.isProtocolEffective(protocol)
        );

        const matchedProtocols = activeProtocols.filter(protocol => {
            const deptMatch = protocol.applicableDepartments.includes(operatorDepartment);
            const serviceMatch = protocol.serviceCode === serviceCode || protocol.serviceCode === 'ALL';
            return deptMatch && serviceMatch;
        });

        // 按推荐程度和佣金率排序
        return matchedProtocols.sort((a, b) => {
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            return b.totalCommissionRate - a.totalCommissionRate;
        });
    }

    /**
     * 检查协议是否在有效期内
     */
    isProtocolEffective(protocol) {
        const now = new Date();
        const effectiveDate = new Date(protocol.effectiveDate);
        const expiryDate = new Date(protocol.expiryDate);
        return now >= effectiveDate && now <= expiryDate;
    }

    /**
     * 转换API数据格式
     */
    convertFromAPI(apiProtocols) {
        return apiProtocols.map(apiProtocol => ({
            protocolId: apiProtocol.protocolId,
            protocolName: apiProtocol.protocolName,
            serviceCode: apiProtocol.serviceCode || 'ALL',
            businessType: apiProtocol.businessType || 'ALL',
            baseCommissionRate: apiProtocol.baseCommissionRate || 0,
            bonusCommissionRate: apiProtocol.performanceBonusRate || 0,
            totalCommissionRate: apiProtocol.totalCommissionRate || 
                (apiProtocol.baseCommissionRate + apiProtocol.performanceBonusRate),
            applicableDepartments: this.getDepartmentNames(
                apiProtocol.salesDepartmentId, 
                apiProtocol.operationDepartmentId
            ),
            slaHours: 24, // 默认值，API中暂无此字段
            recommended: apiProtocol.totalCommissionRate >= 15,
            status: apiProtocol.active ? 'ACTIVE' : 'INACTIVE',
            effectiveDate: apiProtocol.effectiveDate,
            expiryDate: apiProtocol.expiryDate,
            description: `${apiProtocol.protocolName} - 基础佣金${apiProtocol.baseCommissionRate}% + 绩效奖金${apiProtocol.performanceBonusRate}%`,
            createdAt: apiProtocol.createdTime,
            updatedAt: apiProtocol.updatedTime,
            // 保存原始API数据
            _apiData: apiProtocol
        }));
    }
    
    /**
     * 转换为API格式
     */
    convertToAPI(protocolData) {
        return {
            protocolName: protocolData.protocolName,
            salesDepartmentId: this.getSalesDepartmentId(protocolData.applicableDepartments),
            operationDepartmentId: this.getOperationDepartmentId(protocolData.applicableDepartments),
            serviceCode: protocolData.serviceCode === 'ALL' ? null : protocolData.serviceCode,
            businessType: protocolData.businessType === 'ALL' ? null : protocolData.businessType,
            baseCommissionRate: protocolData.baseCommissionRate,
            performanceBonusRate: protocolData.bonusCommissionRate,
            effectiveDate: protocolData.effectiveDate,
            expiryDate: protocolData.expiryDate
        };
    }
    
    /**
     * 获取部门名称
     */
    getDepartmentNames(salesDeptId, operationDeptId) {
        const operationDeptMapping = {
            'SALES_OCEAN': '海运操作',
            'SALES_AIR': '空运操作', 
            'SALES_TRUCK': '西区操作',
            'OPERATION_OCEAN': '海运操作',
            'OPERATION_AIR': '空运操作',
            'OPERATION_TRUCK': '西区操作'
        };
        return [operationDeptMapping[operationDeptId] || '海运操作'];
    }
    
    /**
     * 获取销售部门ID
     */
    getSalesDepartmentId(departments) {
        const deptMapping = {
            '海运操作': 'SALES_OCEAN',
            '空运操作': 'SALES_AIR',
            '西区操作': 'SALES_TRUCK'
        };
        return deptMapping[departments[0]] || 'SALES_OCEAN';
    }
    
    /**
     * 获取操作部门ID
     */
    getOperationDepartmentId(departments) {
        const deptMapping = {
            '海运操作': 'OPERATION_OCEAN',
            '空运操作': 'OPERATION_AIR',
            '西区操作': 'OPERATION_TRUCK'
        };
        return deptMapping[departments[0]] || 'OPERATION_OCEAN';
    }

    /**
     * 添加新协议
     */
    async addProtocol(protocolData) {
        try {
            // 尝试通过API创建
            const apiData = this.convertToAPI(protocolData);
            const response = await fetch('/api/internal-protocols', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const newProtocol = this.convertFromAPI([result.data])[0];
                    this.protocols.push(newProtocol);
                    this.saveProtocols();
                    this.logProtocolAction('CREATE', newProtocol);
                    console.log('✅ 通过API创建协议成功:', newProtocol.protocolName);
                    return newProtocol;
                }
            }
        } catch (error) {
            console.error('❌ API创建协议失败:', error);
        }
        
        // 降级到本地创建
        const newProtocol = {
            protocolId: this.generateProtocolId(),
            ...protocolData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.protocols.push(newProtocol);
        this.saveProtocols();
        this.logProtocolAction('CREATE', newProtocol);
        
        console.log('✅ 本地创建协议成功:', newProtocol.protocolName);
        return newProtocol;
    }

    /**
     * 更新协议
     */
    async updateProtocol(protocolId, updateData) {
        const index = this.protocols.findIndex(p => p.protocolId === protocolId);
        if (index === -1) {
            throw new Error(`协议 ${protocolId} 不存在`);
        }

        const oldProtocol = { ...this.protocols[index] };
        
        try {
            // 尝试通过API更新
            const apiData = this.convertToAPI({ ...oldProtocol, ...updateData });
            const response = await fetch(`/api/internal-protocols/${protocolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const updatedProtocol = this.convertFromAPI([result.data])[0];
                    this.protocols[index] = updatedProtocol;
                    this.saveProtocols();
                    this.logProtocolAction('UPDATE', updatedProtocol, oldProtocol);
                    console.log('✅ 通过API更新协议成功:', updatedProtocol.protocolName);
                    return updatedProtocol;
                }
            }
        } catch (error) {
            console.error('❌ API更新协议失败:', error);
        }
        
        // 降级到本地更新
        this.protocols[index] = {
            ...this.protocols[index],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        this.saveProtocols();
        this.logProtocolAction('UPDATE', this.protocols[index], oldProtocol);
        
        console.log('✅ 本地更新协议成功:', this.protocols[index].protocolName);
        return this.protocols[index];
    }

    /**
     * 删除协议
     */
    async deleteProtocol(protocolId) {
        const index = this.protocols.findIndex(p => p.protocolId === protocolId);
        if (index === -1) {
            throw new Error(`协议 ${protocolId} 不存在`);
        }

        const deletedProtocol = { ...this.protocols[index] };
        
        try {
            // 尝试通过API删除
            const response = await fetch(`/api/internal-protocols/${protocolId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.protocols.splice(index, 1);
                    this.saveProtocols();
                    this.logProtocolAction('DELETE', deletedProtocol);
                    console.log('✅ 通过API删除协议成功:', deletedProtocol.protocolName);
                    return deletedProtocol;
                }
            }
        } catch (error) {
            console.error('❌ API删除协议失败:', error);
        }
        
        // 降级到本地删除
        this.protocols.splice(index, 1);
        this.saveProtocols();
        this.logProtocolAction('DELETE', deletedProtocol);
        
        console.log('✅ 本地删除协议成功:', deletedProtocol.protocolName);
        return deletedProtocol;
    }

    /**
     * 激活/停用协议
     */
    toggleProtocolStatus(protocolId) {
        const protocol = this.protocols.find(p => p.protocolId === protocolId);
        if (!protocol) {
            throw new Error(`协议 ${protocolId} 不存在`);
        }

        protocol.status = protocol.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        protocol.updatedAt = new Date().toISOString();
        
        this.saveProtocols();
        this.logProtocolAction('STATUS_CHANGE', protocol);
        
        console.log('✅ 协议状态已更新:', protocol.protocolName, protocol.status);
        return protocol;
    }

    /**
     * 生成协议ID
     */
    generateProtocolId() {
        const maxId = this.protocols.reduce((max, protocol) => {
            const num = parseInt(protocol.protocolId.replace('PROTO', ''));
            return Math.max(max, num);
        }, 0);
        
        return `PROTO${String(maxId + 1).padStart(3, '0')}`;
    }

    /**
     * 记录协议操作历史
     */
    logProtocolAction(action, protocol, oldData = null) {
        try {
            const history = JSON.parse(localStorage.getItem(PROTOCOL_HISTORY_KEY) || '[]');
            
            const logEntry = {
                timestamp: new Date().toISOString(),
                action,
                protocolId: protocol.protocolId,
                protocolName: protocol.protocolName,
                operator: '系统管理员', // 可以从用户状态获取
                changes: oldData ? this.getChanges(oldData, protocol) : null
            };

            history.unshift(logEntry);
            history.splice(100); // 保留最近100条记录

            localStorage.setItem(PROTOCOL_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('❌ 记录协议历史失败:', error);
        }
    }

    /**
     * 获取协议变更内容
     */
    getChanges(oldData, newData) {
        const changes = {};
        for (const key in newData) {
            if (oldData[key] !== newData[key]) {
                changes[key] = { from: oldData[key], to: newData[key] };
            }
        }
        return changes;
    }

    /**
     * 添加事件监听器
     */
    addEventListener(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(event, callback) {
        this.listeners = this.listeners.filter(
            listener => listener.event !== event || listener.callback !== callback
        );
    }

    /**
     * 通知所有监听器
     */
    notifyListeners(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => {
                try {
                    listener.callback(data);
                } catch (error) {
                    console.error('❌ 事件监听器执行失败:', error);
                }
            });
    }

    /**
     * 导出协议配置
     */
    exportProtocols() {
        const exportData = {
            protocols: this.protocols,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oneorder_protocols_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ 协议配置已导出');
    }

    /**
     * 导入协议配置
     */
    importProtocols(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (!importData.protocols || !Array.isArray(importData.protocols)) {
                        throw new Error('无效的协议配置文件格式');
                    }

                    // 备份当前协议
                    const backup = [...this.protocols];
                    
                    // 导入新协议
                    this.protocols = importData.protocols;
                    this.saveProtocols();
                    
                    console.log('✅ 协议配置已导入:', this.protocols.length, '个协议');
                    resolve(this.protocols);
                    
                } catch (error) {
                    console.error('❌ 导入协议配置失败:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            reader.readAsText(file);
        });
    }
}

// 创建全局协议管理器实例
window.protocolManager = new ProtocolManager();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProtocolManager;
}