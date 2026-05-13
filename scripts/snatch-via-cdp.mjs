import { chromium } from 'playwright';

async function snatch() {
  console.log('📡 正在深度扫描 Comet 浏览器标签页...');
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // 使用更强大的 targets() 扫描方式
    const targets = browser.targets();
    let snatchedCount = 0;

    for (const target of targets) {
      if (target.type() === 'page') {
        const page = await target.page();
        if (!page) continue;
        
        const url = page.url();
        console.log(`🔗 扫描到页面: ${url}`);

        if (url.includes('deepseek.com')) {
          console.log(`🌐 发现 DeepSeek 页面: ${url}`);
          
          const rawToken = await page.evaluate(() => {
            function clean(v) {
              if (!v) return null;
              try {
                const p = JSON.parse(v);
                if (p && p.value) v = p.value;
              } catch(e) {}
              return (v && v.startsWith('at-')) ? v : null;
            }
            return clean(localStorage.getItem('token')) || clean(localStorage.getItem('userToken'));
          });

          if (rawToken) {
            console.log(`✅ 成功拿到 Token: ${rawToken.substring(0, 10)}...`);
            
            const email = await page.evaluate(() => {
              try {
                return JSON.parse(localStorage.getItem('user')).email;
              } catch(e) { return null; }
            });

            if (email) {
              console.log(`📧 对应账户: ${email}`);
              const res = await fetch('http://localhost:5001/admin/accounts/capture-token', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer 744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501'
                },
                body: JSON.stringify({ email, token: rawToken })
              });
              if (res.ok) {
                console.log('🚀 已成功同步到本地系统！');
                snatchedCount++;
              }
            }
          }
        }
      }
    }

    if (snatchedCount === 0) {
      console.log('⚠️  未发现有效的登录状态。');
    } else {
      console.log(`🎉 抓取完成！`);
    }

    await browser.close();
  } catch (err) {
    console.error(`❌ 连接失败: ${err.message}`);
  }
}

snatch();
