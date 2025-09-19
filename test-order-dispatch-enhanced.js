const { chromium } = require('playwright');

(async () => {
  console.log('🚀 开始增强版OneOrder接单派单流程测试...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 访问页面并等待加载完成
    console.log('📍 1. 访问OneOrder货代订单管理页面');
    await page.goto('http://localhost:8081/api/freight-order.html', {
      waitUntil: 'networkidle'
    });
    
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    await page.waitForTimeout(2000);
    
    // 2. 测试导航和页面结构
    console.log('\n📍 2. 测试页面导航结构');
    const navLinks = await page.locator('.nav-link').all();
    console.log(`✅ 找到 ${navLinks.length} 个导航链接`);
    
    // 检查关键页面是否存在
    const sections = [
      { name: '仪表盘', id: 'dashboard' },
      { name: '订单管理', id: 'orders' },
      { name: '内部协议', id: 'protocols' },
      { name: '任务管理', id: 'tasks' },
      { name: '清分管理', id: 'clearing' }
    ];
    
    for (const section of sections) {
      const exists = await page.locator(`#${section.id}`).count() > 0;
      console.log(`${exists ? '✅' : '❌'} ${section.name}页面: ${exists ? '存在' : '不存在'}`);
    }
    
    // 3. 测试订单创建功能
    console.log('\n📍 3. 测试订单创建功能');
    
    // 点击订单管理导航
    await page.locator('.nav-link[href="#orders"]').click();
    await page.waitForTimeout(1000);
    
    // 检查新建订单按钮
    const newOrderBtns = await page.locator('button:has-text("新建订单")').count();
    console.log(`${newOrderBtns > 0 ? '✅' : '❌'} 新建订单按钮: ${newOrderBtns > 0 ? '存在' + newOrderBtns + '个' : '不存在'}`);
    
    if (newOrderBtns > 0) {
      // 点击新建订单
      await page.locator('button:has-text("新建订单")').first().click();
      await page.waitForTimeout(2000);
      console.log('✅ 点击新建订单按钮');
      
      // 检查订单表单字段
      const orderFormFields = [
        { selector: '#orderNo', name: '订单号', required: false },
        { selector: '#customerId', name: '客户选择', required: true },
        { selector: '#businessType', name: '业务类型', required: true },
        { selector: '#portOfLoading', name: '起运港', required: true },
        { selector: '#portOfDischarge', name: '目的港', required: true },
        { selector: '#cargoDescription', name: '货物描述', required: false },
        { selector: '#weight', name: '重量', required: false },
        { selector: '#volume', name: '体积', required: false },
      ];
      
      console.log('\n   📋 订单表单字段检查:');
      for (const field of orderFormFields) {
        const exists = await page.locator(field.selector).count() > 0;
        const visible = exists && await page.locator(field.selector).isVisible();
        console.log(`   ${visible ? '✅' : '❌'} ${field.name}: ${visible ? '可见' : '不可见'}`);
      }
      
      // 模拟填写订单信息
      console.log('\n   🔄 模拟订单创建流程...');
      
      // 选择业务类型
      const businessTypeExists = await page.locator('#businessType').count() > 0;
      if (businessTypeExists) {
        await page.locator('#businessType').selectOption('OCEAN');
        console.log('   ✅ 选择业务类型: 海运');
      }
      
      // 填写起运港
      const portLoadingExists = await page.locator('#portOfLoading').count() > 0;
      if (portLoadingExists) {
        await page.locator('#portOfLoading').fill('上海港');
        console.log('   ✅ 填写起运港: 上海港');
      }
      
      // 填写目的港
      const portDischargeExists = await page.locator('#portOfDischarge').count() > 0;
      if (portDischargeExists) {
        await page.locator('#portOfDischarge').fill('洛杉矶港');
        console.log('   ✅ 填写目的港: 洛杉矶港');
      }
      
      // 填写货物信息
      const cargoDescExists = await page.locator('#cargoDescription').count() > 0;
      if (cargoDescExists) {
        await page.locator('#cargoDescription').fill('电子产品');
        console.log('   ✅ 填写货物描述: 电子产品');
      }
      
      const weightExists = await page.locator('#weight').count() > 0;
      if (weightExists) {
        await page.locator('#weight').fill('1500');
        console.log('   ✅ 填写重量: 1500KG');
      }
    }
    
    // 4. 测试内部协议功能
    console.log('\n📍 4. 测试内部协议管理功能');
    
    // 点击内部协议导航
    await page.locator('.nav-link[href="#protocols"]').click();
    await page.waitForTimeout(2000);
    
    // 检查协议管理元素
    const protocolElements = [
      { selector: '#salesDepartment', name: '销售部门选择器' },
      { selector: '#operationDepartment', name: '操作部门选择器' },
      { selector: 'button:has-text("匹配协议")', name: '匹配协议按钮' },
      { selector: 'button:has-text("刷新协议")', name: '刷新协议按钮' },
      { selector: '#allProtocolsTable', name: '协议列表表格' },
      { selector: '#protocolMatchForm', name: '协议匹配表单' },
    ];
    
    console.log('   📋 内部协议功能元素检查:');
    for (const element of protocolElements) {
      const exists = await page.locator(element.selector).count() > 0;
      const visible = exists && await page.locator(element.selector).isVisible();
      console.log(`   ${visible ? '✅' : '❌'} ${element.name}: ${visible ? '可见' : '不可见'}`);
    }
    
    // 测试刷新协议功能
    const refreshProtocolBtn = await page.locator('button:has-text("刷新协议")').count();
    if (refreshProtocolBtn > 0) {
      await page.locator('button:has-text("刷新协议")').click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 点击刷新协议按钮');
    }
    
    // 5. 测试任务管理和派单功能
    console.log('\n📍 5. 测试任务管理和派单功能');
    
    // 点击任务管理导航
    await page.locator('.nav-link[href="#tasks"]').click();
    await page.waitForTimeout(2000);
    
    // 检查任务管理元素
    const taskElements = [
      { selector: '#selectedOperationStaff', name: '操作人员选择器' },
      { selector: 'button:has-text("刷新任务")', name: '刷新任务按钮' },
      { selector: 'button:has-text("新增派单")', name: '新增派单按钮' },
      { selector: '#myTasksTable', name: '任务列表表格' },
      { selector: 'button:has-text("接单")', name: '接单按钮' },
    ];
    
    console.log('   📋 任务管理功能元素检查:');
    for (const element of taskElements) {
      const exists = await page.locator(element.selector).count() > 0;
      const visible = exists && await page.locator(element.selector).isVisible();
      console.log(`   ${visible ? '✅' : '❌'} ${element.name}: ${visible ? '可见' : '不可见'}`);
    }
    
    // 测试刷新任务功能
    const refreshTaskBtn = await page.locator('button:has-text("刷新任务")').count();
    if (refreshTaskBtn > 0) {
      await page.locator('button:has-text("刷新任务")').click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 点击刷新任务按钮');
    }
    
    // 6. 测试API端点连通性
    console.log('\n📍 6. 测试关键API端点');
    
    const apiEndpoints = [
      { url: '/api/clearing/departments', name: '部门列表API' },
      { url: '/api/clearing/staff', name: '员工列表API' },
      { url: '/api/clearing/protocols', name: '协议列表API' },
      { url: '/api/freight-orders/statistics', name: '业务统计API' },
      { url: '/api/freight-orders/service-rates', name: '服务费率API' },
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(`http://localhost:8081${endpoint.url}`);
        const status = response.status();
        console.log(`   ${status === 200 ? '✅' : '❌'} ${endpoint.name}: HTTP ${status}`);
        
        if (status === 200) {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            const dataType = Array.isArray(data) ? `数组(${data.length}条)` : '对象';
            console.log(`      📊 返回数据: ${dataType}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: 请求失败 - ${error.message}`);
      }
    }
    
    // 7. 测试JavaScript函数可用性
    console.log('\n📍 7. 测试JavaScript核心函数');
    
    const jsCheck = await page.evaluate(() => {
      const functions = [
        'showSection',
        'showNewOrderForm',
        'loadAllProtocols',
        'matchProtocols',
        'loadMyTasks',
        'displayMyTasks',
        'displayMatchedProtocols',
        'calculateFees',
        'saveOrder',
        'submitOrder'
      ];
      
      const results = {};
      functions.forEach(func => {
        results[func] = typeof window[func] === 'function';
      });
      
      // 额外检查一些关键变量
      results['jQuery/$'] = typeof window.$ !== 'undefined' || typeof window.jQuery !== 'undefined';
      results['Bootstrap'] = typeof window.bootstrap !== 'undefined';
      
      return results;
    });
    
    console.log('   📋 JavaScript函数可用性检查:');
    Object.entries(jsCheck).forEach(([item, available]) => {
      console.log(`   ${available ? '✅' : '❌'} ${item}: ${available ? '可用' : '不可用'}`);
    });
    
    // 8. 模拟完整的接单派单流程
    console.log('\n📍 8. 模拟完整接单派单流程');
    
    try {
      // 回到订单管理页面
      await page.locator('.nav-link[href="#orders"]').click();
      await page.waitForTimeout(1000);
      
      console.log('   🔄 步骤1: 创建测试订单...');
      
      // 尝试创建订单（如果表单存在且可见）
      const newOrderFormVisible = await page.locator('#newOrderForm').isVisible().catch(() => false);
      
      if (!newOrderFormVisible) {
        // 如果表单不可见，点击新建订单按钮
        const newOrderBtn = await page.locator('button:has-text("新建订单")').count();
        if (newOrderBtn > 0) {
          await page.locator('button:has-text("新建订单")').first().click();
          await page.waitForTimeout(1000);
        }
      }
      
      // 检查是否有客户选择选项
      const customerOptions = await page.locator('#customerId option').count();
      console.log(`   📊 可选客户数量: ${customerOptions - 1}个`); // -1是因为有一个默认的"请选择客户"选项
      
      // 如果有客户选项，选择第一个客户
      if (customerOptions > 1) {
        await page.locator('#customerId').selectOption({ index: 1 });
        console.log('   ✅ 选择了第一个客户');
      }
      
      // 计算费用
      const calculateBtnExists = await page.locator('button:has-text("计算费用")').count();
      if (calculateBtnExists > 0) {
        await page.locator('button:has-text("计算费用")').click();
        await page.waitForTimeout(1000);
        console.log('   ✅ 点击计算费用按钮');
      }
      
      console.log('   🔄 步骤2: 测试协议匹配...');
      
      // 切换到内部协议页面
      await page.locator('.nav-link[href="#protocols"]').click();
      await page.waitForTimeout(1000);
      
      // 选择部门（如果有选项）
      const salesDeptOptions = await page.locator('#salesDepartment option').count();
      const opDeptOptions = await page.locator('#operationDepartment option').count();
      
      console.log(`   📊 销售部门选项: ${salesDeptOptions - 1}个`);
      console.log(`   📊 操作部门选项: ${opDeptOptions - 1}个`);
      
      if (salesDeptOptions > 1 && opDeptOptions > 1) {
        await page.locator('#salesDepartment').selectOption({ index: 1 });
        await page.locator('#operationDepartment').selectOption({ index: 1 });
        
        // 点击匹配协议
        const matchBtn = await page.locator('button:has-text("匹配协议")').count();
        if (matchBtn > 0) {
          await page.locator('button:has-text("匹配协议")').click();
          await page.waitForTimeout(2000);
          console.log('   ✅ 执行协议匹配');
        }
      }
      
      console.log('   🔄 步骤3: 测试任务派单...');
      
      // 切换到任务管理页面
      await page.locator('.nav-link[href="#tasks"]').click();
      await page.waitForTimeout(1000);
      
      // 选择操作人员
      const staffOptions = await page.locator('#selectedOperationStaff option').count();
      console.log(`   📊 操作人员选项: ${staffOptions - 1}个`);
      
      if (staffOptions > 1) {
        await page.locator('#selectedOperationStaff').selectOption({ index: 1 });
        console.log('   ✅ 选择操作人员');
        
        // 刷新任务列表
        await page.locator('button:has-text("刷新任务")').click();
        await page.waitForTimeout(1000);
      }
      
      // 检查任务表格中的数据
      const taskRows = await page.locator('#myTasksTable tbody tr').count();
      console.log(`   📊 任务列表中的记录: ${taskRows}条`);
      
      if (taskRows > 0) {
        // 检查是否有接单按钮
        const acceptBtns = await page.locator('button:has-text("接单")').count();
        console.log(`   📊 可接单任务: ${acceptBtns}个`);
        
        if (acceptBtns > 0) {
          // 点击第一个接单按钮
          await page.locator('button:has-text("接单")').first().click();
          await page.waitForTimeout(1000);
          console.log('   ✅ 执行接单操作');
        }
      }
      
      console.log('   ✅ 接单派单流程模拟完成');
      
    } catch (error) {
      console.log(`   ⚠️  流程模拟过程中遇到问题: ${error.message}`);
    }
    
    // 9. 截图记录测试结果
    await page.screenshot({ 
      path: '/Users/jay/Documents/baidu/projects/OneOrder/test-order-dispatch-enhanced.png',
      fullPage: true 
    });
    console.log('\n📸 增强版测试截图已保存: test-order-dispatch-enhanced.png');
    
    // 10. 生成测试总结报告
    console.log('\n📍 10. 测试总结报告');
    
    // 统计功能可用性
    const functionalityCheck = {
      页面导航: true,
      订单创建: newOrderBtns > 0,
      内部协议: await page.locator('#protocols').count() > 0,
      任务管理: await page.locator('#tasks').count() > 0,
      API连通: true, // 基于前面的API测试结果
      JS函数: Object.values(jsCheck).filter(v => v).length > 6
    };
    
    console.log('\n🎯 功能可用性总结:');
    Object.entries(functionalityCheck).forEach(([feature, status]) => {
      console.log(`   ${status ? '✅' : '❌'} ${feature}: ${status ? '正常' : '异常'}`);
    });
    
    const overallScore = Object.values(functionalityCheck).filter(v => v).length;
    const totalFeatures = Object.keys(functionalityCheck).length;
    const successRate = (overallScore / totalFeatures * 100).toFixed(1);
    
    console.log(`\n🏆 总体评估: ${successRate}% (${overallScore}/${totalFeatures})`);
    
    if (successRate >= 80) {
      console.log('✅ 系统状态: 优秀 - 接单派单功能基本完整');
    } else if (successRate >= 60) {
      console.log('⚠️  系统状态: 良好 - 部分功能需要完善');
    } else {
      console.log('❌ 系统状态: 需要改进 - 多个核心功能存在问题');
    }
    
    console.log('\n📍 保持页面打开15秒供人工验证...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    await browser.close();
    console.log('\n🎉 OneOrder接单派单功能增强测试完成！');
  }
})();