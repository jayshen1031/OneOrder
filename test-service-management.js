const { chromium } = require('playwright');

async function testServiceManagement() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 测试服务管理功能...');
        
        // 1. 访问服务管理页面
        await page.goto('http://localhost:8081/api/service-management.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log('✅ 服务管理页面成功加载');
        
        // 2. 检查页面标题和导航
        const title = await page.locator('nav .navbar-brand').textContent();
        console.log(`📋 页面标题: ${title}`);
        
        // 3. 检查统计卡片
        console.log('\n📊 统计信息检查:');
        await page.waitForTimeout(2000); // 等待演示数据加载
        const totalServices = await page.locator('#totalServices').textContent();
        const activeServices = await page.locator('#activeServices').textContent();
        const serviceCategories = await page.locator('#serviceCategories').textContent();
        const workflowSteps = await page.locator('#workflowSteps').textContent();
        
        console.log(`  总服务数: ${totalServices}`);
        console.log(`  启用服务: ${activeServices}`);
        console.log(`  服务分类: ${serviceCategories}`);
        console.log(`  工作流步骤: ${workflowSteps}`);
        
        // 4. 检查服务卡片显示
        await page.waitForTimeout(2000);
        const serviceCards = await page.locator('.service-card').count();
        console.log(`\n🔍 显示服务卡片数: ${serviceCards}`);
        
        if (serviceCards > 0) {
            // 检查第一个服务卡片
            const firstCard = page.locator('.service-card').first();
            const serviceName = await firstCard.locator('.card-header h6').textContent();
            const serviceCode = await firstCard.locator('.card-header small').textContent();
            const estimatedDuration = await firstCard.locator('.fw-bold').first().textContent();
            
            console.log(`  第一个服务: ${serviceName}`);
            console.log(`  服务代码: ${serviceCode}`);
            console.log(`  预计耗时: ${estimatedDuration}`);
        }
        
        // 5. 测试搜索功能
        console.log('\n🔍 测试搜索功能:');
        await page.fill('#searchKeyword', '订舱');
        await page.waitForTimeout(1000);
        
        const searchResults = await page.locator('.service-card').count();
        console.log(`  搜索"订舱"结果: ${searchResults}个服务`);
        
        // 清空搜索
        await page.fill('#searchKeyword', '');
        await page.waitForTimeout(1000);
        
        // 6. 测试筛选功能
        console.log('\n📋 测试筛选功能:');
        await page.selectOption('#businessTypeFilter', 'OCEAN');
        await page.waitForTimeout(1000);
        
        const oceanResults = await page.locator('.service-card').count();
        console.log(`  筛选海运服务: ${oceanResults}个`);
        
        // 重置筛选
        await page.selectOption('#businessTypeFilter', '');
        await page.waitForTimeout(1000);
        
        // 7. 测试新建服务功能
        console.log('\n➕ 测试新建服务功能:');
        await page.click('button:has-text("新建服务")');
        await page.waitForTimeout(1500);
        
        const modalVisible = await page.locator('#serviceModal').isVisible();
        console.log(`  新建服务模态框: ${modalVisible ? '显示' : '隐藏'}`);
        
        if (modalVisible) {
            // 检查表单字段
            const serviceCodeField = await page.locator('#serviceCode').isVisible();
            const serviceNameField = await page.locator('#serviceName').isVisible();
            const businessTypeField = await page.locator('#businessType').isVisible();
            const workflowContainer = await page.locator('#workflowStepsContainer').isVisible();
            
            console.log(`  服务代码字段: ${serviceCodeField ? '✅' : '❌'}`);
            console.log(`  服务名称字段: ${serviceNameField ? '✅' : '❌'}`);
            console.log(`  业务类型字段: ${businessTypeField ? '✅' : '❌'}`);
            console.log(`  工作流容器: ${workflowContainer ? '✅' : '❌'}`);
            
            // 检查工作流步骤
            const workflowSteps = await page.locator('.workflow-step').count();
            console.log(`  默认工作流步骤数: ${workflowSteps}`);
            
            // 测试添加工作流步骤
            await page.click('button:has-text("添加步骤")');
            await page.waitForTimeout(500);
            
            const newWorkflowSteps = await page.locator('.workflow-step').count();
            console.log(`  添加步骤后: ${newWorkflowSteps}个步骤`);
            
            // 填写测试表单
            await page.fill('#serviceName', '测试服务');
            await page.selectOption('#businessType', 'OCEAN');
            await page.selectOption('#serviceCategory', 'CORE');
            
            console.log(`  表单填写完成`);
            
            // 关闭模态框
            await page.click('button:has-text("取消")');
            await page.waitForTimeout(1000);
        }
        
        // 8. 测试服务操作按钮
        if (serviceCards > 0) {
            console.log('\n🛠️ 测试服务操作按钮:');
            
            const firstCard = page.locator('.service-card').first();
            
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
            
            // 检查服务特性徽章
            const autoAssignBadge = await firstCard.locator('.badge:has-text("自动派单")').count();
            const approvalBadge = await firstCard.locator('.badge:has-text("需要审批")').count();
            const trackableBadge = await firstCard.locator('.badge:has-text("可追踪")').count();
            
            console.log(`  自动派单徽章: ${autoAssignBadge > 0 ? '✅' : '❌'}`);
            console.log(`  需要审批徽章: ${approvalBadge > 0 ? '✅' : '❌'}`);
            console.log(`  可追踪徽章: ${trackableBadge > 0 ? '✅' : '❌'}`);
        }
        
        // 9. 检查导航链接
        console.log('\n🔗 检查导航链接:');
        const serviceAssignmentLink = await page.locator('a[href="service-assignment.html"]').isVisible();
        const protocolAdminLink = await page.locator('a[href="protocol-admin.html"]').isVisible();
        const freightOrderLink = await page.locator('a[href="freight-order.html"]').isVisible();
        
        console.log(`  服务派单链接: ${serviceAssignmentLink ? '✅' : '❌'}`);
        console.log(`  协议管理链接: ${protocolAdminLink ? '✅' : '❌'}`);
        console.log(`  订单管理链接: ${freightOrderLink ? '✅' : '❌'}`);
        
        // 10. 测试业务类型分组显示
        console.log('\n🏷️ 测试业务类型分组:');
        const categoryHeaders = await page.locator('.service-category').count();
        console.log(`  业务类型分组数: ${categoryHeaders}`);
        
        if (categoryHeaders > 0) {
            const firstCategoryTitle = await page.locator('.service-category h5').first().textContent();
            console.log(`  第一个分组: ${firstCategoryTitle?.replace(/\s+/g, ' ').trim()}`);
        }
        
        console.log('\n🎉 服务管理功能测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await page.screenshot({ path: 'service-management-test.png', fullPage: true });
        console.log('📸 测试截图: service-management-test.png');
        await browser.close();
    }
}

testServiceManagement().catch(console.error);