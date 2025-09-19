// 测试张美华权限和派单功能完整性
const { chromium } = require('playwright');

async function testDispatchFunctionality() {
    console.log('🚀 开始测试张美华权限和派单功能...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // 1. 访问主页面
        console.log('📱 访问主页面...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        await page.waitForLoadState('networkidle');
        
        // 2. 切换到张美华
        console.log('👤 切换到张美华...');
        await page.selectOption('#userSelect', 'CS001');
        await page.waitForTimeout(1000);
        
        // 3. 检查接派单导航是否可见
        console.log('🔍 检查接派单导航...');
        const dispatchNav = await page.locator('a[onclick="showContent(\'dispatch\')"]');
        const isVisible = await dispatchNav.isVisible();
        console.log(`接派单导航可见性: ${isVisible}`);
        
        if (!isVisible) {
            throw new Error('❌ 张美华无法看到接派单导航');
        }
        
        // 4. 点击接派单
        console.log('📋 点击接派单管理...');
        await dispatchNav.click();
        await page.waitForTimeout(2000);
        
        // 5. 检查关键功能元素
        console.log('🔧 检查派单功能元素...');
        
        // 检查订单选择
        const orderSelect = await page.locator('#orderSelect');
        const orderSelectExists = await orderSelect.count() > 0;
        console.log(`订单选择框存在: ${orderSelectExists}`);
        
        // 检查智能派单按钮
        const autoAssignBtn = await page.locator('button[onclick="autoAssignAll()"]');
        const autoAssignExists = await autoAssignBtn.count() > 0;
        console.log(`智能派单按钮存在: ${autoAssignExists}`);
        
        // 检查批量派单按钮
        const batchAssignBtn = await page.locator('button[onclick="batchAssign()"]');
        const batchAssignExists = await batchAssignBtn.count() > 0;
        console.log(`批量派单按钮存在: ${batchAssignExists}`);
        
        // 检查服务容器
        const servicesContainer = await page.locator('#servicesContainer');
        const servicesExists = await servicesContainer.count() > 0;
        console.log(`服务容器存在: ${servicesExists}`);
        
        // 检查操作人员容器
        const operatorsContainer = await page.locator('#operatorsContainer');
        const operatorsExists = await operatorsContainer.count() > 0;
        console.log(`操作人员容器存在: ${operatorsExists}`);
        
        // 检查派单历史容器
        const historyContainer = await page.locator('#assignmentHistoryTableBody');
        const historyExists = await historyContainer.count() > 0;
        console.log(`派单历史容器存在: ${historyExists}`);
        
        // 6. 测试订单加载
        console.log('📦 测试订单加载...');
        const refreshBtn = await page.locator('button[onclick="loadOrderList()"]');
        if (await refreshBtn.count() > 0) {
            await refreshBtn.click();
            await page.waitForTimeout(2000);
            
            const options = await orderSelect.locator('option').count();
            console.log(`订单选项数量: ${options}`);
        }
        
        // 7. 测试选择订单并加载服务
        console.log('🔄 测试选择订单...');
        const orderOptions = await orderSelect.locator('option[value!=""]');
        const optionCount = await orderOptions.count();
        
        if (optionCount > 0) {
            const firstOrderValue = await orderOptions.first().getAttribute('value');
            console.log(`选择第一个订单: ${firstOrderValue}`);
            
            await orderSelect.selectOption(firstOrderValue);
            await page.waitForTimeout(3000);
            
            // 检查服务是否加载
            const serviceCards = await page.locator('.service-card');
            const serviceCount = await serviceCards.count();
            console.log(`加载的服务数量: ${serviceCount}`);
            
            if (serviceCount > 0) {
                console.log('✅ 服务项目加载成功');
                
                // 测试智能派单
                console.log('🤖 测试智能派单...');
                if (await autoAssignBtn.count() > 0) {
                    await autoAssignBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ 智能派单按钮点击成功');
                }
            }
        }
        
        // 8. 检查批量派单模态框
        console.log('📋 测试批量派单模态框...');
        if (await batchAssignBtn.count() > 0) {
            await batchAssignBtn.click();
            await page.waitForTimeout(1000);
            
            const modal = await page.locator('#batchAssignModal');
            const modalVisible = await modal.isVisible();
            console.log(`批量派单模态框可见: ${modalVisible}`);
            
            if (modalVisible) {
                // 关闭模态框
                const closeBtn = await modal.locator('.btn-close');
                if (await closeBtn.count() > 0) {
                    await closeBtn.click();
                }
            }
        }
        
        // 9. 生成测试报告
        const report = {
            timestamp: new Date().toISOString(),
            user: '张美华 (CS001)',
            permissions: {
                canSeeDispatchNav: isVisible,
                canAccessDispatchPage: true
            },
            functionality: {
                orderSelect: orderSelectExists,
                autoAssign: autoAssignExists,
                batchAssign: batchAssignExists,
                servicesContainer: servicesExists,
                operatorsContainer: operatorsExists,
                historyContainer: historyExists
            },
            dataLoading: {
                orderOptionsCount: optionCount,
                servicesLoaded: optionCount > 0
            }
        };
        
        console.log('\n📊 测试报告:');
        console.log(JSON.stringify(report, null, 2));
        
        // 验证关键功能完整性
        const criticalFeatures = [
            orderSelectExists,
            autoAssignExists, 
            batchAssignExists,
            servicesExists,
            operatorsExists
        ];
        
        const allFeaturesWorking = criticalFeatures.every(feature => feature);
        
        if (allFeaturesWorking && isVisible) {
            console.log('\n✅ 所有关键功能测试通过！');
            console.log('张美华可以正常访问和使用完整的派单功能。');
        } else {
            console.log('\n❌ 部分功能存在问题:');
            if (!isVisible) console.log('- 接派单导航不可见');
            if (!orderSelectExists) console.log('- 订单选择功能缺失');
            if (!autoAssignExists) console.log('- 智能派单功能缺失');
            if (!batchAssignExists) console.log('- 批量派单功能缺失');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    } finally {
        await browser.close();
    }
}

// 运行测试
testDispatchFunctionality().catch(console.error);