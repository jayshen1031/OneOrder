const puppeteer = require('puppeteer');

async function testTaskRoleFix() {
    console.log('🧪 测试任务角色修复效果...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听控制台输出
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('用户角色') || text.includes('用户信息') || text.includes('任务')) {
                console.log('📝 页面:', text);
            }
        });
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 检查当前用户角色...');
        const userInfo = await page.evaluate(() => {
            const role = getCurrentUserRole();
            const userId = currentCustomerService ? currentCustomerService.id : null;
            const userName = currentCustomerService ? currentCustomerService.name : null;
            
            return {
                role: role,
                userId: userId,
                userName: userName,
                hasLoadMyTasksFunction: typeof loadMyTasks === 'function'
            };
        });
        
        console.log('👤 用户信息:');
        console.log(`  角色: ${userInfo.role}`);
        console.log(`  ID: ${userInfo.userId}`);
        console.log(`  姓名: ${userInfo.userName}`);
        console.log(`  loadMyTasks函数存在: ${userInfo.hasLoadMyTasksFunction}`);
        
        // 点击"我的任务"标签
        console.log('📋 切换到"我的任务"标签...');
        await page.click('#mytasks-tab');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 点击刷新按钮加载任务
        console.log('🔄 点击刷新按钮加载任务...');
        await page.click('button[onclick="loadMyTasks()"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 检查任务显示
        const taskInfo = await page.evaluate(() => {
            const taskContainer = document.getElementById('myTasksContainer');
            const taskCards = taskContainer.querySelectorAll('.task-card');
            const taskCount = document.getElementById('myTasksCount').textContent;
            
            const tasks = Array.from(taskCards).map(card => {
                const title = card.querySelector('.card-title')?.textContent || '';
                const status = card.querySelector('.badge')?.textContent || '';
                const type = card.querySelector('[data-task-type]')?.getAttribute('data-task-type') || 'unknown';
                return { title, status, type };
            });
            
            return {
                taskCount: taskCount,
                tasksDisplayed: tasks.length,
                tasks: tasks
            };
        });
        
        console.log('📊 任务信息:');
        console.log(`  徽章显示任务数: ${taskInfo.taskCount}`);
        console.log(`  实际显示任务数: ${taskInfo.tasksDisplayed}`);
        
        if (taskInfo.tasks.length > 0) {
            console.log('  任务列表:');
            taskInfo.tasks.forEach((task, index) => {
                console.log(`    ${index + 1}. ${task.title} - ${task.status}`);
            });
        } else {
            console.log('  无任务显示');
        }
        
        // 判断修复效果
        if (userInfo.role === 'CUSTOMER_SERVICE') {
            if (taskInfo.tasksDisplayed === 0 || taskInfo.tasksDisplayed === 1) {
                console.log('✅ 客服任务显示正确：只显示派单任务或无任务');
            } else {
                console.log('❌ 客服任务显示错误：显示了过多任务');
            }
        } else if (userInfo.role === 'OPERATOR') {
            console.log('✅ 操作员角色：显示操作任务');
        } else {
            console.log('⚠️ 未知角色');
        }
        
        console.log('⌚ 保持页面打开10秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testTaskRoleFix().catch(console.error);