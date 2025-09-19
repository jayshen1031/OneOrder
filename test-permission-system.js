// 测试权限系统功能
const playwright = require('playwright');

(async () => {
    console.log('🧪 测试权限系统功能...');
    
    const browser = await playwright.chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // 监听控制台消息，特别是权限相关
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('权限') || text.includes('过滤') || text.includes('用户')) {
            console.log('📋 权限日志:', text);
        }
        if (msg.type() === 'error') {
            console.log('❌ JavaScript Error:', text);
        }
    });
    
    try {
        // 访问订单管理页面
        console.log('📱 访问订单管理页面...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        
        // 等待页面加载
        await page.waitForTimeout(5000);
        
        // 检查用户切换下拉菜单
        const userSelect = await page.$('#userSwitchSelect');
        if (userSelect) {
            console.log('✅ 用户切换下拉菜单存在');
            
            // 获取当前选择的用户
            const currentOption = await page.$eval('#userSwitchSelect option:checked', el => el.text);
            console.log('👤 当前用户:', currentOption);
            
            // 测试切换到不同角色
            console.log('🔄 切换到销售人员 SA002...');
            await page.selectOption('#userSwitchSelect', 'SA002');
            await page.waitForTimeout(2000);
            
            // 检查订单显示
            const orderRows = await page.$$('#orderTableBody tr');
            console.log('📊 SA002 可见订单数:', orderRows.length);
            
            // 切换到运营管理GM001
            console.log('🔄 切换到运营管理 GM001...');
            await page.selectOption('#userSwitchSelect', 'GM001');
            await page.waitForTimeout(2000);
            
            // 检查订单显示
            const orderRowsGM = await page.$$('#orderTableBody tr');
            console.log('📊 GM001 可见订单数:', orderRowsGM.length);
            
            // 切换到操作人员OP001
            console.log('🔄 切换到操作人员 OP001...');
            await page.selectOption('#userSwitchSelect', 'OP001');
            await page.waitForTimeout(2000);
            
            // 检查订单显示
            const orderRowsOP = await page.$$('#orderTableBody tr');
            console.log('📊 OP001 可见订单数:', orderRowsOP.length);
            
            console.log('✅ 权限系统测试完成！');
            
        } else {
            console.log('❌ 用户切换下拉菜单不存在，检查HTML结构');
        }
        
    } catch (error) {
        console.log('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
    }
})();