import { chromium } from 'playwright';

async function snatch() {
  console.log('📡 正在全量扫描您的 Comet 标签页...');
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // 修正后的扫描逻辑
    const contexts = browser.contexts();
    let snatchedCount = 0;

    for (const context of contexts) {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        console.log(`🔗 检查页面: ${url}`);

        if (url.includes('deepseek.com')) {
          console.log(`✨ 锁定 DeepSeek 页面: ${url}`);
          
          const debugData = await page.evaluate(() => {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
            return { keys };
          });
          console.log(`🔍 该页面的 Keys: ${debugData.keys.join(', ')}`);
          
          const rawToken = await page.evaluate(() => {
            function clean(v) {
              if (!v) return null;
              try {
                const p = JSON.parse(v);
                if (p && p.value) v = p.value;
              } catch(e) {}
              // 只要长度超过 20 就认为是 Token
              return (v && v.length > 20) ? v : null;
            }
            return clean(localStorage.getItem('token')) || 
                   clean(localStorage.getItem('userToken'));
          });

          if (rawToken) {
            console.log(`✅ 成功！拿到 Token: ${rawToken.substring(0, 10)}...`);
            
            const email = await page.evaluate(() => {
              try { return JSON.parse(localStorage.getItem('user')).email; } catch(e) {}
              return 'zengtao227@gmail.com';
            });

            const res = await fetch('http://localhost:5001/admin/accounts/capture-token', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501'
              },
              body: JSON.stringify({ email, token: rawToken })
            });

            if (res.ok) {
              console.log(`🚀 已同步账户: ${email}`);
              snatchedCount++;
            }
          }
        }
      }
    }

    if (snatchedCount > 0) {
      console.log(`\n🎉 抓取成功！`);
    } else {
      console.log('\n⚠️  未发现 DeepSeek 登录页面，请确保浏览器里开着 DeepSeek 对话框。');
    }

    await browser.close();
  } catch (err) {
    console.error(`❌ 连接失败: ${err.message}`);
  }
}

snatch();
