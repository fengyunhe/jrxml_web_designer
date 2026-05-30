import { chromium } from 'playwright';

async function quickTest() {
  console.log('开始快速测试...');

  try {
    // 启动浏览器
    console.log('启动浏览器...');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 访问设计器
    console.log('访问设计器...');
    await page.goto('http://localhost:5173');

    // 等待页面加载
    console.log('等待页面加载...');
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);

    // 检查是否有错误
    const errorMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorMessages.push(msg.text());
      }
    });

    // 等待一下看看有没有错误
    await page.waitForTimeout(3000);

    if (errorMessages.length > 0) {
      console.log('发现错误:');
      errorMessages.forEach(msg => console.log(`  - ${msg}`));
    } else {
      console.log('没有发现错误');
    }

    // 截图
    console.log('保存截图...');
    await page.screenshot({ path: '/tmp/quick-test-screenshot.png' });
    console.log('截图已保存: /tmp/quick-test-screenshot.png');

    // 关闭浏览器
    await browser.close();
    console.log('测试完成');

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

quickTest();
