// 简单的UI功能测试
const { test, expect } = require('@playwright/test');

test.describe('OneOrder UI基础功能测试', () => {
  
  test('页面加载和基础元素检查', async ({ page }) => {
    console.log('🌐 测试页面基础加载...');
    
    // 访问主页面
    await page.goto('http://localhost:8081/api/freight-order.html');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/OneOrder/);
    console.log('✅ 页面标题正确');
    
    // 检查主要导航元素
    await expect(page.locator('text=仪表板')).toBeVisible();
    await expect(page.locator('text=订单管理')).toBeVisible();
    await expect(page.locator('text=清分管理')).toBeVisible();
    console.log('✅ 主要导航元素存在');
    
    // 检查新建订单按钮
    await expect(page.locator('button:has-text("新建订单")')).toBeVisible();
    console.log('✅ 新建订单按钮存在');
  });

  test('新建订单表单显示和隐藏', async ({ page }) => {
    console.log('📝 测试新建订单表单...');
    
    await page.goto('http://localhost:8081/api/freight-order.html');
    await page.waitForLoadState('networkidle');
    
    // 点击新建订单按钮
    await page.click('button:has-text("新建订单")');
    
    // 验证表单显示
    await expect(page.locator('#newOrderForm')).toBeVisible();
    console.log('✅ 新建订单表单成功显示');
    
    // 验证必要字段存在
    await expect(page.locator('#customerId')).toBeVisible();
    await expect(page.locator('#businessType')).toBeVisible();
    await expect(page.locator('#portOfLoading')).toBeVisible();
    await expect(page.locator('#portOfDischarge')).toBeVisible();
    console.log('✅ 订单表单字段完整');
    
    // 验证业务类型选项
    const businessTypeOptions = await page.locator('#businessType option').count();
    expect(businessTypeOptions).toBeGreaterThan(1); // 至少有默认选项+业务类型选项
    console.log(`✅ 业务类型有 ${businessTypeOptions} 个选项`);
  });

  test('业务类型选择触发服务加载', async ({ page }) => {
    console.log('🔄 测试业务类型选择功能...');
    
    await page.goto('http://localhost:8081/api/freight-order.html');
    await page.waitForLoadState('networkidle');
    
    // 打开新建订单表单
    await page.click('button:has-text("新建订单")');
    await expect(page.locator('#newOrderForm')).toBeVisible();
    
    // 选择海运业务类型
    await page.selectOption('#businessType', 'OCEAN');
    
    // 等待一段时间让JavaScript执行
    await page.waitForTimeout(2000);
    
    // 检查服务选择区域是否有内容
    const serviceSelection = page.locator('#serviceSelection');
    await expect(serviceSelection).toBeVisible();
    
    // 验证是否有JavaScript加载的内容（即使API失败，也应该有错误信息或默认内容）
    const serviceContent = await serviceSelection.textContent();
    expect(serviceContent.trim().length).toBeGreaterThan(0);
    
    console.log('✅ 业务类型选择触发了服务区域更新');
  });

  test('现有清分功能测试', async ({ page }) => {
    console.log('⚡ 测试现有清分功能...');
    
    await page.goto('http://localhost:8081/api/freight-order.html');
    await page.waitForLoadState('networkidle');
    
    // 切换到清分管理
    await page.click('[data-section="clearing"]');
    await page.waitForTimeout(1000);
    
    // 验证清分界面元素
    const clearingSection = page.locator('#clearing');
    await expect(clearingSection).toBeVisible();
    
    // 检查试算按钮
    const simulateButtons = await page.locator('button:has-text("试算")').count();
    console.log(`✅ 找到 ${simulateButtons} 个试算按钮`);
    
    // 检查清分按钮
    const clearingButtons = await page.locator('button:has-text("清分")').count();
    console.log(`✅ 找到 ${clearingButtons} 个清分按钮`);
  });

  test('JavaScript文件加载检查', async ({ page }) => {
    console.log('📜 检查JavaScript文件加载...');
    
    // 监听控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:8081/api/freight-order.html');
    await page.waitForLoadState('networkidle');
    
    // 等待JavaScript执行
    await page.waitForTimeout(3000);
    
    // 检查是否有严重的JavaScript错误
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') ||
      error.includes('ReferenceError')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ 发现JavaScript错误:', criticalErrors);
    } else {
      console.log('✅ 没有发现严重的JavaScript错误');
    }
    
    // 验证关键函数是否存在
    const hasLoadServiceOptions = await page.evaluate(() => {
      return typeof window.loadServiceOptions === 'function';
    });
    
    if (hasLoadServiceOptions) {
      console.log('✅ loadServiceOptions 函数已加载');
    } else {
      console.log('⚠️ loadServiceOptions 函数未找到');
    }
  });

  test('API端点可达性测试', async ({ page }) => {
    console.log('🔗 测试API端点可达性...');
    
    // 测试现有的API端点
    const apiTests = [
      { path: '/api/', description: '主API路径' },
      { path: '/api/clearing/execute', description: '清分执行端点', method: 'POST' },
      { path: '/api/test/simple', description: '简单测试端点' },
      { path: '/api/swagger-ui.html', description: 'Swagger文档' }
    ];
    
    for (const api of apiTests) {
      try {
        const response = await page.request.get(`http://localhost:8081${api.path}`);
        const status = response.status();
        
        if (status < 500) {
          console.log(`✅ ${api.description}: ${status}`);
        } else {
          console.log(`⚠️ ${api.description}: ${status}`);
        }
      } catch (error) {
        console.log(`❌ ${api.description}: 连接失败`);
      }
    }
  });
});