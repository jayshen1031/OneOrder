const puppeteer = require('puppeteer');

async function debugServiceStatus() {
    console.log('🔍 调试服务状态和派单按钮显示...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // 等待页面初始化
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📋 选择第一个订单...');
        await page.evaluate(() => {
            const orderSelect = document.getElementById('orderSelect');
            if (orderSelect && orderSelect.options.length > 1) {
                orderSelect.selectedIndex = 1;
                orderSelect.dispatchEvent(new Event('change'));
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔍 检查服务详细状态...');
        const serviceDetails = await page.evaluate(() => {
            return {
                servicesCount: currentServices ? currentServices.length : 0,
                services: currentServices ? currentServices.map(service => ({
                    serviceCode: service.serviceCode,
                    serviceName: service.serviceName,
                    status: service.status,
                    estimatedFee: service.estimatedFee,
                    estimatedHours: service.estimatedHours,
                    priority: service.priority
                })) : []
            };
        });
        
        console.log('📊 服务详情:');
        console.log(`  服务总数: ${serviceDetails.servicesCount}`);
        
        if (serviceDetails.services.length > 0) {
            serviceDetails.services.forEach((service, index) => {
                console.log(`  服务${index + 1}:`);
                console.log(`    代码: ${service.serviceCode}`);
                console.log(`    名称: ${service.serviceName}`);
                console.log(`    状态: ${service.status}`);
                console.log(`    费用: ¥${service.estimatedFee}`);
                console.log(`    工期: ${service.estimatedHours}小时`);
                console.log(`    优先级: P${service.priority}`);
                console.log(`    应显示派单按钮: ${service.status === 'PENDING' ? '是' : '否'}`);
            });
        }
        
        console.log('\\n🔍 检查实际DOM中的按钮...');
        const buttonDetails = await page.evaluate(() => {
            const serviceCards = document.querySelectorAll('.service-card');
            const buttons = [];
            
            serviceCards.forEach((card, index) => {
                const assignBtn = card.querySelector('button[onclick*="openAssignModal"]');
                const viewBtn = card.querySelector('button[onclick*="viewAssignmentDetail"]');
                const statusBadge = card.querySelector('.status-badge');
                
                buttons.push({
                    cardIndex: index,
                    hasAssignBtn: !!assignBtn,
                    hasViewBtn: !!viewBtn,
                    assignBtnText: assignBtn ? assignBtn.textContent.trim() : null,
                    statusText: statusBadge ? statusBadge.textContent.trim() : null,
                    statusClass: statusBadge ? statusBadge.className : null
                });
            });
            
            return buttons;
        });
        
        console.log('\\n🎮 DOM按钮状态:');
        buttonDetails.forEach((btn, index) => {
            console.log(`  卡片${index + 1}:`);
            console.log(`    状态显示: ${btn.statusText} (${btn.statusClass})`);
            console.log(`    有派单按钮: ${btn.hasAssignBtn}`);
            console.log(`    有查看按钮: ${btn.hasViewBtn}`);
            if (btn.assignBtnText) {
                console.log(`    派单按钮文本: ${btn.assignBtnText}`);
            }
        });
        
        // 如果有PENDING状态的服务，尝试修改状态来测试
        console.log('\\n🧪 尝试手动修改服务状态为PENDING...');
        const modifyResult = await page.evaluate(() => {
            if (currentServices && currentServices.length > 0) {
                const originalStatus = currentServices[0].status;
                currentServices[0].status = 'PENDING';
                
                // 重新显示服务列表
                displayServices(currentServices);
                
                return {
                    success: true,
                    originalStatus: originalStatus,
                    newStatus: 'PENDING'
                };
            }
            return { success: false, message: '没有服务可修改' };
        });
        
        if (modifyResult.success) {
            console.log(`✅ 已修改第一个服务状态: ${modifyResult.originalStatus} → ${modifyResult.newStatus}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 重新检查按钮
            const updatedButtons = await page.evaluate(() => {
                const assignBtns = document.querySelectorAll('button[onclick*="openAssignModal"]');
                return assignBtns.length;
            });
            
            console.log(`🎯 修改后的派单按钮数量: ${updatedButtons}`);
            
            if (updatedButtons > 0) {
                console.log('\\n🚀 测试点击派单按钮...');
                try {
                    await page.click('button[onclick*="openAssignModal"]');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const modalVisible = await page.evaluate(() => {
                        const modal = document.getElementById('assignServiceModal');
                        return modal && modal.classList.contains('show');
                    });
                    
                    console.log(`📋 派单模态框显示: ${modalVisible}`);
                    
                    if (modalVisible) {
                        console.log('\\n🔧 填写派单表单...');
                        
                        // 选择操作员
                        await page.evaluate(() => {
                            const operatorSelect = document.getElementById('operatorSelect');
                            if (operatorSelect && operatorSelect.options.length > 1) {
                                operatorSelect.selectedIndex = 1;
                                operatorSelect.dispatchEvent(new Event('change'));
                            }
                        });
                        
                        // 选择协议
                        await page.evaluate(() => {
                            const protocolCards = document.querySelectorAll('.protocol-card');
                            if (protocolCards.length > 0) {
                                protocolCards[0].click();
                            }
                        });
                        
                        // 添加备注
                        await page.type('#assignmentNotes', '测试派单历史记录功能');
                        
                        console.log('\\n📊 检查派单前的历史记录...');
                        const beforeHistory = await page.evaluate(() => {
                            return {
                                length: assignmentHistory ? assignmentHistory.length : 0,
                                content: assignmentHistory || []
                            };
                        });
                        
                        console.log(`  派单前历史记录数: ${beforeHistory.length}`);
                        
                        console.log('\\n🚀 执行派单...');
                        await page.click('#confirmAssignBtn');
                        
                        // 等待API响应
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        console.log('\\n📊 检查派单后的历史记录...');
                        const afterHistory = await page.evaluate(() => {
                            return {
                                length: assignmentHistory ? assignmentHistory.length : 0,
                                latest: assignmentHistory && assignmentHistory.length > 0 ? assignmentHistory[0] : null
                            };
                        });
                        
                        console.log(`  派单后历史记录数: ${afterHistory.length}`);
                        
                        if (afterHistory.length > beforeHistory.length) {
                            console.log('✅ 派单历史记录成功添加！');
                            console.log('📝 最新记录:', JSON.stringify(afterHistory.latest, null, 2));
                        } else {
                            console.log('❌ 派单历史记录未添加');
                            
                            // 检查API响应
                            const apiError = await page.evaluate(() => {
                                // 检查是否有API错误信息在控制台
                                return {
                                    confirmBtnText: document.getElementById('confirmAssignBtn') ? document.getElementById('confirmAssignBtn').textContent : 'not found',
                                    confirmBtnDisabled: document.getElementById('confirmAssignBtn') ? document.getElementById('confirmAssignBtn').disabled : 'not found'
                                };
                            });
                            
                            console.log('🔍 API响应检查:', apiError);
                        }
                    }
                } catch (clickError) {
                    console.log(`❌ 点击派单按钮失败: ${clickError.message}`);
                }
            }
        } else {
            console.log(`❌ 修改服务状态失败: ${modifyResult.message}`);
        }
        
        console.log('\\n⌚ 保持页面打开10秒进行观察...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 调试失败:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 调试完成');
    }
}

debugServiceStatus().catch(console.error);