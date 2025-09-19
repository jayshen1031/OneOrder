// 快速测试JavaScript语法修复
const playwright = require('playwright');

(async () => {
    console.log('🧪 测试JavaScript语法修复...');
    
    const browser = await playwright.chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // 监听控制台错误
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ JavaScript Error:', msg.text());
        }
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
        console.log('❌ Page Error:', error.message);
    });
    
    try {
        // 访问订单管理页面
        console.log('📱 访问订单管理页面...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        
        // 等待页面加载
        await page.waitForTimeout(3000);
        
        // 检查页面是否正常加载
        const pageTitle = await page.title();
        console.log('📄 页面标题:', pageTitle);
        
        // 检查用户切换下拉菜单是否存在
        const userSwitch = await page.$('#userSwitchSelect');
        if (userSwitch) {
            console.log('✅ 用户切换下拉菜单存在');
            
            // 测试切换用户功能
            console.log('🔄 测试切换到销售人员...');
            await page.selectOption('#userSwitchSelect', 'SA002');
            
            await page.waitForTimeout(2000);
            
            // 检查是否有订单显示
            const orderRows = await page.$$('#orderTableBody tr');
            console.log('📊 当前显示订单数量:', orderRows.length);
            
            // 检查当前用户信息
            const currentUserInfo = await page.$eval('.current-user-info', el => el.textContent);
            console.log('👤 当前用户信息:', currentUserInfo);
            
        } else {
            console.log('❌ 用户切换下拉菜单不存在');
        }
        
        console.log('✅ 语法修复测试完成！');
        
    } catch (error) {
        console.log('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
    }
})();