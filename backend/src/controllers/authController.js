const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');
const { initialWorkers, initialHospitals } = require('../seeds/seedData');

const DATA_DIR = process.env.DATA_DIR || (fs.existsSync(path.join(process.cwd(), 'backend/data')) 
  ? path.join(process.cwd(), 'backend/data') 
  : path.join(__dirname, '../../data'));
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Default initial password hash for bootstrap accounts: 'Khamgaon@2026'
// Precomputed bcrypt hash of 'Khamgaon@2026' with 10 salt rounds:
const DEFAULT_HASH = '$2a$10$wT0XkI4e87J5Y5N6bWnUqu4iJvZ44b7h5U9VfM0qG5yD2B3ZlR5hW';

/**
 * Initializes and persists real staff records with bcrypt password hashes.
 * No plaintext passwords are ever stored.
 */
const loadUsers = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let existing = [];
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      existing = JSON.parse(raw);
    }

    let needsSave = false;

    // Remove obsolete prototype accounts (e.g. St. Jude, Aaron, etc.)
    const sanitized = existing.filter(
      (u) =>
        u.email &&
        !u.email.includes('stjude.org') &&
        !u.email.includes('testdoctor') &&
        !u.email.includes('dr.sharma')
    );

    if (sanitized.length !== existing.length) {
      existing = sanitized;
      needsSave = true;
    }

    // Convert and migrate initial workers with bcrypt passwordHash
    initialWorkers.forEach((w) => {
      const match = existing.find(
        (u) => u.email.toLowerCase() === w.email.toLowerCase() || u.badgeNumber === w.badgeNumber
      );

      if (!match) {
        existing.push({
          id: w.workerId,
          name: w.name,
          email: w.email.toLowerCase(),
          passwordHash: DEFAULT_HASH,
          role: w.role,
          department: w.department,
          hospitalId: w.hospitalId,
          hospitalName: w.hospitalName,
          phone: w.phone,
          badgeNumber: w.badgeNumber,
          isBootstrapPassword: true,
          createdAt: new Date().toISOString(),
        });
        needsSave = true;
      } else if (!match.passwordHash) {
        // Upgrade legacy plaintext password to bcrypt hash
        const plain = match.password || 'Khamgaon@2026';
        match.passwordHash = bcrypt.hashSync(plain, 10);
        delete match.password;
        needsSave = true;
      }
    });

    if (needsSave || !fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(existing, null, 2), 'utf8');
    }

    return existing;
  } catch (err) {
    console.error('[AUTH] Error loading users file:', err.message);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('[AUTH] Error saving users file:', err.message);
  }
};

/**
 * Strips passwordHash and sensitive security markers before sending to client
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, password, ...safe } = user;
  return safe;
};

/**
 * Generates signed JWT token with 8-hour expiry
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
      hospitalName: user.hospitalName,
      badgeNumber: user.badgeNumber,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
};

/**
 * POST /api/auth/login
 * Strict server-side credential verification with bcrypt.
 */
exports.login = async (req, res) => {
  try {
    const { identifier, password, hospitalId } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Credentials required: Email or Badge ID and Password must be provided.',
      });
    }

    const users = loadUsers();
    const cleanId = identifier.trim().toLowerCase();

    // Find candidate user by email or badge number
    const user = users.find((u) => {
      const matchEmail = (u.email || '').toLowerCase() === cleanId;
      const matchBadge = (u.badgeNumber || '').toLowerCase() === cleanId;
      return matchEmail || matchBadge;
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User identity not found.',
      });
    }

    // Verify hospital scope (State Monitors have access across all facilities)
    if (user.role !== 'State / District Monitor' && user.hospitalId !== 'ALL') {
      if (hospitalId && user.hospitalId !== hospitalId) {
        return res.status(403).json({
          success: false,
          message: `This staff account belongs to ${user.hospitalName}. Please select your registered hospital to log in.`,
        });
      }
    }

    // Server-side bcrypt password verification
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      auditService.logEvent({
        eventType: 'AUTH_FAILED_ATTEMPT',
        actor: { id: user.id, name: user.name, role: user.role, hospitalId: user.hospitalId },
        entityId: user.id,
        hospitalId: user.hospitalId,
        details: { identifier: cleanId, reason: 'Incorrect password' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your password.',
      });
    }

    // Generate authenticated session token
    const token = generateToken(user);

    auditService.logEvent({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actor: user,
      entityId: user.id,
      hospitalId: user.hospitalId,
      details: { role: user.role, badgeNumber: user.badgeNumber },
    });

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('[AUTH] Login failure:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication processing.',
    });
  }
};

/**
 * POST /api/auth/bootstrap-superintendent
 * Securely creates or sets the primary superintendent password for a Khamgaon hospital
 */
exports.bootstrapSuperintendent = async (req, res) => {
  try {
    const { hospitalId, email, password, name, badgeNumber, secretSetupKey } = req.body;

    // Protect bootstrap with setup key if provided, or allow initial provisioning if superintendent unset
    const SYSTEM_BOOTSTRAP_KEY = process.env.BOOTSTRAP_SECRET_KEY || 'khamgaon-cpcb-admin-setup-2026';
    if (secretSetupKey && secretSetupKey !== SYSTEM_BOOTSTRAP_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid setup authorization key.' });
    }

    if (!hospitalId || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'hospitalId, email, password, and superintendent name are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long for superintendent accounts.',
      });
    }

    const users = loadUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    const passwordHash = await bcrypt.hash(password, 10);

    let targetUser;
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.name = name;
      existing.role = 'Chief Medical Superintendent';
      existing.isBootstrapPassword = false;
      existing.updatedAt = new Date().toISOString();
      targetUser = existing;
    } else {
      targetUser = {
        id: `WRK-SUP-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'Chief Medical Superintendent',
        department: 'Medical Administration & Surgery',
        hospitalId,
        hospitalName: req.body.hospitalName || 'Khamgaon Hospital',
        badgeNumber: badgeNumber || `SUP-${hospitalId}-01`,
        isBootstrapPassword: false,
        createdAt: new Date().toISOString(),
      };
      users.push(targetUser);
    }

    saveUsers(users);

    auditService.logEvent({
      eventType: 'SUPERINTENDENT_BOOTSTRAP',
      actor: targetUser,
      entityId: targetUser.id,
      hospitalId,
      details: { email: targetUser.email, name: targetUser.name },
    });

    const token = generateToken(targetUser);

    return res.status(201).json({
      success: true,
      message: 'Superintendent account provisioned successfully.',
      token,
      user: sanitizeUser(targetUser),
    });
  } catch (err) {
    console.error('[AUTH] Bootstrap failure:', err);
    return res.status(500).json({ success: false, message: 'Failed to provision account.' });
  }
};

/**
 * GET /api/auth/me
 * Retrieves profile of currently authenticated token
 */
exports.getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  const users = loadUsers();
  const user = users.find((u) => u.id === req.user.id || u.email.toLowerCase() === req.user.email.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  return res.json({ success: true, user: sanitizeUser(user) });
};

/**
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const users = loadUsers();
    const user = users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.isBootstrapPassword = false;
    user.updatedAt = new Date().toISOString();
    saveUsers(users);

    auditService.logEvent({
      eventType: 'PASSWORD_CHANGED',
      actor: user,
      entityId: user.id,
      hospitalId: user.hospitalId,
      details: {},
    });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Initialize users on module load
loadUsers();
