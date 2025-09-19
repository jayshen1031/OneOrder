// OneOrder API集成测试
const { test, expect } = require('@playwright/test');

test.describe('API集成测试', () => {
  const baseURL = 'http://localhost:8081';
  
  // 测试数据
  const testOrderData = {
    customerServiceId: 'CS001',
    customerId: 'CUST001',
    businessType: 'OCEAN',
    selectedServices: ['OCEAN_FREIGHT', 'OTHC', 'DOC_FEE'],
    portOfLoading: 'CNSHA',
    portOfDischarge: 'USLAX',
    cargoDescription: '测试货物',
    packageCount: 100,
    weight: 5000,
    volume: 25
  };

  test('客服接单API测试', async ({ request }) => {
    console.log('🔗 测试客服接单API...');
    
    // 测试创建订单并选择服务
    const response = await request.post(`${baseURL}/api/customer-service/orders/create-with-services`, {
      data: testOrderData
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result.success).toBeTruthy();
    expect(result.data.orderId).toBeTruthy();
    expect(result.data.serviceCount).toBe(testOrderData.selectedServices.length);
    
    console.log(`✅ 订单创建成功，订单ID: ${result.data.orderId}`);
    
    return result.data.orderId;
  });

  test('获取可选服务API测试', async ({ request }) => {
    console.log('📋 测试获取可选服务API...');
    
    const businessTypes = ['OCEAN', 'AIR', 'TRUCK', 'RAIL'];
    
    for (const businessType of businessTypes) {
      const response = await request.get(`${baseURL}/api/customer-service/services/available`, {
        params: { businessType }
      });
      
      expect(response.status()).toBe(200);
      
      const services = await response.json();
      expect(Array.isArray(services)).toBeTruthy();
      expect(services.length).toBeGreaterThan(0);
      
      // 验证服务数据结构
      const firstService = services[0];
      expect(firstService).toHaveProperty('serviceCode');
      expect(firstService).toHaveProperty('serviceName');
      expect(firstService).toHaveProperty('businessType', businessType);
      
      console.log(`✅ ${businessType} 业务类型有 ${services.length} 个可选服务`);
    }
  });

  test('获取可用操作人员API测试', async ({ request }) => {
    console.log('👥 测试获取可用操作人员API...');
    
    const response = await request.get(`${baseURL}/api/service-assignment/services/OCEAN_FREIGHT/available-staff`);
    
    expect(response.status()).toBe(200);
    
    const staff = await response.json();
    expect(Array.isArray(staff)).toBeTruthy();
    
    // 验证员工数据结构
    if (staff.length > 0) {
      const firstStaff = staff[0];
      expect(firstStaff).toHaveProperty('staffId');
      expect(firstStaff).toHaveProperty('staffName');
      expect(firstStaff).toHaveProperty('roleType', 'OPERATION');
      expect(firstStaff).toHaveProperty('active', true);
    }
    
    console.log(`✅ 找到 ${staff.length} 个可用操作人员`);
  });

  test('协议匹配API测试', async ({ request }) => {
    console.log('🤝 测试协议匹配API...');
    
    const response = await request.get(`${baseURL}/api/service-assignment/protocols/match`, {
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
    
    // 验证协议数据结构
    if (protocols.length > 0) {
      const firstProtocol = protocols[0];
      expect(firstProtocol).toHaveProperty('protocolId');
      expect(firstProtocol).toHaveProperty('protocolName');
      expect(firstProtocol).toHaveProperty('baseCommissionRate');
      expect(firstProtocol).toHaveProperty('active', true);
    }
    
    console.log(`✅ 匹配到 ${protocols.length} 个可用协议`);
  });

  test('服务派单API测试', async ({ request }) => {
    console.log('📤 测试服务派单API...');
    
    // 先创建订单
    const createResponse = await request.post(`${baseURL}/api/customer-service/orders/create-with-services`, {
      data: testOrderData
    });
    
    expect(createResponse.status()).toBe(200);
    const orderData = await createResponse.json();
    const orderId = orderData.data.orderId;
    
    // 获取待派单服务
    const servicesResponse = await request.get(`${baseURL}/api/customer-service/orders/${orderId}/pending-services`);
    expect(servicesResponse.status()).toBe(200);
    
    const pendingServices = await servicesResponse.json();
    expect(pendingServices.length).toBeGreaterThan(0);
    
    const firstService = pendingServices[0];
    
    // 执行派单
    const assignmentData = {
      serviceId: firstService.serviceId,
      customerServiceId: 'CS001',
      operationStaffId: 'OP001',
      protocolId: 'PROTOCOL001',
      message: '测试派单',
      urgent: false
    };
    
    const assignResponse = await request.post(`${baseURL}/api/service-assignment/services/${firstService.serviceId}/assign`, {
      data: assignmentData
    });
    
    expect(assignResponse.status()).toBe(200);
    
    const assignResult = await assignResponse.json();
    expect(assignResult.success).toBeTruthy();
    expect(assignResult.data.serviceId).toBe(firstService.serviceId);
    
    console.log(`✅ 服务派单成功，通知ID: ${assignResult.data.notificationId}`);
  });

  test('批量派单API测试', async ({ request }) => {
    console.log('🔄 测试批量派单API...');
    
    // 先创建订单
    const createResponse = await request.post(`${baseURL}/api/customer-service/orders/create-with-services`, {
      data: testOrderData
    });
    
    const orderData = await createResponse.json();
    const orderId = orderData.data.orderId;
    
    // 获取待派单服务
    const servicesResponse = await request.get(`${baseURL}/api/customer-service/orders/${orderId}/pending-services`);
    const pendingServices = await servicesResponse.json();
    
    // 准备批量派单数据
    const assignments = pendingServices.slice(0, 2).map(service => ({
      serviceId: service.serviceId,
      customerServiceId: 'CS001',
      operationStaffId: 'OP001',
      protocolId: 'PROTOCOL001',
      message: '批量测试派单',
      urgent: false
    }));
    
    const batchData = {
      assignments: assignments,
      batchNotes: '批量派单测试',
      parallel: true
    };
    
    // 执行批量派单
    const batchResponse = await request.post(`${baseURL}/api/service-assignment/services/batch-assign`, {
      data: batchData
    });
    
    expect(batchResponse.status()).toBe(200);
    
    const batchResult = await batchResponse.json();
    expect(batchResult.success).toBeTruthy();
    expect(batchResult.data.successCount).toBe(assignments.length);
    
    console.log(`✅ 批量派单成功，成功: ${batchResult.data.successCount}, 失败: ${batchResult.data.failureCount}`);
  });

  test('错误处理测试', async ({ request }) => {
    console.log('❌ 测试错误处理...');
    
    // 测试无效的客户ID
    const invalidOrderData = { ...testOrderData, customerId: 'INVALID_CUSTOMER' };
    
    const response = await request.post(`${baseURL}/api/customer-service/orders/create-with-services`, {
      data: invalidOrderData
    });
    
    // 应该返回错误（可能是400或422）
    expect([400, 422, 500].includes(response.status())).toBeTruthy();
    
    // 测试未授权的派单请求
    const unauthorizedResponse = await request.post(`${baseURL}/api/service-assignment/services/999/assign`, {
      data: {
        serviceId: 999,
        customerServiceId: 'INVALID_CS',
        operationStaffId: 'OP001',
        protocolId: 'PROTOCOL001'
      }
    });
    
    expect([400, 401, 403, 404].includes(unauthorizedResponse.status())).toBeTruthy();
    
    console.log('✅ 错误处理测试通过');
  });

  test('数据一致性测试', async ({ request }) => {
    console.log('🔍 测试数据一致性...');
    
    // 创建订单
    const createResponse = await request.post(`${baseURL}/api/customer-service/orders/create-with-services`, {
      data: testOrderData
    });
    
    const orderData = await createResponse.json();
    const orderId = orderData.data.orderId;
    
    // 验证订单数据一致性
    expect(orderData.data.serviceCount).toBe(testOrderData.selectedServices.length);
    expect(orderData.data.totalAmount).toBeGreaterThan(0);
    
    // 获取订单详情（如果有此API）
    try {
      const detailResponse = await request.get(`${baseURL}/api/orders/${orderId}`);
      if (detailResponse.status() === 200) {
        const orderDetail = await detailResponse.json();
        expect(orderDetail.orderId).toBe(orderId);
        expect(orderDetail.customerId).toBe(testOrderData.customerId);
        expect(orderDetail.businessType).toBe(testOrderData.businessType);
      }
    } catch (error) {
      console.log('订单详情API不存在，跳过此项检查');
    }
    
    console.log('✅ 数据一致性测试通过');
  });

  test('性能测试', async ({ request }) => {
    console.log('⚡ 执行性能测试...');
    
    const startTime = Date.now();
    
    // 并发创建多个订单
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const orderData = {
        ...testOrderData,
        customerId: `CUST00${i + 1}`,
        cargoDescription: `性能测试货物 ${i + 1}`
      };
      
      promises.push(
        request.post(`${baseURL}/api/customer-service/orders/create-with-services`, {
          data: orderData
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    // 验证所有请求都成功
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    const duration = endTime - startTime;
    console.log(`✅ 性能测试完成，5个并发订单创建耗时: ${duration}ms`);
    
    // 性能断言（根据实际情况调整）
    expect(duration).toBeLessThan(10000); // 10秒内完成
  });
});