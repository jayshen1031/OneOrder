const { chromium } = require('playwright');

(async () => {
  console.log('🚀 开始测试OneOrder接单派单流程...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 访问页面
    console.log('📍 1. 访问OneOrder货代订单管理页面');
    await page.goto('http://localhost:8081/api/freight-order.html', {
      waitUntil: 'networkidle'
    });
    
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    
    // 2. 检查页面基本结构
    console.log('\n📍 2. 检查页面基本结构');
    const navLinks = await page.locator('.nav-link').all();
    console.log(`✅ 找到 ${navLinks.length} 个导航链接`);
    
    // 3. 测试创建订单功能
    console.log('\n📍 3. 测试创建订单功能');
    
    // 查找创建订单按钮或表单
    const createOrderBtn = page.locator('button:has-text("创建订单"), button:has-text("新增订单"), #createOrderBtn');
    const createOrderBtnCount = await createOrderBtn.count();
    console.log(`${createOrderBtnCount > 0 ? '✅' : '❌'} 创建订单按钮: ${createOrderBtnCount > 0 ? '存在' : '不存在'}`);
    
    if (createOrderBtnCount > 0) {
      // 点击创建订单
      await createOrderBtn.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ 点击创建订单按钮');
    }
    
    // 4. 检查订单表单字段
    console.log('\n📍 4. 检查订单表单字段');
    const formFields = [
      { selector: '#orderNo, input[name="orderNo"]', name: '订单号' },
      { selector: '#customerId, select[name="customerId"]', name: '客户ID' },
      { selector: '#businessType, select[name="businessType"]', name: '业务类型' },
      { selector: '#totalAmount, input[name="totalAmount"]', name: '订单金额' },
      { selector: '#currency, select[name="currency"]', name: '币种' },
      { selector: '#portOfLoading, input[name="portOfLoading"]', name: '起运港' },
      { selector: '#portOfDischarge, input[name="portOfDischarge"]', name: '目的港' },
    ];
    
    for (const field of formFields) {
      try {
        const element = page.locator(field.selector);
        const exists = await element.count() > 0;
        console.log(`${exists ? '✅' : '❌'} ${field.name}: ${exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`❌ ${field.name}: 检查失败`);
      }
    }
    
    // 5. 测试内部协议相关功能
    console.log('\n📍 5. 测试内部协议相关功能');
    
    const protocolElements = [
      { selector: '#protocols', name: '内部协议页面' },
      { selector: '#salesDepartment, select[name="salesDepartment"]', name: '销售部门选择' },
      { selector: '#operationDepartment, select[name="operationDepartment"]', name: '操作部门选择' },
      { selector: '#selectedOperationStaff, select[name="operationStaff"]', name: '操作人员选择' },
      { selector: 'button:has-text("匹配协议"), #matchProtocolsBtn', name: '匹配协议按钮' },
      { selector: '#availableProtocols, .available-protocols', name: '可用协议列表' },
    ];
    
    for (const element of protocolElements) {
      try {
        const locator = page.locator(element.selector);
        const exists = await locator.count() > 0;
        console.log(`${exists ? '✅' : '❌'} ${element.name}: ${exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`❌ ${element.name}: 检查失败`);
      }
    }
    
    // 6. 测试服务派单功能
    console.log('\n📍 6. 测试服务派单功能');
    
    const serviceElements = [
      { selector: '#tasks', name: '任务管理页面' },
      { selector: '.service-assignment, #serviceAssignment', name: '服务派单区域' },
      { selector: 'button:has-text("派单"), .assign-service-btn', name: '派单按钮' },
      { selector: '.task-list, #taskList', name: '任务列表' },
      { selector: 'button:has-text("接单"), .accept-task-btn', name: '接单按钮' },
    ];
    
    for (const element of serviceElements) {
      try {
        const locator = page.locator(element.selector);
        const exists = await locator.count() > 0;
        console.log(`${exists ? '✅' : '❌'} ${element.name}: ${exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`❌ ${element.name}: 检查失败`);
      }
    }
    
    // 7. 测试API端点
    console.log('\n📍 7. 测试后端API端点');
    
    const apiTests = [
      { url: '/api/clearing/departments', name: '部门列表API' },
      { url: '/api/clearing/staff', name: '员工列表API' },
      { url: '/api/clearing/protocols', name: '协议列表API' },
    ];
    
    for (const api of apiTests) {
      try {
        const response = await page.request.get(`http://localhost:8081${api.url}`);
        const status = response.status();
        console.log(`${status === 200 ? '✅' : '❌'} ${api.name}: HTTP ${status}`);
        
        if (status === 200) {
          const data = await response.json();
          console.log(`   📊 返回数据: ${Array.isArray(data) ? data.length + ' 条记录' : '对象数据'}`);
        }
      } catch (error) {
        console.log(`❌ ${api.name}: 请求失败 - ${error.message}`);
      }
    }
    
    // 8. 模拟接单派单流程
    console.log('\n📍 8. 模拟接单派单流程');
    
    try {
      // 尝试模拟创建订单
      console.log('🔄 尝试模拟订单创建流程...');
      
      // 填写基本订单信息（如果表单存在）
      const orderNoInput = page.locator('#orderNo, input[name="orderNo"]');
      if (await orderNoInput.count() > 0) {
        await orderNoInput.fill(`TEST-${Date.now()}`);
        console.log('✅ 填写订单号');
      }
      
      // 选择业务类型
      const businessTypeSelect = page.locator('#businessType, select[name="businessType"]');
      if (await businessTypeSelect.count() > 0) {
        await businessTypeSelect.selectOption('SEA_EXPORT');
        console.log('✅ 选择业务类型: 海运出口');
      }
      
      // 填写金额
      const amountInput = page.locator('#totalAmount, input[name="totalAmount"]');
      if (await amountInput.count() > 0) {
        await amountInput.fill('15000');
        console.log('✅ 填写订单金额');
      }
      
      // 尝试提交订单（如果提交按钮存在）
      const submitBtn = page.locator('button:has-text("提交"), button:has-text("创建"), button[type="submit"]');
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click();
        console.log('✅ 点击提交按钮');
        await page.waitForTimeout(2000);
      }
      
    } catch (error) {
      console.log(`⚠️  模拟流程遇到问题: ${error.message}`);
    }
    
    // 9. 截图记录
    await page.screenshot({ 
      path: '/Users/jay/Documents/baidu/projects/OneOrder/test-order-dispatch.png',
      fullPage: true 
    });
    console.log('\n📸 测试截图已保存: test-order-dispatch.png');
    
    // 10. 检查页面JavaScript函数
    console.log('\n📍 10. 检查JavaScript内部协议函数');
    const jsCheck = await page.evaluate(() => {
      const funcs = [
        'createOrder',
        'loadAllProtocols',
        'matchProtocols', 
        'assignService',
        'confirmProtocol',
        'loadMyTasks',
        'acceptTask',
        'loadOperationStaff'
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
    
    // 11. 总结测试结果
    console.log('\n📍 11. 测试总结');
    const summary = {
      基本功能: '页面可访问，基础框架正常',
      订单管理: createOrderBtn.count > 0 ? '✅ 创建功能存在' : '❌ 创建功能缺失',
      内部协议: Object.values(jsCheck).filter(v => v).length > 4 ? '✅ 协议功能完整' : '❌ 协议功能不完整',
      API接口: '需要进一步验证',
      前端集成: '部分功能可能未部署'
    };
    
    console.log('\n🎯 测试结果总结:');
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\n📍 保持页面打开20秒供手动观察...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n🎉 接单派单流程测试完成！');
  }
})();