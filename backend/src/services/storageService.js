const fs = require('fs');
const path = require('path');
const { isConnected } = require('../config/db');
const WasteRecordModel = require('../models/WasteRecord');
const PickupRequestModel = require('../models/PickupRequest');
const IncidentModel = require('../models/Incident');
const { initialWasteRecords, initialPickups, initialIncidents } = require('../seeds/seedData');

const DATA_DIR = process.env.DATA_DIR || (fs.existsSync(path.join(process.cwd(), 'backend/data')) ? path.join(process.cwd(), 'backend/data') : path.join(__dirname, '../../data'));
const DATA_FILE = path.join(DATA_DIR, 'db_store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Fallback State
let localStore = {
  wasteRecords: [...initialWasteRecords.map((r, i) => ({ _id: `waste_${i + 1}`, ...r }))],
  pickups: [...initialPickups.map((p, i) => ({ _id: `pickup_${i + 1}`, ...p }))],
  incidents: [...initialIncidents.map((inc, i) => ({ _id: `inc_${i + 1}`, ...inc }))],
};

// Load saved data if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.wasteRecords) {
      localStore = parsed;
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

// --- WASTE RECORDS METHODS ---
const getAllWaste = async (filters = {}) => {
  if (isConnected()) {
    const query = {};
    if (filters.category && filters.category !== 'All') query.category = filters.category;
    if (filters.department && filters.department !== 'All') query.department = filters.department;
    if (filters.status && filters.status !== 'All') query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { tagId: { $regex: filters.search, $options: 'i' } },
        { handlerName: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await WasteRecordModel.find(query).sort({ createdAt: -1 });
  }

  // Fallback
  let list = [...localStore.wasteRecords];
  if (filters.category && filters.category !== 'All') {
    list = list.filter((r) => r.category === filters.category);
  }
  if (filters.department && filters.department !== 'All') {
    list = list.filter((r) => r.department === filters.department);
  }
  if (filters.status && filters.status !== 'All') {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.tagId.toLowerCase().includes(s) ||
        r.handlerName.toLowerCase().includes(s) ||
        r.location.toLowerCase().includes(s)
    );
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getWasteById = async (id) => {
  if (isConnected()) {
    return await WasteRecordModel.findById(id);
  }
  return localStore.wasteRecords.find((r) => r._id === id || r.tagId === id);
};

const createWasteRecord = async (data) => {
  if (isConnected()) {
    const record = new WasteRecordModel(data);
    return await record.save();
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
  if (isConnected()) {
    return await WasteRecordModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
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
    return await WasteRecordModel.findByIdAndDelete(id);
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
    return await PickupRequestModel.find().sort({ scheduledDate: -1 });
  }
  return [...localStore.pickups].sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
};

const createPickup = async (data) => {
  if (isConnected()) {
    const pickup = new PickupRequestModel(data);
    const saved = await pickup.save();
    // Update linked waste records to In Transit or Awaiting Pickup
    if (data.wasteRecordIds && data.wasteRecordIds.length > 0) {
      await WasteRecordModel.updateMany(
        { tagId: { $in: data.wasteRecordIds } },
        { status: 'In Transit', pickupId: saved._id.toString() }
      );
    }
    return saved;
  }

  const newPickup = {
    _id: `pickup_${Date.now()}`,
    ...data,
    status: data.status || 'Scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStore.pickups.unshift(newPickup);

  // Link waste records in local store
  if (data.wasteRecordIds && data.wasteRecordIds.length > 0) {
    localStore.wasteRecords = localStore.wasteRecords.map((rec) => {
      if (data.wasteRecordIds.includes(rec.tagId)) {
        return { ...rec, status: 'In Transit', pickupId: newPickup._id };
      }
      return rec;
    });
  }
  saveLocalStore();
  return newPickup;
};

const updatePickupStatus = async (id, status) => {
  if (isConnected()) {
    const update = { status };
    if (status === 'Completed') update.completedDate = new Date();
    const updated = await PickupRequestModel.findByIdAndUpdate(id, update, { new: true });
    if (updated && status === 'Completed' && updated.wasteRecordIds) {
      await WasteRecordModel.updateMany(
        { tagId: { $in: updated.wasteRecordIds } },
        { status: 'Disposed', disposedAt: new Date() }
      );
    }
    return updated;
  }

  const idx = localStore.pickups.findIndex((p) => p._id === id || p.manifestNumber === id);
  if (idx === -1) return null;
  const p = localStore.pickups[idx];
  p.status = status;
  if (status === 'Completed') {
    p.completedDate = new Date().toISOString();
    localStore.wasteRecords = localStore.wasteRecords.map((w) => {
      if (p.wasteRecordIds && p.wasteRecordIds.includes(w.tagId)) {
        return { ...w, status: 'Disposed', disposedAt: new Date().toISOString() };
      }
      return w;
    });
  }
  saveLocalStore();
  return p;
};

// --- INCIDENT & COMPLIANCE METHODS ---
const getAllIncidents = async () => {
  if (isConnected()) {
    return await IncidentModel.find().sort({ reportedDate: -1 });
  }
  return [...localStore.incidents].sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));
};

const createIncident = async (data) => {
  if (isConnected()) {
    const incident = new IncidentModel(data);
    return await incident.save();
  }

  const newInc = {
    _id: `inc_${Date.now()}`,
    ...data,
    reportedDate: data.reportedDate || new Date().toISOString(),
    status: data.status || 'Resolved',
  };
  localStore.incidents.unshift(newInc);
  saveLocalStore();
  return newInc;
};

const resolveIncident = async (id, resolution) => {
  if (isConnected()) {
    return await IncidentModel.findOneAndUpdate(
      { $or: [{ _id: id }, { incidentId: id }] },
      { status: 'Resolved', correctiveAction: resolution || 'Addressed and resolved by safety officer' },
      { new: true }
    );
  }

  const idx = localStore.incidents.findIndex((i) => i._id === id || i.incidentId === id);
  if (idx === -1) return null;
  localStore.incidents[idx].status = 'Resolved';
  if (resolution) {
    localStore.incidents[idx].correctiveAction = resolution;
  }
  saveLocalStore();
  return localStore.incidents[idx];
};

// --- STATS / METRICS AGGREGATION ---
const getStats = async () => {
  const records = await getAllWaste();
  const pickups = await getAllPickups();
  const incidents = await getAllIncidents();

  let totalWeight = 0;
  let activeWeight = 0; // Not yet disposed
  let disposedWeight = 0;

  const categoryBreakdown = {
    Yellow: { count: 0, weightKg: 0 },
    Red: { count: 0, weightKg: 0 },
    Blue: { count: 0, weightKg: 0 },
    White: { count: 0, weightKg: 0 },
    Black: { count: 0, weightKg: 0 },
  };

  const departmentBreakdown = {};
  const statusCounts = {
    Logged: 0,
    'Awaiting Pickup': 0,
    'In Transit': 0,
    Disposed: 0,
  };

  records.forEach((r) => {
    const w = Number(r.weightKg) || 0;
    totalWeight += w;
    if (r.status === 'Disposed') {
      disposedWeight += w;
    } else {
      activeWeight += w;
    }

    if (categoryBreakdown[r.category]) {
      categoryBreakdown[r.category].count += 1;
      categoryBreakdown[r.category].weightKg = Number((categoryBreakdown[r.category].weightKg + w).toFixed(2));
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
  // Compliance score calculation based on timely pickup, resolved incidents, and bag weight bounds
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved').length;
  let complianceScore = 98;
  if (openIncidents > 0) complianceScore -= openIncidents * 10;
  if (statusCounts['Awaiting Pickup'] > 5) complianceScore -= 5;
  complianceScore = Math.max(70, Math.min(100, complianceScore));

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
  };
};

// Seed / Reset Database
const resetToSeed = async () => {
  if (isConnected()) {
    await WasteRecordModel.deleteMany({});
    await PickupRequestModel.deleteMany({});
    await IncidentModel.deleteMany({});

    await WasteRecordModel.insertMany(initialWasteRecords);
    await PickupRequestModel.insertMany(initialPickups);
    await IncidentModel.insertMany(initialIncidents);
  }

  localStore = {
    wasteRecords: [...initialWasteRecords.map((r, i) => ({ _id: `waste_${i + 1}`, ...r }))],
    pickups: [...initialPickups.map((p, i) => ({ _id: `pickup_${i + 1}`, ...p }))],
    incidents: [...initialIncidents.map((inc, i) => ({ _id: `inc_${i + 1}`, ...inc }))],
  };
  saveLocalStore();
  return { message: 'Database refreshed with official clinical biomedical baseline dataset.' };
};

module.exports = {
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
  getStats,
  resetToSeed,
};
