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
    const result = await ssh.execCommand('ls -la htdocs && ls -la htdocs/ats.whitehorsemanpower.in');
    console.log('STDOUT:', result.stdout);
    console.log('STDERR:', result.stderr);
  } catch (err) {
    console.error('Error connecting:', err);
  } finally {
    ssh.dispose();
  }
}

run();
