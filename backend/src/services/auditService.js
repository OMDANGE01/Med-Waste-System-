const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || (fs.existsSync(path.join(process.cwd(), 'backend/data')) 
  ? path.join(process.cwd(), 'backend/data') 
  : path.join(__dirname, '../../data'));
const AUDIT_FILE = path.join(DATA_DIR, 'audit_ledger.json');

const computeHash = (prevHash, timestamp, eventType, actorId, entityId, details) => {
  const content = `${prevHash || 'GENESIS'}|${timestamp}|${eventType}|${actorId}|${entityId}|${JSON.stringify(details)}`;
  return crypto.createHash('sha256').update(content).digest('hex');
};

const loadLedger = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(AUDIT_FILE)) {
      const data = fs.readFileSync(AUDIT_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch (err) {
    console.error('[AUDIT] Failed to read ledger:', err.message);
    return [];
  }
};

const saveLedger = (ledger) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(ledger, null, 2), 'utf8');
  } catch (err) {
    console.error('[AUDIT] Failed to persist ledger:', err.message);
  }
};

/**
 * Appends a tamper-evident entry to the CPCB audit ledger
 */
const logEvent = ({ eventType, actor, entityId, hospitalId, details = {} }) => {
  const ledger = loadLedger();
  const lastEntry = ledger[ledger.length - 1];
  const previousHash = lastEntry ? lastEntry.hash : 'CPCB_KHAMGAON_GENESIS_BLOCK_2026';
  const timestamp = new Date().toISOString();

  const actorId = actor ? (actor.id || actor.workerId || 'SYSTEM') : 'SYSTEM';
  const actorName = actor ? actor.name : 'Automated CPCB Compliance Engine';
  const actorRole = actor ? actor.role : 'System';

  const hash = computeHash(previousHash, timestamp, eventType, actorId, entityId, details);

  const entry = {
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    eventType,
    actorId,
    actorName,
    actorRole,
    hospitalId: hospitalId || (actor ? actor.hospitalId : 'GLOBAL'),
    entityId,
    details,
    previousHash,
    hash,
  };

  ledger.push(entry);
  saveLedger(ledger);
  return entry;
};

const getAuditLogs = (filter = {}) => {
  const ledger = loadLedger();
  let filtered = [...ledger].reverse(); // Most recent first

  if (filter.hospitalId && filter.hospitalId !== 'ALL') {
    filtered = filtered.filter((e) => e.hospitalId === filter.hospitalId);
  }
  if (filter.eventType) {
    filtered = filtered.filter((e) => e.eventType === filter.eventType);
  }
  if (filter.entityId) {
    filtered = filtered.filter((e) => e.entityId === filter.entityId);
  }

  return filtered;
};

/**
 * Validates the cryptographic chain of the ledger
 */
const verifyChainIntegrity = () => {
  const ledger = loadLedger();
  for (let i = 0; i < ledger.length; i++) {
    const entry = ledger[i];
    const expectedPrevHash = i === 0 ? 'CPCB_KHAMGAON_GENESIS_BLOCK_2026' : ledger[i - 1].hash;
    if (entry.previousHash !== expectedPrevHash) {
      return { valid: false, brokenAtIndex: i, reason: 'Broken previousHash link' };
    }
    const recalculated = computeHash(
      entry.previousHash,
      entry.timestamp,
      entry.eventType,
      entry.actorId,
      entry.entityId,
      entry.details
    );
    if (recalculated !== entry.hash) {
      return { valid: false, brokenAtIndex: i, reason: 'Corrupted payload hash' };
    }
  }
  return { valid: true, totalEntries: ledger.length };
};

module.exports = {
  logEvent,
  getAuditLogs,
  verifyChainIntegrity,
};
