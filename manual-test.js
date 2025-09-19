const { chromium } = require('playwright');

async function manualTest() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 手动测试权限问题...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 在浏览器控制台执行手动测试
        const result = await page.evaluate(async () => {
            // 等待一下确保JS加载完成
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            let debugInfo = {};
            
            try {
                // 测试函数是否存在
                debugInfo.functionsExist = {
                    getCurrentUser: typeof getCurrentUser !== 'undefined',
                    getVisibleOrderIds: typeof getVisibleOrderIds !== 'undefined',
                    loadOrders: typeof loadOrders !== 'undefined',
                    operatorData: typeof operatorData !== 'undefined'
                };
                
                if (typeof getCurrentUser !== 'undefined') {
                    debugInfo.currentUser = getCurrentUser();
                    
                    if (typeof getVisibleOrderIds !== 'undefined') {
                        debugInfo.visibleIds = getVisibleOrderIds(debugInfo.currentUser);
                    }
                }
                
                // 测试API调用
                const response = await fetch('/api/freight-orders?page=0&size=5');
                const apiData = await response.json();
                debugInfo.apiDataCount = apiData.length;
                debugInfo.firstOrderFields = apiData.length > 0 ? {
                    orderNo: apiData[0].orderNo,
                    salesStaffId: apiData[0].salesStaffId,
                    createdBy: apiData[0].createdBy,
                    staffId: apiData[0].staffId
                } : null;
                
            } catch (error) {
                debugInfo.error = error.message;
            }
            
            return debugInfo;
        });
        
        console.log('\n🧠 手动测试结果:');
        console.log(JSON.stringify(result, null, 2));
        
        // 如果函数存在，手动触发订单加载
        if (result.functionsExist && result.functionsExist.loadOrders) {
            console.log('\n🔄 手动触发订单加载...');
            await page.evaluate(() => {
                if (typeof loadOrders === 'function') {
                    loadOrders();
                }
            });
            
            await page.waitForTimeout(3000);
            
            // 检查订单是否显示
            const orderCount = await page.locator('#ordersTable tr').count();
            console.log(`✅ 手动加载后订单数量: ${orderCount}`);
        }
        
    } catch (error) {
        console.error('❌ 手动测试失败:', error.message);
    } finally {
        await page.screenshot({ path: 'manual-test-result.png', fullPage: true });
        console.log('📸 手动测试截图: manual-test-result.png');
        await browser.close();
    }
}

manualTest().catch(console.error);