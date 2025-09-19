const puppeteer = require('puppeteer');

async function testAssignmentHistoryDetailed() {
    console.log('🧪 详细测试派单历史功能...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听所有控制台消息
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('派单历史') || text.includes('assignmentHistory') || text.includes('历史记录')) {
                console.log('📝 页面:', text);
            }
        });
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 检查assignmentHistory变量初始状态...');
        const initialHistoryState = await page.evaluate(() => {
            return {
                historyExists: typeof assignmentHistory !== 'undefined',
                historyLength: assignmentHistory ? assignmentHistory.length : -1,
                historyContent: assignmentHistory || 'undefined'
            };
        });
        
        console.log('📊 初始历史状态:');
        console.log(`  变量存在: ${initialHistoryState.historyExists}`);
        console.log(`  记录数量: ${initialHistoryState.historyLength}`);
        console.log(`  内容: ${JSON.stringify(initialHistoryState.historyContent)}`);
        
        console.log('\\n📋 切换到派单历史标签...');
        await page.click('#history-tab');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔄 点击加载派单历史按钮...');
        await page.click('button[onclick="loadAssignmentHistory()"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查历史表格内容
        const historyTableContent = await page.evaluate(() => {
            const historyTable = document.getElementById('historyTable');
            if (!historyTable) return { error: '历史表格不存在' };
            
            const rows = historyTable.querySelectorAll('tr');
            const rowContents = Array.from(rows).map(row => {
                const cells = Array.from(row.cells).map(cell => cell.textContent.trim());
                return cells;
            });
            
            return {
                tableExists: true,
                rowCount: rows.length,
                rows: rowContents,
                innerHTML: historyTable.innerHTML.substring(0, 300)
            };
        });
        
        console.log('\\n📜 派单历史表格状态:');
        console.log(`  表格存在: ${historyTableContent.tableExists}`);
        console.log(`  行数: ${historyTableContent.rowCount}`);
        if (historyTableContent.rows && historyTableContent.rows.length > 0) {
            historyTableContent.rows.forEach((row, index) => {
                console.log(`  行${index + 1}: ${row.join(' | ')}`);
            });
        }
        console.log(`\\n  HTML内容(前300字符): ${historyTableContent.innerHTML}`);
        
        console.log('\\n🎯 模拟添加一条派单历史记录...');
        const mockHistoryResult = await page.evaluate(() => {
            try {
                // 模拟添加一条历史记录
                const mockRecord = {
                    id: `ASS${Date.now()}`,
                    orderId: 'TEST001',
                    orderNo: 'TEST-ORDER-001',
                    assignTime: new Date().toISOString(),
                    customerService: '张美华',
                    successCount: 1,
                    failedCount: 0,
                    results: [{
                        serviceCode: 'BOOKING',
                        serviceName: '订舱服务',
                        operatorId: 'OP001',
                        operatorName: '陈师傅',
                        department: '海运操作',
                        protocolId: 'PROTOCOL001',
                        protocolName: '标准海运协议',
                        commissionRate: '3.5%',
                        status: 'SUCCESS',
                        notes: '测试派单记录'
                    }],
                    operator: '手动单个派单'
                };
                
                assignmentHistory.unshift(mockRecord);
                console.log('派单历史已添加测试记录:', mockRecord);
                
                // 重新加载历史表格
                loadAssignmentHistory();
                
                return {
                    success: true,
                    newHistoryLength: assignmentHistory.length,
                    addedRecord: mockRecord
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        console.log('✅ 模拟添加结果:', mockHistoryResult);
        
        // 再次检查表格内容
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedTableContent = await page.evaluate(() => {
            const historyTable = document.getElementById('historyTable');
            const rows = historyTable.querySelectorAll('tr');
            return {
                rowCount: rows.length,
                hasDataRows: rows.length > 1 || (rows.length === 1 && !rows[0].textContent.includes('暂无'))
            };
        });
        
        console.log('\\n📊 更新后的表格状态:');
        console.log(`  行数: ${updatedTableContent.rowCount}`);
        console.log(`  有数据行: ${updatedTableContent.hasDataRows}`);
        
        console.log('\\n⌚ 保持页面打开10秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testAssignmentHistoryDetailed().catch(console.error);