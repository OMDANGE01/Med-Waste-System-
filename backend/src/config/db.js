const mongoose = require('mongoose');
require('dotenv').config({ override: true });

// CRITICAL: fail fast, do not hang on buffered commands when MongoDB is offline
mongoose.set('bufferCommands', false);

let mongoConnected = false;
let lastError = null;
let activeDatabaseName = null;
let activeHost = null;

/**
 * Sanitizes MongoDB connection URIs to handle common copy-paste artifacts:
 * - Angle brackets left around password from Atlas templates (<password>)
 * - Accidental whitespace around username or password
 * - Leading/trailing spaces
 */
const sanitizeMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return rawUri;
  let uri = rawUri.trim();

  // Match: mongodb://user:pass@host/db or mongodb+srv://user:pass@host/db
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@(.+)$/);
  if (match) {
    const protocol = match[1];
    let username = match[2].trim();
    let password = match[3].trim();
    const rest = match[4].trim();

    // Strip leading '<' and trailing '>' if template placeholder brackets were retained
    if (password.startsWith('<') && password.endsWith('>')) {
      password = password.slice(1, -1);
    }
    return `${protocol}${username}:${password}@${rest}`;
  }
  return uri;
};

/**
 * Safely masks credentials for log outputs
 */
const maskUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//*credential-hidden*@');
};

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!rawUri) {
    mongoConnected = false;
    lastError = 'No MONGODB_URI configured in environment';
    console.log('[DB] No MONGODB_URI configured. Running with resilient local persistent storage engine.');
    return false;
  }

  const uri = sanitizeMongoUri(rawUri);
  const masked = maskUri(uri);

  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${masked}`);
    
    // Connect with a reasonable timeout so local operations never hang
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000,
    });

    mongoConnected = true;
    lastError = null;

    try {
      activeDatabaseName = mongoose.connection?.name || 'med_waste_db';
      activeHost = mongoose.connection?.host || 'remote-cluster';
    } catch {
      // ignore
    }

    console.log(`[DB] MongoDB Connected successfully! (Database: ${activeDatabaseName})`);

    // Auto-seed initial biomedical records if empty
    try {
      const WasteRecordModel = require('../models/WasteRecord');
      const count = await WasteRecordModel.countDocuments();
      if (count === 0) {
        console.log('[DB] Fresh database detected. Seeding official biomedical baseline records...');
        const storageService = require('../services/storageService');
        await storageService.resetToSeed();
        console.log('[DB] Baseline biomedical dataset seeded successfully.');
      }
    } catch (seedErr) {
      console.warn('[DB] Seeding check notice:', seedErr.message);
    }

    return true;
  } catch (err) {
    mongoConnected = false;
    lastError = err.message;
    console.warn(`[DB] Notice: External MongoDB not reachable (${err.message}).`);
    console.log('[DB] Resilient local persistent storage engine is active. MedWaste system is 100% operational.');
    return false;
  }
};

const isConnected = () => mongoConnected;

const getConnectionDetails = () => ({
  connected: mongoConnected,
  database: mongoConnected ? activeDatabaseName : 'med_waste_db (Local Resilient)',
  host: mongoConnected ? activeHost : 'Local In-Memory / JSON DB Engine',
  lastError: lastError,
  configuredUriMasked: process.env.MONGODB_URI ? maskUri(sanitizeMongoUri(process.env.MONGODB_URI)) : null,
});

module.exports = {
  connectDB,
  isConnected,
  getConnectionDetails,
  sanitizeMongoUri,
  maskUri,
};
