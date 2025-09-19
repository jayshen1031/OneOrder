#!/usr/bin/env node

/**
 * OneOrder完整4步骤业务流程测试
 * 验证从接单到协议确认的完整业务流程
 */

const http = require('http');

// 配置
const BASE_URL = 'http://localhost:8081';
const API_BASE = '/api';

// 测试场景配置
const testScenarios = [
    {
        name: '海运整柜出口场景',
        customerServiceId: 'CS001',
        operationStaffId: 'OP001', 
        serviceCode: 'BOOKING',
        businessType: 'OCEAN',
        customer: {
            name: '华为技术有限公司',
            contact: '张经理'
        }
    },
    {
        name: '空运快件场景',
        customerServiceId: 'CS002',
        operationStaffId: 'OP002',
        serviceCode: 'AIR_BOOKING', 
        businessType: 'AIR',
        customer: {
            name: '小米科技有限公司',
            contact: '李经理'
        }
    }
];

/**
 * HTTP请求工具
 */
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

/**
 * 生成订单ID
 */
function generateOrderId() {
    return 'ORD' + new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
}

/**
 * 步骤1: 客服接单 - 创建订单
 */
async function step1_CustomerServiceIntake(scenario) {
    console.log(`\n📋 步骤1: 客服接单 - ${scenario.name}`);
    console.log('=' .repeat(50));
    
    const orderId = generateOrderId();
    
    // 模拟客服接单过程
    console.log(`👩‍💼 客服 ${scenario.customerServiceId} 接收来自 ${scenario.customer.name} 的订单`);
    console.log(`📞 联系人: ${scenario.customer.contact}`);
    console.log(`📦 业务类型: ${scenario.businessType}`);
    console.log(`🆔 生成订单号: ${orderId}`);
    
    // 在真实系统中，这里会调用订单创建API
    const orderData = {
        orderId: orderId,
        customerId: 'CUST_' + Date.now(),
        customerName: scenario.customer.name,
        businessType: scenario.businessType,
        salesStaffId: scenario.customerServiceId,
        status: 'CREATED',
        createdTime: new Date().toISOString()
    };
    
    console.log('✅ 订单创建成功');
    console.log(`📊 订单信息:`, JSON.stringify(orderData, null, 2));
    
    return {
        success: true,
        data: orderData
    };
}

/**
 * 步骤2: 协议匹配与派单
 */
async function step2_ProtocolMatching(scenario, orderData) {
    console.log(`\n🔍 步骤2: 协议匹配与派单 - ${scenario.name}`);
    console.log('=' .repeat(50));
    
    // 2.1 智能协议匹配
    console.log('🔍 执行智能协议匹配...');
    const params = new URLSearchParams({
        customerServiceId: scenario.customerServiceId,
        operationStaffId: scenario.operationStaffId,
        serviceCode: scenario.serviceCode,
        businessType: scenario.businessType
    });
    
    try {
        const matchResponse = await makeRequest('GET', `${API_BASE}/protocol-assignment/protocols/match?${params}`);
        
        if (matchResponse.statusCode === 200 && matchResponse.data.code === 200) {
            const protocols = matchResponse.data.data.protocols;
            console.log(`✅ 协议匹配成功! 找到 ${protocols.length} 个可用协议`);
            
            // 显示匹配的协议
            protocols.forEach((protocol, index) => {
                console.log(`  ${index + 1}. ${protocol.protocolName}`);
                console.log(`     佣金率: ${protocol.baseCommissionRate}% + ${protocol.performanceBonusRate}% = ${protocol.totalCommissionRate}%`);
                console.log(`     适用范围: ${protocol.serviceCode || '通用'} / ${protocol.businessType || '通用'}`);
            });
            
            // 2.2 选择最佳协议（第一个，优先级最高）
            const selectedProtocol = protocols[0];
            console.log(`\n📋 客服选择协议: ${selectedProtocol.protocolName}`);
            
            // 2.3 执行协议派单
            console.log('🎯 执行协议派单...');
            const assignmentData = {
                orderId: orderData.orderId,
                serviceCode: scenario.serviceCode,
                operationStaffId: scenario.operationStaffId,
                protocolId: selectedProtocol.protocolId
            };
            
            const assignResponse = await makeRequest('POST', `${API_BASE}/protocol-assignment/assign-with-protocol`, assignmentData);
            
            if (assignResponse.statusCode === 200 && assignResponse.data.code === 200) {
                console.log('✅ 协议派单成功!');
                console.log(`🆔 派单ID: ${assignResponse.data.data.assignmentId}`);
                console.log(`👨‍💼 操作人员: ${assignResponse.data.data.operationStaffId}`);
                console.log(`📜 协议: ${selectedProtocol.protocolName}`);
                
                return {
                    success: true,
                    data: {
                        assignment: assignResponse.data.data,
                        protocol: selectedProtocol,
                        matchedProtocols: protocols
                    }
                };
            } else {
                console.log('❌ 协议派单失败');
                console.log('错误信息:', assignResponse.data);
                return { success: false, error: '协议派单失败' };
            }
            
        } else {
            console.log('❌ 协议匹配失败');
            console.log('错误信息:', matchResponse.data);
            return { success: false, error: '协议匹配失败' };
        }
        
    } catch (error) {
        console.log('❌ 协议匹配请求异常:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 步骤3: 操作人员接收任务
 */
async function step3_OperatorReceiveTask(scenario, orderData, assignmentData) {
    console.log(`\n📨 步骤3: 操作人员接收任务 - ${scenario.name}`);
    console.log('=' .repeat(50));
    
    console.log(`👨‍💼 操作人员 ${scenario.operationStaffId} 接收任务通知`);
    console.log(`📋 任务详情:`);
    console.log(`  • 订单号: ${orderData.orderId}`);
    console.log(`  • 服务类型: ${scenario.serviceCode}`);
    console.log(`  • 客户: ${orderData.customerName}`);
    console.log(`  • 协议: ${assignmentData.protocol.protocolName}`);
    
    // 获取协议详情
    console.log('\n📋 查看协议详情...');
    try {
        const protocolResponse = await makeRequest('GET', `${API_BASE}/protocol-assignment/protocols/${assignmentData.protocol.protocolId}`);
        
        if (protocolResponse.statusCode === 200 && protocolResponse.data.code === 200) {
            const protocolDetails = protocolResponse.data.data;
            console.log('✅ 协议详情获取成功');
            console.log(`📜 协议名称: ${protocolDetails.protocolName}`);
            console.log(`💰 总佣金率: ${protocolDetails.totalCommissionRate}%`);
            console.log(`📝 描述: ${protocolDetails.description}`);
            console.log(`📅 有效期: ${protocolDetails.effectiveDate} ~ ${protocolDetails.expiryDate}`);
            
            console.log('\n💹 分润规则:');
            protocolDetails.revenueRules.forEach(rule => {
                console.log(`  • ${rule.type}: ${rule.rate}`);
            });
            
            return {
                success: true,
                data: {
                    protocolDetails: protocolDetails,
                    taskReceived: true
                }
            };
        } else {
            console.log('❌ 获取协议详情失败');
            return { success: false, error: '获取协议详情失败' };
        }
        
    } catch (error) {
        console.log('❌ 请求协议详情异常:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 步骤4: 协议确认与执行
 */
async function step4_ProtocolConfirmation(scenario, orderData, assignmentData) {
    console.log(`\n✅ 步骤4: 协议确认与执行 - ${scenario.name}`);
    console.log('=' .repeat(50));
    
    console.log(`👨‍💼 操作人员 ${scenario.operationStaffId} 确认协议条款`);
    
    // 协议确认
    const confirmationData = {
        orderId: orderData.orderId,
        serviceCode: scenario.serviceCode,
        operationStaffId: scenario.operationStaffId,
        protocolId: assignmentData.protocol.protocolId,
        action: 'CONFIRM'
    };
    
    try {
        const confirmResponse = await makeRequest('POST', `${API_BASE}/protocol-assignment/confirm-protocol`, confirmationData);
        
        if (confirmResponse.statusCode === 200 && confirmResponse.data.code === 200) {
            const confirmResult = confirmResponse.data.data;
            console.log('✅ 协议确认成功!');
            console.log(`📊 新状态: ${confirmResult.status}`);
            console.log(`⏰ 确认时间: ${confirmResult.confirmedTime}`);
            console.log(`💬 系统消息: ${confirmResult.message}`);
            console.log(`➡️  下一步: ${confirmResult.nextStep}`);
            
            console.log('\n🎉 业务流程完成！分润规则已生效，开始服务执行。');
            
            return {
                success: true,
                data: {
                    confirmation: confirmResult,
                    workflowCompleted: true
                }
            };
        } else {
            console.log('❌ 协议确认失败');
            console.log('错误信息:', confirmResponse.data);
            return { success: false, error: '协议确认失败' };
        }
        
    } catch (error) {
        console.log('❌ 协议确认请求异常:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 执行完整业务流程测试
 */
async function executeCompleteWorkflow(scenario) {
    console.log(`\n🚀 开始执行完整业务流程测试: ${scenario.name}`);
    console.log('🔄 流程: 客服接单 → 协议匹配派单 → 操作接收 → 协议确认');
    console.log('='.repeat(80));
    
    try {
        // 步骤1: 客服接单
        const step1Result = await step1_CustomerServiceIntake(scenario);
        if (!step1Result.success) {
            throw new Error('步骤1失败: ' + step1Result.error);
        }
        
        await delay(1000); // 模拟真实操作间隔
        
        // 步骤2: 协议匹配与派单
        const step2Result = await step2_ProtocolMatching(scenario, step1Result.data);
        if (!step2Result.success) {
            throw new Error('步骤2失败: ' + step2Result.error);
        }
        
        await delay(1000);
        
        // 步骤3: 操作人员接收任务
        const step3Result = await step3_OperatorReceiveTask(scenario, step1Result.data, step2Result.data);
        if (!step3Result.success) {
            throw new Error('步骤3失败: ' + step3Result.error);
        }
        
        await delay(1000);
        
        // 步骤4: 协议确认与执行
        const step4Result = await step4_ProtocolConfirmation(scenario, step1Result.data, step2Result.data);
        if (!step4Result.success) {
            throw new Error('步骤4失败: ' + step4Result.error);
        }
        
        console.log(`\n🎊 ${scenario.name} 完整流程测试成功完成!`);
        return {
            success: true,
            scenario: scenario.name,
            results: {
                step1: step1Result,
                step2: step2Result,
                step3: step3Result,
                step4: step4Result
            }
        };
        
    } catch (error) {
        console.log(`\n❌ ${scenario.name} 流程测试失败:`, error.message);
        return {
            success: false,
            scenario: scenario.name,
            error: error.message
        };
    }
}

/**
 * 工具函数
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主测试流程
 */
async function runCompleteWorkflowTests() {
    console.log('🚀 OneOrder完整4步骤业务流程测试');
    console.log('🎯 目标: 验证从接单到协议确认的完整业务流程');
    console.log('📋 测试场景数量:', testScenarios.length);
    console.log('🌐 测试环境:', BASE_URL);
    console.log('='.repeat(80));
    
    const results = [];
    
    for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        console.log(`\n📊 执行测试场景 ${i + 1}/${testScenarios.length}`);
        
        const result = await executeCompleteWorkflow(scenario);
        results.push(result);
        
        if (i < testScenarios.length - 1) {
            console.log('\n⏸️  等待3秒后继续下一个场景...');
            await delay(3000);
        }
    }
    
    // 测试总结
    console.log('\n📊 测试总结');
    console.log('='.repeat(80));
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach((result, index) => {
        const status = result.success ? '✅ 成功' : '❌ 失败';
        console.log(`${index + 1}. ${result.scenario}: ${status}`);
        
        if (result.success) {
            successCount++;
        } else {
            failureCount++;
            console.log(`   错误: ${result.error}`);
        }
    });
    
    console.log('\n📈 统计结果:');
    console.log(`✅ 成功: ${successCount} 个场景`);
    console.log(`❌ 失败: ${failureCount} 个场景`);
    console.log(`📊 成功率: ${((successCount / results.length) * 100).toFixed(1)}%`);
    
    if (successCount === results.length) {
        console.log('\n🎉 所有测试场景均成功通过！');
        console.log('✅ 完整4步骤业务流程验证完成');
        console.log('✅ 内部协议系统全面激活成功');
    } else {
        console.log('\n⚠️  部分测试场景失败，需要进一步检查');
    }
    
    return results;
}

// 执行测试
runCompleteWorkflowTests();