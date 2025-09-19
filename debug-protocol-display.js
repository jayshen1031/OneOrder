const puppeteer = require('puppeteer');

async function debugProtocolDisplay() {
    console.log('🔍 调试协议匹配显示问题...');
    
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
            console.log(`📝 页面: ${text}`);
        });
        
        console.log('📖 加载服务派单页面...');
        await page.goto('http://localhost:8081/api/service-assignment.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📋 选择订单...');
        await page.select('#orderSelect', await page.evaluate(() => {
            const orderSelect = document.getElementById('orderSelect');
            return orderSelect.options[1].value;
        }));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🎯 打开派单模态框...');
        await page.click('.service-card:first-child button[onclick*="openAssignModal"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\\n🔍 检查模态框初始状态...');
        const initialState = await page.evaluate(() => {
            return {
                modalVisible: document.getElementById('assignServiceModal')?.classList.contains('show'),
                operatorSelectExists: !!document.getElementById('operatorSelect'),
                protocolMatchResultsExists: !!document.getElementById('protocolMatchResults'),
                protocolSelectExists: !!document.getElementById('protocolSelect'),
                selectedOperatorNameExists: !!document.getElementById('selectedOperatorName'),
                protocolMatchResultsContent: document.getElementById('protocolMatchResults')?.innerHTML || 'not found'
            };
        });
        
        console.log('📊 模态框初始状态:');
        console.log(`  模态框可见: ${initialState.modalVisible}`);
        console.log(`  操作员选择框存在: ${initialState.operatorSelectExists}`);
        console.log(`  协议匹配结果区域存在: ${initialState.protocolMatchResultsExists}`);
        console.log(`  协议选择框存在: ${initialState.protocolSelectExists}`);
        console.log(`  选中操作员名称显示存在: ${initialState.selectedOperatorNameExists}`);
        console.log(`  协议匹配结果初始内容: ${initialState.protocolMatchResultsContent.substring(0, 100)}...`);
        
        console.log('\\n📋 选择操作员...');
        const selectedOperatorInfo = await page.evaluate(() => {
            const operatorSelect = document.getElementById('operatorSelect');
            if (operatorSelect && operatorSelect.options.length > 1) {
                const selectedValue = operatorSelect.options[1].value;
                const selectedText = operatorSelect.options[1].textContent;
                return { value: selectedValue, text: selectedText };
            }
            return null;
        });
        
        if (selectedOperatorInfo) {
            console.log(`  将选择操作员: ${selectedOperatorInfo.text}`);
            
            // 选择操作员（这会触发 loadMatchingProtocols）
            await page.select('#operatorSelect', selectedOperatorInfo.value);
            
            console.log('⏳ 等待协议匹配加载...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('\\n🔍 检查协议匹配结果...');
            const protocolMatchState = await page.evaluate(() => {
                const protocolMatchResults = document.getElementById('protocolMatchResults');
                const selectedOperatorName = document.getElementById('selectedOperatorName');
                const protocolSelect = document.getElementById('protocolSelect');
                
                return {
                    matchResultsContent: protocolMatchResults ? protocolMatchResults.innerHTML : 'not found',
                    selectedOperatorNameText: selectedOperatorName ? selectedOperatorName.textContent : 'not found',
                    protocolOptionsCount: protocolSelect ? protocolSelect.options.length : 0,
                    protocolOptions: protocolSelect ? Array.from(protocolSelect.options).map(opt => opt.textContent) : [],
                    hasLoadingSpinner: protocolMatchResults ? protocolMatchResults.innerHTML.includes('spinner-border') : false,
                    hasErrorMessage: protocolMatchResults ? protocolMatchResults.innerHTML.includes('alert-warning') : false,
                    hasSuccessMessage: protocolMatchResults ? protocolMatchResults.innerHTML.includes('alert-success') : false
                };
            });
            
            console.log('📊 协议匹配状态:');
            console.log(`  选中操作员名称显示: ${protocolMatchState.selectedOperatorNameText}`);
            console.log(`  协议选项数量: ${protocolMatchState.protocolOptionsCount}`);
            console.log(`  有加载动画: ${protocolMatchState.hasLoadingSpinner}`);
            console.log(`  有错误消息: ${protocolMatchState.hasErrorMessage}`);
            console.log(`  有成功消息: ${protocolMatchState.hasSuccessMessage}`);
            
            if (protocolMatchState.protocolOptions.length > 0) {
                console.log('  协议选项:');
                protocolMatchState.protocolOptions.forEach((option, index) => {
                    console.log(`    ${index}: ${option}`);
                });
            }
            
            console.log(`\\n📄 协议匹配结果内容 (前200字符):`);
            console.log(protocolMatchState.matchResultsContent.substring(0, 200));
            
            if (protocolMatchState.protocolOptionsCount > 1) {
                console.log('\\n✅ 协议匹配功能正常工作');
                
                // 测试选择协议
                console.log('\\n📋 测试选择第一个协议...');
                await page.select('#protocolSelect', await page.evaluate(() => {
                    const protocolSelect = document.getElementById('protocolSelect');
                    return protocolSelect.options[1].value;
                }));
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const protocolDetailsState = await page.evaluate(() => {
                    const protocolDetails = document.getElementById('protocolDetails');
                    return {
                        protocolDetailsExists: !!protocolDetails,
                        protocolDetailsVisible: protocolDetails ? protocolDetails.style.display !== 'none' : false,
                        protocolDetailsContent: protocolDetails ? protocolDetails.innerHTML.substring(0, 200) : 'not found',
                        selectedProtocol: typeof selectedProtocol !== 'undefined' && selectedProtocol ? selectedProtocol.protocolName : 'not selected'
                    };
                });
                
                console.log('📋 协议详情状态:');
                console.log(`  协议详情区域存在: ${protocolDetailsState.protocolDetailsExists}`);
                console.log(`  协议详情可见: ${protocolDetailsState.protocolDetailsVisible}`);
                console.log(`  选中的协议: ${protocolDetailsState.selectedProtocol}`);
                console.log(`  协议详情内容 (前200字符): ${protocolDetailsState.protocolDetailsContent}`);
                
            } else {
                console.log('\\n❌ 协议匹配失败，没有可选协议');
            }
            
        } else {
            console.log('❌ 无法选择操作员');
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

debugProtocolDisplay().catch(console.error);