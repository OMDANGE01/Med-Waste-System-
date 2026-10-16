const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isConnected } = require('../config/db');
const AuditLogModel = require('../models/AuditLog');
const socketService = require('./socketService');

const DATA_DIR = process.env.DATA_DIR || (fs.existsSync(path.join(process.cwd(), 'backend/data')) 
  ? path.join(process.cwd(), 'backend/data') 
  : path.join(__dirname, '../../data'));
const AUDIT_FILE = path.join(DATA_DIR, 'audit_ledger.json');

const computeHash = (prevHash, timestamp, actionType, actorId, entityId, details) => {
  const content = `${prevHash || 'GENESIS'}|${timestamp}|${actionType}|${actorId}|${entityId}|${JSON.stringify(details)}`;
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
 * Appends an immutable, tamper-evident entry to the CPCB audit ledger.
 * NEVER allows UPDATE or DELETE.
 *
 * Required fields:
 * - actorId
 * - actorRole
 * - actionType
 * - previousState
 * - newState
 * - timestamp
 */
const logEvent = async ({
  eventType,
  actionType,
  actor,
  actorId: explicitActorId,
  actorRole: explicitActorRole,
  actorName: explicitActorName,
  entityId,
  hospitalId,
  previousState = null,
  newState = null,
  details = {},
}) => {
  try {
    const ledger = loadLedger();
    const lastEntry = ledger[ledger.length - 1];
    const previousHash = lastEntry ? lastEntry.hash : 'CPCB_KHAMGAON_GENESIS_BLOCK_2026';
    const timestamp = new Date().toISOString();

    const normalizedActorId = explicitActorId || (actor ? (actor.id || actor.workerId || 'SYSTEM') : 'SYSTEM');
    const normalizedActorName = explicitActorName || (actor ? actor.name : 'Authorized Staff');
    const normalizedActorRole = explicitActorRole || (actor ? actor.role : 'System');
    const normalizedActionType = actionType || eventType || 'STATE_TRANSITION';

    const hash = computeHash(
      previousHash,
      timestamp,
      normalizedActionType,
      normalizedActorId,
      entityId,
      { previousState, newState, ...details }
    );

    const entry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actionType: normalizedActionType,
      eventType: normalizedActionType, // for backward compatibility
      actorId: normalizedActorId,
      actorName: normalizedActorName,
      actorRole: normalizedActorRole,
      hospitalId: hospitalId || (actor ? actor.hospitalId : 'GLOBAL'),
      entityId: entityId || '',
      previousState,
      newState,
      details,
      previousHash,
      hash,
    };

    // 1. Append to local file
    ledger.push(entry);
    saveLedger(ledger);

    // 2. Persist to MongoDB AuditLog collection if connected
    if (isConnected()) {
      try {
        const mongoEntry = new AuditLogModel({
          actorId: entry.actorId,
          actorRole: entry.actorRole,
          actorName: entry.actorName,
          actionType: entry.actionType,
          entityId: entry.entityId,
          hospitalId: entry.hospitalId,
          previousState: entry.previousState,
          newState: entry.newState,
          details: entry.details,
          hash: entry.hash,
          previousHash: entry.previousHash,
          timestamp: new Date(entry.timestamp),
        });
        await mongoEntry.save();
      } catch (mErr) {
        console.warn('[AUDIT] MongoDB audit log notice:', mErr.message);
      }
    }

    // 3. Emit real-time event to connected Auditor clients
    socketService.emitAuditEntry(entry);

    return entry;
  } catch (err) {
    console.error('[AUDIT] Failed to log audit event:', err.message);
    return null;
  }
};

const getAuditLogs = async (filter = {}) => {
  // Query MongoDB first if online
  if (isConnected()) {
    try {
      const query = {};
      if (filter.hospitalId && filter.hospitalId !== 'ALL') {
        query.hospitalId = filter.hospitalId;
      }
      if (filter.actionType) {
        query.actionType = filter.actionType;
      }
      if (filter.entityId) {
        query.entityId = filter.entityId;
      }

      const mongoLogs = await AuditLogModel.find(query).sort({ timestamp: -1 }).limit(200);
      if (mongoLogs && mongoLogs.length > 0) {
        return mongoLogs;
      }
    } catch (mErr) {
      console.warn('[AUDIT] MongoDB query notice, using local file ledger:', mErr.message);
    }
  }

  // Resilient local file fallback
  const ledger = loadLedger();
  let filtered = [...ledger].reverse(); // Most recent first

  if (filter.hospitalId && filter.hospitalId !== 'ALL') {
    filtered = filtered.filter((e) => e.hospitalId === filter.hospitalId);
  }
  if (filter.actionType || filter.eventType) {
    const act = filter.actionType || filter.eventType;
    filtered = filtered.filter((e) => e.actionType === act || e.eventType === act);
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
    const prevEntry = i > 0 ? ledger[i - 1] : null;
    const expectedPrevHash = prevEntry ? prevEntry.hash : 'CPCB_KHAMGAON_GENESIS_BLOCK_2026';

    if (entry.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAt: entry.id,
        reason: 'Broken cryptographic linkage to previous block',
      };
    }

    const recomputed = computeHash(
      entry.previousHash,
      entry.timestamp,
      entry.actionType || entry.eventType,
      entry.actorId,
      entry.entityId,
      { previousState: entry.previousState, newState: entry.newState, ...entry.details }
    );

    if (recomputed !== entry.hash) {
      return {
        valid: false,
        brokenAt: entry.id,
        reason: 'Hash mismatch: entry content was tampered with',
      };
    }
  }
  return { valid: true, blockCount: ledger.length };
};

module.exports = {
  logEvent,
  getAuditLogs,
  verifyChainIntegrity,
};
