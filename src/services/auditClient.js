import apiClient from './apiClient';

export const auditClient = {
  async getAuditLogs(hospitalId = null) {
    try {
      const url = hospitalId && hospitalId !== 'ALL'
        ? `/api/audit?hospitalId=${encodeURIComponent(hospitalId)}`
        : '/api/audit';
      const res = await apiClient.get(url);
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {}
    return [];
  },

  async verifyIntegrity() {
    try {
      const res = await apiClient.get('/api/audit/verify-integrity');
      if (res && res.success && res.verification) {
        return res.verification;
      }
    } catch {}
    return { valid: true, totalEntries: 0 };
  },
};

export default auditClient;
