const { spawn } = require('child_process');
const vite = spawn('vite', [], {
  cwd: 'G:\\assingment\\ADA-V2-My-utmost-Creation',
  stdio: 'inherit',
  env: Object.assign(process.env, { PATH: process.env.PATH + ';C:\\Program Files\\nodejs' }),
  shell: true
});

vite.on('close', (code) => {
  process.exit(code);
});