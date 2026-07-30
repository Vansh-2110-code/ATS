const { execSync } = require('child_process');

const zipPath = 'c:/Users/s.anirudh/Downloads/ats-main-v2.zip';
const cmd = `powershell -Command "Get-ChildItem -Path 'c:\\Users\\s.anirudh\\Downloads\\ats-main-20260724T030529Z-1-001\\ats-main' -Exclude 'node_modules','.git' | Compress-Archive -DestinationPath '${zipPath}' -Force"`;

execSync(cmd, { stdio: 'inherit' });
console.log('Zip file successfully generated at:', zipPath);
