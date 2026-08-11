const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'ats.whitehorsemanpower.in',
      username: 'whitehorsemanpower',
      password: 'Whitehorse@2026blr',
      port: 22,
      readyTimeout: 20000
    });
    console.log('Connected!');
    const pm2 = await ssh.execCommand('npx pm2 list');
    console.log('PM2:', pm2.stdout);
    
    // Check if node/npm/pm2 are in path, often we need to source profile
    const pm2withprofile = await ssh.execCommand('source ~/.profile && pm2 list');
    console.log('PM2 with profile:', pm2withprofile.stdout);
    
  } catch (err) {
    console.error('Error connecting:', err);
  } finally {
    ssh.dispose();
  }
}

run();
