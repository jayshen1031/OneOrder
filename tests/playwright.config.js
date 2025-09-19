// Playwright配置文件
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  /* 并行运行测试 */
  fullyParallel: true,
  /* 失败时不重试 */
  retries: 0,
  /* 使用的worker数量 */
  workers: process.env.CI ? 1 : undefined,
  /* 报告配置 */
  reporter: [
    ['html', { outputFolder: 'test-reports/html' }],
    ['junit', { outputFile: 'test-reports/junit.xml' }],
    ['list']
  ],
  /* 全局设置 */
  use: {
    /* 基础URL */
    baseURL: 'http://localhost:8081',
    /* 截图设置 */
    screenshot: 'only-on-failure',
    /* 视频录制 */
    video: 'retain-on-failure',
    /* 追踪 */
    trace: 'on-first-retry',
  },

  /* 配置不同浏览器的测试项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* 启动本地服务器 */
  webServer: {
    command: 'cd /Users/jay/Documents/baidu/projects/OneOrder && mvn spring-boot:run -Dspring-boot.run.profiles=test',
    port: 8081,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2分钟启动超时
  },
});