const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cpcb-khamgaon-biohazard-sec-2026';
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync(path.join(process.cwd(), 'backend/data')) 
  ? path.join(process.cwd(), 'backend/data') 
  : path.join(__dirname, '../../data'));
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Normalizes system roles to standard CPCB RBAC categories:
 * - HospitalHead
 * - DepartmentHead
 * - Nurse
 * - Driver
 * - Auditor
 */
const normalizeRole = (role) => {
  if (!role) return 'Nurse';
  const r = role.toLowerCase().trim();
  if (
    r === 'hospitalhead' ||
    r.includes('superintendent') ||
    r.includes('hospital head') ||
    r.includes('chief medical') ||
    r.includes('director') ||
    r.includes('administrator')
  ) {
    return 'HospitalHead';
  }
  if (
    r === 'departmenthead' ||
    r.includes('department head') ||
    r.includes('doctor') ||
    r.includes('surgeon') ||
    r.includes('ward head')
  ) {
    return 'DepartmentHead';
  }
  if (
    r === 'nurse' ||
    r.includes('nurse') ||
    r.includes('clinical') ||
    r.includes('package registration') ||
    r.includes('waste worker') ||
    r.includes('station')
  ) {
    return 'Nurse';
  }
  if (
    r === 'driver' ||
    r.includes('driver') ||
    r.includes('custodian') ||
    r.includes('transport') ||
    r.includes('delivery boy') ||
    r.includes('porter')
  ) {
    return 'Driver';
  }
  if (
    r === 'auditor' ||
    r.includes('auditor') ||
    r.includes('monitor') ||
    r.includes('state') ||
    r.includes('mpcb') ||
    r.includes('cpcb inspector')
  ) {
    return 'Auditor';
  }
  return role;
};

/**
 * Standard JWT Authentication Middleware
 * Enforces token presence, signature authenticity, and non-expiration.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. A valid Bearer token must be provided in the Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Single-session enforcement check
    if (decoded.email && decoded.sessionId && fs.existsSync(USERS_FILE)) {
      try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const user = users.find((u) => u.email.toLowerCase() === decoded.email.toLowerCase());
        if (user && user.active_session_id && user.active_session_id !== decoded.sessionId) {
          return res.status(401).json({
            success: false,
            code: 'SESSION_SUPERSEDED',
            message: 'This account has been logged in on another device. Your session has ended.',
          });
        }
      } catch {
        // fail-safe on transient file lock
      }
    }

    req.user = {
      ...decoded,
      normalizedRole: normalizeRole(decoded.role),
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session token has expired. Please re-authenticate.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};

/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is provided, but does not block if omitted.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        ...decoded,
        normalizedRole: normalizeRole(decoded.role),
      };
    } catch {
      // ignore invalid optional token
    }
  }
  next();
};

/**
 * Role-Based Access Control (RBAC) Guard
 * Compares both normalized role and verbatim role string.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to permission check.',
      });
    }

    const userRole = req.user.role;
    const normUserRole = req.user.normalizedRole || normalizeRole(userRole);

    // Auditor / State Monitor has universal audit oversight
    if (normUserRole === 'Auditor' && allowedRoles.includes('Auditor')) {
      return next();
    }

    // HospitalHead has universal clinical view
    if (normUserRole === 'HospitalHead' && allowedRoles.includes('HospitalHead')) {
      return next();
    }

    const hasPermission = allowedRoles.some((role) => {
      const normAllowed = normalizeRole(role);
      return (
        normAllowed.toLowerCase() === normUserRole.toLowerCase() ||
        role.toLowerCase() === userRole.toLowerCase()
      );
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${userRole}" (${normUserRole}) is not authorized for this resource.`,
      });
    }

    next();
  };
};

/**
 * Scopes data access to the user's assigned hospital,
 * unless user possesses Auditor or Global HospitalHead oversight.
 */
const requireHospitalScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const norm = req.user.normalizedRole || normalizeRole(req.user.role);
  if (norm === 'Auditor' || req.user.hospitalId === 'ALL') {
    return next();
  }

  const requestedHospitalId = req.query.hospitalId || req.body.hospitalId || req.params.hospitalId;
  if (requestedHospitalId && requestedHospitalId !== 'ALL' && requestedHospitalId !== req.user.hospitalId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You cannot view or modify data for another hospital.',
    });
  }

  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requireHospitalScope,
  normalizeRole,
  JWT_SECRET,
};
