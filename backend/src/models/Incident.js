const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Needle-Stick / Sharp Injury', 'Bag Puncture / Leak', 'Chemical / Liquid Spill', 'Improper Segregation', 'Transport Delay'],
    },
    department: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      default: 'Moderate',
    },
    reportedBy: {
      type: String,
      required: true,
    },
    reportedDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    correctiveAction: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Under Investigation', 'Resolved'],
      default: 'Resolved',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Incident', incidentSchema);
