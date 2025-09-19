/**
 * OneOrder 全局用户管理器
 * 统一管理所有页面的用户切换、权限控制和状态同步
 */

window.GlobalUserManager = {
    // 初始化标志
    initialized: false,
    
    // 用户列表数据
    users: [
        { id: 'CS001', name: '张美华', department: '客服中心', role: 'CUSTOMER_SERVICE', level: 'CS' },
        { id: 'CS002', name: '李雪梅', department: '客服中心', role: 'CUSTOMER_SERVICE', level: 'CS' },
        { id: 'SALES001', name: '王建国', department: '销售部', role: 'SALES', level: 'SALES' },
        { id: 'OP001', name: '马晓东', department: '空运操作', role: 'OPERATOR', level: 'OP' },
        { id: 'OP002', name: '林芳', department: '海运操作', role: 'OPERATOR', level: 'OP' },
        { id: 'OP008', name: '高玲', department: '西区操作', role: 'OPERATOR', level: 'OP' },
        { id: 'MGR001', name: '刘经理', department: '管理层', role: 'MANAGER', level: 'MGR' }
    ],
    
    // 初始化全局用户管理器
    init() {
        if (this.initialized) return;
        
        console.log('GlobalUserManager 初始化开始');
        
        // 确保UserState已初始化
        if (typeof window.UserState !== 'undefined') {
            window.UserState.init();
        }
        
        // 创建全局用户切换组件
        this.createGlobalUserSelector();
        
        // 设置跨页面同步
        this.setupCrossPageSync();
        
        // 监听用户状态变化
        this.setupUserStateListener();
        
        this.initialized = true;
        console.log('GlobalUserManager 初始化完成');
    },
    
    // 创建全局用户切换组件
    createGlobalUserSelector() {
        // 查找现有的用户选择框
        const existingSelectors = document.querySelectorAll('#userSelect, #userSwitchSelect, [data-role="user-selector"]');
        
        existingSelectors.forEach(selector => {
            this.enhanceUserSelector(selector);
        });
        
        // 如果页面没有用户选择框，创建一个全局的
        if (existingSelectors.length === 0) {
            this.injectGlobalUserSelector();
        }
    },
    
    // 增强现有的用户选择框
    enhanceUserSelector(selector) {
        // 清空现有选项
        selector.innerHTML = '';
        
        // 添加用户选项
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.department})`;
            option.setAttribute('data-role', user.role);
            option.setAttribute('data-level', user.level);
            selector.appendChild(option);
        });
        
        // 设置当前用户
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            selector.value = currentUser.id;
        }
        
        // 绑定切换事件
        selector.addEventListener('change', (e) => {
            this.switchUser(e.target.value);
        });
        
        // 标记为全局管理
        selector.setAttribute('data-global-managed', 'true');
        
        console.log('用户选择框已增强:', selector.id || selector.className);
    },
    
    // 注入全局用户选择框（如果页面没有）
    injectGlobalUserSelector() {
        const navbar = document.querySelector('.navbar, .header, nav');
        if (navbar) {
            const userSelectorHTML = `
                <div class="global-user-selector ms-auto" style="display: flex; align-items: center; gap: 10px;">
                    <label for="globalUserSelect" class="text-muted small mb-0">当前用户:</label>
                    <select id="globalUserSelect" class="form-select form-select-sm" style="width: auto; min-width: 160px;" data-role="user-selector">
                        ${this.users.map(user => 
                            `<option value="${user.id}" data-role="${user.role}" data-level="${user.level}">
                                ${user.name} (${user.department})
                            </option>`
                        ).join('')}
                    </select>
                </div>
            `;
            
            navbar.insertAdjacentHTML('beforeend', userSelectorHTML);
            
            const globalSelector = document.getElementById('globalUserSelect');
            this.enhanceUserSelector(globalSelector);
            
            console.log('已注入全局用户选择框');
        }
    },
    
    // 设置跨页面同步
    setupCrossPageSync() {
        // 监听storage变化（跨标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentCustomerService' && e.newValue) {
                try {
                    const newUser = JSON.parse(e.newValue);
                    this.syncUserSelectorValue(newUser.id);
                    this.notifyPageUserChange(newUser);
                    console.log('检测到跨页面用户变更:', newUser.name);
                } catch (error) {
                    console.error('处理跨页面用户变更失败:', error);
                }
            }
        });
        
        // 监听iframe消息（同页面内iframe同步）
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'userChanged') {
                this.syncUserSelectorValue(e.data.userId);
                this.notifyPageUserChange(e.data.user);
                console.log('检测到iframe用户变更:', e.data.user.name);
            }
        });
    },
    
    // 设置用户状态监听器
    setupUserStateListener() {
        if (typeof window.UserState !== 'undefined') {
            window.UserState.addListener((event, oldUser, newUser) => {
                if (event === 'userChanged') {
                    this.syncUserSelectorValue(newUser.id);
                    this.broadcastUserChange(newUser);
                    this.notifyPageUserChange(newUser);
                    console.log('UserState用户变更:', newUser.name);
                }
            });
        }
    },
    
    // 切换用户
    switchUser(userId) {
        console.log('GlobalUserManager 切换用户:', userId);
        
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            console.error('用户不存在:', userId);
            return false;
        }
        
        // 构建完整用户信息
        const fullUser = {
            id: user.id,
            name: user.name,
            department: user.department,
            departmentId: this.getDepartmentId(user.department),
            role: user.role,
            level: user.level,
            status: 'online',
            loginTime: new Date().toISOString()
        };
        
        // 更新UserState
        if (typeof window.UserState !== 'undefined') {
            window.UserState.setUser(fullUser);
        }
        
        // 同步所有选择框
        this.syncUserSelectorValue(userId);
        
        // 广播变更
        this.broadcastUserChange(fullUser);
        
        // 通知页面
        this.notifyPageUserChange(fullUser);
        
        return true;
    },
    
    // 同步所有用户选择框的值
    syncUserSelectorValue(userId) {
        const selectors = document.querySelectorAll('[data-global-managed="true"], #userSelect, #userSwitchSelect, [data-role="user-selector"]');
        selectors.forEach(selector => {
            if (selector.value !== userId) {
                selector.value = userId;
                console.log('同步用户选择框:', selector.id || selector.className, '→', userId);
            }
        });
    },
    
    // 广播用户变更到所有iframe
    broadcastUserChange(user) {
        // 发送到所有iframe
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'userChanged',
                    userId: user.id,
                    user: user
                }, '*');
            } catch (error) {
                console.warn('向iframe发送用户变更消息失败:', error);
            }
        });
        
        // 发送到父窗口（如果在iframe中）
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({
                    type: 'userChanged',
                    userId: user.id,
                    user: user
                }, '*');
            } catch (error) {
                console.warn('向父窗口发送用户变更消息失败:', error);
            }
        }
    },
    
    // 通知页面用户变更
    notifyPageUserChange(user) {
        // 触发自定义事件
        const event = new CustomEvent('globalUserChanged', {
            detail: { user: user }
        });
        document.dispatchEvent(event);
        
        // 调用页面特定的回调函数
        if (typeof window.onUserChanged === 'function') {
            window.onUserChanged(user);
        }
        
        // 更新页面显示
        this.updatePageUserDisplay(user);
        
        // 刷新权限相关的UI
        this.refreshPermissionUI(user);
    },
    
    // 更新页面用户显示
    updatePageUserDisplay(user) {
        // 更新用户名显示
        const userNameElements = document.querySelectorAll('[data-user-name], .current-user-name');
        userNameElements.forEach(el => {
            el.textContent = user.name;
        });
        
        // 更新部门显示
        const deptElements = document.querySelectorAll('[data-user-department], .current-user-department');
        deptElements.forEach(el => {
            el.textContent = user.department;
        });
        
        // 更新角色显示
        const roleElements = document.querySelectorAll('[data-user-role], .current-user-role');
        roleElements.forEach(el => {
            el.textContent = this.getRoleDisplayName(user.role);
        });
    },
    
    // 刷新权限相关UI
    refreshPermissionUI(user) {
        // 根据角色显示/隐藏元素
        document.querySelectorAll('[data-role-required]').forEach(el => {
            const requiredRoles = el.getAttribute('data-role-required').split(',');
            const hasPermission = requiredRoles.includes(user.role);
            el.style.display = hasPermission ? '' : 'none';
        });
        
        // 根据用户级别显示/隐藏元素
        document.querySelectorAll('[data-level-required]').forEach(el => {
            const requiredLevels = el.getAttribute('data-level-required').split(',');
            const hasPermission = requiredLevels.includes(user.level);
            el.style.display = hasPermission ? '' : 'none';
        });
        
        // 调用页面特定的权限刷新函数
        if (typeof window.refreshPermissions === 'function') {
            window.refreshPermissions(user);
        }
        
        console.log('权限UI已刷新，当前用户:', user.name, '角色:', user.role);
    },
    
    // 获取当前用户
    getCurrentUser() {
        if (typeof window.UserState !== 'undefined') {
            return window.UserState.getCurrentUser();
        }
        
        // 从存储中获取
        try {
            const userData = sessionStorage.getItem('currentCustomerService') || 
                           localStorage.getItem('currentCustomerService');
            if (userData) {
                return JSON.parse(userData);
            }
        } catch (error) {
            console.error('获取当前用户失败:', error);
        }
        
        // 返回默认用户
        return this.users[0];
    },
    
    // 获取用户信息
    getUserInfo(userId) {
        return this.users.find(u => u.id === userId);
    },
    
    // 获取部门ID
    getDepartmentId(departmentName) {
        const deptMapping = {
            '客服中心': 'DEPT_CS_01',
            '销售部': 'DEPT_SALES_01',
            '空运操作': 'DEPT_AIR_01',
            '海运操作': 'DEPT_OCEAN_01',
            '西区操作': 'DEPT_WEST_01',
            '管理层': 'DEPT_MGR_01'
        };
        return deptMapping[departmentName] || 'DEPT_CS_01';
    },
    
    // 获取角色显示名称
    getRoleDisplayName(role) {
        const roleNames = {
            'CUSTOMER_SERVICE': '客服专员',
            'SALES': '销售员',
            'OPERATOR': '操作员',
            'MANAGER': '经理'
        };
        return roleNames[role] || role;
    },
    
    // 检查用户权限
    hasPermission(permission, user = null) {
        const currentUser = user || this.getCurrentUser();
        if (!currentUser) return false;
        
        // 简单的权限检查逻辑
        const permissions = {
            'view_orders': ['CUSTOMER_SERVICE', 'SALES', 'OPERATOR', 'MANAGER'],
            'create_orders': ['CUSTOMER_SERVICE', 'SALES', 'MANAGER'],
            'assign_tasks': ['CUSTOMER_SERVICE', 'MANAGER'],
            'view_reports': ['SALES', 'MANAGER'],
            'manage_users': ['MANAGER'],
            'financial_operations': ['MANAGER']
        };
        
        return permissions[permission] && permissions[permission].includes(currentUser.role);
    },
    
    // 强制同步所有页面
    forceSync() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.syncUserSelectorValue(currentUser.id);
            this.broadcastUserChange(currentUser);
            this.notifyPageUserChange(currentUser);
            console.log('强制同步完成，当前用户:', currentUser.name);
        }
    }
};

// 兼容性函数
window.switchUser = function(userId) {
    return GlobalUserManager.switchUser(userId);
};

window.getCurrentUser = function() {
    return GlobalUserManager.getCurrentUser();
};

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保其他脚本加载完成
    setTimeout(() => {
        GlobalUserManager.init();
    }, 100);
});

// 页面可见性变化时强制同步
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && GlobalUserManager.initialized) {
        GlobalUserManager.forceSync();
    }
});

console.log('GlobalUserManager 全局用户管理器已加载');