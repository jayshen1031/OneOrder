const { chromium } = require('playwright');

async function debugPermission() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // 监听所有控制台消息
    const allConsoleLogs = [];
    page.on('console', msg => {
        allConsoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 监听网络请求
    const networkRequests = [];
    page.on('request', request => {
        if (request.url().includes('/api/freight-orders')) {
            networkRequests.push({
                url: request.url(),
                method: request.method()
            });
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/freight-orders')) {
            console.log(`📡 API响应: ${response.status()} - ${response.url()}`);
        }
    });
    
    try {
        console.log('🔍 深度调试权限系统...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        await page.waitForLoadState('networkidle');
        
        // 等待JavaScript加载完成
        await page.waitForTimeout(5000);
        
        // 在浏览器中执行调试代码
        const debugResult = await page.evaluate(() => {
            try {
                // 手动调用函数进行调试
                console.log('=== 手动调试开始 ===');
                
                const currentUser = getCurrentUser();
                console.log('当前用户:', currentUser);
                
                const visibleIds = getVisibleOrderIds(currentUser);
                console.log('可见订单ID:', visibleIds);
                
                // 手动调用loadOrders来看看发生了什么
                loadOrders();
                
                return {
                    currentUser: currentUser,
                    visibleIds: visibleIds,
                    status: 'debug完成'
                };
            } catch (error) {
                console.error('调试错误:', error);
                return { error: error.message };
            }
        });
        
        console.log('\n🧠 浏览器调试结果:', debugResult);
        
        // 等待一下让所有日志输出
        await page.waitForTimeout(3000);
        
        console.log('\n📝 所有控制台日志:');
        allConsoleLogs.forEach((log, index) => {
            console.log(`${index + 1}. ${log}`);
        });
        
        console.log('\n🌐 网络请求:');
        networkRequests.forEach(req => {
            console.log(`  ${req.method} ${req.url}`);
        });
        
    } catch (error) {
        console.error('❌ 调试失败:', error.message);
    } finally {
        await page.screenshot({ path: 'debug-permission.png', fullPage: true });
        console.log('📸 调试截图已保存: debug-permission.png');
        await browser.close();
    }
}

debugPermission().catch(console.error);