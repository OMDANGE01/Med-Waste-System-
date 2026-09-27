import apiClient from './apiClient';

/**
 * Standard Khamgaon Hospitals Dataset (MH 56 / MH-28)
 * Fallback dataset if remote API is cold-starting or offline.
 */
export const KHAMGAON_HOSPITALS = [
  {
    hospitalId: 'HOSP-01',
    name: 'Government Hospital of Khamgaon',
    cpcbCode: 'MPCB-KHM-GOV-2024',
    bedCapacity: 200,
    address: 'Jalamb Road, Near Civil Lines, Khamgaon, Buldhana District, MH 444303',
    zone: 'Central Public Healthcare Zone',
    type: 'Government Sub-District Hospital',
    badge: 'Public Healthcare',
    icon: '🏛️',
    color: 'emerald',
    superintendent: 'Dr. Ravindra Patil (Civil Surgeon & Superintendent)',
    dailyWasteKg: 142.5,
    deliveredKg: 118.0,
    pendingKg: 24.5,
    categories: { yellow: 68.2, red: 42.1, blue: 21.0, white: 11.2 },
    lat: 20.6920,
    lng: 76.5695,
  },
  {
    hospitalId: 'HOSP-02',
    name: 'Dwarka Hospital of Khamgaon',
    cpcbCode: 'MPCB-KHM-DWK-2023',
    bedCapacity: 120,
    address: 'Near New Bus Stand, Nandura Road, NH-53 / MH-56, Khamgaon, MH 444303',
    zone: 'Highway Medical Corridor',
    type: 'Private Multispeciality Hospital',
    badge: 'ICCU & Critical Care',
    icon: '🏥',
    color: 'teal',
    superintendent: 'Dr. Ashish Dwarka (Medical Director)',
    dailyWasteKg: 88.0,
    deliveredKg: 72.5,
    pendingKg: 15.5,
    categories: { yellow: 41.0, red: 28.5, blue: 12.0, white: 6.5 },
    lat: 20.6854,
    lng: 76.5742,
  },
  {
    hospitalId: 'HOSP-03',
    name: 'Anand Hospital of Khamgaon',
    cpcbCode: 'MPCB-KHM-AND-2022',
    bedCapacity: 80,
    address: 'Ghatpuri Naka, Balaji Plots, Khamgaon, Maharashtra 444303',
    zone: 'South Emergency Corridor',
    type: 'Critical Care & Accident Hospital',
    badge: 'Accident & Trauma',
    icon: '🚑',
    color: 'amber',
    superintendent: 'Dr. Anand Deshpande (Director & Orthopedic Surgeon)',
    dailyWasteKg: 54.2,
    deliveredKg: 46.0,
    pendingKg: 8.2,
    categories: { yellow: 24.5, red: 18.2, blue: 8.0, white: 3.5 },
    lat: 20.6812,
    lng: 76.5615,
  },
  {
    hospitalId: 'HOSP-04',
    name: 'Dr. Hedgewar Rugnalaya Khamgaon',
    cpcbCode: 'MPCB-KHM-HDG-2024',
    bedCapacity: 100,
    address: 'Station Road, Opposite Railway Colony, Khamgaon, Maharashtra 444303',
    zone: 'Railway & Urban Health Sector',
    type: 'Charitable Trust Hospital',
    badge: 'Charitable Healthcare',
    icon: '🏥',
    color: 'indigo',
    superintendent: 'Dr. Maheshwari Joshi (Chief Medical Officer)',
    dailyWasteKg: 62.4,
    deliveredKg: 52.0,
    pendingKg: 10.4,
    categories: { yellow: 29.0, red: 20.4, blue: 9.0, white: 4.0 },
    lat: 20.6970,
    lng: 76.5720,
  },
  {
    hospitalId: 'CBWTF-01',
    name: 'Khamgaon Central Bio-Medical Treatment Facility (CBWTF)',
    cpcbCode: 'MPCB-CBWTF-KHM-01',
    bedCapacity: 0,
    address: 'Plot 18-20, MIDC Industrial Area, Khamgaon - Nandura Highway, MH 444303',
    zone: 'MIDC Treatment & Incineration Park',
    type: 'Regional Central Incineration Facility',
    badge: 'CBWTF Plant & Transit Fleet',
    icon: '🏭',
    color: 'rose',
    superintendent: 'Eng. Rajeshwar Tidke (Operations Director)',
    dailyWasteKg: 347.1,
    deliveredKg: 347.1,
    pendingKg: 0,
    categories: { yellow: 162.7, red: 109.2, blue: 50.0, white: 25.2 },
    lat: 20.6720,
    lng: 76.5450,
  },
];

export const hospitalService = {
  /**
   * Fetch all registered Khamgaon hospitals
   */
  async getHospitals() {
    try {
      const res = await apiClient.get('/api/hospitals');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return KHAMGAON_HOSPITALS;
    } catch {
      return KHAMGAON_HOSPITALS;
    }
  },

  /**
   * Get specific hospital by ID
   */
  async getHospitalById(hospitalId) {
    try {
      const res = await apiClient.get(`/api/hospitals/${hospitalId}`);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch {}
    return KHAMGAON_HOSPITALS.find((h) => h.hospitalId === hospitalId) || KHAMGAON_HOSPITALS[0];
  },

  /**
   * Get daily summary statistics for all Khamgaon facilities
   */
  async getDailySummary() {
    try {
      const res = await apiClient.get('/api/stats');
      if (res && res.success) {
        return res.data;
      }
    } catch {}

    const totalCollected = KHAMGAON_HOSPITALS.reduce((acc, h) => acc + (h.dailyWasteKg || 0), 0);
    const totalDelivered = KHAMGAON_HOSPITALS.reduce((acc, h) => acc + (h.deliveredKg || 0), 0);
    const totalPending = KHAMGAON_HOSPITALS.reduce((acc, h) => acc + (h.pendingKg || 0), 0);

    return {
      totalCollectedKg: Math.round(totalCollected * 10) / 10,
      totalDeliveredKg: Math.round(totalDelivered * 10) / 10,
      totalPendingKg: Math.round(totalPending * 10) / 10,
      activeHospitalsCount: KHAMGAON_HOSPITALS.length,
      transitVehiclesActive: 2,
    };
  },
};

export default hospitalService;
