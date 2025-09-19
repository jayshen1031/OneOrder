const { chromium } = require('playwright');

(async () => {
  console.log('🚀 开始简化测试OneOrder内部协议功能...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 访问页面
    console.log('📍 访问OneOrder主页面');
    await page.goto('http://localhost:8081/api/freight-order.html');
    await page.waitForLoadState('networkidle');
    
    // 2. 检查页面基本结构
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    
    // 3. 获取页面源代码检查是否包含新功能
    const content = await page.content();
    const hasProtocols = content.includes('protocols') || content.includes('内部协议');
    const hasTasks = content.includes('tasks') || content.includes('任务管理');
    
    console.log(`${hasProtocols ? '✅' : '❌'} 页面包含协议功能: ${hasProtocols}`);
    console.log(`${hasTasks ? '✅' : '❌'} 页面包含任务功能: ${hasTasks}`);
    
    // 4. 检查所有导航链接
    console.log('📍 检查导航结构');
    const navLinks = await page.locator('.nav-link').all();
    console.log(`✅ 找到 ${navLinks.length} 个导航链接`);
    
    for (let i = 0; i < navLinks.length; i++) {
      try {
        const text = await navLinks[i].textContent();
        const href = await navLinks[i].getAttribute('href');
        console.log(`  - 导航 ${i + 1}: "${text?.trim()}" -> ${href}`);
      } catch (error) {
        console.log(`  - 导航 ${i + 1}: 读取失败`);
      }
    }
    
    // 5. 尝试点击协议相关导航
    console.log('📍 尝试访问协议功能');
    try {
      // 查找包含"协议"的链接
      const protocolLinks = await page.locator('a').all();
      let protocolFound = false;
      
      for (const link of protocolLinks) {
        const text = await link.textContent();
        if (text && (text.includes('协议') || text.includes('protocols'))) {
          console.log(`✅ 找到协议相关链接: "${text.trim()}"`);
          await link.click();
          await page.waitForTimeout(2000);
          protocolFound = true;
          break;
        }
      }
      
      if (!protocolFound) {
        console.log('⚠️  未找到协议相关导航链接');
      }
    } catch (error) {
      console.log('⚠️  访问协议功能时出错:', error.message);
    }
    
    // 6. 检查JavaScript功能
    console.log('📍 检查JavaScript内部协议函数');
    const jsCheck = await page.evaluate(() => {
      const funcs = [
        'loadAllProtocols',
        'matchProtocols', 
        'loadOperationStaff',
        'loadMyTasks'
      ];
      
      const results = {};
      funcs.forEach(func => {
        results[func] = typeof window[func] === 'function';
      });
      
      return results;
    });
    
    console.log('JavaScript函数检查:');
    Object.entries(jsCheck).forEach(([func, exists]) => {
      console.log(`${exists ? '✅' : '❌'} ${func}: ${exists ? '已定义' : '未定义'}`);
    });
    
    // 7. 检查页面中是否有特定的元素ID
    console.log('📍 检查关键页面元素');
    const elements = [
      '#protocols',
      '#tasks', 
      '#salesDepartment',
      '#operationDepartment',
      '#selectedOperationStaff'
    ];
    
    for (const selector of elements) {
      try {
        const element = page.locator(selector);
        const exists = await element.count() > 0;
        console.log(`${exists ? '✅' : '❌'} 元素 ${selector}: ${exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`❌ 元素 ${selector}: 检查失败`);
      }
    }
    
    // 8. 尝试手动执行JavaScript函数
    console.log('📍 尝试手动调用协议函数');
    try {
      await page.evaluate(() => {
        if (typeof window.loadAllProtocols === 'function') {
          console.log('调用 loadAllProtocols 函数');
          window.loadAllProtocols();
        }
      });
      console.log('✅ JavaScript函数调用成功');
    } catch (error) {
      console.log('⚠️  JavaScript函数调用失败:', error.message);
    }
    
    // 9. 保存截图
    await page.screenshot({ 
      path: '/Users/jay/Documents/baidu/projects/OneOrder/simple-test-result.png',
      fullPage: true 
    });
    console.log('✅ 测试截图已保存');
    
    // 10. 等待观察
    console.log('📍 保持页面打开15秒供观察...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ 测试错误:', error.message);
  } finally {
    await browser.close();
    console.log('🎉 简化测试完成！');
  }
})();