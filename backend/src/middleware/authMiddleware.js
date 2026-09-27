const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cpcb-khamgaon-biohazard-sec-2026';

/**
 * Standard JWT Authentication Middleware
 * Enforces token presence, signature authenticity, and non-expiration.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Valid Bearer token must be provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
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
 * Role-Based Access Control (RBAC) Guard
 * Allowed Roles:
 * - 'Doctor / Lead Surgeon'
 * - 'Clinical Staff / Nurse'
 * - 'Package Registration Worker'
 * - 'Internal Delivery Boy / Handler'
 * - 'CBWTF Transport Custodian'
 * - 'Chief Medical Superintendent'
 * - 'State / District Monitor'
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
    // State/District Monitor has global auditing privileges across all views
    if (userRole === 'State / District Monitor') {
      return next();
    }

    const hasPermission = allowedRoles.some(
      (role) => role.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${userRole}" is not authorized for this resource.`,
      });
    }

    next();
  };
};

/**
 * Scopes data access to the user's assigned hospital,
 * unless user possesses the 'State / District Monitor' oversight credential.
 */
const requireHospitalScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role === 'State / District Monitor' || req.user.hospitalId === 'ALL') {
    return next();
  }

  const requestedHospitalId = req.query.hospitalId || req.body.hospitalId || req.params.hospitalId;
  if (requestedHospitalId && requestedHospitalId !== req.user.hospitalId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You cannot view or modify data for another hospital.',
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requireRole,
  requireHospitalScope,
  JWT_SECRET,
};
