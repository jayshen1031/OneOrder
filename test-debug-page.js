const { chromium } = require('playwright');

async function testDebugPage() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // 监听所有控制台消息
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    try {
        console.log('🔍 访问调试页面...');
        await page.goto('http://localhost:8081/api/debug-orders.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000); // 等待调试信息生成
        
        // 获取调试信息
        const debugContent = await page.locator('#debug-info').innerHTML();
        console.log('\n📋 调试页面内容:');
        console.log(debugContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
        
        // 检查是否有错误
        const hasError = debugContent.includes('错误:') || debugContent.includes('error');
        console.log(`\n状态: ${hasError ? '❌ 有错误' : '✅ 正常'}`);
        
        console.log('\n📝 所有控制台日志:');
        consoleLogs.forEach((log, index) => {
            console.log(`${index + 1}. ${log}`);
        });
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await page.screenshot({ path: 'debug-page-result.png', fullPage: true });
        console.log('📸 调试页面截图: debug-page-result.png');
        await browser.close();
    }
}

testDebugPage().catch(console.error);