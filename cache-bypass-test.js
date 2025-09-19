const { chromium } = require('playwright');

(async () => {
  console.log('🔍 测试OneOrder内部协议功能（绕过缓存）...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 禁用缓存
    await context.addInitScript(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
    });
    
    // 访问页面时添加缓存清除参数
    console.log('📍 访问OneOrder主页面（强制刷新）');
    await page.goto(`http://localhost:8081/api/freight-order.html?t=${Date.now()}`, {
      waitUntil: 'networkidle'
    });
    
    // 强制重新加载页面
    await page.reload({ waitUntil: 'networkidle' });
    
    console.log('📍 检查页面基本信息');
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 检查页面源代码
    console.log('📍 分析页面内容...');
    const content = await page.content();
    
    // 检查关键字
    const keywords = ['protocols', 'tasks', '内部协议', '任务管理'];
    keywords.forEach(keyword => {
      const found = content.includes(keyword);
      console.log(`${found ? '✅' : '❌'} 页面包含"${keyword}": ${found}`);
    });
    
    // 查找所有导航链接
    console.log('📍 检查导航结构（详细分析）');
    const navLinksInfo = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.nav-link'));
      return links.map((link, index) => ({
        index: index + 1,
        text: link.textContent?.trim(),
        href: link.getAttribute('href'),
        onclick: link.getAttribute('onclick'),
        visible: link.offsetParent !== null
      }));
    });
    
    console.log(`📋 找到 ${navLinksInfo.length} 个导航链接:`);
    navLinksInfo.forEach(link => {
      console.log(`  ${link.index}. "${link.text}" -> ${link.href} (onclick: ${link.onclick}) [${link.visible ? '可见' : '隐藏'}]`);
    });
    
    // 检查HTML源代码中的特定模式
    console.log('📍 搜索HTML中的关键元素...');
    const elementChecks = [
      { pattern: /showSection\(['"]protocols['"]/, name: '协议导航函数调用' },
      { pattern: /showSection\(['"]tasks['"]/, name: '任务导航函数调用' },
      { pattern: /id\s*=\s*['"]protocols['"]/, name: '协议页面ID' },
      { pattern: /id\s*=\s*['"]tasks['"]/, name: '任务页面ID' },
      { pattern: /loadAllProtocols/, name: '加载协议函数' },
      { pattern: /matchProtocols/, name: '匹配协议函数' }
    ];
    
    elementChecks.forEach(check => {
      const found = check.pattern.test(content);
      console.log(`${found ? '✅' : '❌'} ${check.name}: ${found ? '存在' : '不存在'}`);
    });
    
    // 尝试手动添加协议导航进行测试
    console.log('📍 手动测试：尝试添加协议导航');
    await page.evaluate(() => {
      // 检查是否已存在协议导航
      const existingProtocolNav = document.querySelector('a[href="#protocols"]');
      if (!existingProtocolNav) {
        console.log('未找到协议导航，尝试手动添加');
        
        // 找到导航列表
        const navList = document.querySelector('.nav.flex-column');
        if (navList) {
          // 创建协议导航
          const protocolNav = document.createElement('li');
          protocolNav.className = 'nav-item';
          protocolNav.innerHTML = `
            <a class="nav-link" href="#protocols" onclick="alert('协议功能测试')">
                <i class="fas fa-handshake me-2"></i>
                内部协议 (测试)
            </a>
          `;
          
          // 插入到清分管理之前
          const clearingNav = Array.from(navList.children).find(li => 
            li.querySelector('a[href="#clearing"]')
          );
          
          if (clearingNav) {
            navList.insertBefore(protocolNav, clearingNav);
            console.log('手动添加协议导航成功');
            return true;
          }
        }
      }
      return false;
    });
    
    // 再次检查导航
    console.log('📍 重新检查导航（添加测试导航后）');
    const updatedNavLinks = await page.locator('.nav-link').allTextContents();
    console.log('更新后的导航链接:', updatedNavLinks);
    
    // 尝试点击协议相关链接
    console.log('📍 测试协议导航点击');
    try {
      const protocolLink = page.locator('a[href="#protocols"]');
      const count = await protocolLink.count();
      if (count > 0) {
        await protocolLink.first().click();
        console.log('✅ 成功点击协议导航');
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️  协议导航不存在');
      }
    } catch (error) {
      console.log('⚠️  点击协议导航失败:', error.message);
    }
    
    // 保存当前状态截图
    await page.screenshot({ 
      path: '/Users/jay/Documents/baidu/projects/OneOrder/cache-bypass-test.png',
      fullPage: true 
    });
    console.log('📸 测试截图已保存');
    
    // 最后检查文件时间戳
    console.log('📍 检查文件最后修改时间');
    const stats = require('fs').statSync('/Users/jay/Documents/baidu/projects/OneOrder/src/main/resources/static/freight-order.html');
    console.log('📅 freight-order.html 最后修改时间:', stats.mtime.toLocaleString());
    
    console.log('📍 测试完成，保持浏览器打开10秒观察...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 测试错误:', error.message);
  } finally {
    await browser.close();
    console.log('🎉 缓存绕过测试完成！');
  }
})();