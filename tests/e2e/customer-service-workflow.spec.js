// OneOrder客服接单流程端到端测试
const { test, expect } = require('@playwright/test');

test.describe('客服接单完整流程', () => {
  let page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 设置视口
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 导航到应用
    await page.goto('/api/freight-order.html');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题
    await expect(page).toHaveTitle(/OneOrder/);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('完整的客服接单到派单流程', async () => {
    console.log('🚀 开始测试客服接单流程...');
    
    // 步骤1: 打开新建订单表单
    await test.step('打开新建订单表单', async () => {
      await page.click('button:has-text("新建订单")');
      await expect(page.locator('#newOrderForm')).toBeVisible();
      console.log('✅ 新建订单表单已打开');
    });

    // 步骤2: 填写订单基本信息
    await test.step('填写订单基本信息', async () => {
      // 选择客户
      await page.selectOption('#customerId', 'CUST001');
      await page.waitForTimeout(500);
      
      // 选择业务类型
      await page.selectOption('#businessType', 'OCEAN');
      await page.waitForTimeout(1000); // 等待服务选项加载
      
      console.log('✅ 基本信息填写完成');
    });

    // 步骤3: 填写运输信息
    await test.step('填写运输信息', async () => {
      await page.fill('#portOfLoading', 'CNSHA');
      await page.fill('#portOfDischarge', 'USLAX');
      await page.fill('#estimatedDeparture', '2024-01-15');
      await page.fill('#estimatedArrival', '2024-02-01');
      
      console.log('✅ 运输信息填写完成');
    });

    // 步骤4: 填写货物信息
    await test.step('填写货物信息', async () => {
      await page.fill('#cargoDescription', '电子产品');
      await page.fill('#packageCount', '100');
      await page.fill('#weight', '5000');
      await page.fill('#volume', '25');
      
      console.log('✅ 货物信息填写完成');
    });

    // 步骤5: 等待服务选项加载并选择服务
    await test.step('选择服务项', async () => {
      // 等待服务选项加载
      await page.waitForSelector('#serviceSelection .form-check-input', { timeout: 10000 });
      
      // 选择几个核心服务
      const serviceSelectors = [
        'input[value="OCEAN_FREIGHT"]',
        'input[value="OTHC"]', 
        'input[value="DOC_FEE"]',
        'input[value="CUSTOMS_DECLARATION"]'
      ];
      
      for (const selector of serviceSelectors) {
        const checkbox = page.locator(selector);
        if (await checkbox.count() > 0) {
          await checkbox.check();
          console.log(`✅ 已选择服务: ${selector}`);
        }
      }
      
      // 验证至少选择了一个服务
      const checkedServices = await page.locator('#serviceSelection input[type="checkbox"]:checked').count();
      expect(checkedServices).toBeGreaterThan(0);
      
      console.log(`✅ 共选择了 ${checkedServices} 个服务`);
    });

    // 步骤6: 检查费用计算
    await test.step('验证费用计算', async () => {
      // 触发费用计算
      await page.click('button:has-text("计算费用")');
      await page.waitForTimeout(2000);
      
      // 验证总金额显示
      const totalAmount = await page.textContent('#totalAmount');
      expect(totalAmount).toContain('¥');
      expect(totalAmount).not.toBe('¥ 0.00');
      
      console.log(`✅ 费用计算完成，总金额: ${totalAmount}`);
    });

    // 步骤7: 提交订单（客服接单）
    let orderId;
    await test.step('提交订单（客服接单）', async () => {
      // 点击客服接单按钮
      await page.click('button:has-text("客服接单")');
      
      // 等待成功通知
      await page.waitForSelector('.alert-success, .toast-success', { timeout: 10000 });
      
      // 等待订单创建成功模态框
      await page.waitForSelector('#orderCreationResultModal', { state: 'visible', timeout: 10000 });
      
      // 获取订单ID
      orderId = await page.textContent('#resultOrderId');
      expect(orderId).toBeTruthy();
      
      console.log(`✅ 订单创建成功，订单ID: ${orderId}`);
    });

    // 步骤8: 进入派单界面
    await test.step('进入派单界面', async () => {
      // 点击开始派单按钮
      await page.click('button:has-text("开始派单")');
      
      // 等待派单界面显示
      await page.waitForSelector('#serviceAssignmentSection', { state: 'visible', timeout: 5000 });
      
      // 验证待派单服务列表
      await page.waitForSelector('#pendingServicesList .card', { timeout: 10000 });
      
      const serviceCards = await page.locator('#pendingServicesList .card').count();
      expect(serviceCards).toBeGreaterThan(0);
      
      console.log(`✅ 派单界面加载完成，共有 ${serviceCards} 个待派单服务`);
    });

    // 步骤9: 为服务分配操作人员
    await test.step('分配操作人员', async () => {
      // 加载操作人员
      await page.click('button:has-text("加载操作人员")');
      await page.waitForTimeout(2000);
      
      // 获取第一个服务的派单控件
      const firstServiceCard = page.locator('#pendingServicesList .card').first();
      const staffSelect = firstServiceCard.locator('select[id^="staff_"]');
      const protocolSelect = firstServiceCard.locator('select[id^="protocol_"]');
      
      // 选择操作人员
      await staffSelect.selectOption({ index: 1 }); // 选择第一个可用操作人员
      await page.waitForTimeout(1000);
      
      // 等待协议加载并选择协议
      await page.waitForSelector('select[id^="protocol_"] option:not([value=""])', { timeout: 10000 });
      await protocolSelect.selectOption({ index: 1 }); // 选择第一个可用协议
      
      console.log('✅ 操作人员和协议分配完成');
    });

    // 步骤10: 执行派单
    await test.step('执行派单', async () => {
      // 点击派单按钮
      const firstServiceCard = page.locator('#pendingServicesList .card').first();
      const assignButton = firstServiceCard.locator('button:has-text("派单")');
      
      await assignButton.click();
      
      // 等待派单成功通知
      await page.waitForSelector('.alert-success, .toast-success', { timeout: 10000 });
      
      // 验证服务卡片状态更新
      await expect(firstServiceCard.locator(':has-text("已派单")')).toBeVisible();
      
      console.log('✅ 服务派单成功');
    });

    console.log('🎉 客服接单到派单完整流程测试通过！');
  });

  test('服务选择功能测试', async () => {
    console.log('🧪 开始测试服务选择功能...');
    
    // 打开新建订单表单
    await page.click('button:has-text("新建订单")');
    await expect(page.locator('#newOrderForm')).toBeVisible();
    
    // 测试不同业务类型的服务加载
    const businessTypes = ['OCEAN', 'AIR', 'TRUCK', 'RAIL'];
    
    for (const businessType of businessTypes) {
      await test.step(`测试 ${businessType} 业务类型`, async () => {
        await page.selectOption('#businessType', businessType);
        await page.waitForTimeout(2000);
        
        // 验证服务选项已加载
        const serviceOptions = await page.locator('#serviceSelection .form-check-input').count();
        expect(serviceOptions).toBeGreaterThan(0);
        
        console.log(`✅ ${businessType} 业务类型加载了 ${serviceOptions} 个服务选项`);
      });
    }
  });

  test('协议匹配功能测试', async () => {
    console.log('🔍 开始测试协议匹配功能...');
    
    // 模拟到达派单步骤
    await page.goto('/api/freight-order.html#service-assignment');
    
    // 测试协议匹配API
    const response = await page.request.get('/api/service-assignment/protocols/match', {
      params: {
        customerServiceId: 'CS001',
        operationStaffId: 'OP001',
        serviceCode: 'OCEAN_FREIGHT',
        businessType: 'OCEAN'
      }
    });
    
    expect(response.status()).toBe(200);
    const protocols = await response.json();
    expect(Array.isArray(protocols)).toBeTruthy();
    
    console.log(`✅ 协议匹配API测试通过，返回 ${protocols.length} 个协议`);
  });

  test('批量派单功能测试', async () => {
    console.log('🔄 开始测试批量派单功能...');
    
    // 创建测试订单并到达派单阶段
    await createTestOrderAndNavigateToAssignment();
    
    // 加载操作人员
    await page.click('button:has-text("加载操作人员")');
    await page.waitForTimeout(2000);
    
    // 为多个服务分配操作人员和协议
    const serviceCards = await page.locator('#pendingServicesList .card').count();
    
    for (let i = 0; i < Math.min(serviceCards, 3); i++) {
      const serviceCard = page.locator('#pendingServicesList .card').nth(i);
      const staffSelect = serviceCard.locator('select[id^="staff_"]');
      const protocolSelect = serviceCard.locator('select[id^="protocol_"]');
      
      await staffSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      await protocolSelect.selectOption({ index: 1 });
    }
    
    // 执行批量派单
    await page.click('button:has-text("批量派单")');
    
    // 确认对话框
    await page.on('dialog', dialog => dialog.accept());
    
    // 等待批量派单完成
    await page.waitForSelector('.alert-success', { timeout: 15000 });
    
    console.log('✅ 批量派单功能测试通过');
  });

  // 辅助函数：创建测试订单并导航到派单阶段
  async function createTestOrderAndNavigateToAssignment() {
    await page.click('button:has-text("新建订单")');
    await page.selectOption('#customerId', 'CUST001');
    await page.selectOption('#businessType', 'OCEAN');
    await page.waitForTimeout(2000);
    
    // 选择服务
    const firstService = page.locator('#serviceSelection .form-check-input').first();
    await firstService.check();
    
    // 提交订单
    await page.click('button:has-text("客服接单")');
    await page.waitForSelector('#orderCreationResultModal', { state: 'visible', timeout: 10000 });
    await page.click('button:has-text("开始派单")');
    await page.waitForSelector('#serviceAssignmentSection', { state: 'visible' });
  }
});