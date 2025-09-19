const puppeteer = require('puppeteer');

async function testServiceAssignmentPage() {
    console.log('🚀 启动服务派单页面测试...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听控制台输出
        page.on('console', msg => {
            console.log('📝 页面控制台:', msg.text());
        });
        
        // 监听错误
        page.on('error', err => {
            console.error('❌ 页面错误:', err.message);
        });
        
        // 监听网络请求
        page.on('response', response => {
            if (response.url().includes('freight-orders')) {
                console.log('🌐 API请求:', response.url(), '状态:', response.status());
            }
        });
        
        console.log('📖 正在加载页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        await page.waitForTimeout(3000);
        
        console.log('🔍 检查订单选择框...');
        const orderSelect = await page.$('#orderSelect');
        if (!orderSelect) {
            console.error('❌ 未找到订单选择框');
            return;
        }
        
        // 获取选择框的选项
        const options = await page.evaluate(() => {
            const select = document.getElementById('orderSelect');
            return Array.from(select.options).map(option => ({
                value: option.value,
                text: option.textContent,
                disabled: option.disabled
            }));
        });
        
        console.log('📋 订单选择框选项:');
        options.forEach((option, index) => {
            console.log(`  ${index}: "${option.text}" (value: "${option.value}", disabled: ${option.disabled})`);
        });
        
        // 检查是否有真实订单数据
        const hasRealOrders = options.some(option => option.value && !option.disabled);
        console.log('✅ 是否有真实订单数据:', hasRealOrders);
        
        if (!hasRealOrders) {
            console.log('🔄 尝试手动刷新订单列表...');
            await page.click('button[onclick="loadOrderList()"]');
            await page.waitForTimeout(2000);
            
            // 重新检查选项
            const newOptions = await page.evaluate(() => {
                const select = document.getElementById('orderSelect');
                return Array.from(select.options).map(option => ({
                    value: option.value,
                    text: option.textContent,
                    disabled: option.disabled
                }));
            });
            
            console.log('📋 刷新后的订单选择框选项:');
            newOptions.forEach((option, index) => {
                console.log(`  ${index}: "${option.text}" (value: "${option.value}", disabled: ${option.disabled})`);
            });
        }
        
        console.log('⏰ 保持页面打开，按Ctrl+C退出...');
        await new Promise(() => {}); // 保持页面打开
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
    }
}

// 运行测试
testServiceAssignmentPage().catch(console.error);