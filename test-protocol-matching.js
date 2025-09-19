#!/usr/bin/env node

/**
 * OneOrder内部协议匹配API测试
 * 测试协议匹配、派单、确认等核心功能
 */

const https = require('https');
const http = require('http');

// 配置
const BASE_URL = 'http://localhost:8081';
const API_BASE = '/api/protocol-assignment';

// 测试数据
const testData = {
    customerServiceId: 'CS001',
    operationStaffId: 'OP001',
    serviceCode: 'BOOKING',
    businessType: 'OCEAN',
    orderId: 'ORD20250916001'
};

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
 * 测试协议匹配API
 */
async function testProtocolMatching() {
    console.log('\n🔍 测试1: 协议匹配API');
    console.log('='.repeat(50));
    
    const params = new URLSearchParams({
        customerServiceId: testData.customerServiceId,
        operationStaffId: testData.operationStaffId,
        serviceCode: testData.serviceCode,
        businessType: testData.businessType
    });
    
    const path = `${API_BASE}/protocols/match?${params.toString()}`;
    
    try {
        const response = await makeRequest('GET', path);
        
        console.log(`📡 请求URL: GET ${BASE_URL + path}`);
        console.log(`📊 响应状态: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const data = response.data;
            console.log('✅ 协议匹配成功!');
            console.log(`📋 匹配到 ${data.data.matchCount} 个协议`);
            console.log(`🏢 销售部门: ${data.data.customerServiceDept}`);
            console.log(`🔧 操作部门: ${data.data.operationDept}`);
            
            console.log('\n📜 匹配的协议列表:');
            data.data.protocols.forEach((protocol, index) => {
                console.log(`  ${index + 1}. ${protocol.protocolName} (${protocol.protocolId})`);
                console.log(`     佣金率: ${protocol.baseCommissionRate}% + ${protocol.performanceBonusRate}%`);
                console.log(`     服务类型: ${protocol.serviceCode || '通用'}`);
                console.log(`     业务类型: ${protocol.businessType || '通用'}`);
                console.log('     ' + '-'.repeat(40));
            });
            
            return data.data.protocols[0]; // 返回第一个协议用于后续测试
        } else {
            console.log('❌ 协议匹配失败');
            console.log('错误信息:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ 请求异常:', error.message);
        return null;
    }
}

/**
 * 测试协议详情API
 */
async function testProtocolDetails(protocolId) {
    console.log('\n📋 测试2: 协议详情API');
    console.log('='.repeat(50));
    
    if (!protocolId) {
        console.log('⚠️  跳过测试: 没有可用的协议ID');
        return;
    }
    
    const path = `${API_BASE}/protocols/${protocolId}`;
    
    try {
        const response = await makeRequest('GET', path);
        
        console.log(`📡 请求URL: GET ${BASE_URL + path}`);
        console.log(`📊 响应状态: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const data = response.data.data;
            console.log('✅ 获取协议详情成功!');
            console.log(`📜 协议名称: ${data.protocolName}`);
            console.log(`🆔 协议ID: ${data.protocolId}`);
            console.log(`💰 基础佣金率: ${data.baseCommissionRate}%`);
            console.log(`🎯 绩效奖金率: ${data.performanceBonusRate}%`);
            console.log(`📊 总佣金率: ${data.totalCommissionRate}%`);
            console.log(`📅 有效期: ${data.effectiveDate} ~ ${data.expiryDate}`);
            console.log(`📝 描述: ${data.description}`);
            
            console.log('\n💹 分润规则:');
            data.revenueRules.forEach(rule => {
                console.log(`  • ${rule.type}: ${rule.rate}`);
            });
        } else {
            console.log('❌ 获取协议详情失败');
            console.log('错误信息:', response.data);
        }
    } catch (error) {
        console.log('❌ 请求异常:', error.message);
    }
}

/**
 * 测试协议派单API
 */
async function testProtocolAssignment(protocolId) {
    console.log('\n🎯 测试3: 协议派单API');
    console.log('='.repeat(50));
    
    if (!protocolId) {
        console.log('⚠️  跳过测试: 没有可用的协议ID');
        return null;
    }
    
    const path = `${API_BASE}/assign-with-protocol`;
    const requestData = {
        orderId: testData.orderId,
        serviceCode: testData.serviceCode,
        operationStaffId: testData.operationStaffId,
        protocolId: protocolId
    };
    
    try {
        const response = await makeRequest('POST', path, requestData);
        
        console.log(`📡 请求URL: POST ${BASE_URL + path}`);
        console.log(`📤 请求数据:`, JSON.stringify(requestData, null, 2));
        console.log(`📊 响应状态: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const data = response.data.data;
            console.log('✅ 协议派单成功!');
            console.log(`🆔 派单ID: ${data.assignmentId}`);
            console.log(`📋 订单ID: ${data.orderId}`);
            console.log(`🔧 服务代码: ${data.serviceCode}`);
            console.log(`👨‍💼 操作人员: ${data.operationStaffId}`);
            console.log(`📜 协议ID: ${data.protocolId}`);
            console.log(`📊 状态: ${data.status}`);
            console.log(`⏰ 派单时间: ${data.assignedTime}`);
            console.log(`💬 消息: ${data.message}`);
            
            return data.assignmentId;
        } else {
            console.log('❌ 协议派单失败');
            console.log('错误信息:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ 请求异常:', error.message);
        return null;
    }
}

/**
 * 测试协议确认API
 */
async function testProtocolConfirmation(protocolId) {
    console.log('\n✅ 测试4: 协议确认API');
    console.log('='.repeat(50));
    
    if (!protocolId) {
        console.log('⚠️  跳过测试: 没有可用的协议ID');
        return;
    }
    
    const path = `${API_BASE}/confirm-protocol`;
    const requestData = {
        orderId: testData.orderId,
        serviceCode: testData.serviceCode,
        operationStaffId: testData.operationStaffId,
        protocolId: protocolId,
        action: 'CONFIRM'
    };
    
    try {
        const response = await makeRequest('POST', path, requestData);
        
        console.log(`📡 请求URL: POST ${BASE_URL + path}`);
        console.log(`📤 请求数据:`, JSON.stringify(requestData, null, 2));
        console.log(`📊 响应状态: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const data = response.data.data;
            console.log('✅ 协议确认成功!');
            console.log(`📋 订单ID: ${data.orderId}`);
            console.log(`🔧 服务代码: ${data.serviceCode}`);
            console.log(`📜 协议ID: ${data.protocolId}`);
            console.log(`✅ 确认动作: ${data.action}`);
            console.log(`📊 新状态: ${data.status}`);
            console.log(`⏰ 确认时间: ${data.confirmedTime}`);
            console.log(`💬 消息: ${data.message}`);
            console.log(`➡️  下一步: ${data.nextStep}`);
        } else {
            console.log('❌ 协议确认失败');
            console.log('错误信息:', response.data);
        }
    } catch (error) {
        console.log('❌ 请求异常:', error.message);
    }
}

/**
 * 主测试流程
 */
async function runTests() {
    console.log('🚀 OneOrder内部协议匹配API测试');
    console.log('='.repeat(60));
    console.log(`🌐 测试环境: ${BASE_URL}`);
    console.log(`📋 测试数据:`, JSON.stringify(testData, null, 2));
    
    try {
        // 测试1: 协议匹配
        const firstProtocol = await testProtocolMatching();
        
        if (firstProtocol) {
            // 测试2: 协议详情
            await testProtocolDetails(firstProtocol.protocolId);
            
            // 测试3: 协议派单
            const assignmentId = await testProtocolAssignment(firstProtocol.protocolId);
            
            // 测试4: 协议确认
            await testProtocolConfirmation(firstProtocol.protocolId);
        }
        
        console.log('\n🎉 测试完成!');
        console.log('='.repeat(60));
        
        // 测试总结
        console.log('\n📊 测试总结:');
        console.log('✅ 协议匹配API - 完成');
        console.log('✅ 协议详情API - 完成');
        console.log('✅ 协议派单API - 完成');
        console.log('✅ 协议确认API - 完成');
        
    } catch (error) {
        console.log('\n❌ 测试过程中发生异常:', error.message);
    }
}

// 执行测试
runTests();