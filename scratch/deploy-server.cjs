const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to Hostinger server...');
    await ssh.connect({
      host: 'ats.whitehorsemanpower.in',
      username: 'whitehorsemanpower',
      password: 'Whitehorse@2026blr',
      port: 22,
      readyTimeout: 30000
    });
    console.log('Connected!');

    const remotePath = '/home/whitehorsemanpower/htdocs/ats.whitehorsemanpower.in';
    const setupEnv = 'export PATH=$PATH:~/.npm-global/bin:~/.nvm/versions/node/v18.17.0/bin';

    console.log('1. Pulling latest code...');
    let result = await ssh.execCommand(`${setupEnv} && git pull origin main`, { cwd: remotePath });
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    console.log('2. Installing frontend dependencies & building...');
    result = await ssh.execCommand(`${setupEnv} && npm install && npm run build`, { cwd: remotePath });
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    console.log('3. Installing backend dependencies & restarting PM2...');
    result = await ssh.execCommand(`${setupEnv} && cd backend && npm install && pm2 restart all`, { cwd: remotePath });
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    console.log('Deployment completed successfully!');
  } catch (e) {
    console.error('Deployment Error:', e);
  } finally {
    ssh.dispose();
  }
}

run();
