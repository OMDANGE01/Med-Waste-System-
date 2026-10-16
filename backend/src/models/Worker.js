const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    hospitalId: {
      type: String,
      required: true,
      ref: 'Hospital',
    },
    hospitalName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'Chief Medical Superintendent',
        'Doctor / Lead Surgeon',
        'Clinical Staff / Nurse',
        'Package Registration Worker',
        'Internal Delivery Boy / Handler',
        'CBWTF Transport Custodian'
      ],
    },
    department: {
      type: String,
      required: true,
      default: 'General Ward',
    },
    phone: {
      type: String,
      default: '+91 98200 12345',
    },
    badgeNumber: {
      type: String,
      required: true,
    },
    dutyStatus: {
      type: String,
      enum: ['On Duty', 'Off Duty', 'In Transit', 'On Break'],
      default: 'On Duty',
    },
    avatar: {
      type: String,
      default: '👤',
    },
    is_logged_in: {
      type: Boolean,
      default: false,
    },
    active_session_id: {
      type: String,
      default: null,
    },
    last_active_at: {
      type: Date,
      default: null,
    },
    session_created_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Worker', workerSchema);
