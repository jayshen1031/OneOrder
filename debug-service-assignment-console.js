const puppeteer = require('puppeteer');

async function debugServiceAssignmentConsole() {
    console.log('🔍 调试service-assignment页面控制台错误...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        const logs = [];
        const errors = [];
        
        // 监听所有控制台消息
        page.on('console', msg => {
            const text = msg.text();
            logs.push(`[${msg.type()}] ${text}`);
            console.log(`📝 控制台 [${msg.type()}]:`, text);
        });
        
        // 监听JavaScript错误
        page.on('error', err => {
            const error = `JavaScript错误: ${err.message}`;
            errors.push(error);
            console.error('❌', error);
        });
        
        // 监听页面错误
        page.on('pageerror', err => {
            const error = `页面错误: ${err.message}`;
            errors.push(error);
            console.error('❌', error);
        });
        
        // 监听响应错误
        page.on('response', response => {
            if (!response.ok() && response.url().includes('localhost:8081')) {
                const error = `HTTP错误: ${response.status()} ${response.url()}`;
                errors.push(error);
                console.error('🌐', error);
            }
        });
        
        console.log('📖 加载service-assignment页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        console.log('⏰ 等待页面初始化...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 手动触发loadOrderList
        console.log('🔄 手动触发loadOrderList...');
        await page.evaluate(() => {
            console.log('开始手动调用loadOrderList...');
            if (typeof loadOrderList === 'function') {
                loadOrderList();
            } else {
                console.error('loadOrderList函数不存在！');
            }
        });
        
        // 再等待一段时间观察结果
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 检查最终状态
        const finalState = await page.evaluate(() => {
            const select = document.getElementById('orderSelect');
            if (!select) return { error: 'orderSelect元素不存在' };
            
            return {
                optionCount: select.options.length,
                options: Array.from(select.options).map(opt => ({
                    value: opt.value,
                    text: opt.textContent,
                    disabled: opt.disabled
                })),
                hasLoadOrderList: typeof loadOrderList === 'function',
                hasGetCustomerName: typeof getCustomerName === 'function',
                hasGetBusinessTypeName: typeof getBusinessTypeName === 'function'
            };
        });
        
        console.log('\n📊 最终状态:');
        console.log('  选项数量:', finalState.optionCount);
        console.log('  loadOrderList函数存在:', finalState.hasLoadOrderList);
        console.log('  getCustomerName函数存在:', finalState.hasGetCustomerName);
        console.log('  getBusinessTypeName函数存在:', finalState.hasGetBusinessTypeName);
        
        if (finalState.options) {
            console.log('  订单选项:');
            finalState.options.forEach((opt, index) => {
                console.log(`    ${index + 1}. ${opt.value ? '[有效]' : '[无效]'} ${opt.text}`);
            });
        }
        
        console.log('\n📜 收集到的错误:');
        if (errors.length === 0) {
            console.log('  无错误');
        } else {
            errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('⌚ 保持页面打开10秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 调试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 调试完成');
    }
}

debugServiceAssignmentConsole().catch(console.error);