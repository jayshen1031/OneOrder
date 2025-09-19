// 验证客户名称显示修复
const customerMapping = {
    'CUST_001': 'CONG TY TNHH COCREATION GRASS CORPORATION VIET NAM',
    'CUST_002': 'COCREATION GRASS CORPORATION (VIET NAM) CO., LTD',
    'CUST_003': 'CONG TY TNHH CONG NGHIEP ZHANG LONG',
    'CUST_004': 'CONG TY TNHH THOI TRANG G&G VIET NAM',
    'CUST_005': 'VIETNAM FOUR SEASON MACHINERY MANUFACTORY COMPANY LIMITED',
    'CUST_006': 'ALPHA AVIATION VIET NAM CO., LTD',
    'CUST_007': 'BOE VISION ELECTRONIC TECHNOLOGY (VIET NAM) COMPANY LIMITED',
    'CUST_008': 'CHI NHANH THANH PHO HAI PHONG CONG TY CO PHAN GIAO NHAN WIN WIN'
};

function getCustomerName(order) {
    if (order.customerName && order.customerName.trim() !== '') {
        return order.customerName;
    }
    
    if (order.customerId && customerMapping[order.customerId]) {
        return customerMapping[order.customerId];
    }
    
    return order.customerId || 'Unknown Customer';
}

// 测试数据
const testOrders = [
    { customerId: 'CUST_004', customerName: null },
    { customerId: 'CUST_006', customerName: null },
    { customerId: 'CUST_007', customerName: null }
];

console.log('=== 客户名称显示修复验证 ===');
testOrders.forEach((order, index) => {
    const displayName = getCustomerName(order);
    console.log(`订单 ${index + 1}:`);
    console.log(`  - customerId: ${order.customerId}`);
    console.log(`  - customerName: ${order.customerName}`);
    console.log(`  - 显示名称: ${displayName}`);
    console.log(`  - 修复成功: ${displayName !== 'Unknown Customer' && displayName !== order.customerId ? '✅' : '❌'}`);
    console.log('');
});

console.log('预期效果：');
console.log('- CUST_004 应显示: CONG TY TNHH THOI TRANG G&G VIET NAM');
console.log('- CUST_006 应显示: ALPHA AVIATION VIET NAM CO., LTD');
console.log('- CUST_007 应显示: BOE VISION ELECTRONIC TECHNOLOGY (VIET NAM) COMPANY LIMITED');