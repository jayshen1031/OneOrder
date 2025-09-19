const { chromium } = require('playwright');

async function testOrderNumberDisplay() {
    console.log('🚀 启动Playwright测试...');
    
    const browser = await chromium.launch({ 
        headless: false,  // 显示浏览器窗口
        slowMo: 1000      // 每个操作延迟1秒，方便观察
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 测试订单管理页面
        console.log('📋 测试订单管理页面...');
        await page.goto('http://localhost:8081/api/freight-order.html');
        
        // 等待页面加载完成
        await page.waitForTimeout(3000);
        
        // 检查仪表盘中的最近订单表格
        console.log('🔍 检查仪表盘最近订单...');
        await page.waitForSelector('#recentOrdersTable', { timeout: 10000 });
        
        // 获取最近订单表格中的订单号
        const recentOrderNumbers = await page.$$eval('#recentOrdersTable tr td:first-child', 
            cells => cells.map(cell => cell.textContent.trim())
        );
        
        console.log('最近订单号:', recentOrderNumbers);
        
        // 检查订单号格式
        const hasORDFormat = recentOrderNumbers.some(orderNo => 
            orderNo.match(/^ORD\d+$|^ORD-\d{4}-\d+$/)
        );
        
        if (hasORDFormat) {
            console.log('❌ 仪表盘最近订单仍显示ORD格式:', recentOrderNumbers);
        } else {
            console.log('✅ 仪表盘最近订单号格式正确:', recentOrderNumbers);
        }
        
        // 切换到订单管理页面
        console.log('📊 切换到订单列表...');
        await page.click('a[href="#orders"]');
        await page.waitForTimeout(2000);
        
        // 检查订单列表表格
        await page.waitForSelector('#ordersTable', { timeout: 10000 });
        
        const orderListNumbers = await page.$$eval('#ordersTable tr td:first-child', 
            cells => cells.map(cell => cell.textContent.trim())
        );
        
        console.log('订单列表订单号:', orderListNumbers);
        
        const listHasORDFormat = orderListNumbers.some(orderNo => 
            orderNo.match(/^ORD\d+$|^ORD-\d{4}-\d+$/)
        );
        
        if (listHasORDFormat) {
            console.log('❌ 订单列表仍显示ORD格式:', orderListNumbers);
        } else {
            console.log('✅ 订单列表订单号格式正确:', orderListNumbers);
        }
        
        // 切换到任务管理页面检查
        console.log('📋 检查任务管理部分...');
        await page.click('a[href="#tasks"]');
        await page.waitForTimeout(2000);
        
        // 选择操作人员以加载任务
        const staffSelect = await page.$('#selectedOperationStaff');
        if (staffSelect) {
            console.log('🔄 加载操作人员...');
            await page.click('button[onclick="loadOperationStaff()"]');
            await page.waitForTimeout(1000);
            
            // 选择第一个操作人员
            await page.selectOption('#selectedOperationStaff', { index: 1 });
            await page.waitForTimeout(1000);
            
            // 加载任务
            await page.click('button[onclick="loadMyTasks()"]');
            await page.waitForTimeout(2000);
            
            // 检查任务表格中的订单号
            const taskOrderNumbers = await page.$$eval('#myTasksTable tr td:first-child', 
                cells => cells.map(cell => cell.textContent.trim())
            );
            
            console.log('任务管理订单号:', taskOrderNumbers);
            
            const taskHasORDFormat = taskOrderNumbers.some(orderNo => 
                orderNo.match(/^ORD\d+$|^ORD-\d{4}-\d+$/)
            );
            
            if (taskHasORDFormat) {
                console.log('❌ 任务管理仍显示ORD格式:', taskOrderNumbers);
            } else {
                console.log('✅ 任务管理订单号格式正确:', taskOrderNumbers);
            }
        }
        
        // 测试接派单页面
        console.log('🔄 测试接派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html');
        await page.waitForTimeout(3000);
        
        // 检查订单选择下拉框
        console.log('📋 检查订单选择下拉框...');
        await page.click('button[onclick="loadOrderList()"]');
        await page.waitForTimeout(2000);
        
        const selectOptions = await page.$$eval('#orderSelect option', 
            options => options.map(option => option.textContent.trim()).filter(text => text && text !== '请选择订单')
        );
        
        console.log('接派单页面订单选项:', selectOptions);
        
        const selectHasORDFormat = selectOptions.some(option => 
            option.match(/^ORD\d+/)
        );
        
        if (selectHasORDFormat) {
            console.log('❌ 接派单页面仍显示ORD格式:', selectOptions);
        } else {
            console.log('✅ 接派单页面订单号格式正确:', selectOptions);
        }
        
        // 总结测试结果
        console.log('\n📊 测试总结:');
        console.log('==================');
        
        const allPassed = !hasORDFormat && !listHasORDFormat && !selectHasORDFormat;
        
        if (allPassed) {
            console.log('🎉 所有测试通过！订单号显示已修复');
        } else {
            console.log('⚠️  部分测试失败，仍有ORD格式订单号');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    } finally {
        await browser.close();
    }
}

// 运行测试
testOrderNumberDisplay().catch(console.error);