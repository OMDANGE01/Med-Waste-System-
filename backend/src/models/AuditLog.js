const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: String,
      required: true,
      trim: true,
    },
    actorRole: {
      type: String,
      required: true,
      trim: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: 'Authorized Staff',
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    hospitalId: {
      type: String,
      trim: true,
      default: 'GLOBAL',
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    hash: {
      type: String,
      trim: true,
    },
    previousHash: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Strictly append-only: prevent any UPDATE or DELETE operations targeting audit log
auditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog is append-only. UPDATE operations are forbidden.');
});
auditLogSchema.pre('updateMany', function () {
  throw new Error('AuditLog is append-only. UPDATE operations are forbidden.');
});
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog is append-only. UPDATE operations are forbidden.');
});
auditLogSchema.pre('deleteOne', function () {
  throw new Error('AuditLog is append-only. DELETE operations are forbidden.');
});
auditLogSchema.pre('deleteMany', function () {
  throw new Error('AuditLog is append-only. DELETE operations are forbidden.');
});
auditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('AuditLog is append-only. DELETE operations are forbidden.');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
