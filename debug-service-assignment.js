// 简单的调试脚本，检查service-assignment页面
const fetch = require('node-fetch');

async function debugServiceAssignment() {
    console.log('🔍 调试服务派单页面问题...');
    
    try {
        // 1. 检查API数据
        console.log('1️⃣ 检查API数据...');
        const response = await fetch('http://localhost:8081/api/freight-orders?page=0&size=5');
        const orders = await response.json();
        console.log(`✅ API返回${orders.length}个订单`);
        
        if (orders.length > 0) {
            console.log('📋 示例订单数据:');
            orders.slice(0, 2).forEach((order, index) => {
                console.log(`  ${index + 1}. 订单号: ${order.orderNo}, 客户: ${order.customerId}, 状态: ${order.orderStatus}`);
            });
        }
        
        // 2. 检查页面HTML
        console.log('\n2️⃣ 检查页面HTML中的orderSelect元素...');
        const pageResponse = await fetch('http://localhost:8081/api/service-assignment.html');
        const html = await pageResponse.text();
        
        const hasOrderSelect = html.includes('id="orderSelect"');
        const hasLoadOrderList = html.includes('loadOrderList()');
        const hasDOMContentLoaded = html.includes('DOMContentLoaded');
        
        console.log(`✅ 页面包含orderSelect: ${hasOrderSelect}`);
        console.log(`✅ 页面包含loadOrderList调用: ${hasLoadOrderList}`);
        console.log(`✅ 页面包含DOMContentLoaded: ${hasDOMContentLoaded}`);
        
        // 3. 分析可能的问题
        console.log('\n3️⃣ 分析可能问题:');
        
        if (orders.length === 0) {
            console.log('❌ 问题: API没有返回订单数据');
        } else if (!hasOrderSelect) {
            console.log('❌ 问题: 页面缺少orderSelect元素');
        } else if (!hasLoadOrderList) {
            console.log('❌ 问题: 页面没有调用loadOrderList函数');
        } else {
            console.log('🤔 页面和API看起来都正常，可能是JavaScript执行问题');
        }
        
        // 4. 提供解决方案
        console.log('\n4️⃣ 建议解决方案:');
        console.log('1. 检查浏览器控制台是否有JavaScript错误');
        console.log('2. 确认页面加载完成后loadOrderList是否被调用');
        console.log('3. 检查网络请求是否成功');
        console.log('4. 可能需要手动点击刷新按钮来加载订单');
        
    } catch (error) {
        console.error('❌ 调试过程出错:', error.message);
    }
}

// 运行调试
debugServiceAssignment();