const { chromium } = require('playwright');

async function testOrderPageEnhancements() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔗 打开货代订单管理页面...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        await page.waitForLoadState('networkidle');
        
        console.log('📊 检查页面基础元素...');
        
        // 检查客服角色标识
        console.log('👤 检查客服角色标识...');
        const customerServiceBadge = await page.locator('.badge.bg-warning.text-dark').textContent();
        console.log(`✅ 客服角色标识: ${customerServiceBadge}`);
        
        const permissionText = await page.locator('.text-info').textContent();
        console.log(`✅ 权限说明: ${permissionText}`);
        
        // 检查订单列表表头
        console.log('📋 检查订单列表表头...');
        const tableHeaders = await page.locator('table thead tr th').allTextContents();
        console.log(`✅ 表头列: ${tableHeaders.join(' | ')}`);
        
        // 等待订单数据加载
        console.log('⏳ 等待订单数据加载...');
        await page.waitForTimeout(3000);
        
        // 检查订单列表内容
        console.log('📝 检查订单列表内容...');
        const orderRows = await page.locator('#ordersTable tr').count();
        console.log(`✅ 订单行数: ${orderRows}`);
        
        if (orderRows > 0) {
            // 检查第一行订单数据
            const firstRow = page.locator('#ordersTable tr').first();
            const cells = await firstRow.locator('td').allTextContents();
            console.log(`✅ 第一行数据: ${cells.join(' | ')}`);
            
            // 检查业务类型图标和徽章
            const businessTypeCell = firstRow.locator('td').nth(2);
            const hasIcon = await businessTypeCell.locator('i').count() > 0;
            const hasBadge = await businessTypeCell.locator('.badge').count() > 0;
            console.log(`✅ 业务类型显示 - 图标: ${hasIcon}, 徽章: ${hasBadge}`);
            
            // 检查包含服务列
            const serviceCell = firstRow.locator('td').nth(3);
            const serviceCount = await serviceCell.locator('.text-muted').textContent();
            const serviceTags = await serviceCell.locator('.badge').count();
            console.log(`✅ 服务信息 - ${serviceCount}, 标签数量: ${serviceTags}`);
            
            // 检查客服负责人列
            const customerServiceCell = firstRow.locator('td').nth(8);
            const hasCustomerServiceLabel = await customerServiceCell.locator('.text-muted').textContent();
            console.log(`✅ 客服负责人显示: ${hasCustomerServiceLabel}`);
        }
        
        // 测试新建订单功能
        console.log('➕ 测试新建订单功能...');
        await page.click('button:has-text("新建订单")');
        await page.waitForTimeout(1000);
        
        const newOrderForm = await page.locator('#newOrderForm').isVisible();
        console.log(`✅ 新建订单表单显示: ${newOrderForm}`);
        
        if (newOrderForm) {
            // 检查客服信息显示
            const currentOperator = await page.locator('#currentOperator').inputValue();
            console.log(`✅ 当前操作员: ${currentOperator}`);
            
            // 测试业务类型选择
            await page.selectOption('#businessType', 'OCEAN');
            await page.waitForTimeout(500);
            
            // 检查服务选择区域
            const serviceSelection = await page.locator('#serviceSelection').isVisible();
            console.log(`✅ 服务选择区域显示: ${serviceSelection}`);
            
            // 检查已选择服务提示
            const selectedServicesAlert = await page.locator('#selectedServicesAlert').isVisible();
            console.log(`✅ 已选择服务提示: ${selectedServicesAlert}`);
        }
        
        console.log('✅ 所有测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    } finally {
        await page.screenshot({ path: 'test-enhanced-order-page.png' });
        console.log('📸 截图已保存: test-enhanced-order-page.png');
        await browser.close();
    }
}

testOrderPageEnhancements().catch(console.error);