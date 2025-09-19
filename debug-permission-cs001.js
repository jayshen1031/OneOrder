const playwright = require('playwright');

(async () => {
    const browser = await playwright.chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('访问OneOrder系统...');
        // 强制清除缓存并重新加载
        await page.goto('http://localhost:8081/api/freight-order.html', { 
            waitUntil: 'networkidle'
        });
        
        // 强制刷新页面清除缓存
        await page.reload({ waitUntil: 'networkidle' });
        
        console.log('等待页面加载...');
        await page.waitForTimeout(3000);
        
        console.log('查找用户切换下拉菜单...');
        await page.waitForSelector('#userSwitchSelect', { timeout: 10000 });
        
        console.log('切换到张美华(CS001)...');
        await page.selectOption('#userSwitchSelect', 'CS001');
        await page.waitForTimeout(2000);
        
        console.log('检查当前用户显示...');
        const currentUserName = await page.textContent('#currentUserName');
        console.log('当前用户:', currentUserName);
        
        console.log('检查接派单菜单是否可见...');
        const assignmentMenu = await page.locator('a[data-page-permission="assignment"]');
        const isVisible = await assignmentMenu.isVisible();
        console.log('接派单菜单可见:', isVisible);
        
        if (isVisible) {
            console.log('✅ 接派单菜单正常显示');
            const menuText = await assignmentMenu.textContent();
            console.log('菜单文本:', menuText.trim());
        } else {
            console.log('❌ 接派单菜单未显示');
        }
        
        // 检查权限系统状态
        console.log('检查权限系统状态...');
        const permissionStatus = await page.evaluate(() => {
            const user = window.GlobalUserManager ? window.GlobalUserManager.getCurrentUser() : null;
            const normalizedRole = window.PermissionManager ? window.PermissionManager.normalizeRole(user?.role) : null;
            
            return {
                hasPermissionManager: typeof window.PermissionManager !== 'undefined',
                hasGlobalUserManager: typeof window.GlobalUserManager !== 'undefined',
                currentUser: user,
                normalizedRole: normalizedRole,
                originalRole: user?.role,
                roleMapping: window.PermissionManager?.roleMapping,
                assignmentConfig: window.PermissionManager?.permissionConfig?.pages?.assignment,
                hasAssignmentPermission: window.PermissionManager ? 
                    window.PermissionManager.hasPagePermission('assignment') : null
            };
        });
        
        console.log('权限系统状态:', JSON.stringify(permissionStatus, null, 2));
        
        if (!permissionStatus.hasAssignmentPermission) {
            console.log('❌ 张美华没有接派单权限或权限系统异常');
        } else {
            console.log('✅ 张美华有接派单权限');
        }
        
        // 截图保存问题状态
        await page.screenshot({ path: 'debug-cs001-permission.png', fullPage: true });
        console.log('截图已保存: debug-cs001-permission.png');
        
    } catch (error) {
        console.error('测试过程中出错:', error);
    } finally {
        await browser.close();
    }
})();