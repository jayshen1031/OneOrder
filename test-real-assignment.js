const puppeteer = require('puppeteer');

async function testRealAssignment() {
    console.log('🧪 测试真实派单操作和历史记录...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听所有控制台消息和网络请求
        page.on('console', msg => {
            const text = msg.text();
            console.log(`📝 页面: ${text}`);
        });
        
        page.on('response', response => {
            if (response.url().includes('/protocol-assignment/')) {
                console.log(`🌐 API响应: ${response.url()} - ${response.status()}`);
            }
        });
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 检查当前页面状态...');
        const pageState = await page.evaluate(() => {
            return {
                hasOrders: typeof orders !== 'undefined' && orders && orders.length > 0,
                ordersCount: orders ? orders.length : 0,
                currentOrderId: currentOrderId || 'none',
                hasOperators: availableOperators && availableOperators.length > 0,
                operatorsCount: availableOperators ? availableOperators.length : 0,
                hasServices: currentServices && currentServices.length > 0,
                servicesCount: currentServices ? currentServices.length : 0
            };
        });
        
        console.log('📊 页面状态:');
        console.log(`  订单: ${pageState.hasOrders} (${pageState.ordersCount}个)`);
        console.log(`  当前订单ID: ${pageState.currentOrderId}`);
        console.log(`  操作员: ${pageState.hasOperators} (${pageState.operatorsCount}个)`);
        console.log(`  服务: ${pageState.hasServices} (${pageState.servicesCount}个)`);
        
        if (!pageState.hasOrders) {
            console.log('⚠️ 没有订单数据，尝试加载订单...');
            await page.evaluate(() => {
                if (typeof loadOrderList === 'function') {
                    loadOrderList();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\\n📋 选择第一个订单...');
        const orderSelectResult = await page.evaluate(() => {
            const orderSelect = document.getElementById('orderSelect');
            if (!orderSelect || orderSelect.options.length <= 1) {
                return { success: false, message: '没有可选择的订单' };
            }
            
            // 选择第一个订单（跳过默认选项）
            orderSelect.selectedIndex = 1;
            orderSelect.dispatchEvent(new Event('change'));
            
            return { 
                success: true, 
                selectedOrder: orderSelect.options[orderSelect.selectedIndex].textContent,
                orderId: orderSelect.value
            };
        });
        
        if (!orderSelectResult.success) {
            console.log(`❌ 订单选择失败: ${orderSelectResult.message}`);
            return;
        }
        
        console.log(`✅ 已选择订单: ${orderSelectResult.selectedOrder}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\\n🔧 检查服务列表...');
        const servicesState = await page.evaluate(() => {
            return {
                servicesCount: currentServices ? currentServices.length : 0,
                hasAssignBtn: document.querySelector('.btn-outline-primary[onclick*="openAssignmentModal"]') !== null
            };
        });
        
        console.log(`  服务数量: ${servicesState.servicesCount}`);
        console.log(`  有派单按钮: ${servicesState.hasAssignBtn}`);
        
        if (servicesState.hasAssignBtn) {
            console.log('\\n🎯 点击第一个服务的派单按钮...');
            await page.click('.btn-outline-primary[onclick*="openAssignmentModal"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('\\n⚙️ 填写派单信息...');
            
            // 选择操作员
            const operatorSelectResult = await page.evaluate(() => {
                const operatorSelect = document.getElementById('operatorSelect');
                if (!operatorSelect || operatorSelect.options.length <= 1) {
                    return { success: false, message: '没有可选择的操作员' };
                }
                operatorSelect.selectedIndex = 1; // 选择第一个操作员
                operatorSelect.dispatchEvent(new Event('change'));
                return { 
                    success: true, 
                    selectedOperator: operatorSelect.options[operatorSelect.selectedIndex].textContent 
                };
            });
            
            if (operatorSelectResult.success) {
                console.log(`✅ 已选择操作员: ${operatorSelectResult.selectedOperator}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 选择协议
                const protocolSelectResult = await page.evaluate(() => {
                    const protocolCards = document.querySelectorAll('.protocol-card');
                    if (protocolCards.length === 0) {
                        return { success: false, message: '没有可选择的协议' };
                    }
                    protocolCards[0].click(); // 点击第一个协议
                    return { success: true };
                });
                
                if (protocolSelectResult.success) {
                    console.log('✅ 已选择协议');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // 添加备注
                    await page.type('#assignmentNotes', '测试派单 - 检查历史记录功能');
                    
                    console.log('\\n🚀 执行派单...');
                    
                    // 监听历史记录变化
                    const beforeHistoryLength = await page.evaluate(() => {
                        return assignmentHistory ? assignmentHistory.length : 0;
                    });
                    
                    console.log(`  派单前历史记录数: ${beforeHistoryLength}`);
                    
                    // 点击确认派单按钮
                    await page.click('#confirmAssignBtn');
                    
                    // 等待API响应
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // 检查历史记录变化
                    const afterHistoryLength = await page.evaluate(() => {
                        return assignmentHistory ? assignmentHistory.length : 0;
                    });
                    
                    console.log(`  派单后历史记录数: ${afterHistoryLength}`);
                    
                    if (afterHistoryLength > beforeHistoryLength) {
                        console.log('✅ 派单历史记录已成功添加！');
                        
                        // 查看最新的历史记录
                        const latestHistory = await page.evaluate(() => {
                            return assignmentHistory[0];
                        });
                        console.log('📝 最新历史记录:', JSON.stringify(latestHistory, null, 2));
                        
                        // 切换到历史标签查看
                        console.log('\\n📋 切换到派单历史标签验证显示...');
                        await page.click('#history-tab');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await page.click('button[onclick="loadAssignmentHistory()"]');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } else {
                        console.log('❌ 派单历史记录未添加');
                        
                        // 检查API响应或错误
                        const errorInfo = await page.evaluate(() => {
                            return {
                                currentOrderId: currentOrderId,
                                selectedProtocol: selectedProtocol,
                                hasConfirmBtn: document.getElementById('confirmAssignBtn') !== null,
                                btnText: document.getElementById('confirmAssignBtn') ? document.getElementById('confirmAssignBtn').textContent : 'not found'
                            };
                        });
                        
                        console.log('🔍 诊断信息:', errorInfo);
                    }
                } else {
                    console.log(`❌ 协议选择失败: ${protocolSelectResult.message}`);
                }
            } else {
                console.log(`❌ 操作员选择失败: ${operatorSelectResult.message}`);
            }
        } else {
            console.log('❌ 没有找到派单按钮');
        }
        
        console.log('\\n⌚ 保持页面打开15秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testRealAssignment().catch(console.error);