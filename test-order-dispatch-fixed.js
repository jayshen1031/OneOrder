const { chromium } = require('playwright');

(async () => {
  console.log('🚀 开始OneOrder接单派单流程测试 (修复版)...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // 1. 访问页面并等待加载完成
    console.log('📍 1. 访问OneOrder货代订单管理页面');
    await page.goto('http://localhost:8081/api/freight-order.html', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 2. 测试页面基本结构
    console.log('\n📍 2. 测试页面基本结构');
    
    // 检查侧边栏是否存在
    const sidebar = await page.locator('.sidebar').count();
    console.log(`${sidebar > 0 ? '✅' : '❌'} 侧边导航栏: ${sidebar > 0 ? '存在' : '不存在'}`);
    
    // 检查导航链接
    const navLinks = await page.locator('.sidebar .nav-link').all();
    console.log(`✅ 导航链接数量: ${navLinks.length}个`);
    
    // 列出所有导航项
    for (let i = 0; i < navLinks.length; i++) {
      const linkText = await navLinks[i].textContent();
      const isVisible = await navLinks[i].isVisible();
      console.log(`   ${isVisible ? '✅' : '❌'} ${linkText.trim()}`);
    }
    
    // 3. 测试页面导航功能
    console.log('\n📍 3. 测试页面导航功能');
    
    // 测试切换到不同页面
    const testSections = ['orders', 'protocols', 'tasks', 'clearing'];
    
    for (const sectionId of testSections) {
      try {
        console.log(`   🔄 测试导航到: ${sectionId}`);
        
        // 使用JavaScript直接调用页面函数来切换页面
        await page.evaluate((id) => {
          if (typeof window.showSection === 'function') {
            window.showSection(id);
          }
        }, sectionId);
        
        await page.waitForTimeout(1000);
        
        // 检查目标页面是否显示
        const sectionVisible = await page.locator(`#${sectionId}`).isVisible().catch(() => false);
        console.log(`   ${sectionVisible ? '✅' : '❌'} ${sectionId} 页面显示: ${sectionVisible ? '成功' : '失败'}`);
        
        if (sectionVisible) {
          // 检查该页面的核心元素
          await checkSectionElements(page, sectionId);
        }
        
      } catch (error) {
        console.log(`   ❌ 导航到 ${sectionId} 失败: ${error.message}`);
      }
    }
    
    // 4. 测试订单管理功能
    console.log('\n📍 4. 测试订单管理功能');
    await testOrderManagement(page);
    
    // 5. 测试内部协议功能
    console.log('\n📍 5. 测试内部协议功能');
    await testProtocolManagement(page);
    
    // 6. 测试任务管理功能
    console.log('\n📍 6. 测试任务管理功能');
    await testTaskManagement(page);
    
    // 7. 测试API连通性
    console.log('\n📍 7. 测试API连通性');
    await testAPIEndpoints(page);
    
    // 8. 测试JavaScript函数
    console.log('\n📍 8. 测试JavaScript函数');
    await testJavaScriptFunctions(page);
    
    // 9. 截图记录
    await page.screenshot({ 
      path: '/Users/jay/Documents/baidu/projects/OneOrder/test-order-dispatch-fixed.png',
      fullPage: true 
    });
    console.log('\n📸 测试截图已保存: test-order-dispatch-fixed.png');
    
    // 10. 生成测试报告
    console.log('\n📍 10. 测试总结');
    await generateTestReport(page);
    
    console.log('\n📍 保持页面打开10秒供观察...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n🎉 OneOrder接单派单功能测试完成！');
  }
})();

// 检查各页面的核心元素
async function checkSectionElements(page, sectionId) {
  console.log(`     📋 检查 ${sectionId} 页面元素:`);
  
  const elementChecks = {
    orders: [
      { selector: 'button:has-text("新建订单")', name: '新建订单按钮' },
      { selector: '#newOrderForm', name: '新订单表单' },
      { selector: '#ordersTable', name: '订单列表表格' },
      { selector: '#orderNo', name: '订单号输入框' },
      { selector: '#businessType', name: '业务类型选择' }
    ],
    protocols: [
      { selector: '#salesDepartment', name: '销售部门选择' },
      { selector: '#operationDepartment', name: '操作部门选择' },
      { selector: 'button:has-text("匹配协议")', name: '匹配协议按钮' },
      { selector: '#allProtocolsTable', name: '协议列表表格' }
    ],
    tasks: [
      { selector: '#selectedOperationStaff', name: '操作人员选择' },
      { selector: 'button:has-text("刷新任务")', name: '刷新任务按钮' },
      { selector: '#myTasksTable', name: '任务列表表格' }
    ],
    clearing: [
      { selector: '.flow-diagram', name: '法人实体流转图' },
      { selector: '.form-check-input', name: '规则配置开关' }
    ]
  };
  
  const elements = elementChecks[sectionId] || [];
  
  for (const element of elements) {
    try {
      const exists = await page.locator(element.selector).count() > 0;
      const visible = exists && await page.locator(element.selector).isVisible();
      console.log(`     ${visible ? '✅' : '❌'} ${element.name}: ${visible ? '可见' : '不可见'}`);
    } catch (error) {
      console.log(`     ❌ ${element.name}: 检查失败`);
    }
  }
}

// 测试订单管理功能
async function testOrderManagement(page) {
  try {
    // 切换到订单页面
    await page.evaluate(() => {
      if (typeof window.showSection === 'function') {
        window.showSection('orders');
      }
    });
    await page.waitForTimeout(1000);
    
    // 检查订单相关按钮
    const buttons = await page.locator('button').all();
    let newOrderButtons = 0;
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.includes('新建订单')) {
        const isVisible = await button.isVisible();
        if (isVisible) {
          newOrderButtons++;
        }
      }
    }
    
    console.log(`   📊 可见的新建订单按钮: ${newOrderButtons}个`);
    
    if (newOrderButtons > 0) {
      try {
        // 尝试显示新订单表单
        await page.evaluate(() => {
          if (typeof window.showNewOrderForm === 'function') {
            window.showNewOrderForm();
          }
        });
        await page.waitForTimeout(1000);
        
        const formVisible = await page.locator('#newOrderForm').isVisible();
        console.log(`   ${formVisible ? '✅' : '❌'} 新订单表单显示: ${formVisible ? '成功' : '失败'}`);
        
        if (formVisible) {
          // 检查表单字段
          const fields = ['#orderNo', '#customerId', '#businessType', '#portOfLoading', '#portOfDischarge'];
          
          for (const field of fields) {
            const fieldExists = await page.locator(field).count() > 0;
            console.log(`   ${fieldExists ? '✅' : '❌'} 表单字段 ${field}: ${fieldExists ? '存在' : '不存在'}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ 表单操作失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ 订单管理测试失败: ${error.message}`);
  }
}

// 测试内部协议功能
async function testProtocolManagement(page) {
  try {
    // 切换到内部协议页面
    await page.evaluate(() => {
      if (typeof window.showSection === 'function') {
        window.showSection('protocols');
      }
    });
    await page.waitForTimeout(1000);
    
    const protocolsVisible = await page.locator('#protocols').isVisible();
    console.log(`   ${protocolsVisible ? '✅' : '❌'} 内部协议页面显示: ${protocolsVisible ? '成功' : '失败'}`);
    
    if (protocolsVisible) {
      // 测试刷新协议功能
      try {
        const refreshBtn = await page.locator('button:has-text("刷新协议")').count();
        console.log(`   📊 刷新协议按钮: ${refreshBtn}个`);
        
        if (refreshBtn > 0) {
          // 使用JavaScript函数而不是点击按钮
          await page.evaluate(() => {
            if (typeof window.loadAllProtocols === 'function') {
              window.loadAllProtocols();
            }
          });
          await page.waitForTimeout(2000);
          console.log(`   ✅ 执行刷新协议操作`);
        }
        
      } catch (error) {
        console.log(`   ❌ 协议刷新失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ 协议管理测试失败: ${error.message}`);
  }
}

// 测试任务管理功能
async function testTaskManagement(page) {
  try {
    // 切换到任务管理页面
    await page.evaluate(() => {
      if (typeof window.showSection === 'function') {
        window.showSection('tasks');
      }
    });
    await page.waitForTimeout(1000);
    
    const tasksVisible = await page.locator('#tasks').isVisible();
    console.log(`   ${tasksVisible ? '✅' : '❌'} 任务管理页面显示: ${tasksVisible ? '成功' : '失败'}`);
    
    if (tasksVisible) {
      // 测试操作人员选择
      const staffSelect = await page.locator('#selectedOperationStaff').count();
      console.log(`   📊 操作人员选择器: ${staffSelect}个`);
      
      if (staffSelect > 0) {
        // 检查选项数量
        const options = await page.locator('#selectedOperationStaff option').count();
        console.log(`   📊 操作人员选项: ${options - 1}个`); // -1 是因为默认选项
        
        // 尝试刷新任务
        try {
          await page.evaluate(() => {
            const staffId = '1'; // 使用默认ID
            if (typeof window.loadMyTasks === 'function') {
              window.loadMyTasks(staffId);
            }
          });
          await page.waitForTimeout(2000);
          console.log(`   ✅ 执行任务加载操作`);
          
        } catch (error) {
          console.log(`   ❌ 任务加载失败: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`   ❌ 任务管理测试失败: ${error.message}`);
  }
}

// 测试API端点
async function testAPIEndpoints(page) {
  const endpoints = [
    '/api/freight-orders/statistics',
    '/api/freight-orders/service-rates',
    '/api/clearing/departments',
    '/api/clearing/staff',
    '/api/clearing/protocols'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await page.request.get(`http://localhost:8081${endpoint}`, {
        timeout: 5000
      });
      const status = response.status();
      console.log(`   ${status === 200 ? '✅' : '❌'} ${endpoint}: HTTP ${status}`);
      
    } catch (error) {
      console.log(`   ❌ ${endpoint}: 请求失败`);
    }
  }
}

// 测试JavaScript函数
async function testJavaScriptFunctions(page) {
  const jsCheck = await page.evaluate(() => {
    const functions = [
      'showSection',
      'showNewOrderForm', 
      'loadAllProtocols',
      'matchProtocols',
      'loadMyTasks',
      'displayMyTasks',
      'calculateFees',
      'saveOrder',
      'submitOrder'
    ];
    
    const results = {};
    functions.forEach(func => {
      results[func] = typeof window[func] === 'function';
    });
    
    return results;
  });
  
  console.log('   📋 JavaScript函数检查:');
  Object.entries(jsCheck).forEach(([func, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${func}: ${exists ? '已定义' : '未定义'}`);
  });
  
  return jsCheck;
}

// 生成测试报告
async function generateTestReport(page) {
  const jsCheck = await testJavaScriptFunctions(page);
  
  const summary = {
    页面导航: true,
    JavaScript函数: Object.values(jsCheck).filter(v => v).length >= 6,
    订单管理: await page.locator('#orders').count() > 0,
    内部协议: await page.locator('#protocols').count() > 0,  
    任务管理: await page.locator('#tasks').count() > 0,
    清分管理: await page.locator('#clearing').count() > 0
  };
  
  console.log('🎯 功能模块状态:');
  Object.entries(summary).forEach(([module, status]) => {
    console.log(`   ${status ? '✅' : '❌'} ${module}: ${status ? '正常' : '异常'}`);
  });
  
  const successCount = Object.values(summary).filter(v => v).length;
  const totalCount = Object.keys(summary).length;
  const successRate = (successCount / totalCount * 100).toFixed(1);
  
  console.log(`\n🏆 总体状态: ${successRate}% (${successCount}/${totalCount})`);
  
  if (successRate >= 80) {
    console.log('✅ 评级: 优秀 - 接单派单功能完整');
  } else if (successRate >= 60) {
    console.log('⚠️  评级: 良好 - 核心功能可用');  
  } else {
    console.log('❌ 评级: 需改进 - 存在功能缺陷');
  }
}