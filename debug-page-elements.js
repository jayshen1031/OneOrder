// 调试页面元素和用户切换功能
const { chromium } = require('playwright');

async function debugPageElements() {
    console.log('🔍 调试页面元素...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // 1. 访问主页面
        console.log('📱 访问主页面...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // 等待JavaScript初始化
        
        // 2. 检查用户选择器
        console.log('👤 检查用户选择器...');
        const userSelect = await page.locator('#userSwitchSelect');
        const userSelectExists = await userSelect.count() > 0;
        console.log(`用户选择器存在: ${userSelectExists}`);
        
        if (userSelectExists) {
            const options = await userSelect.locator('option').count();
            console.log(`用户选项数量: ${options}`);
            
            // 列出所有选项
            const allOptions = await userSelect.locator('option').allTextContents();
            console.log('所有用户选项:', allOptions);
            
            // 尝试切换到张美华
            console.log('尝试切换到张美华...');
            try {
                await userSelect.selectOption('CS001');
                console.log('✅ 成功切换到张美华');
                await page.waitForTimeout(2000);
                
                // 检查当前用户显示
                const currentUserText = await page.locator('#currentUserName').textContent();
                console.log(`当前用户显示: ${currentUserText}`);
                
            } catch (error) {
                console.log('❌ 切换用户失败:', error.message);
            }
        }
        
        // 3. 检查侧边栏导航
        console.log('🔍 检查侧边栏导航...');
        const sidebarNavs = await page.locator('.sidebar .nav-link').allTextContents();
        console.log('侧边栏导航项:', sidebarNavs);
        
        // 4. 检查接派单导航
        const dispatchNav = await page.locator('a[onclick="showSection(\'assignment\')"]');
        const dispatchNavExists = await dispatchNav.count() > 0;
        console.log(`接派单导航存在: ${dispatchNavExists}`);
        
        if (dispatchNavExists) {
            const isVisible = await dispatchNav.isVisible();
            console.log(`接派单导航可见: ${isVisible}`);
            
            if (isVisible) {
                console.log('📋 点击接派单导航...');
                await dispatchNav.click();
                await page.waitForTimeout(3000);
                
                // 检查派单页面元素
                console.log('🔧 检查派单页面元素...');
                
                const elements = {
                    orderSelect: await page.locator('#orderSelect').count() > 0,
                    autoAssignBtn: await page.locator('button[onclick="autoAssignAll()"]').count() > 0,
                    batchAssignBtn: await page.locator('button[onclick="batchAssign()"]').count() > 0,
                    servicesContainer: await page.locator('#servicesContainer').count() > 0,
                    operatorsContainer: await page.locator('#operatorsContainer').count() > 0,
                    historyContainer: await page.locator('#assignmentHistoryTableBody').count() > 0
                };
                
                console.log('派单页面元素检查结果:');
                Object.entries(elements).forEach(([key, exists]) => {
                    console.log(`  ${key}: ${exists ? '✅' : '❌'}`);
                });
                
                // 检查控制台错误
                console.log('📊 检查JavaScript控制台...');
                page.on('console', msg => {
                    if (msg.type() === 'error') {
                        console.log('🚨 JavaScript错误:', msg.text());
                    }
                });
                
                // 等待一段时间看是否有JavaScript初始化
                await page.waitForTimeout(5000);
            }
        }
        
        // 5. 手动截图
        console.log('📸 截图保存...');
        await page.screenshot({ 
            path: '/Users/jay/Documents/baidu/projects/OneOrder/debug-dispatch-page.png',
            fullPage: true 
        });
        
    } catch (error) {
        console.error('❌ 调试过程中出现错误:', error.message);
    } finally {
        console.log('调试完成，浏览器将保持打开30秒供检查...');
        await page.waitForTimeout(30000);
        await browser.close();
    }
}

// 运行调试
debugPageElements().catch(console.error);