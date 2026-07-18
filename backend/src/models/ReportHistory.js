const mongoose = require('mongoose');

const KeyFindingSchema = new mongoose.Schema({
  test: { type: String, required: true },
  value: { type: String, required: true },
  referenceRange: { type: String, default: '' },
  status: { type: String, default: 'Normal' }
}, { _id: false });

const LabResultSchema = new mongoose.Schema({
  test: { type: String, required: true },
  value: { type: String, required: true },
  referenceRange: { type: String, default: '' },
  status: { type: String, default: 'Normal' },
  unit: { type: String, default: '' }
}, { _id: false });

const HighlightedInsightSchema = new mongoose.Schema({
  type: { type: String, default: 'info' }, // 'danger', 'warning', 'info'
  message: { type: String, required: true }
}, { _id: false });

const ReportHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String, // 'pdf' or 'image'
    required: true,
  },
  fileName: {
    type: String,
    default: '',
  },
  rawText: {
    type: String,
    default: '',
  },
  reportType: {
    type: String,
    default: 'Other',
  },
  patient: {
    name: { type: String, default: '' },
    dob: { type: String, default: '' },
    age: { type: String, default: '' },
    gender: { type: String, default: '' },
    patientId: { type: String, default: '' }
  },
  doctor: {
    name: { type: String, default: '' },
    specialty: { type: String, default: '' },
    contact: { type: String, default: '' }
  },
  lifestyleInformation: [String],
  patientDetails: {
    name: { type: String, default: '' },
    age: { type: String, default: '' },
    gender: { type: String, default: '' },
    patientID: { type: String, default: '' },
    dob: { type: String, default: '' },
    reportDate: { type: String, default: '' }
  },
  doctorDetails: {
    physicianName: { type: String, default: '' },
    specialty: { type: String, default: '' },
    contact: { type: String, default: '' }
  },
  summary: {
    type: String,
    default: '',
  },
  medicalHistory: [String],
  symptoms: [String],
  familyHistory: [String],
  lifestyle: [String],
  labResults: [LabResultSchema],
  keyFindings: [KeyFindingSchema], // Deprecated but kept for backward compatibility
  highlightedInsights: [HighlightedInsightSchema], // Deprecated but kept for backward compatibility
  criticalAlerts: [String],
  recommendations: {
    type: String,
    default: '',
  },
  doctorNotes: [String],
  hasLabValues: {
    type: Boolean,
    default: false,
  },
  hasCriticalFindings: {
    type: Boolean,
    default: false,
  },
  reportConfidence: {
    type: Number,
    default: 95,
  },
  ocrConfidence: {
    type: Number,
    default: 95,
  },
  classificationConfidence: {
    type: Number,
    default: 95,
  },
  analysisConfidence: {
    type: Number,
    default: 95,
  },
  warnings: {
    type: String,
    default: '',
  }
}, {
  timestamps: true
});

// Format _id to id
ReportHistorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const ReportHistory = mongoose.model('ReportHistory', ReportHistorySchema);
module.exports = ReportHistory;
