const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cpcbCode: {
      type: String,
      required: true,
      trim: true,
    },
    bedCapacity: {
      type: Number,
      required: true,
      default: 300,
    },
    address: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      default: 'North Zone Medical Cluster',
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    contactPhone: {
      type: String,
      default: '+91 22 2548 9900',
    },
    contactEmail: {
      type: String,
      required: true,
    },
    superintendent: {
      type: String,
      default: 'Dr. Aaron Patel',
    },
    activeWards: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Pending Inspection', 'Suspended'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
