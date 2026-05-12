#!/usr/bin/env node

/**
 * 🍎 Mac 专用：AppleScript 捕获工具
 * 不需要 CDP，直接通过系统指令向 Comet 要 Token
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    console.log('🍎 正在通过 AppleScript 向 Comet 提取 Token...');

    // 1. 定义 AppleScript
    // 这个脚本会遍历 Comet 的所有窗口和标签页，寻找 deepseek.com
    const appleScript = `
        tell application "Comet"
            set foundToken to ""
            set foundEmail to ""
            set windowList to every window
            repeat with theWindow in windowList
                set tabList to every tab of theWindow
                repeat with theTab in tabList
                    if URL of theTab contains "deepseek.com" then
                        set foundToken to execute theTab javascript "localStorage.getItem('token')"
                        try
                            set userStr to execute theTab javascript "localStorage.getItem('user')"
                            -- 简单解析 JSON 里的 email
                            set foundEmail to execute theTab javascript "JSON.parse(localStorage.getItem('user')).email"
                        end try
                        if foundToken is not "" then exit repeat
                    end if
                end repeat
                if foundToken is not "" then exit repeat
            end repeat
            return foundToken & "|" & foundEmail
        end tell
    `;

    try {
        // 2. 执行 AppleScript
        const result = execSync(`osascript -e '${appleScript}'`).toString().trim();
        const [token, email] = result.split('|');

        if (!token || token === "undefined" || token === "missing value") {
            console.error('❌ 未能在 Comet 中找到已登录的 DeepSeek 页面。');
            console.log('   请确保您已经在 Comet 中打开并登录了 https://chat.deepseek.com');
            return;
        }

        console.log(`✅ 成功捕获 Token (预览: ${token.substring(0, 10)}...)`);
        if (email) console.log(`📧 识别到账户: ${email}`);

        // 3. 保存到本地 config.json
        const configPath = path.join(process.cwd(), 'config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);

        let targetEmail = email;
        if (!targetEmail || targetEmail === "undefined") {
            targetEmail = "zengtao227@gmail.com"; // 默认主账号
            console.log(`⚠️ 未识别到邮箱，默认存入: ${targetEmail}`);
        }

        let found = false;
        if (config.accounts) {
            for (let acc of config.accounts) {
                if (acc.email === targetEmail) {
                    acc.token = token;
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            if (!config.accounts) config.accounts = [];
            config.accounts.push({ email: targetEmail, token: token });
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(`🎉 成功！Token 已写入本地 config.json`);

    } catch (err) {
        console.error('❌ 捕获失败:', err.message);
        console.log('   提示: 如果系统弹出“权限请求”，请允许终端控制 Comet。');
    }
}

main();
