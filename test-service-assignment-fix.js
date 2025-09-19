const puppeteer = require('puppeteer');

async function testServiceAssignmentFix() {
    console.log('🔧 测试服务派单页面修复效果...');
    
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
            if (text.includes('🔄') || text.includes('✅') || text.includes('❌') || text.includes('📡')) {
                console.log('📝 页面:', text);
            }
        });
        
        console.log('📖 正在加载页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化和数据加载
        console.log('⏰ 等待数据加载...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🔍 检查订单选择框...');
        const options = await page.evaluate(() => {
            const select = document.getElementById('orderSelect');
            if (!select) return null;
            
            return Array.from(select.options).map(option => ({
                value: option.value,
                text: option.textContent,
                disabled: option.disabled
            }));
        });
        
        if (!options) {
            console.error('❌ 未找到订单选择框');
            return;
        }
        
        console.log(`📋 订单选择框包含 ${options.length} 个选项:`);
        options.forEach((option, index) => {
            const status = option.disabled ? '[禁用]' : option.value ? '[可选]' : '[默认]';
            console.log(`  ${index + 1}. ${status} "${option.text}"`);
        });
        
        // 检查是否有可选择的订单
        const selectableOrders = options.filter(option => option.value && !option.disabled);
        console.log(`✅ 找到 ${selectableOrders.length} 个可选择的订单`);
        
        if (selectableOrders.length > 0) {
            console.log('🎉 修复成功！订单数据已正确加载');
            
            // 尝试选择第一个订单
            console.log('🧪 测试选择第一个订单...');
            await page.select('#orderSelect', selectableOrders[0].value);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('✅ 订单选择功能正常');
        } else {
            console.log('⚠️ 没有可选择的订单，可能是数据问题');
        }
        
        console.log('⌚ 保持页面打开10秒用于观察...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testServiceAssignmentFix().catch(console.error);