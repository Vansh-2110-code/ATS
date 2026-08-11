const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting...');
    await ssh.connect({
      host: 'ats.whitehorsemanpower.in',
      username: 'whitehorsemanpower',
      password: 'Whitehorse@2026blr',
      port: 22,
      readyTimeout: 30000
    });
    console.log('Connected!');

    const cmd = await ssh.execCommand('ls -la && pwd', { cwd: '/home/whitehorsemanpower/htdocs/ats.whitehorsemanpower.in' });
    console.log('STDOUT:\n', cmd.stdout);
    if (cmd.stderr) console.error('STDERR:\n', cmd.stderr);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    ssh.dispose();
  }
}

run();
