const puppeteer = require('puppeteer');

async function testOrderLoadingPage() {
    console.log('🧪 测试独立订单加载页面...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听控制台输出
        page.on('console', msg => {
            console.log('📄 页面日志:', msg.text());
        });
        
        // 监听错误
        page.on('error', err => {
            console.error('❌ 页面错误:', err.message);
        });
        
        console.log('📖 加载测试页面...');
        await page.goto('http://localhost:8081/api/test-order-loading.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待数据加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 检查订单加载结果...');
        const result = await page.evaluate(() => {
            const select = document.getElementById('orderSelect');
            const options = Array.from(select.options).map(option => ({
                value: option.value,
                text: option.textContent,
                disabled: option.disabled
            }));
            
            const logs = Array.from(document.querySelectorAll('.log')).map(log => log.textContent);
            
            return {
                options: options,
                logs: logs,
                selectCount: options.length
            };
        });
        
        console.log(`📊 订单选择框选项数量: ${result.selectCount}`);
        console.log('📋 选项列表:');
        result.options.forEach((option, index) => {
            const status = option.disabled ? '[禁用]' : option.value ? '[可选]' : '[默认]';
            console.log(`  ${index + 1}. ${status} ${option.text}`);
        });
        
        console.log('\n📜 页面日志:');
        result.logs.forEach(log => console.log(`  ${log}`));
        
        // 判断测试结果
        const validOrders = result.options.filter(opt => opt.value && !opt.disabled);
        if (validOrders.length > 0) {
            console.log(`🎉 测试成功！找到 ${validOrders.length} 个有效订单`);
        } else {
            console.log('❌ 测试失败：没有找到有效订单');
        }
        
        console.log('⌚ 保持页面打开5秒...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testOrderLoadingPage().catch(console.error);