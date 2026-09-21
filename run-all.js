const { spawn } = require('child_process');
const path = require('path');

console.log('============================================================');
console.log(' ☣️  Starting MedWaste Guard Full-Stack Platform...');
console.log(' Web App     -> http://medwaste:5173 (or http://localhost:5173)');
console.log(' Backend API -> http://medwaste:5000');
console.log(' Internet    -> Run "npm run share" for instant Public link');
console.log('============================================================\n');

// Start Backend
const backend = spawn('node', ['backend/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

// Start Frontend
const frontend = spawn('npm', ['run', 'dev', '--', '--host'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down all services...');
  backend.kill();
  frontend.kill();
  process.exit();
});
