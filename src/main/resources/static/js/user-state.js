/**
 * OneOrder 全局用户状态管理系统
 * 负责用户登录状态、切换用户、状态同步等功能
 */

// 全局用户状态管理器
window.UserState = {
    // 当前用户信息
    currentUser: null,
    
    // 状态变更监听器
    listeners: [],
    
    // 初始化用户状态管理
    init() {
        this.loadUserFromStorage();
        this.setupStorageListener();
        console.log('UserState 初始化完成，当前用户:', this.currentUser);
    },
    
    // 从存储中加载用户信息
    loadUserFromStorage() {
        try {
            // 优先从sessionStorage获取
            let userData = sessionStorage.getItem('currentCustomerService');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('从sessionStorage加载用户信息:', this.currentUser);
                return;
            }
            
            // 从localStorage获取
            userData = localStorage.getItem('currentCustomerService');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('从localStorage加载用户信息:', this.currentUser);
                return;
            }
            
            // 尝试从operatorData获取
            if (window.operatorData && window.getCurrentUser) {
                const currentUser = window.getCurrentUser();
                this.setUser({
                    id: currentUser.opid,
                    name: currentUser.name,
                    department: currentUser.department,
                    departmentId: this.getDepartmentIdFromName(currentUser.department),
                    role: currentUser.role,
                    level: currentUser.level,
                    status: 'online',
                    loginTime: new Date().toISOString()
                });
                console.log('从operatorData获取用户信息:', this.currentUser);
                return;
            }
            
            // 使用默认用户
            this.setUser(this.getDefaultUser());
            console.log('使用默认用户信息:', this.currentUser);
            
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.setUser(this.getDefaultUser());
        }
    },
    
    // 设置当前用户
    setUser(userData) {
        const oldUser = this.currentUser;
        this.currentUser = userData;
        
        // 保存到存储
        this.saveUserToStorage();
        
        // 通知所有监听器
        this.notifyListeners('userChanged', oldUser, this.currentUser);
        
        console.log('用户状态已更新:', this.currentUser);
    },
    
    // 保存用户信息到存储
    saveUserToStorage() {
        try {
            const userData = JSON.stringify(this.currentUser);
            sessionStorage.setItem('currentCustomerService', userData);
            localStorage.setItem('currentCustomerService', userData);
            
            // 也保存到operatorData（如果存在）
            if (window.operatorData) {
                window.operatorData.currentUser = {
                    opid: this.currentUser.id,
                    name: this.currentUser.name,
                    department: this.currentUser.department,
                    role: this.currentUser.role,
                    level: this.currentUser.level
                };
            }
        } catch (error) {
            console.error('保存用户信息失败:', error);
        }
    },
    
    // 切换用户
    switchUser(userId) {
        try {
            let newUser = null;
            
            // 如果传入的是完整用户对象
            if (typeof userId === 'object') {
                newUser = userId;
            } else {
                // 从operatorData中查找用户
                if (window.getOperatorInfo) {
                    const operator = window.getOperatorInfo(userId);
                    if (operator) {
                        newUser = {
                            id: operator.opid,
                            name: operator.name,
                            department: `${operator.dept1} - ${operator.dept2}`,
                            departmentId: this.getDepartmentIdFromName(`${operator.dept1} - ${operator.dept2}`),
                            role: operator.role,
                            level: operator.level,
                            status: 'online',
                            loginTime: new Date().toISOString()
                        };
                    }
                }
            }
            
            if (newUser) {
                this.setUser(newUser);
                return true;
            } else {
                console.error('未找到用户:', userId);
                return false;
            }
        } catch (error) {
            console.error('切换用户失败:', error);
            return false;
        }
    },
    
    // 获取当前用户
    getCurrentUser() {
        if (!this.currentUser) {
            this.loadUserFromStorage();
        }
        return this.currentUser;
    },
    
    // 添加状态变更监听器
    addListener(callback) {
        this.listeners.push(callback);
    },
    
    // 移除监听器
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    },
    
    // 通知所有监听器
    notifyListeners(event, ...args) {
        this.listeners.forEach(listener => {
            try {
                listener(event, ...args);
            } catch (error) {
                console.error('监听器执行失败:', error);
            }
        });
    },
    
    // 设置存储变更监听器
    setupStorageListener() {
        // 监听sessionStorage变更
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentCustomerService' && e.newValue) {
                try {
                    const newUser = JSON.parse(e.newValue);
                    if (newUser && (!this.currentUser || newUser.id !== this.currentUser.id)) {
                        const oldUser = this.currentUser;
                        this.currentUser = newUser;
                        this.notifyListeners('userChanged', oldUser, newUser);
                        console.log('检测到用户状态变更:', newUser);
                    }
                } catch (error) {
                    console.error('处理存储变更失败:', error);
                }
            }
        });
    },
    
    // 获取部门ID
    getDepartmentIdFromName(departmentName) {
        const deptMapping = {
            '上海海领供应链 - 客服中心': 'DEPT_CS_01',
            '上海海领供应链 - 销售部': 'DEPT_SALES_01',
            '上海海领供应链 - 海运操作部': 'DEPT_OCEAN_01',
            '上海海领供应链 - 空运操作部': 'DEPT_AIR_01',
            '客服中心': 'DEPT_CS_01',
            '销售部': 'DEPT_SALES_01',
            '海运销售一部': 'DEPT_SALES_01',
            '空运销售部': 'DEPT_SALES_02',
            '陆运销售部': 'DEPT_SALES_03'
        };
        return deptMapping[departmentName] || 'DEPT_CS_01';
    },
    
    // 获取默认用户
    getDefaultUser() {
        return {
            id: 'CS001',
            name: '张美华',
            department: '上海海领供应链 - 客服中心',
            departmentId: 'DEPT_CS_01',
            role: '客服专员',
            level: 'CS',
            status: 'online',
            loginTime: new Date().toISOString()
        };
    },
    
    // 检查用户信息一致性
    checkConsistency() {
        const issues = [];
        
        if (!this.currentUser) {
            issues.push('当前用户为空');
        } else {
            if (!this.currentUser.id) issues.push('用户ID缺失');
            if (!this.currentUser.name) issues.push('用户姓名缺失');
            if (!this.currentUser.department) issues.push('用户部门缺失');
        }
        
        // 检查存储一致性
        try {
            const sessionData = sessionStorage.getItem('currentCustomerService');
            const localData = localStorage.getItem('currentCustomerService');
            
            if (sessionData !== localData) {
                issues.push('sessionStorage与localStorage不一致');
            }
            
            if (sessionData) {
                const sessionUser = JSON.parse(sessionData);
                if (sessionUser.id !== this.currentUser.id) {
                    issues.push('内存用户与存储用户不一致');
                }
            }
        } catch (error) {
            issues.push('存储数据格式错误');
        }
        
        if (issues.length > 0) {
            console.warn('用户状态一致性检查发现问题:', issues);
        }
        
        return issues;
    },
    
    // 强制同步用户状态
    forceSync() {
        this.loadUserFromStorage();
        this.notifyListeners('forceSync', this.currentUser);
    }
};

// 兼容性函数 - 保持向后兼容
window.getCurrentCustomerService = function() {
    return UserState.getCurrentUser();
};

window.switchUser = function(userId) {
    return UserState.switchUser(userId);
};

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    UserState.init();
});

console.log('UserState 全局用户状态管理系统已加载');