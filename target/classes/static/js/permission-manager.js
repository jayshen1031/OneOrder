/**
 * OneOrder 权限管理系统
 * 统一管理页面权限、菜单权限、功能权限
 */

window.PermissionManager = {
    // 角色映射：中文显示名称 -> 英文代码
    roleMapping: {
        '客服专员': 'CUSTOMER_SERVICE',
        '客服主管': 'CUSTOMER_SERVICE',
        '高级客服': 'CUSTOMER_SERVICE',
        '客服总监': 'MANAGER',
        '销售专员': 'SALES',
        '销售主管': 'SALES',
        '高级销售': 'SALES',
        '销售总监': 'MANAGER',
        '操作专员': 'OPERATOR',
        '操作主管': 'OPERATOR',
        '高级操作': 'OPERATOR',
        '操作总监': 'MANAGER',
        '总经理': 'MANAGER',
        '副总经理': 'MANAGER'
    },
    
    // 权限配置
    permissionConfig: {
        // 页面级权限
        pages: {
            'dashboard': ['CUSTOMER_SERVICE', 'SALES', 'OPERATOR', 'MANAGER'],
            'orders': ['CUSTOMER_SERVICE', 'SALES', 'MANAGER'],
            'assignment': ['CUSTOMER_SERVICE', 'MANAGER'],
            'clearing': ['MANAGER'],
            'reports': ['SALES', 'MANAGER'],
            'contracts': ['MANAGER'],
            'settings': ['MANAGER']
        },
        
        // 功能级权限
        features: {
            'create_order': ['CUSTOMER_SERVICE', 'SALES', 'MANAGER'],
            'edit_order': ['CUSTOMER_SERVICE', 'SALES', 'MANAGER'],
            'delete_order': ['MANAGER'],
            'assign_task': ['CUSTOMER_SERVICE', 'MANAGER'],
            'view_financial': ['MANAGER'],
            'export_data': ['SALES', 'MANAGER'],
            'manage_users': ['MANAGER'],
            'approve_workflow': ['MANAGER']
        },
        
        // 数据级权限
        data: {
            'own_orders': ['CUSTOMER_SERVICE', 'SALES', 'OPERATOR'],
            'team_orders': ['MANAGER'],
            'all_orders': ['MANAGER'],
            'financial_data': ['MANAGER']
        }
    },
    
    // 初始化权限管理器
    init() {
        this.bindPermissionEvents();
        this.applyInitialPermissions();
        console.log('PermissionManager 初始化完成');
    },
    
    // 绑定权限相关事件
    bindPermissionEvents() {
        // 监听全局用户变更
        document.addEventListener('globalUserChanged', (event) => {
            const user = event.detail.user;
            this.applyUserPermissions(user);
        });
        
        // 监听页面加载完成
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.applyInitialPermissions(), 500);
        });
    },
    
    // 应用初始权限
    applyInitialPermissions() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.applyUserPermissions(currentUser);
        }
    },
    
    // 应用用户权限
    applyUserPermissions(user) {
        console.log('应用用户权限:', user.name, user.role);
        
        // 应用菜单权限
        this.applyMenuPermissions(user);
        
        // 应用功能权限
        this.applyFeaturePermissions(user);
        
        // 应用数据权限
        this.applyDataPermissions(user);
        
        // 应用自定义权限标记
        this.applyCustomPermissions(user);
        
        // 触发权限更新事件
        this.triggerPermissionUpdateEvent(user);
    },
    
    // 应用菜单权限
    applyMenuPermissions(user) {
        // 处理导航菜单
        document.querySelectorAll('[data-page-permission]').forEach(el => {
            const requiredPage = el.getAttribute('data-page-permission');
            const hasPermission = this.hasPagePermission(requiredPage, user);
            el.style.display = hasPermission ? '' : 'none';
            
            if (!hasPermission) {
                el.classList.add('permission-denied');
            } else {
                el.classList.remove('permission-denied');
            }
        });
    },
    
    // 应用功能权限
    applyFeaturePermissions(user) {
        // 处理功能按钮和操作
        document.querySelectorAll('[data-feature-permission]').forEach(el => {
            const requiredFeature = el.getAttribute('data-feature-permission');
            const hasPermission = this.hasFeaturePermission(requiredFeature, user);
            
            if (el.tagName === 'BUTTON' || el.tagName === 'A') {
                el.disabled = !hasPermission;
                if (!hasPermission) {
                    el.classList.add('permission-denied');
                    el.title = '您没有权限执行此操作';
                } else {
                    el.classList.remove('permission-denied');
                    el.title = '';
                }
            } else {
                el.style.display = hasPermission ? '' : 'none';
            }
        });
        
        // 处理表单字段权限
        document.querySelectorAll('[data-field-permission]').forEach(el => {
            const requiredPermission = el.getAttribute('data-field-permission');
            const hasPermission = this.hasFeaturePermission(requiredPermission, user);
            
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
                el.readOnly = !hasPermission;
                if (!hasPermission) {
                    el.classList.add('permission-readonly');
                } else {
                    el.classList.remove('permission-readonly');
                }
            }
        });
    },
    
    // 应用数据权限
    applyDataPermissions(user) {
        // 根据数据权限控制显示内容
        document.querySelectorAll('[data-data-permission]').forEach(el => {
            const requiredDataAccess = el.getAttribute('data-data-permission');
            const hasPermission = this.hasDataPermission(requiredDataAccess, user);
            el.style.display = hasPermission ? '' : 'none';
        });
    },
    
    // 应用自定义权限标记
    applyCustomPermissions(user) {
        // 原有的角色和级别权限控制
        document.querySelectorAll('[data-role-required]').forEach(el => {
            const requiredRoles = el.getAttribute('data-role-required').split(',').map(r => r.trim());
            const normalizedRole = this.normalizeRole(user.role);
            const hasPermission = requiredRoles.includes(normalizedRole) || requiredRoles.includes(user.role);
            el.style.display = hasPermission ? '' : 'none';
        });
        
        document.querySelectorAll('[data-level-required]').forEach(el => {
            const requiredLevels = el.getAttribute('data-level-required').split(',').map(l => l.trim());
            const hasPermission = requiredLevels.includes(user.level);
            el.style.display = hasPermission ? '' : 'none';
        });
        
        // 用户ID特定权限
        document.querySelectorAll('[data-user-specific]').forEach(el => {
            const allowedUsers = el.getAttribute('data-user-specific').split(',').map(u => u.trim());
            const hasPermission = allowedUsers.includes(user.id);
            el.style.display = hasPermission ? '' : 'none';
        });
    },
    
    // 角色标准化：将中文角色名称转换为英文代码
    normalizeRole(role) {
        // 如果已经是英文代码，直接返回
        if (role && role.toUpperCase() === role && role.includes('_')) {
            return role;
        }
        // 使用映射表转换中文角色
        return this.roleMapping[role] || role;
    },
    
    // 检查页面权限
    hasPagePermission(pageName, user = null) {
        const currentUser = user || this.getCurrentUser();
        if (!currentUser) return false;
        
        const normalizedRole = this.normalizeRole(currentUser.role);
        const allowedRoles = this.permissionConfig.pages[pageName];
        return allowedRoles && allowedRoles.includes(normalizedRole);
    },
    
    // 检查功能权限
    hasFeaturePermission(featureName, user = null) {
        const currentUser = user || this.getCurrentUser();
        if (!currentUser) return false;
        
        const normalizedRole = this.normalizeRole(currentUser.role);
        const allowedRoles = this.permissionConfig.features[featureName];
        return allowedRoles && allowedRoles.includes(normalizedRole);
    },
    
    // 检查数据权限
    hasDataPermission(dataType, user = null) {
        const currentUser = user || this.getCurrentUser();
        if (!currentUser) return false;
        
        const normalizedRole = this.normalizeRole(currentUser.role);
        const allowedRoles = this.permissionConfig.data[dataType];
        return allowedRoles && allowedRoles.includes(normalizedRole);
    },
    
    // 获取当前用户
    getCurrentUser() {
        if (typeof GlobalUserManager !== 'undefined') {
            return GlobalUserManager.getCurrentUser();
        } else if (typeof UserState !== 'undefined') {
            return UserState.getCurrentUser();
        }
        return null;
    },
    
    // 获取用户权限总览
    getUserPermissionSummary(user = null) {
        const currentUser = user || this.getCurrentUser();
        if (!currentUser) return null;
        
        const summary = {
            user: currentUser,
            pages: [],
            features: [],
            data: []
        };
        
        // 计算页面权限
        Object.keys(this.permissionConfig.pages).forEach(page => {
            if (this.hasPagePermission(page, currentUser)) {
                summary.pages.push(page);
            }
        });
        
        // 计算功能权限
        Object.keys(this.permissionConfig.features).forEach(feature => {
            if (this.hasFeaturePermission(feature, currentUser)) {
                summary.features.push(feature);
            }
        });
        
        // 计算数据权限
        Object.keys(this.permissionConfig.data).forEach(dataType => {
            if (this.hasDataPermission(dataType, currentUser)) {
                summary.data.push(dataType);
            }
        });
        
        return summary;
    },
    
    // 触发权限更新事件
    triggerPermissionUpdateEvent(user) {
        const event = new CustomEvent('permissionUpdated', {
            detail: { 
                user: user,
                permissions: this.getUserPermissionSummary(user)
            }
        });
        document.dispatchEvent(event);
    },
    
    // 添加权限配置
    addPermissionConfig(type, name, allowedRoles) {
        if (!this.permissionConfig[type]) {
            this.permissionConfig[type] = {};
        }
        this.permissionConfig[type][name] = allowedRoles;
        
        // 重新应用权限
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.applyUserPermissions(currentUser);
        }
    },
    
    // 移除权限配置
    removePermissionConfig(type, name) {
        if (this.permissionConfig[type] && this.permissionConfig[type][name]) {
            delete this.permissionConfig[type][name];
            
            // 重新应用权限
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                this.applyUserPermissions(currentUser);
            }
        }
    },
    
    // 更新权限配置
    updatePermissionConfig(type, name, allowedRoles) {
        if (this.permissionConfig[type]) {
            this.permissionConfig[type][name] = allowedRoles;
            
            // 重新应用权限
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                this.applyUserPermissions(currentUser);
            }
        }
    },
    
    // 导出权限配置
    exportPermissionConfig() {
        return JSON.stringify(this.permissionConfig, null, 2);
    },
    
    // 导入权限配置
    importPermissionConfig(configJson) {
        try {
            const config = JSON.parse(configJson);
            this.permissionConfig = { ...this.permissionConfig, ...config };
            
            // 重新应用权限
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                this.applyUserPermissions(currentUser);
            }
            
            return true;
        } catch (error) {
            console.error('导入权限配置失败:', error);
            return false;
        }
    },
    
    // 检查权限一致性
    validatePermissions() {
        const issues = [];
        const currentUser = this.getCurrentUser();
        
        if (!currentUser) {
            issues.push('无当前用户信息');
            return issues;
        }
        
        // 检查页面元素权限标记
        document.querySelectorAll('[data-page-permission], [data-feature-permission], [data-data-permission]').forEach(el => {
            const pagePermission = el.getAttribute('data-page-permission');
            const featurePermission = el.getAttribute('data-feature-permission');
            const dataPermission = el.getAttribute('data-data-permission');
            
            if (pagePermission && !this.permissionConfig.pages[pagePermission]) {
                issues.push(`未定义的页面权限: ${pagePermission}`);
            }
            
            if (featurePermission && !this.permissionConfig.features[featurePermission]) {
                issues.push(`未定义的功能权限: ${featurePermission}`);
            }
            
            if (dataPermission && !this.permissionConfig.data[dataPermission]) {
                issues.push(`未定义的数据权限: ${dataPermission}`);
            }
        });
        
        return issues;
    }
};

// 兼容性函数
window.hasPermission = function(type, name, user = null) {
    switch(type) {
        case 'page':
            return PermissionManager.hasPagePermission(name, user);
        case 'feature':
            return PermissionManager.hasFeaturePermission(name, user);
        case 'data':
            return PermissionManager.hasDataPermission(name, user);
        default:
            return false;
    }
};

window.refreshPermissions = function(user) {
    PermissionManager.applyUserPermissions(user);
};

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        PermissionManager.init();
    }, 200);
});

console.log('PermissionManager 权限管理系统已加载');