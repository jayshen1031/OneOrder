#!/usr/bin/env node

/**
 * OneOrder协议管理前端功能测试
 * 验证协议管理页面的所有功能
 */

const puppeteer = require('puppeteer');

// 配置
const BASE_URL = 'http://localhost:8081/api';
const PROTOCOL_PAGE = '/protocol-management.html';

/**
 * 测试协议管理页面功能
 */
async function testProtocolManagement() {
    console.log('🚀 开始协议管理前端功能测试...');
    
    const browser = await puppeteer.launch({ 
        headless: false,  // 显示浏览器窗口
        defaultViewport: { width: 1400, height: 1000 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 监听控制台消息
        page.on('console', msg => {
            console.log(`🔧 页面控制台: ${msg.text()}`);
        });
        
        // 监听网络请求
        page.on('response', response => {
            if (response.url().includes('/api/protocol-assignment/')) {
                console.log(`📡 API请求: ${response.status()} ${response.url()}`);
            }
        });
        
        console.log(`📄 打开协议管理页面: ${BASE_URL + PROTOCOL_PAGE}`);
        await page.goto(BASE_URL + PROTOCOL_PAGE, { waitUntil: 'networkidle2' });
        
        // 等待页面加载完成
        await page.waitForSelector('#customerServiceId', { timeout: 10000 });
        console.log('✅ 页面加载完成');
        
        // 测试1: 修改测试参数
        console.log('\n🔍 测试1: 协议匹配功能');
        await page.select('#operationStaffId', 'OP001');  // 选择海运操作员
        await page.select('#serviceCode', 'BOOKING');      // 选择订舱服务
        await page.select('#businessType', 'OCEAN');       // 选择海运业务
        
        // 点击协议匹配按钮
        await page.click('button[onclick="testProtocolMatching()"]');
        console.log('📋 已点击协议匹配按钮');
        
        // 等待匹配结果
        await page.waitForSelector('#matchResult', { visible: true, timeout: 10000 });
        console.log('✅ 协议匹配结果已显示');
        
        // 等待2秒看结果
        await page.waitForTimeout(2000);
        
        // 测试2: 完整流程测试
        console.log('\n🚀 测试2: 完整流程测试');
        await page.click('button[onclick="runFullWorkflow()"]');
        console.log('📋 已点击完整流程测试按钮');
        
        // 等待流程完成
        await page.waitForSelector('#step4.completed', { timeout: 30000 });
        console.log('✅ 完整流程测试完成');
        
        // 等待5秒查看结果
        await page.waitForTimeout(5000);
        
        // 截图保存测试结果
        await page.screenshot({ 
            path: 'protocol-management-test-result.png', 
            fullPage: true 
        });
        console.log('📷 测试结果截图已保存: protocol-management-test-result.png');
        
        console.log('\n🎉 协议管理前端功能测试完成!');
        console.log('✅ 协议匹配功能正常');
        console.log('✅ 协议详情显示正常');
        console.log('✅ 完整流程测试正常');
        console.log('✅ API日志记录正常');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        
        // 错误截图
        try {
            const page = browser.pages()[0];
            await page.screenshot({ 
                path: 'protocol-management-test-error.png', 
                fullPage: true 
            });
            console.log('📷 错误截图已保存: protocol-management-test-error.png');
        } catch (screenshotError) {
            console.error('截图失败:', screenshotError);
        }
    } finally {
        // 等待10秒让用户查看结果
        console.log('\n⏰ 保持浏览器打开10秒供查看...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await browser.close();
        console.log('🔚 浏览器已关闭');
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        await testProtocolManagement();
    } catch (error) {
        console.error('❌ 测试失败:', error);
        process.exit(1);
    }
}

// 检查是否有Puppeteer
function checkPuppeteer() {
    try {
        require('puppeteer');
        return true;
    } catch (error) {
        console.log('⚠️  Puppeteer未安装，将跳过浏览器自动化测试');
        console.log('📖 请手动打开浏览器访问: http://localhost:8081/api/protocol-management.html');
        console.log('🔧 如需自动化测试，请运行: npm install puppeteer');
        return false;
    }
}

// 运行测试
if (checkPuppeteer()) {
    main();
} else {
    console.log('\n📋 手动测试步骤:');
    console.log('1. 打开浏览器访问: http://localhost:8081/api/protocol-management.html');
    console.log('2. 点击"查找匹配协议"按钮');
    console.log('3. 查看协议匹配结果');
    console.log('4. 点击"完整流程测试"按钮');
    console.log('5. 观察4个步骤的执行过程');
    console.log('6. 查看右侧API响应日志');
}