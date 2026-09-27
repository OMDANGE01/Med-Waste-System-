import apiClient from './apiClient';
import { DEFAULT_WASTE_RECORDS, DEFAULT_PICKUPS, DEFAULT_INCIDENTS } from '../data/baselineData';
import { generateKhamgaonBagCode } from '../data/baselineData';

export const wasteService = {
  /**
   * Fetch waste records for a specific hospital or ALL
   */
  async getWasteRecords(hospitalId = null) {
    try {
      const url = hospitalId && hospitalId !== 'ALL'
        ? `/api/waste?hospitalId=${encodeURIComponent(hospitalId)}`
        : '/api/waste';
      const res = await apiClient.get(url);
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {}

    if (hospitalId && hospitalId !== 'ALL') {
      return DEFAULT_WASTE_RECORDS.filter((r) => r.hospitalId === hospitalId);
    }
    return DEFAULT_WASTE_RECORDS;
  },

  /**
   * Log new biomedical waste bag
   */
  async createWasteRecord(payload) {
    const enriched = {
      ...payload,
      bagId: payload.bagId || generateKhamgaonBagCode(payload.hospitalId || 'HOSP-01'),
      status: payload.status || 'Logged',
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    try {
      const res = await apiClient.post('/api/waste', enriched);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch {}

    return enriched;
  },

  /**
   * Update status of waste bag (e.g. Picked Up, In Transit, Incinerated)
   */
  async updateWasteStatus(bagId, updateFields) {
    try {
      const res = await apiClient.patch(`/api/waste/${encodeURIComponent(bagId)}`, updateFields);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch {}

    return { bagId, ...updateFields };
  },

  /**
   * Fetch pickups
   */
  async getPickups() {
    try {
      const res = await apiClient.get('/api/pickups');
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {}
    return DEFAULT_PICKUPS;
  },

  /**
   * Fetch incidents
   */
  async getIncidents() {
    try {
      const res = await apiClient.get('/api/incidents');
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {}
    return DEFAULT_INCIDENTS;
  },
};

export default wasteService;
