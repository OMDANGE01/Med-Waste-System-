const express = require('express');
const path = require('path');
const fs = require('fs');
const { createMedWasteApk } = require('../utils/generateApk.js');

const router = express.Router();

let cachedMetadata = null;

async function ensureApkExists() {
  try {
    const { metadata } = await createMedWasteApk();
    cachedMetadata = metadata;
    return metadata;
  } catch (err) {
    console.error('[DownloadRoutes] Error generating APK:', err);
    return null;
  }
}

// Initial build
ensureApkExists();

/**
 * GET /api/download/apk
 * Direct download stream for the CPCB Android APK
 */
router.get('/apk', async (req, res) => {
  try {
    const apkPath = path.join(process.cwd(), 'public/downloads/medwaste-guard-khamgaon-v1.0.0.apk');
    
    if (!fs.existsSync(apkPath)) {
      await ensureApkExists();
    }

    if (!fs.existsSync(apkPath)) {
      return res.status(500).json({ error: 'APK packaging failed. Please try again in a moment.' });
    }

    const stat = fs.statSync(apkPath);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="medwaste-guard-khamgaon-v1.0.0.apk"');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const fileStream = fs.createReadStream(apkPath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download APK error:', err);
    res.status(500).json({ error: 'Failed to stream APK' });
  }
});

/**
 * GET /api/download/apk/info
 * Package info, SHA-256 integrity hash, installation guide
 */
router.get('/apk/info', async (req, res) => {
  try {
    if (!cachedMetadata) {
      await ensureApkExists();
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    res.json({
      success: true,
      data: {
        ...cachedMetadata,
        downloadUrl: `${baseUrl}/api/download/apk`,
        directStaticUrl: `${baseUrl}/downloads/medwaste-guard-khamgaon-v1.0.0.apk`,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${baseUrl}/api/download/apk`)}`,
        easBuildCommand: 'cd expo-app && npx eas build -p android --profile preview',
        installSteps: [
          'Download medwaste-guard-khamgaon-v1.0.0.apk directly to your Android device.',
          'Open your device Settings > Security > Enable "Install unknown apps" for your browser.',
          'Open the downloaded .apk file and tap "Install".',
          'Launch MedWaste Guard and log in with your verified Khamgaon hospital credentials.'
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
