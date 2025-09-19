#!/usr/bin/env node
/**
 * OneOrder 接派单流程测试运行器
 * 
 * 使用方法:
 * node tests/test-runner.js [--headless] [--browser=chromium|firefox|webkit] [--test=pattern]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 解析命令行参数
const args = process.argv.slice(2);
const headless = args.includes('--headless');
const browserMatch = args.find(arg => arg.startsWith('--browser='));
const browser = browserMatch ? browserMatch.split('=')[1] : 'chromium';
const testMatch = args.find(arg => arg.startsWith('--test='));
const testPattern = testMatch ? testMatch.split('=')[1] : '';

console.log('🚀 OneOrder 接派单流程测试启动器');
console.log('=====================================');

// 检查 Playwright 是否已安装
function checkPlaywrightInstallation() {
    try {
        require('@playwright/test');
        console.log('✅ Playwright 已安装');
        return true;
    } catch (error) {
        console.log('❌ Playwright 未安装，请运行: npm install @playwright/test');
        return false;
    }
}

// 检查 OneOrder 应用是否运行
async function checkApplicationStatus() {
    try {
        const response = await fetch('http://localhost:8081/api/freight-order.html');
        if (response.ok) {
            console.log('✅ OneOrder 应用正在运行 (http://localhost:8081)');
            return true;
        }
    } catch (error) {
        console.log('❌ OneOrder 应用未运行，请先启动应用:');
        console.log('   cd /Users/jay/Documents/baidu/projects/OneOrder');
        console.log('   mvn spring-boot:run');
        return false;
    }
}

// 运行测试
function runTests() {
    console.log('\n🧪 开始执行测试...');
    console.log(`📋 测试配置:`);
    console.log(`   浏览器: ${browser}`);
    console.log(`   无头模式: ${headless ? '是' : '否'}`);
    console.log(`   测试模式: ${testPattern || '全部测试'}`);
    
    const playwrightArgs = [
        'npx', 'playwright', 'test',
        '--project', browser,
        headless ? '--headed=false' : '--headed=true'
    ];
    
    if (testPattern) {
        playwrightArgs.push('--grep', testPattern);
    }
    
    // 设置环境变量
    const env = {
        ...process.env,
        CI: 'false',
        HEADLESS: headless.toString()
    };
    
    const testProcess = spawn(playwrightArgs[0], playwrightArgs.slice(1), {
        stdio: 'inherit',
        env: env,
        cwd: path.resolve(__dirname, '..')
    });
    
    testProcess.on('close', (code) => {
        console.log('\n📊 测试执行完成');
        console.log('=====================================');
        
        if (code === 0) {
            console.log('🎉 所有测试通过！');
            console.log('\n📋 测试报告:');
            console.log('   HTML报告: test-reports/html/index.html');
            console.log('   JUnit报告: test-reports/junit.xml');
        } else {
            console.log('❌ 测试失败，请查看详细报告');
            console.log('\n📋 故障排除:');
            console.log('   1. 检查应用是否正常启动');
            console.log('   2. 检查数据库连接');
            console.log('   3. 查看测试日志和截图');
        }
        
        process.exit(code);
    });
    
    testProcess.on('error', (error) => {
        console.error('❌ 测试执行失败:', error.message);
        process.exit(1);
    });
}

// 主函数
async function main() {
    console.log('\n🔍 环境检查...');
    
    // 检查 Playwright
    if (!checkPlaywrightInstallation()) {
        process.exit(1);
    }
    
    // 检查应用状态
    if (!(await checkApplicationStatus())) {
        console.log('\n💡 提示: 你可以使用以下命令启动应用:');
        console.log('   1. 启动数据库服务');
        console.log('   2. cd /Users/jay/Documents/baidu/projects/OneOrder');
        console.log('   3. mvn spring-boot:run');
        console.log('   4. 等待应用启动完成后重新运行测试');
        process.exit(1);
    }
    
    // 创建测试报告目录
    const reportsDir = path.resolve(__dirname, '..', 'test-reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
        console.log('✅ 测试报告目录已创建');
    }
    
    // 运行测试
    runTests();
}

// 显示帮助信息
function showHelp() {
    console.log(`
OneOrder 接派单流程测试运行器

用法:
  node tests/test-runner.js [选项]

选项:
  --headless              无头模式运行（不显示浏览器窗口）
  --browser=<browser>     指定浏览器 (chromium|firefox|webkit)
  --test=<pattern>        运行匹配模式的测试
  --help                  显示此帮助信息

示例:
  node tests/test-runner.js                              # 运行所有测试
  node tests/test-runner.js --headless                   # 无头模式运行
  node tests/test-runner.js --browser=firefox            # 使用Firefox运行
  node tests/test-runner.js --test="客服接单"            # 只运行客服接单相关测试
  node tests/test-runner.js --headless --test="API"      # 无头模式运行API测试

测试文件:
  tests/e2e/customer-service-workflow.spec.js    # 客服接单完整流程
  tests/e2e/api-integration.spec.js              # API集成测试  
  tests/e2e/operation-staff-workflow.spec.js     # 操作人员工作流程

更多信息请查看: tests/playwright.config.js
`);
}

// 处理命令行参数
if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

// 执行主函数
main().catch(error => {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
});

module.exports = {
    checkPlaywrightInstallation,
    checkApplicationStatus,
    runTests
};