const { chromium } = require('playwright');

async function finalVerification() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🎯 最终验证修复效果...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 1. 检查仪表盘最近订单
        console.log('\n📊 仪表盘验证:');
        const dashboardRows = await page.locator('#recentOrdersTable tr').count();
        console.log(`✅ 仪表盘订单数: ${dashboardRows}`);
        
        if (dashboardRows > 0) {
            const firstOrderNo = await page.locator('#recentOrdersTable tr:first-child td:first-child').textContent();
            console.log(`✅ 第一个订单号: ${firstOrderNo}`);
            
            // 检查业务类型列
            const businessType = await page.locator('#recentOrdersTable tr:first-child td:nth-child(3)').textContent();
            console.log(`✅ 业务类型显示: ${businessType.replace(/\s+/g, ' ').trim()}`);
            
            // 检查包含服务列
            const services = await page.locator('#recentOrdersTable tr:first-child td:nth-child(4)').textContent();
            console.log(`✅ 包含服务显示: ${services.replace(/\s+/g, ' ').trim()}`);
            
            // 检查客服负责人列
            const responsible = await page.locator('#recentOrdersTable tr:first-child td:nth-child(9)').textContent();
            console.log(`✅ 客服负责人: ${responsible.replace(/\s+/g, ' ').trim()}`);
        }
        
        // 2. 检查订单管理页面
        console.log('\n📋 订单管理验证:');
        await page.click('a[href="#orders"]');
        await page.waitForTimeout(2000);
        
        const managementRows = await page.locator('#ordersTable tr').count();
        console.log(`✅ 订单管理数: ${managementRows}`);
        
        if (managementRows > 0) {
            const orderNo = await page.locator('#ordersTable tr:first-child td:first-child').textContent();
            console.log(`✅ 管理订单号: ${orderNo}`);
            
            // 检查新增的列
            const tableHeaders = await page.locator('#orders table thead tr th').allTextContents();
            console.log(`✅ 表头包含: ${tableHeaders.join(' | ')}`);
        }
        
        // 3. 检查客服角色标识
        console.log('\n👤 客服角色验证:');
        const userName = await page.locator('#currentUserName').textContent();
        const userDept = await page.locator('#currentUserDept').textContent();
        const userRole = await page.locator('.badge.bg-warning.text-dark').textContent();
        
        console.log(`✅ 用户: ${userName} | 部门: ${userDept} | 角色: ${userRole}`);
        
        // 4. 测试新建订单功能
        console.log('\n➕ 新建订单验证:');
        await page.click('button:has-text("新建订单")');
        await page.waitForTimeout(1000);
        
        const formVisible = await page.locator('#newOrderForm').isVisible();
        console.log(`✅ 新建表单: ${formVisible}`);
        
        if (formVisible) {
            const currentOperator = await page.locator('#currentOperator').inputValue();
            console.log(`✅ 预填操作员: ${currentOperator}`);
        }
        
        console.log('\n🎉 验证完成！');
        
    } catch (error) {
        console.error('❌ 验证失败:', error.message);
    } finally {
        await page.screenshot({ path: 'final-verification.png', fullPage: true });
        console.log('📸 最终截图: final-verification.png');
        await browser.close();
    }
}

finalVerification().catch(console.error);