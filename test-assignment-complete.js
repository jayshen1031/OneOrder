const puppeteer = require('puppeteer');

async function testAssignmentComplete() {
    console.log('🧪 完整测试派单流程和历史记录...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听API调用
        page.on('response', response => {
            if (response.url().includes('/protocol-assignment/')) {
                console.log(`🌐 API响应: ${response.url()} - ${response.status()}`);
            }
        });
        
        // 监听控制台错误
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('error') || text.includes('Error') || text.includes('Failed') || text.includes('派单历史') || text.includes('assignmentHistory')) {
                console.log(`📝 页面: ${text}`);
            }
        });
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📋 选择第一个订单...');
        await page.select('#orderSelect', await page.evaluate(() => {
            const orderSelect = document.getElementById('orderSelect');
            return orderSelect.options[1].value; // 选择第一个实际订单
        }));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📊 检查派单前历史记录...');
        const beforeHistory = await page.evaluate(() => {
            return assignmentHistory ? assignmentHistory.length : 0;
        });
        console.log(`  历史记录数: ${beforeHistory}`);
        
        console.log('\\n🎯 点击第一个服务的派单按钮...');
        // 更精确的选择器
        await page.click('.service-card:first-child button[onclick*="openAssignModal"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ 派单模态框已打开');
        
        console.log('\\n🔧 选择操作员...');
        const operatorSelected = await page.evaluate(() => {
            const operatorSelect = document.getElementById('operatorSelect');
            if (operatorSelect && operatorSelect.options.length > 1) {
                operatorSelect.selectedIndex = 1;
                operatorSelect.dispatchEvent(new Event('change'));
                return operatorSelect.options[operatorSelect.selectedIndex].textContent;
            }
            return null;
        });
        
        if (operatorSelected) {
            console.log(`✅ 已选择操作员: ${operatorSelected}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('\\n📋 选择协议...');
            await page.waitForSelector('.protocol-card', { timeout: 3000 });
            await page.click('.protocol-card:first-child');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ 已选择协议');
            
            console.log('\\n📝 添加备注...');
            await page.type('#assignmentNotes', '完整测试派单历史记录功能');
            
            console.log('\\n🚀 执行派单...');
            
            // 等待确认按钮可用
            await page.waitForSelector('#confirmAssignBtn:not([disabled])', { timeout: 3000 });
            
            // 点击确认派单按钮
            await page.click('#confirmAssignBtn');
            
            console.log('⏳ 等待API响应...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('\\n📊 检查派单后历史记录...');
            const afterHistoryInfo = await page.evaluate(() => {
                return {
                    length: assignmentHistory ? assignmentHistory.length : 0,
                    latest: assignmentHistory && assignmentHistory.length > 0 ? {
                        id: assignmentHistory[0].id,
                        orderNo: assignmentHistory[0].orderNo,
                        serviceName: assignmentHistory[0].results[0].serviceName,
                        operatorName: assignmentHistory[0].results[0].operatorName,
                        status: assignmentHistory[0].results[0].status,
                        assignTime: assignmentHistory[0].assignTime
                    } : null,
                    allRecords: assignmentHistory || []
                };
            });
            
            console.log(`  历史记录数: ${afterHistoryInfo.length}`);
            
            if (afterHistoryInfo.length > beforeHistory) {
                console.log('\\n✅ 派单历史记录成功添加！');
                console.log('📝 最新记录摘要:');
                console.log(`  ID: ${afterHistoryInfo.latest.id}`);
                console.log(`  订单号: ${afterHistoryInfo.latest.orderNo}`);
                console.log(`  服务: ${afterHistoryInfo.latest.serviceName}`);
                console.log(`  操作员: ${afterHistoryInfo.latest.operatorName}`);
                console.log(`  状态: ${afterHistoryInfo.latest.status}`);
                console.log(`  时间: ${afterHistoryInfo.latest.assignTime}`);
                
                console.log('\\n📋 验证历史记录显示...');
                await page.click('#history-tab');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.click('button[onclick="loadAssignmentHistory()"]');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const historyDisplayed = await page.evaluate(() => {
                    const historyTable = document.getElementById('historyTable');
                    const rows = historyTable.querySelectorAll('tr');
                    return {
                        rowCount: rows.length,
                        hasData: rows.length > 0 && !rows[0].textContent.includes('暂无'),
                        firstRowText: rows[0] ? Array.from(rows[0].cells).map(cell => cell.textContent.trim()).join(' | ') : ''
                    };
                });
                
                console.log('\\n📊 历史记录显示验证:');
                console.log(`  表格行数: ${historyDisplayed.rowCount}`);
                console.log(`  有数据显示: ${historyDisplayed.hasData}`);
                if (historyDisplayed.firstRowText) {
                    console.log(`  第一行内容: ${historyDisplayed.firstRowText}`);
                }
                
                if (historyDisplayed.hasData) {
                    console.log('\\n🎉 派单历史功能完全正常！');
                } else {
                    console.log('\\n⚠️ 历史记录已添加但显示可能有问题');
                }
                
            } else {
                console.log('\\n❌ 派单历史记录未添加');
                
                // 检查可能的API错误
                const errorInfo = await page.evaluate(() => {
                    return {
                        modalStillOpen: document.getElementById('assignServiceModal') && document.getElementById('assignServiceModal').classList.contains('show'),
                        confirmBtnText: document.getElementById('confirmAssignBtn') ? document.getElementById('confirmAssignBtn').textContent : 'not found',
                        confirmBtnDisabled: document.getElementById('confirmAssignBtn') ? document.getElementById('confirmAssignBtn').disabled : 'not found',
                        selectedProtocol: selectedProtocol ? selectedProtocol.protocolName : 'none',
                        currentOrderId: currentOrderId || 'none'
                    };
                });
                
                console.log('🔍 错误诊断:');
                console.log(`  模态框仍打开: ${errorInfo.modalStillOpen}`);
                console.log(`  确认按钮文本: ${errorInfo.confirmBtnText}`);
                console.log(`  确认按钮禁用: ${errorInfo.confirmBtnDisabled}`);
                console.log(`  选中协议: ${errorInfo.selectedProtocol}`);
                console.log(`  当前订单ID: ${errorInfo.currentOrderId}`);
            }
            
        } else {
            console.log('❌ 无法选择操作员');
        }
        
        console.log('\\n⌚ 保持页面打开15秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testAssignmentComplete().catch(console.error);