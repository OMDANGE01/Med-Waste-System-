const mongoose = require('mongoose');

const wasteRecordSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Yellow', 'Red', 'Blue', 'White', 'Black'],
    },
    department: {
      type: String,
      required: true,
      enum: ['ICU', 'Operating Theater', 'Emergency', 'Pathology Lab', 'General Ward', 'Oncology', 'Pediatrics'],
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0.05,
    },
    status: {
      type: String,
      required: true,
      enum: ['Logged', 'Awaiting Pickup', 'In Transit', 'Disposed'],
      default: 'Logged',
    },
    handlerName: {
      type: String,
      required: true,
      trim: true,
    },
    hospitalName: {
      type: String,
      required: true,
      default: 'St. Jude Memorial Hospital',
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      default: 20.0063,
    },
    lng: {
      type: Number,
      default: 73.7902,
    },
    hazardLevel: {
      type: String,
      enum: ['Bio-Infectious', 'Toxic Chemical', 'Sharp Hazard', 'High-Risk Anatomical'],
      default: 'Bio-Infectious',
    },
    notes: {
      type: String,
      default: '',
    },
    disposedAt: {
      type: Date,
    },
    pickupId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WasteRecord', wasteRecordSchema);
