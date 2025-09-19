const puppeteer = require('puppeteer');

async function testAssignmentHistoryFix() {
    console.log('🧪 测试派单历史和用户切换修复效果...');
    
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
            if (text.includes('派单历史') || text.includes('用户切换') || text.includes('角色') || text.includes('任务')) {
                console.log('📝 页面:', text);
            }
        });
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('\n🔍 1. 检查当前用户（张美华-客服）的任务...');
        await page.click('#mytasks-tab');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('button[onclick="loadMyTasks()"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const customerServiceTasks = await page.evaluate(() => {
            const taskCards = document.querySelectorAll('.task-card');
            return Array.from(taskCards).map(card => {
                const title = card.querySelector('.card-title')?.textContent || '';
                const assignedTo = card.querySelector('.text-info')?.textContent || '';
                const type = card.querySelector('.text-muted:last-child')?.textContent || '';
                return { title, assignedTo, type };
            });
        });
        
        console.log('👩‍💼 张美华（客服）的任务:');
        customerServiceTasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title} → ${task.assignedTo}`);
            console.log(`     类型: ${task.type}`);
        });
        
        console.log('\n🔄 2. 切换到操作员用户...');
        await page.select('#userSwitchSelect', 'OP001');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 重新加载任务看看是否变化
        await page.click('button[onclick="loadMyTasks()"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const operatorTasks = await page.evaluate(() => {
            const taskCards = document.querySelectorAll('.task-card');
            return Array.from(taskCards).map(card => {
                const title = card.querySelector('.card-title')?.textContent || '';
                const customer = card.querySelector('.text-info')?.textContent || '';
                const workflow = card.querySelector('.workflow-steps') ? '有工作流' : '无工作流';
                return { title, customer, workflow };
            });
        });
        
        console.log('👨‍🔧 操作员的任务:');
        operatorTasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title} - ${task.customer}`);
            console.log(`     ${task.workflow}`);
        });
        
        console.log('\n📋 3. 切换到派单历史标签...');
        await page.click('#history-tab');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('button[onclick="loadAssignmentHistory()"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const historyRecords = await page.evaluate(() => {
            const historyRows = document.querySelectorAll('#historyTable tr');
            if (historyRows.length === 1 && historyRows[0].cells.length === 1) {
                // 只有一行且是"暂无记录"
                return [];
            }
            return Array.from(historyRows).map(row => {
                const cells = Array.from(row.cells).map(cell => cell.textContent.trim());
                return cells;
            });
        });
        
        console.log('📜 派单历史记录:');
        if (historyRecords.length === 0) {
            console.log('  暂无派单历史记录');
        } else {
            historyRecords.forEach((record, index) => {
                console.log(`  ${index + 1}. ${record.join(' | ')}`);
            });
        }
        
        console.log('\n🎯 4. 测试结果评估:');
        
        // 评估客服任务显示
        if (customerServiceTasks.length > 0 && customerServiceTasks.some(t => t.type.includes('客服派单'))) {
            console.log('✅ 客服任务显示正确：显示派单跟踪任务');
        } else {
            console.log('❌ 客服任务显示错误');
        }
        
        // 评估操作员任务显示
        if (operatorTasks.length > 0 && operatorTasks.some(t => t.workflow === '有工作流')) {
            console.log('✅ 操作员任务显示正确：显示操作任务');
        } else {
            console.log('❌ 操作员任务显示错误');
        }
        
        // 评估用户切换功能
        if (customerServiceTasks.length !== operatorTasks.length) {
            console.log('✅ 用户切换功能正常：不同角色显示不同任务');
        } else {
            console.log('⚠️ 用户切换可能未生效');
        }
        
        console.log('\n⌚ 保持页面打开15秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testAssignmentHistoryFix().catch(console.error);