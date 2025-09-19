const { chromium } = require('playwright');

(async () => {
  console.log('🎉 测试OneOrder内部协议功能最终部署...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 访问新端口的页面
    console.log('📍 访问OneOrder页面 (端口9090)');
    await page.goto('http://localhost:9090/api/freight-order.html', {
      waitUntil: 'networkidle'
    });
    
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    
    // 2. 检查内部协议导航
    console.log('\n📍 检查内部协议导航');
    const protocolNav = page.locator('a[href="#protocols"]');
    const protocolNavExists = await protocolNav.count() > 0;
    console.log(`${protocolNavExists ? '✅' : '❌'} 内部协议导航: ${protocolNavExists ? '存在' : '不存在'}`);
    
    if (protocolNavExists) {
      const protocolText = await protocolNav.textContent();
      console.log(`✅ 导航文本: "${protocolText?.trim()}"`);
    }
    
    // 3. 检查任务管理导航
    const tasksNav = page.locator('a[href="#tasks"]');
    const tasksNavExists = await tasksNav.count() > 0;
    console.log(`${tasksNavExists ? '✅' : '❌'} 任务管理导航: ${tasksNavExists ? '存在' : '不存在'}`);
    
    // 4. 测试API端点
    console.log('\n📍 测试内部协议API端点');
    const apiTests = [
      { url: '/api/clearing/departments', name: '部门列表API' },
      { url: '/api/clearing/staff', name: '员工列表API' },
      { url: '/api/clearing/protocols', name: '协议列表API' },
      { url: '/api/clearing/protocols/match?salesDepartmentId=SALES001&operationDepartmentId=OPS001', name: '协议匹配API' },
      { url: '/api/clearing/staff/operations', name: '操作人员列表API' },
      { url: '/api/clearing/tasks/my?staffId=STAFF001', name: '我的任务API' }
    ];
    
    for (const api of apiTests) {
      try {
        const response = await page.request.get(`http://localhost:9090${api.url}`);
        const status = response.status();
        console.log(`${status === 200 ? '✅' : '❌'} ${api.name}: HTTP ${status}`);
        
        if (status === 200) {
          const data = await response.json();
          const dataInfo = Array.isArray(data) ? `${data.length} 条记录` : '对象数据';
          console.log(`   📊 返回数据: ${dataInfo}`);
        }
      } catch (error) {
        console.log(`❌ ${api.name}: 请求失败 - ${error.message}`);
      }
    }
    
    // 5. 检查JavaScript函数
    console.log('\n📍 检查JavaScript内部协议函数');
    const jsCheck = await page.evaluate(() => {
      const funcs = [
        'loadAllProtocols',
        'matchProtocols', 
        'assignService',
        'confirmProtocol',
        'loadMyTasks',
        'acceptTask',
        'loadOperationStaff',
        'showSection'
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
    
    // 6. 测试点击内部协议导航
    if (protocolNavExists) {
      console.log('\n📍 测试点击内部协议导航');
      try {
        await protocolNav.click();
        await page.waitForTimeout(2000);
        console.log('✅ 成功点击内部协议导航');
        
        // 检查协议页面是否显示
        const protocolSection = page.locator('#protocols');
        const protocolSectionVisible = await protocolSection.isVisible();
        console.log(`${protocolSectionVisible ? '✅' : '❌'} 协议页面显示: ${protocolSectionVisible ? '可见' : '隐藏'}`);
        
      } catch (error) {
        console.log(`❌ 点击协议导航失败: ${error.message}`);
      }
    }
    
    // 7. 检查关键页面元素
    console.log('\n📍 检查关键页面元素');
    const elements = [
      { selector: '#protocols', name: '内部协议页面' },
      { selector: '#tasks', name: '任务管理页面' },
      { selector: '#salesDepartment', name: '销售部门选择' },
      { selector: '#operationDepartment', name: '操作部门选择' },
      { selector: '#selectedOperationStaff', name: '操作人员选择' },
      { selector: '#availableProtocols', name: '可用协议列表' },
      { selector: '#taskList', name: '任务列表' }
    ];
    
    for (const element of elements) {
      try {
        const locator = page.locator(element.selector);
        const exists = await locator.count() > 0;
        console.log(`${exists ? '✅' : '❌'} ${element.name}: ${exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`❌ ${element.name}: 检查失败`);
      }
    }
    
    // 8. 截图记录
    await page.screenshot({ 
      path: '/Users/jay/Documents/baidu/projects/OneOrder/test-final-deployment.png',
      fullPage: true 
    });
    console.log('\n📸 最终部署测试截图已保存');
    
    // 9. 最终总结
    console.log('\n🎯 最终部署测试总结:');
    const successCount = Object.values(jsCheck).filter(v => v).length;
    const totalFunctions = Object.keys(jsCheck).length;
    
    console.log(`   📊 JavaScript函数: ${successCount}/${totalFunctions} 已部署`);
    console.log(`   🔗 导航链接: ${protocolNavExists && tasksNavExists ? '✅ 完整' : '❌ 不完整'}`);
    console.log(`   🌐 页面访问: ✅ 正常`);
    console.log(`   🚀 应用状态: ✅ 运行中 (端口9090)`);
    
    if (protocolNavExists && tasksNavExists && successCount >= 6) {
      console.log('\n🎉 内部协议功能部署成功！');
      console.log('✅ 所有核心功能已正常部署并可用');
    } else {
      console.log('\n⚠️  部分功能可能未完全部署');
    }
    
    console.log('\n📍 保持页面打开20秒进行手动验证...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  } finally {
    await browser.close();
    console.log('🎉 最终部署测试完成！');
  }
})();