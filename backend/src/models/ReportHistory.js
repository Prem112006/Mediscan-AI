const mongoose = require('mongoose');

const KeyFindingSchema = new mongoose.Schema({
  test: { type: String, required: true },
  value: { type: String, required: true },
  referenceRange: { type: String, default: '' },
  status: { type: String, default: 'Normal' }
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
  summary: {
    type: String,
    default: '',
  },
  keyFindings: [KeyFindingSchema], // Native MongoDB arrays
  highlightedInsights: [HighlightedInsightSchema], // Native MongoDB arrays
  recommendations: {
    type: String,
    default: '',
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
