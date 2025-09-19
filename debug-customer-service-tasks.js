const puppeteer = require('puppeteer');

async function debugCustomerServiceTasks() {
    console.log('🔍 调试客服任务显示问题...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听所有控制台消息
        page.on('console', msg => {
            console.log(`📝 [${msg.type()}]:`, msg.text());
        });
        
        // 监听错误
        page.on('error', err => {
            console.error('❌ 页面错误:', err.message);
        });
        
        console.log('📖 加载页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 检查用户角色和函数...');
        const debugInfo = await page.evaluate(() => {
            const role = getCurrentUserRole();
            const userId = currentCustomerService ? currentCustomerService.id : null;
            const userName = currentCustomerService ? currentCustomerService.name : null;
            
            return {
                role,
                userId,
                userName,
                hasLoadMockMyTasks: typeof loadMockMyTasks === 'function',
                hasGetCurrentUserRole: typeof getCurrentUserRole === 'function'
            };
        });
        
        console.log('用户信息:', debugInfo);
        
        console.log('🔄 手动调用loadMockMyTasks函数...');
        const mockResult = await page.evaluate(() => {
            try {
                loadMockMyTasks();
                return {
                    success: true,
                    tasksCount: myTasks.length,
                    tasks: myTasks.map(t => ({
                        serviceName: t.serviceName,
                        assignedOperator: t.assignedOperator,
                        type: t.type
                    }))
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        console.log('模拟任务结果:', mockResult);
        
        console.log('📋 切换到我的任务标签...');
        await page.click('#mytasks-tab');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查任务容器内容
        const containerContent = await page.evaluate(() => {
            const container = document.getElementById('myTasksContainer');
            return {
                innerHTML: container ? container.innerHTML : 'Container not found',
                hasTaskCards: container ? container.querySelectorAll('.task-card').length : 0
            };
        });
        
        console.log('任务容器内容:', {
            taskCardsCount: containerContent.hasTaskCards,
            htmlLength: containerContent.innerHTML.length
        });
        
        if (containerContent.hasTaskCards === 0) {
            console.log('⚠️ 没有任务卡片，HTML内容:');
            console.log(containerContent.innerHTML.substring(0, 500));
        }
        
        console.log('⌚ 保持页面打开10秒...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 调试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 调试完成');
    }
}

debugCustomerServiceTasks().catch(console.error);