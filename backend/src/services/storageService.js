const fs = require('fs');
const path = require('path');
const { isConnected } = require('../config/db');
const WasteRecordModel = require('../models/WasteRecord');
const PickupRequestModel = require('../models/PickupRequest');
const IncidentModel = require('../models/Incident');
const HospitalModel = require('../models/Hospital');
const WorkerModel = require('../models/Worker');
const { 
  initialHospitals, 
  initialWorkers, 
  initialWasteRecords, 
  initialPickups, 
  initialIncidents 
} = require('../seeds/seedData');

const DATA_DIR = process.env.DATA_DIR || (fs.existsSync(path.join(process.cwd(), 'backend/data')) ? path.join(process.cwd(), 'backend/data') : path.join(__dirname, '../../data'));
const DATA_FILE = path.join(DATA_DIR, 'db_store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Resilient Fallback State
let localStore = {
  hospitals: [...initialHospitals.map((h, i) => ({ _id: `hosp_${i + 1}`, ...h }))],
  workers: [...initialWorkers.map((w, i) => ({ _id: `wrk_${i + 1}`, ...w }))],
  wasteRecords: [...initialWasteRecords.map((r, i) => ({ _id: `waste_${i + 1}`, ...r }))],
  pickups: [...initialPickups.map((p, i) => ({ _id: `pickup_${i + 1}`, ...p }))],
  incidents: [...initialIncidents.map((inc, i) => ({ _id: `inc_${i + 1}`, ...inc }))],
  syncLog: [],
};

// Load saved data if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.wasteRecords) {
      localStore = {
        ...localStore,
        ...parsed,
        hospitals: parsed.hospitals && parsed.hospitals.length ? parsed.hospitals : localStore.hospitals,
        workers: parsed.workers && parsed.workers.length ? parsed.workers : localStore.workers,
      };
    }
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  }
} catch (e) {
  console.warn('[Storage] Error reading local data file, using defaults:', e.message);
}

const saveLocalStore = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    console.error('[Storage] Failed to persist data file:', e.message);
  }
};

// --- HOSPITALS METHODS ---
const getAllHospitals = async () => {
  if (isConnected()) {
    try {
      const records = await HospitalModel.find({}).sort({ bedCapacity: -1 });
      if (records && records.length > 0) return records;
    } catch (e) {
      console.warn('[Storage] Hospital query fallback:', e.message);
    }
  }
  return localStore.hospitals;
};

const getHospitalById = async (id) => {
  if (isConnected()) {
    try {
      const record = await HospitalModel.findOne({ $or: [{ hospitalId: id }, { _id: id }] });
      if (record) return record;
    } catch (e) {
      console.warn('[Storage] Hospital lookup fallback:', e.message);
    }
  }
  return localStore.hospitals.find((h) => h.hospitalId === id || h._id === id || h.name.toLowerCase().includes(id.toLowerCase()));
};

// --- WORKERS METHODS ---
const getAllWorkers = async (hospitalId = null) => {
  if (isConnected()) {
    try {
      const query = hospitalId && hospitalId !== 'ALL' ? { hospitalId } : {};
      const workers = await WorkerModel.find(query).sort({ role: 1 });
      if (workers && workers.length > 0) return workers;
    } catch (e) {
      console.warn('[Storage] Worker query fallback:', e.message);
    }
  }

  let list = [...localStore.workers];
  if (hospitalId && hospitalId !== 'ALL') {
    list = list.filter((w) => w.hospitalId === hospitalId || w.hospitalId === 'ALL');
  }
  return list;
};

const createWorker = async (data) => {
  const newWorkerId = data.workerId || `WRK-${Date.now().toString().slice(-4)}`;
  const workerObj = {
    ...data,
    workerId: newWorkerId,
    avatar: data.role?.includes('Surgeon') || data.role?.includes('Doctor') 
      ? '👨‍⚕️' 
      : data.role?.includes('Nurse') 
      ? '👩‍⚕️' 
      : data.role?.includes('Registration') 
      ? '🏷️' 
      : data.role?.includes('Delivery') 
      ? '📦' 
      : data.role?.includes('Driver') 
      ? '🚚' 
      : '👤',
    dutyStatus: data.dutyStatus || 'On Duty',
    createdAt: new Date().toISOString(),
  };

  if (isConnected()) {
    try {
      const record = new WorkerModel(workerObj);
      return await record.save();
    } catch (e) {
      console.warn('[Storage] Worker create fallback:', e.message);
    }
  }

  const saved = { _id: `wrk_${Date.now()}`, ...workerObj };
  localStore.workers.unshift(saved);
  saveLocalStore();
  return saved;
};

const updateWorkerStatus = async (id, status) => {
  if (isConnected()) {
    try {
      return await WorkerModel.findOneAndUpdate(
        { $or: [{ workerId: id }, { _id: id }] },
        { dutyStatus: status },
        { new: true }
      );
    } catch (e) {
      // fallback
    }
  }

  const idx = localStore.workers.findIndex((w) => w.workerId === id || w._id === id);
  if (idx !== -1) {
    localStore.workers[idx].dutyStatus = status;
    saveLocalStore();
    return localStore.workers[idx];
  }
  return null;
};

// --- WASTE RECORDS METHODS ---
const getAllWaste = async (filters = {}) => {
  if (isConnected()) {
    try {
      const query = {};
      if (filters.category && filters.category !== 'All') query.category = filters.category;
      if (filters.department && filters.department !== 'All') {
        const d = filters.department.trim();
        const keywords = d.split(/[ &(/)]+/).filter((w) => w.length > 2);
        query.department = { $regex: keywords.length > 0 ? keywords.join('|') : d, $options: 'i' };
      }
      if (filters.status && filters.status !== 'All') query.status = filters.status;
      if (filters.hospitalId && filters.hospitalId !== 'ALL') query.hospitalId = filters.hospitalId;
      if (filters.hospitalName && filters.hospitalName !== 'ALL') query.hospitalName = filters.hospitalName;
      if (filters.search) {
        query.$or = [
          { tagId: { $regex: filters.search, $options: 'i' } },
          { handlerName: { $regex: filters.search, $options: 'i' } },
          { location: { $regex: filters.search, $options: 'i' } },
          { hospitalName: { $regex: filters.search, $options: 'i' } },
        ];
      }
      return await WasteRecordModel.find(query).sort({ createdAt: -1 });
    } catch (e) {
      console.warn('[Storage] MongoDB waste query error, falling back to local:', e.message);
    }
  }

  // Fallback
  let list = [...localStore.wasteRecords];
  if (filters.category && filters.category !== 'All') {
    list = list.filter((r) => r.category === filters.category);
  }
  if (filters.department && filters.department !== 'All') {
    const target = filters.department.toLowerCase().trim();
    list = list.filter((r) => {
      if (!r.department) return false;
      const d = r.department.toLowerCase().trim();
      if (d === target || d.includes(target) || target.includes(d)) return true;
      if (
        (target.includes('theater') || target.includes('theatre') || target.includes('ot') || target.includes('surgery')) &&
        (d.includes('theater') || d.includes('theatre') || d.includes('ot') || d.includes('surgery'))
      ) {
        return true;
      }
      return false;
    });
  }
  if (filters.status && filters.status !== 'All') {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters.hospitalId && filters.hospitalId !== 'ALL') {
    list = list.filter((r) => r.hospitalId === filters.hospitalId);
  }
  if (filters.hospitalName && filters.hospitalName !== 'ALL') {
    list = list.filter((r) => r.hospitalName === filters.hospitalName);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.tagId.toLowerCase().includes(s) ||
        r.handlerName.toLowerCase().includes(s) ||
        r.location.toLowerCase().includes(s) ||
        (r.hospitalName && r.hospitalName.toLowerCase().includes(s))
    );
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getWasteById = async (id) => {
  if (!id) return null;
  if (isConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const found = await WasteRecordModel.findById(id);
        if (found) return found;
      }
      const foundByTag = await WasteRecordModel.findOne({ tagId: id });
      if (foundByTag) return foundByTag;
    } catch (e) {
      // fallback
    }
  }
  return localStore.wasteRecords.find((r) => r._id === id || r.tagId === id);
};

const createWasteRecord = async (data) => {
  if (isConnected()) {
    try {
      const record = new WasteRecordModel(data);
      return await record.save();
    } catch (e) {
      console.warn('[Storage] Fallback to local store for waste creation:', e.message);
    }
  }

  const newRecord = {
    _id: `waste_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...data,
    status: data.status || 'Logged',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStore.wasteRecords.unshift(newRecord);
  saveLocalStore();
  return newRecord;
};

const updateWasteRecord = async (id, updateData) => {
  if (!id) return null;
  if (isConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const res = await WasteRecordModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (res) return res;
      }
      const resByTag = await WasteRecordModel.findOneAndUpdate({ tagId: id }, updateData, { new: true, runValidators: true });
      if (resByTag) return resByTag;
    } catch (e) {
      // fallback
    }
  }

  const idx = localStore.wasteRecords.findIndex((r) => r._id === id || r.tagId === id);
  if (idx === -1) return null;
  localStore.wasteRecords[idx] = {
    ...localStore.wasteRecords[idx],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  saveLocalStore();
  return localStore.wasteRecords[idx];
};

const deleteWasteRecord = async (id) => {
  if (isConnected()) {
    try {
      return await WasteRecordModel.findByIdAndDelete(id);
    } catch (e) {
      // fallback
    }
  }

  const idx = localStore.wasteRecords.findIndex((r) => r._id === id || r.tagId === id);
  if (idx === -1) return null;
  const deleted = localStore.wasteRecords.splice(idx, 1)[0];
  saveLocalStore();
  return deleted;
};

// --- PICKUP & MANIFEST METHODS ---
const getAllPickups = async () => {
  if (isConnected()) {
    try {
      return await PickupRequestModel.find({}).sort({ scheduledDate: -1 });
    } catch (e) {
      // fallback
    }
  }
  return [...localStore.pickups].sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
};

const createPickup = async (data) => {
  if (isConnected()) {
    try {
      const pickup = new PickupRequestModel(data);
      return await pickup.save();
    } catch (e) {
      // fallback
    }
  }

  const newPickup = {
    _id: `pickup_${Date.now()}`,
    ...data,
    status: data.status || 'Scheduled',
    createdAt: new Date().toISOString(),
  };
  localStore.pickups.unshift(newPickup);
  saveLocalStore();
  return newPickup;
};

const updatePickupStatus = async (id, status, driverName, vehicleNumber) => {
  const updateObj = { status };
  if (status === 'Completed') updateObj.completedDate = new Date();
  if (driverName) updateObj.driverName = driverName;
  if (vehicleNumber) updateObj.vehicleNumber = vehicleNumber;

  if (isConnected()) {
    try {
      return await PickupRequestModel.findOneAndUpdate(
        { $or: [{ _id: id }, { manifestNumber: id }] },
        updateObj,
        { new: true }
      );
    } catch (e) {
      // fallback
    }
  }

  const idx = localStore.pickups.findIndex((p) => p._id === id || p.manifestNumber === id);
  if (idx === -1) return null;
  localStore.pickups[idx] = {
    ...localStore.pickups[idx],
    ...updateObj,
    updatedAt: new Date().toISOString(),
  };
  saveLocalStore();
  return localStore.pickups[idx];
};

// --- INCIDENTS METHODS ---
const getAllIncidents = async () => {
  if (isConnected()) {
    try {
      return await IncidentModel.find({}).sort({ reportedDate: -1 });
    } catch (e) {
      // fallback
    }
  }
  return [...localStore.incidents].sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));
};

const createIncident = async (data) => {
  const incidentId = `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const incidentData = { ...data, incidentId };

  if (isConnected()) {
    try {
      const incident = new IncidentModel(incidentData);
      return await incident.save();
    } catch (e) {
      // fallback
    }
  }

  const newIncident = {
    _id: `inc_${Date.now()}`,
    ...incidentData,
    status: 'Open',
    reportedDate: new Date().toISOString(),
  };
  localStore.incidents.unshift(newIncident);
  saveLocalStore();
  return newIncident;
};

const resolveIncident = async (id, correctiveAction) => {
  if (isConnected()) {
    try {
      return await IncidentModel.findOneAndUpdate(
        { $or: [{ _id: id }, { incidentId: id }] },
        { status: 'Resolved', correctiveAction, resolvedAt: new Date() },
        { new: true }
      );
    } catch (e) {
      // fallback
    }
  }

  const idx = localStore.incidents.findIndex((i) => i._id === id || i.incidentId === id);
  if (idx === -1) return null;
  localStore.incidents[idx].status = 'Resolved';
  localStore.incidents[idx].correctiveAction = correctiveAction;
  localStore.incidents[idx].resolvedAt = new Date().toISOString();
  saveLocalStore();
  return localStore.incidents[idx];
};

// --- CLOUD SYNC ENGINE: Process Batched Offline Transactions ---
const syncTransactions = async (transactions = []) => {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    details: [],
  };

  for (const tx of transactions) {
    results.processed += 1;
    try {
      const { operation, table, payload, clientTimestamp, txId } = tx;

      if (table === 'waste_records') {
        if (operation === 'INSERT') {
          await createWasteRecord(payload);
        } else if (operation === 'UPDATE') {
          await updateWasteRecord(payload.id || payload._id || payload.tagId, payload);
        } else if (operation === 'DELETE') {
          await deleteWasteRecord(payload.id || payload._id || payload.tagId);
        }
      } else if (table === 'pickup_requests') {
        if (operation === 'INSERT') {
          await createPickup(payload);
        } else if (operation === 'UPDATE') {
          await updatePickupStatus(payload.id || payload.manifestNumber, payload.status, payload.driverName, payload.vehicleNumber);
        }
      } else if (table === 'workers') {
        if (operation === 'INSERT') {
          await createWorker(payload);
        } else if (operation === 'UPDATE_STATUS') {
          await updateWorkerStatus(payload.workerId, payload.dutyStatus);
        }
      } else if (table === 'incidents') {
        if (operation === 'INSERT') {
          await createIncident(payload);
        }
      }

      results.succeeded += 1;
      results.details.push({ txId, status: 'synced', timestamp: new Date().toISOString() });
    } catch (err) {
      results.failed += 1;
      results.details.push({ txId: tx.txId, status: 'error', error: err.message });
    }
  }

  localStore.syncLog = [
    ...results.details,
    ...(localStore.syncLog || []).slice(0, 100),
  ];
  saveLocalStore();

  return results;
};

// --- STATS & SUPER MONITOR AGGREGATIONS ---
const getStats = async (hospitalId = null) => {
  const records = await getAllWaste(hospitalId && hospitalId !== 'ALL' ? { hospitalId } : {});
  const pickups = await getAllPickups();
  const incidents = await getAllIncidents();
  const hospitals = await getAllHospitals();
  const workers = await getAllWorkers(hospitalId);

  let totalWeight = 0;
  let activeWeight = 0;
  let disposedWeight = 0;

  const categoryBreakdown = { Yellow: 0, Red: 0, Blue: 0, Black: 0, White: 0 };
  const departmentBreakdown = {};
  const statusCounts = {
    Logged: 0,
    'Awaiting Pickup': 0,
    'In Transit': 0,
    Disposed: 0,
  };

  records.forEach((r) => {
    const w = parseFloat(r.weightKg) || 0;
    totalWeight += w;

    if (r.status === 'Disposed') {
      disposedWeight += w;
    } else {
      activeWeight += w;
    }

    if (categoryBreakdown[r.category] !== undefined) {
      categoryBreakdown[r.category] = Number((categoryBreakdown[r.category] + w).toFixed(2));
    }

    if (!departmentBreakdown[r.department]) {
      departmentBreakdown[r.department] = { count: 0, weightKg: 0 };
    }
    departmentBreakdown[r.department].count += 1;
    departmentBreakdown[r.department].weightKg = Number((departmentBreakdown[r.department].weightKg + w).toFixed(2));

    if (statusCounts[r.status] !== undefined) {
      statusCounts[r.status] += 1;
    }
  });

  const totalBags = records.length;
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved').length;
  let complianceScore = 98;
  if (openIncidents > 0) complianceScore -= openIncidents * 10;
  if (statusCounts['Awaiting Pickup'] > 5) complianceScore -= 5;
  complianceScore = Math.max(70, Math.min(100, complianceScore));

  // Multi-hospital breakdown for Super Monitor
  const hospitalSummaries = hospitals.map((h) => {
    const hBags = localStore.wasteRecords.filter((r) => r.hospitalId === h.hospitalId || r.hospitalName === h.name);
    const hWeight = hBags.reduce((acc, b) => acc + (parseFloat(b.weightKg) || 0), 0);
    const hAwaiting = hBags.filter((b) => b.status === 'Awaiting Pickup').length;
    const hWorkers = localStore.workers.filter((w) => w.hospitalId === h.hospitalId).length;
    return {
      hospitalId: h.hospitalId,
      name: h.name,
      cpcbCode: h.cpcbCode,
      bedCapacity: h.bedCapacity,
      zone: h.zone,
      lat: h.lat,
      lng: h.lng,
      superintendent: h.superintendent,
      totalBags: hBags.length,
      totalWeightKg: Number(hWeight.toFixed(2)),
      awaitingPickupCount: hAwaiting,
      workersCount: hWorkers,
      complianceScore: Math.min(100, Math.max(82, 98 - hAwaiting * 2)),
      status: h.status,
    };
  });

  return {
    totalBags,
    totalWeightKg: Number(totalWeight.toFixed(2)),
    activeWeightKg: Number(activeWeight.toFixed(2)),
    disposedWeightKg: Number(disposedWeight.toFixed(2)),
    complianceScore,
    statusCounts,
    categoryBreakdown,
    departmentBreakdown,
    recentPickupsCount: pickups.length,
    incidentCount: incidents.length,
    openIncidents,
    totalHospitalsCount: hospitals.length,
    totalWorkersCount: workers.length,
    hospitalSummaries,
  };
};

// Seed / Reset Database
const resetToSeed = async () => {
  if (isConnected()) {
    try {
      await WasteRecordModel.deleteMany({});
      await PickupRequestModel.deleteMany({});
      await IncidentModel.deleteMany({});
      await HospitalModel.deleteMany({});
      await WorkerModel.deleteMany({});

      await HospitalModel.insertMany(initialHospitals);
      await WorkerModel.insertMany(initialWorkers);
      await WasteRecordModel.insertMany(initialWasteRecords);
      await PickupRequestModel.insertMany(initialPickups);
      await IncidentModel.insertMany(initialIncidents);
    } catch (e) {
      console.warn('[Storage] Seed error in MongoDB, resetting local store:', e.message);
    }
  }

  localStore = {
    hospitals: [...initialHospitals.map((h, i) => ({ _id: `hosp_${i + 1}`, ...h }))],
    workers: [...initialWorkers.map((w, i) => ({ _id: `wrk_${i + 1}`, ...w }))],
    wasteRecords: [...initialWasteRecords.map((r, i) => ({ _id: `waste_${i + 1}`, ...r }))],
    pickups: [...initialPickups.map((p, i) => ({ _id: `pickup_${i + 1}`, ...p }))],
    incidents: [...initialIncidents.map((inc, i) => ({ _id: `inc_${i + 1}`, ...inc }))],
    syncLog: [],
  };
  saveLocalStore();
  return { message: 'Database reset and seeded with production clinical biomedical multi-hospital dataset.' };
};

module.exports = {
  getAllHospitals,
  getHospitalById,
  getAllWorkers,
  createWorker,
  updateWorkerStatus,
  getAllWaste,
  getWasteById,
  createWasteRecord,
  updateWasteRecord,
  deleteWasteRecord,
  getAllPickups,
  createPickup,
  updatePickupStatus,
  getAllIncidents,
  createIncident,
  resolveIncident,
  syncTransactions,
  getStats,
  resetToSeed,
};
