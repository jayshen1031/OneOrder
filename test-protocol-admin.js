const { chromium } = require('playwright');

async function testProtocolAdmin() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 测试协议管理功能...');
        
        // 1. 访问协议管理页面
        await page.goto('http://localhost:8081/api/protocol-admin.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log('✅ 协议管理页面成功加载');
        
        // 2. 检查页面标题和导航
        const title = await page.locator('nav .navbar-brand').textContent();
        console.log(`📋 页面标题: ${title}`);
        
        // 3. 检查统计卡片
        console.log('\n📊 统计信息检查:');
        const totalProtocols = await page.locator('#totalProtocols').textContent();
        const activeProtocols = await page.locator('#activeProtocols').textContent();
        const expiringSoon = await page.locator('#expiringSoon').textContent();
        const avgCommission = await page.locator('#averageCommission').textContent();
        
        console.log(`  总协议数: ${totalProtocols}`);
        console.log(`  有效协议: ${activeProtocols}`);
        console.log(`  即将到期: ${expiringSoon}`);
        console.log(`  平均佣金率: ${avgCommission}`);
        
        // 4. 检查协议卡片显示
        await page.waitForTimeout(2000);
        const protocolCards = await page.locator('.protocol-card').count();
        console.log(`\n🔍 显示协议卡片数: ${protocolCards}`);
        
        if (protocolCards > 0) {
            // 检查第一个协议卡片
            const firstCard = page.locator('.protocol-card').first();
            const protocolName = await firstCard.locator('.card-header h6').textContent();
            const commissionRate = await firstCard.locator('.commission-rate').first().textContent();
            const status = await firstCard.locator('.card-header small').last().textContent();
            
            console.log(`  第一个协议: ${protocolName}`);
            console.log(`  佣金率: ${commissionRate}`);
            console.log(`  状态: ${status}`);
        }
        
        // 5. 测试搜索功能
        console.log('\n🔍 测试搜索功能:');
        await page.fill('#searchKeyword', '海运');
        await page.waitForTimeout(1000);
        
        const searchResults = await page.locator('.protocol-card').count();
        console.log(`  搜索"海运"结果: ${searchResults}个协议`);
        
        // 清空搜索
        await page.fill('#searchKeyword', '');
        await page.waitForTimeout(1000);
        
        // 6. 测试筛选功能
        console.log('\n📋 测试筛选功能:');
        await page.selectOption('#statusFilter', 'active');
        await page.waitForTimeout(1000);
        
        const activeResults = await page.locator('.protocol-card').count();
        console.log(`  筛选有效协议: ${activeResults}个`);
        
        // 重置筛选
        await page.selectOption('#statusFilter', '');
        await page.waitForTimeout(1000);
        
        // 7. 测试新建协议功能
        console.log('\n➕ 测试新建协议功能:');
        await page.click('button:has-text("新建")');
        await page.waitForTimeout(1000);
        
        const modalVisible = await page.locator('#protocolModal').isVisible();
        console.log(`  新建协议模态框: ${modalVisible ? '显示' : '隐藏'}`);
        
        if (modalVisible) {
            // 检查表单字段
            const protocolNameField = await page.locator('#protocolName').isVisible();
            const baseCommissionField = await page.locator('#baseCommissionRate').isVisible();
            const salesDeptField = await page.locator('#salesDepartmentId').isVisible();
            
            console.log(`  协议名称字段: ${protocolNameField ? '✅' : '❌'}`);
            console.log(`  基础佣金字段: ${baseCommissionField ? '✅' : '❌'}`);
            console.log(`  销售部门字段: ${salesDeptField ? '✅' : '❌'}`);
            
            // 填写表单测试
            await page.fill('#protocolName', '测试协议');
            await page.selectOption('#salesDepartmentId', 'SALES_OCEAN');
            await page.selectOption('#operationDepartmentId', 'OPERATION_OCEAN');
            await page.fill('#baseCommissionRate', '15');
            await page.fill('#performanceBonusRate', '5');
            
            console.log(`  表单填写完成`);
            
            // 关闭模态框
            await page.click('button:has-text("取消")');
            await page.waitForTimeout(1000);
        }
        
        // 8. 测试协议操作按钮
        if (protocolCards > 0) {
            console.log('\n🛠️ 测试协议操作按钮:');
            
            const firstCard = page.locator('.protocol-card').first();
            
            // 检查详情按钮
            const detailBtn = await firstCard.locator('button:has-text("详情")').isVisible();
            console.log(`  详情按钮: ${detailBtn ? '✅' : '❌'}`);
            
            // 检查编辑按钮
            const editBtn = await firstCard.locator('button:has-text("编辑")').isVisible();
            console.log(`  编辑按钮: ${editBtn ? '✅' : '❌'}`);
            
            // 检查删除按钮
            const deleteBtn = await firstCard.locator('button:has-text("删除")').isVisible();
            console.log(`  删除按钮: ${deleteBtn ? '✅' : '❌'}`);
            
            // 检查启用/停用按钮
            const toggleBtn = await firstCard.locator('button:has-text("停用"), button:has-text("启用")').isVisible();
            console.log(`  状态切换按钮: ${toggleBtn ? '✅' : '❌'}`);
        }
        
        // 9. 检查导航链接
        console.log('\n🔗 检查导航链接:');
        const serviceAssignmentLink = await page.locator('a[href="service-assignment.html"]').isVisible();
        const freightOrderLink = await page.locator('a[href="freight-order.html"]').isVisible();
        
        console.log(`  服务派单链接: ${serviceAssignmentLink ? '✅' : '❌'}`);
        console.log(`  订单管理链接: ${freightOrderLink ? '✅' : '❌'}`);
        
        console.log('\n🎉 协议管理功能测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await page.screenshot({ path: 'protocol-admin-test.png', fullPage: true });
        console.log('📸 测试截图: protocol-admin-test.png');
        await browser.close();
    }
}

testProtocolAdmin().catch(console.error);