const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const localtunnel = require('localtunnel');
const qrcode = require('qrcode-terminal');

const PORT = process.env.PORT || 5000;

function getPublicIP() {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve('Not available'));
  });
}

function waitForServer(port, retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry(remaining);
      });
      req.on('error', () => retry(remaining));
      req.end();
    };

    const retry = (remaining) => {
      if (remaining <= 0) return reject(new Error('Server boot timed out'));
      setTimeout(() => check(remaining - 1), 500);
    };

    check(retries);
  });
}

async function main() {
  console.log('============================================================');
  console.log(' 🚀 Launching MedWaste Guard Public Internet Sharing...');
  console.log('============================================================\n');

  // Check if frontend build exists
  const distPath = path.join(__dirname, 'frontend', 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('📦 Frontend production build not found. Building now...');
    const buildProcess = spawn('npm', ['--prefix', 'frontend', 'run', 'build'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with exit code ${code}`));
      });
    });
  }

  // Start backend server
  console.log(`\n⏳ Starting unified server on port ${PORT}...`);
  const backend = spawn('node', ['backend/index.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  try {
    await waitForServer(PORT);
    console.log('✅ Local server is online and operational.');

    // Fetch public IP for tunnel verification password
    const publicIp = await getPublicIP();

    // Create public HTTPS tunnel via localhost.run using built-in SSH
    console.log('🌐 Connecting to global internet tunnel via localhost.run...');
    const { spawn } = require('child_process');
    const tunnel = spawn('ssh', ['-R', `80:localhost:${PORT}`, 'nokey@localhost.run', '-o', 'StrictHostKeyChecking=no']);

    let urlFound = false;

    tunnel.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/(https:\/\/[a-zA-Z0-9-]+\.lhr\.life)/);
      if (match && !urlFound) {
        urlFound = true;
        const url = match[1];
        
        console.log('============================================================');
        console.log(' 🎉 YOUR APP IS NOW LIVE ON THE INTERNET!');
        console.log('============================================================');
        console.log(` 🌍 Public Internet URL: ${url}`);
        if (publicIp !== 'Not available') {
          console.log(` 🔑 Tunnel Password (if asked on first load): ${publicIp}`);
        }
        console.log(' 📱 Anyone in the world can now open this link on their');
        console.log('    phone, laptop, or tablet (no Wi-Fi connection required).');
        console.log('============================================================');
        
        // Generate QR Code in the terminal
        qrcode.generate(url, { small: true }, function (qr) {
          console.log('\n Scan this QR Code with your phone camera to open instantly:');
          console.log(qr);
        });

        console.log(' Press Ctrl+C at any time to stop public sharing.\n');
      }
    });

    tunnel.on('close', () => {
      console.log('Public tunnel closed.');
    });

    const cleanup = () => {
      console.log('\nStopping public tunnel and server...');
      tunnel.kill();
      backend.kill();
      process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (err) {
    console.error('Failed to start public tunnel:', err.message);
    backend.kill();
    process.exit(1);
  }
}

main();
