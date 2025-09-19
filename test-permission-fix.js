const { chromium } = require('playwright');

async function testPermissionFix() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🎯 测试权限修复后的订单显示...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // 等待数据加载
        
        // 检查仪表盘最近订单
        console.log('\n📊 检查仪表盘最近订单:');
        const recentOrderRows = await page.locator('#recentOrdersTable tr').count();
        console.log(`✅ 仪表盘订单行数: ${recentOrderRows}`);
        
        if (recentOrderRows > 0) {
            const firstOrderNo = await page.locator('#recentOrdersTable tr:first-child td:first-child').textContent();
            console.log(`✅ 第一个订单号: ${firstOrderNo}`);
        }
        
        // 切换到订单管理页面
        console.log('\n📋 检查订单管理页面:');
        await page.click('a[href="#orders"]');
        await page.waitForTimeout(2000);
        
        const orderRows = await page.locator('#ordersTable tr').count();
        console.log(`✅ 订单管理行数: ${orderRows}`);
        
        if (orderRows > 0) {
            const firstOrderManageNo = await page.locator('#ordersTable tr:first-child td:first-child').textContent();
            console.log(`✅ 第一个管理订单号: ${firstOrderManageNo}`);
        }
        
        // 检查控制台权限日志
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('订单') || msg.text().includes('权限') || msg.text().includes('可见')) {
                consoleLogs.push(msg.text());
            }
        });
        
        // 强制刷新来查看控制台日志
        await page.reload();
        await page.waitForTimeout(5000);
        
        console.log('\n🔍 控制台权限日志:');
        consoleLogs.forEach(log => console.log(`  ${log}`));
        
        const result = {
            dashboardOrders: recentOrderRows,
            managementOrders: orderRows,
            status: (recentOrderRows > 0 && orderRows > 0) ? '✅ 成功' : '❌ 失败'
        };
        
        console.log('\n📋 测试结果:', result);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await page.screenshot({ path: 'test-permission-fix.png', fullPage: true });
        console.log('📸 测试截图已保存: test-permission-fix.png');
        await browser.close();
    }
}

testPermissionFix().catch(console.error);