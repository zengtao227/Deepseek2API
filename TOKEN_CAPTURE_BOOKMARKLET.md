# 🔐 DeepSeek Token 一键捕获工具

## 📊 当前状态

- ✅ **13个账户已有token**
- ❌ **1个账户缺失token**: leo.rlzeng@gmail.com

## 🚀 快速开始

### 方法1：使用浏览器打开安装页面（推荐）

```bash
open scripts/bookmarklet-token-capture.html
```

然后按照页面上的步骤操作即可。

### 方法2：手动创建书签

1. 在Comet浏览器中，右键点击书签栏，选择"添加书签"
2. 名称填写：`📥 捕获DeepSeek Token`
3. URL填写以下代码（完整复制）：

```javascript
javascript:(function(){const DS2API_URL='http://localhost:5001';const ADMIN_KEY='744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501';const ACCOUNTS=['zengtao227@gmail.com','zengtao227.de@gmail.com','zengtao227.us@gmail.com','zengtao227.sg@gmail.com','zengqhxf@gmail.com','liyue828@gmail.com','liyue828.de@gmail.com','mia.rhzeng@gmail.com','leo.rlzeng@gmail.com','9pgyxsfby5@privaterelay.appleid.com','yqrt7tjg85@privaterelay.appleid.com','xhg4h79pph@privaterelay.appleid.com','n6vst2bmsc@privaterelay.appleid.com'];function findToken(){const keys=['token','auth_token','accessToken','access_token','deepseek_token','ds_token','userToken'];for(const k of keys){const v=localStorage.getItem(k);if(v&&v.length>20){try{const parsed=JSON.parse(v);if(parsed.value&&parsed.value.length>20)return parsed.value}catch{}return v}}for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.toLowerCase().includes('token')){const val=localStorage.getItem(key);if(val&&val.length>20){try{const parsed=JSON.parse(val);if(parsed.value&&parsed.value.length>20)return parsed.value}catch{}return val}}}return null}const token=findToken();if(!token){alert('❌ 未找到token，请先登录DeepSeek');return}const preview=token.substring(0,6)+'****'+token.substring(token.length-2);const email=prompt('🔑 找到Token: '+preview+'\n\n请选择账户（输入序号）:\n\n'+ACCOUNTS.map((e,i)=>(i+1)+'. '+e).join('\n'));if(!email){return}let selectedEmail;const num=parseInt(email);if(num>=1&&num<=ACCOUNTS.length){selectedEmail=ACCOUNTS[num-1]}else{selectedEmail=email.trim()}if(!selectedEmail||!selectedEmail.includes('@')){alert('❌ 无效的账户');return}const btn=document.createElement('div');btn.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:999999;font-family:sans-serif;text-align:center';btn.innerHTML='<div style="font-size:18px;margin-bottom:15px">⏳ 正在提交token...</div><div style="color:#666">'+selectedEmail+'</div>';document.body.appendChild(btn);fetch(DS2API_URL+'/admin/accounts/capture-token',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+ADMIN_KEY},body:JSON.stringify({email:selectedEmail,token:token})}).then(r=>r.json()).then(data=>{btn.innerHTML='<div style="font-size:24px;margin-bottom:10px">✅</div><div style="font-size:18px;color:#28a745;margin-bottom:10px">Token保存成功！</div><div style="color:#666;font-size:14px">'+selectedEmail+'</div>';setTimeout(()=>document.body.removeChild(btn),3000)}).catch(err=>{btn.innerHTML='<div style="font-size:24px;margin-bottom:10px">❌</div><div style="font-size:18px;color:#dc3545;margin-bottom:10px">提交失败</div><div style="color:#666;font-size:14px">'+err.message+'</div>';setTimeout(()=>document.body.removeChild(btn),5000)})})();
```

## 📝 使用步骤

1. **打开DeepSeek网站**
   ```
   https://chat.deepseek.com
   ```

2. **登录你的账户**（例如：leo.rlzeng@gmail.com）

3. **点击书签栏中的"📥 捕获DeepSeek Token"按钮**

4. **在弹出的对话框中输入账户序号**
   - 输入 `9` 选择 leo.rlzeng@gmail.com
   - 或者直接输入完整邮箱地址

5. **等待提示"✅ Token保存成功！"**

6. **完成！** Token已自动保存到后端

## 📋 账户列表

| 序号 | 邮箱 | 状态 |
|------|------|------|
| 1 | zengtao227@gmail.com | ✅ 已有token |
| 2 | zengtao227.de@gmail.com | ✅ 已有token |
| 3 | zengtao227.us@gmail.com | ✅ 已有token |
| 4 | zengtao227.sg@gmail.com | ✅ 已有token |
| 5 | zengqhxf@gmail.com | ✅ 已有token |
| 6 | liyue828@gmail.com | ✅ 已有token |
| 7 | liyue828.de@gmail.com | ✅ 已有token |
| 8 | mia.rhzeng@gmail.com | ✅ 已有token |
| 9 | **leo.rlzeng@gmail.com** | ❌ **缺失token** |
| 10 | 9pgyxsfby5@privaterelay.appleid.com | ✅ 已有token |
| 11 | yqrt7tjg85@privaterelay.appleid.com | ✅ 已有token |
| 12 | xhg4h79pph@privaterelay.appleid.com | ✅ 已有token |
| 13 | n6vst2bmsc@privaterelay.appleid.com | ✅ 已有token |

## ⚠️ 注意事项

- ✅ 不需要F12控制台
- ✅ 不需要运行任何脚本
- ✅ 使用你现有的Comet浏览器
- ✅ 密码始终保存在浏览器中，脚本看不到
- ⚠️ 确保DS2API后端正在运行（`http://localhost:5001`）
- ⚠️ 书签只在 `chat.deepseek.com` 域名下工作

## 🔧 技术原理

这个书签（bookmarklet）是一段JavaScript代码，它会：

1. 从浏览器的 `localStorage` 中查找DeepSeek的token
2. 显示token预览（前6位+****+后2位）
3. 让用户选择这是哪个账户
4. 调用DS2API的 `/admin/accounts/capture-token` 接口保存token
5. 显示成功或失败的提示

整个过程在浏览器中完成，安全可靠。

## 🎯 适用场景

- ✅ 初次配置账户token
- ✅ Token过期后重新捕获
- ✅ 添加新账户
- ✅ 团队成员自助配置（非技术人员也能轻松使用）

## 🆚 与其他方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **书签按钮（当前方案）** | ✅ 最简单<br>✅ 不需要F12<br>✅ 用户体验最好 | 需要拖拽书签 |
| CDP监听脚本 | ✅ 全自动 | ❌ 账户匹配不可靠<br>❌ 需要运行脚本 |
| 手动F12提取 | ✅ 最直接 | ❌ 需要F12权限<br>❌ 步骤繁琐 |

## 🔍 验证Token是否有效

捕获token后，可以通过以下命令验证：

```bash
# 查看所有账户状态
curl -s "http://localhost:5001/admin/accounts?page_size=20" \
  -H "Authorization: Bearer 744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501" \
  | jq -r '.items[] | "\(.email) - Token: \(if .has_token then "✅" else "❌" end)"'
```

## 💡 常见问题

**Q: 点击书签后提示"未找到token"？**
A: 请确保你已经登录DeepSeek，然后刷新页面重试。

**Q: 提交失败？**
A: 检查DS2API后端是否正在运行：`curl http://localhost:5001/admin/accounts`

**Q: 如何更新已有账户的token？**
A: 直接使用书签重新捕获即可，会自动覆盖旧token。

**Q: 其他人如何使用？**
A: 将 `scripts/bookmarklet-token-capture.html` 文件发给他们，用浏览器打开即可。
