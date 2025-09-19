const { chromium } = require('playwright');

async function testNotificationSystem() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 测试实时通知系统...');
        
        // 1. 访问接派单页面
        await page.goto('http://localhost:8081/api/service-assignment.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log('✅ 接派单页面成功加载');
        
        // 2. 检查通知系统初始化
        console.log('\n📡 检查通知系统初始化:');
        const notificationSystemExists = await page.evaluate(() => {
            return typeof window.notificationSystem !== 'undefined';
        });
        console.log(`  通知系统对象: ${notificationSystemExists ? '✅ 已创建' : '❌ 未找到'}`);
        
        // 3. 检查通知中心按钮
        const notificationButton = await page.locator('a:has-text("通知中心")').isVisible();
        console.log(`  通知中心按钮: ${notificationButton ? '✅' : '❌'}`);
        
        // 4. 检查通知徽章
        const notificationBadge = await page.locator('#notificationCount').isVisible();
        console.log(`  通知徽章: ${notificationBadge ? '✅' : '❌'}`);
        
        // 5. 测试通知中心弹窗
        console.log('\n🔔 测试通知中心:');
        await page.click('a:has-text("通知中心")');
        await page.waitForTimeout(2000);
        
        const notificationModal = await page.locator('#notificationCenterModal').isVisible();
        console.log(`  通知中心模态框: ${notificationModal ? '✅ 显示' : '❌ 隐藏'}`);
        
        if (notificationModal) {
            // 检查筛选按钮
            const filterButtons = await page.locator('input[name="notificationFilter"]').count();
            console.log(`  筛选按钮数量: ${filterButtons}`);
            
            // 检查操作按钮
            const markAllReadBtn = await page.locator('button:has-text("全部已读")').isVisible();
            const clearAllBtn = await page.locator('button:has-text("清空通知")').isVisible();
            console.log(`  全部已读按钮: ${markAllReadBtn ? '✅' : '❌'}`);
            console.log(`  清空通知按钮: ${clearAllBtn ? '✅' : '❌'}`);
            
            // 检查通知列表
            const notificationList = await page.locator('#notificationCenterList').isVisible();
            console.log(`  通知列表容器: ${notificationList ? '✅' : '❌'}`);
            
            // 关闭模态框
            await page.click('.btn-close');
            await page.waitForTimeout(1000);
        }
        
        // 6. 测试模拟通知生成
        console.log('\n🎬 测试模拟通知:');
        await page.evaluate(() => {
            if (window.notificationSystem) {
                // 生成测试通知
                window.notificationSystem.showSystemNotification('这是一个测试通知', 'info');
                
                // 生成派单通知
                window.notificationSystem.sendAssignmentNotification({
                    serviceCode: 'MBL_PROCESSING',
                    serviceName: 'MBL处理',
                    orderNo: 'HW-EXPORT-20240102-001',
                    operatorId: 'OP001',
                    department: '海运操作部',
                    priority: 'high'
                });
            }
        });
        
        await page.waitForTimeout(3000);
        
        // 检查是否有通知弹窗出现
        const notificationToasts = await page.locator('.notification-toast').count();
        console.log(`  实时通知弹窗数量: ${notificationToasts}`);
        
        // 7. 检查通知徽章更新
        const badgeCount = await page.locator('#notificationCount').textContent();
        console.log(`  通知徽章数字: ${badgeCount || '0'}`);
        
        // 8. 测试订单选择和派单操作
        console.log('\n📋 测试派单通知功能:');
        
        // 等待订单加载
        await page.waitForTimeout(2000);
        const orderOptions = await page.locator('#orderSelect option').count();
        console.log(`  可用订单数: ${orderOptions - 1}`); // 减去默认选项
        
        if (orderOptions > 1) {
            // 选择第一个真实订单
            await page.selectOption('#orderSelect', { index: 1 });
            await page.waitForTimeout(2000);
            
            // 检查服务是否加载
            const serviceCards = await page.locator('.service-card').count();
            console.log(`  加载的服务数: ${serviceCards}`);
            
            if (serviceCards > 0) {
                // 点击第一个派单按钮（如果有）
                const assignButton = page.locator('.service-card button:has-text("派单")').first();
                const assignButtonExists = await assignButton.isVisible();
                
                if (assignButtonExists) {
                    console.log('  测试派单操作...');
                    await assignButton.click();
                    await page.waitForTimeout(1500);
                    
                    // 检查派单模态框
                    const assignModal = await page.locator('#assignServiceModal').isVisible();
                    console.log(`  派单模态框: ${assignModal ? '✅' : '❌'}`);
                    
                    if (assignModal) {
                        // 选择操作人员
                        const operatorOptions = await page.locator('#operatorSelect option').count();
                        if (operatorOptions > 1) {
                            await page.selectOption('#operatorSelect', { index: 1 });
                            await page.fill('#assignmentNotes', '测试派单通知功能');
                            
                            // 确认派单
                            await page.click('button:has-text("确认派单")');
                            await page.waitForTimeout(2000);
                            
                            console.log('  派单操作已执行');
                            
                            // 检查是否有新的通知弹窗
                            const newNotificationToasts = await page.locator('.notification-toast').count();
                            console.log(`  派单后通知弹窗数: ${newNotificationToasts}`);
                        }
                    }
                }
            }
        }
        
        // 9. 测试我的任务标签页
        console.log('\n📝 测试我的任务功能:');
        await page.click('#mytasks-tab');
        await page.waitForTimeout(2000);
        
        const taskPanel = await page.locator('#mytasks').isVisible();
        console.log(`  我的任务面板: ${taskPanel ? '✅' : '❌'}`);
        
        if (taskPanel) {
            // 检查任务统计卡片
            const taskStatsCards = await page.locator('#mytasks .card.bg-primary, #mytasks .card.bg-warning, #mytasks .card.bg-success, #mytasks .card.bg-danger').count();
            console.log(`  任务统计卡片数: ${taskStatsCards}`);
            
            // 点击刷新任务
            await page.click('button:has-text("刷新")');
            await page.waitForTimeout(2000);
            
            const taskCards = await page.locator('.task-card').count();
            console.log(`  任务卡片数: ${taskCards}`);
            
            if (taskCards > 0) {
                // 测试任务操作
                const startTaskBtn = page.locator('button:has-text("开始处理")').first();
                const startTaskExists = await startTaskBtn.isVisible();
                
                if (startTaskExists) {
                    console.log('  测试开始任务...');
                    await startTaskBtn.click();
                    await page.waitForTimeout(1500);
                    
                    // 检查是否有完成步骤按钮出现
                    const completeStepBtn = await page.locator('button:has-text("完成当前步骤")').first().isVisible();
                    console.log(`  完成步骤按钮: ${completeStepBtn ? '✅' : '❌'}`);
                    
                    if (completeStepBtn) {
                        await page.click('button:has-text("完成当前步骤")');
                        await page.waitForTimeout(1500);
                        console.log('  步骤完成操作已执行');
                    }
                }
            }
        }
        
        // 10. 测试通知API端点
        console.log('\n🌐 测试通知API端点:');
        
        try {
            // 测试通知统计API
            const statsResponse = await page.evaluate(async () => {
                const response = await fetch('/api/notifications/stats');
                return response.ok;
            });
            console.log(`  通知统计API: ${statsResponse ? '✅' : '❌'}`);
            
            // 测试发送测试通知API
            const testNotificationResponse = await page.evaluate(async () => {
                const response = await fetch('/api/notifications/test?userId=OP001', {
                    method: 'POST'
                });
                return response.ok;
            });
            console.log(`  测试通知API: ${testNotificationResponse ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`  API测试错误: ${error.message}`);
        }
        
        // 11. 最终检查通知容器
        console.log('\n🎯 最终状态检查:');
        const notificationContainer = await page.locator('#notificationContainer').isVisible();
        console.log(`  通知容器: ${notificationContainer ? '✅' : '❌'}`);
        
        const finalBadgeCount = await page.locator('#notificationCount').textContent();
        console.log(`  最终徽章数: ${finalBadgeCount || '0'}`);
        
        const finalTaskBadgeCount = await page.locator('#myTasksCount').textContent();
        console.log(`  任务徽章数: ${finalTaskBadgeCount || '0'}`);
        
        console.log('\n🎉 实时通知系统测试完成！');
        
        // 保持页面打开以便观察
        console.log('\n⏸️  页面将保持打开状态供手动测试...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await page.screenshot({ path: 'notification-system-test.png', fullPage: true });
        console.log('📸 测试截图: notification-system-test.png');
        await browser.close();
    }
}

testNotificationSystem().catch(console.error);