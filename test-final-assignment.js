const puppeteer = require('puppeteer');

async function testFinalAssignment() {
    console.log('🧪 最终派单历史测试...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听关键控制台消息
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('派单历史') || text.includes('assignmentHistory') || text.includes('API不可用') || text.includes('模拟数据')) {
                console.log(`📝 页面: ${text}`);
            }
        });
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📋 选择第一个订单...');
        await page.select('#orderSelect', await page.evaluate(() => {
            const orderSelect = document.getElementById('orderSelect');
            return orderSelect.options[1].value;
        }));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📊 派单前历史记录数量...');
        const beforeCount = await page.evaluate(() => {
            return assignmentHistory ? assignmentHistory.length : 0;
        });
        console.log(`  历史记录: ${beforeCount} 条`);
        
        console.log('\\n🎯 打开派单模态框...');
        await page.click('.service-card:first-child button[onclick*="openAssignModal"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔧 选择操作员...');
        await page.select('#operatorSelect', await page.evaluate(() => {
            const operatorSelect = document.getElementById('operatorSelect');
            return operatorSelect.options[1].value; // 选择第一个操作员
        }));
        
        console.log('⏳ 等待协议加载...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 检查协议是否加载成功
        const protocolState = await page.evaluate(() => {
            const protocolSelect = document.getElementById('protocolSelect');
            return {
                exists: !!protocolSelect,
                optionCount: protocolSelect ? protocolSelect.options.length : 0,
                options: protocolSelect ? Array.from(protocolSelect.options).map(opt => opt.textContent) : []
            };
        });
        
        console.log('📋 协议状态:');
        console.log(`  协议选择框存在: ${protocolState.exists}`);
        console.log(`  协议选项数量: ${protocolState.optionCount}`);
        protocolState.options.forEach((option, index) => {
            console.log(`    ${index}: ${option}`);
        });
        
        if (protocolState.optionCount > 1) {
            console.log('\\n📋 选择第一个协议...');
            await page.select('#protocolSelect', await page.evaluate(() => {
                const protocolSelect = document.getElementById('protocolSelect');
                return protocolSelect.options[1].value; // 选择第一个实际协议
            }));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ 协议选择完成');
            
            console.log('\\n📝 添加备注...');
            await page.type('#assignmentNotes', '测试派单历史记录 - 用户 张美华');
            
            console.log('\\n🚀 执行派单...');
            
            // 检查确认按钮状态
            const confirmBtnState = await page.evaluate(() => {
                const btn = document.getElementById('confirmAssignBtn');
                return {
                    exists: !!btn,
                    disabled: btn ? btn.disabled : null,
                    text: btn ? btn.textContent.trim() : null,
                    visible: btn ? btn.style.display !== 'none' : null
                };
            });
            
            console.log('🔘 确认按钮状态:', confirmBtnState);
            
            if (confirmBtnState.exists && !confirmBtnState.disabled) {
                await page.click('#confirmAssignBtn');
                
                console.log('⏳ 等待派单处理...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                console.log('\\n📊 检查派单后历史记录...');
                const afterInfo = await page.evaluate(() => {
                    return {
                        historyCount: assignmentHistory ? assignmentHistory.length : 0,
                        latestRecord: assignmentHistory && assignmentHistory.length > 0 ? {
                            id: assignmentHistory[0].id,
                            orderNo: assignmentHistory[0].orderNo,
                            customerService: assignmentHistory[0].customerService,
                            serviceName: assignmentHistory[0].results[0]?.serviceName,
                            operatorName: assignmentHistory[0].results[0]?.operatorName,
                            status: assignmentHistory[0].results[0]?.status,
                            notes: assignmentHistory[0].results[0]?.notes
                        } : null
                    };
                });
                
                console.log(`  派单后历史记录: ${afterInfo.historyCount} 条`);
                
                if (afterInfo.historyCount > beforeCount) {
                    console.log('\\n🎉 派单成功！历史记录已添加！');
                    console.log('📝 最新记录详情:');
                    console.log(`  记录ID: ${afterInfo.latestRecord.id}`);
                    console.log(`  订单号: ${afterInfo.latestRecord.orderNo}`);
                    console.log(`  客服: ${afterInfo.latestRecord.customerService}`);
                    console.log(`  服务: ${afterInfo.latestRecord.serviceName}`);
                    console.log(`  操作员: ${afterInfo.latestRecord.operatorName}`);
                    console.log(`  状态: ${afterInfo.latestRecord.status}`);
                    console.log(`  备注: ${afterInfo.latestRecord.notes}`);
                    
                    console.log('\\n📋 验证历史记录显示功能...');
                    
                    // 切换到历史标签
                    await page.click('#history-tab');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // 加载历史记录
                    await page.click('button[onclick="loadAssignmentHistory()"]');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // 检查表格显示
                    const historyDisplay = await page.evaluate(() => {
                        const historyTable = document.getElementById('historyTable');
                        const rows = historyTable.querySelectorAll('tr');
                        
                        return {
                            tableExists: !!historyTable,
                            rowCount: rows.length,
                            hasDataRows: rows.length > 0 && !rows[0].textContent.includes('暂无'),
                            firstRowData: rows[0] ? Array.from(rows[0].cells).map(cell => cell.textContent.trim()) : []
                        };
                    });
                    
                    console.log('\\n📊 历史记录显示结果:');
                    console.log(`  表格存在: ${historyDisplay.tableExists}`);
                    console.log(`  数据行数: ${historyDisplay.rowCount}`);
                    console.log(`  有数据显示: ${historyDisplay.hasDataRows}`);
                    
                    if (historyDisplay.hasDataRows && historyDisplay.firstRowData.length > 0) {
                        console.log('  第一行数据:');
                        historyDisplay.firstRowData.forEach((cell, index) => {
                            console.log(`    列${index + 1}: ${cell}`);
                        });
                        
                        console.log('\\n✅ 派单历史功能完全正常！');
                        console.log('🔍 问题已解决：派单历史记录正常添加和显示');
                        
                    } else {
                        console.log('\\n⚠️ 历史记录已添加但显示可能有问题');
                    }
                    
                } else {
                    console.log('\\n❌ 派单历史记录未添加');
                    
                    // 检查可能的错误
                    const errorDiag = await page.evaluate(() => {
                        return {
                            modalOpen: document.getElementById('assignServiceModal')?.classList.contains('show'),
                            buttonText: document.getElementById('confirmAssignBtn')?.textContent,
                            selectedProtocol: selectedProtocol ? selectedProtocol.protocolName : 'none'
                        };
                    });
                    
                    console.log('🔍 错误诊断:', errorDiag);
                }
                
            } else {
                console.log('❌ 确认按钮不可用，无法执行派单');
            }
            
        } else {
            console.log('❌ 没有可选择的协议');
        }
        
        console.log('\\n⌚ 保持页面打开10秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 测试完成');
    }
}

testFinalAssignment().catch(console.error);