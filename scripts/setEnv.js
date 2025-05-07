const fs = require('fs');
const path = require('path');

// 获取项目根目录的文件夹名
const projectName = path.basename(process.cwd());

// 创建或更新 .env.local 文件
const envContent = `NEXT_PUBLIC_BASE_PATH=/${projectName}`;
fs.writeFileSync('.env.local', envContent);

console.log(`Set NEXT_PUBLIC_BASE_PATH to /${projectName}`);