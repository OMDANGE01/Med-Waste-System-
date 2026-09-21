const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema(
  {
    manifestNumber: {
      type: String,
      required: true,
      unique: true,
    },
    treatmentFacility: {
      type: String,
      required: true,
      default: 'Apex Bio-Clean & Incineration Services (CBWTF)',
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhone: {
      type: String,
      default: '+1 (555) 349-8821',
    },
    wasteRecordIds: [
      {
        type: String,
      },
    ],
    totalWeightKg: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'En Route', 'Collected', 'Completed'],
      default: 'Scheduled',
    },
    scheduledDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);
