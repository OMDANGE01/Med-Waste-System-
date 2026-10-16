const auditService = require('../services/auditService');

exports.getAuditLogs = async (req, res) => {
  try {
    const { hospitalId, eventType, actionType, entityId } = req.query;
    // Non-super/non-monitors cannot query outside their hospital
    let effectiveHospital = hospitalId;
    if (
      req.user &&
      req.user.role !== 'State / District Monitor' &&
      req.user.normalizedRole !== 'Auditor' &&
      req.user.hospitalId !== 'ALL'
    ) {
      effectiveHospital = req.user.hospitalId;
    }

    const logs = await auditService.getAuditLogs({
      hospitalId: effectiveHospital,
      actionType: actionType || eventType,
      entityId,
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyChain = (req, res) => {
  try {
    const verification = auditService.verifyChainIntegrity();
    res.json({
      success: true,
      verification,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
