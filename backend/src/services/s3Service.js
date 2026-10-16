const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * AWS S3 and Local Resilient QR Code Cloud Storage Service
 * Strictly references credentials from process.env without hardcoding.
 * Fully error-handled to ensure the Node server NEVER crashes.
 */

// S3 Client configuration strictly from process.env
const getS3Client = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-south-1';

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  try {
    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (err) {
    console.warn('[S3] Failed to initialize S3Client:', err.message);
    return null;
  }
};

/**
 * Generates a QR Code image buffer and uploads to AWS S3 (or resilient local public store),
 * returning the public URL.
 *
 * @param {string} tagId - The unique CPCB barcode/tag identifier
 * @param {object} payload - The metadata encoded into the QR code
 * @returns {Promise<string>} - The public URL of the QR code image
 */
const generateAndUploadQRCode = async (tagId, payload = {}) => {
  const filename = `${tagId.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  const qrData = JSON.stringify({
    tagId,
    cpcbStandard: 'CPCB-BMW-2016',
    category: payload.category || 'Yellow',
    hospitalId: payload.hospitalId || 'HOSP-01',
    hospitalName: payload.hospitalName || 'Government Hospital of Khamgaon',
    weightKg: payload.weightKg || 0,
    timestamp: payload.timestamp || new Date().toISOString(),
  });

  let qrBuffer;
  try {
    // Generate high-resolution PNG buffer using qrcode library
    qrBuffer = await QRCode.toBuffer(qrData, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('[QRCode] Failed to generate QR buffer:', err.message);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tagId)}`;
  }

  // Attempt AWS S3 Upload if environment variables are configured
  const s3Client = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET;

  if (s3Client && bucketName) {
    try {
      const s3Key = `medwaste/qrcodes/${filename}`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: qrBuffer,
        ContentType: 'image/png',
        ACL: 'public-read',
      });

      await s3Client.send(command);
      const region = process.env.AWS_REGION || 'ap-south-1';
      const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
      console.log(`[S3] Uploaded QR code for ${tagId} to S3: ${s3Url}`);
      return s3Url;
    } catch (s3Err) {
      console.warn(`[S3] AWS S3 upload notice (${s3Err.message}). Falling back to resilient storage.`);
    }
  }

  // Graceful Local Public File Storage Fallback (Always works, no crash)
  try {
    const publicQrDir = path.join(process.cwd(), 'public/qrcodes');
    if (!fs.existsSync(publicQrDir)) {
      fs.mkdirSync(publicQrDir, { recursive: true });
    }
    const localFilePath = path.join(publicQrDir, filename);
    fs.writeFileSync(localFilePath, qrBuffer);
    return `/qrcodes/${filename}`;
  } catch (fsErr) {
    console.warn('[Storage] File write error, converting to base64 Data URL:', fsErr.message);
    return `data:image/png;base64,${qrBuffer.toString('base64')}`;
  }
};

module.exports = {
  generateAndUploadQRCode,
};
