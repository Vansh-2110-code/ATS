const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const remotePath = '/home/whitehorsemanpower/htdocs/ats.whitehorsemanpower.in';

async function run() {
  try {
    await ssh.connect({
      host: 'ats.whitehorsemanpower.in',
      username: 'whitehorsemanpower',
      password: 'Whitehorse@2026blr',
      port: 22,
      readyTimeout: 30000
    });
    console.log('Connected!');

    const gitRemote = await ssh.execCommand('git remote -v && git status', { cwd: remotePath });
    console.log('GIT STDOUT:', gitRemote.stdout);
    console.log('GIT STDERR:', gitRemote.stderr);
  } catch (err) {
    console.error('Error connecting:', err);
  } finally {
    ssh.dispose();
  }
}

run();
