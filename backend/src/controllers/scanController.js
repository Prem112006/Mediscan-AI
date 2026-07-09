const ScanHistory = require('../models/ScanHistory');
const { extractTextFromImage } = require('../utils/ocr');
const { analyzeMedicineLabel } = require('../utils/llm');

/**
 * @desc    Upload medicine label, perform OCR, analyze using AI, save to history
 * @route   POST /api/scan
 * @access  Private
 */
const scanMedicineLabel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a medicine label image' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    // 1. Run OCR on the image
    let rawText = '';
    try {
      rawText = await extractTextFromImage(filePath);
    } catch (ocrError) {
      console.error('OCR Error in Controller:', ocrError);
      return res.status(500).json({ success: false, error: 'Failed to extract text from the uploaded image' });
    }

    if (!rawText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No text could be detected in the image. Please upload a clearer image of the label.'
      });
    }

    // 2. Run LLM Medicine Label Analysis
    let analysisResult;
    try {
      analysisResult = await analyzeMedicineLabel(rawText);
    } catch (llmError) {
      console.error('LLM Analysis Error in Controller:', llmError);
      return res.status(500).json({ success: false, error: 'Failed to analyze medicine details using AI' });
    }

    // 3. Save to database history
    const newScan = await ScanHistory.create({
      userId: req.user.id,
      imageUrl: fileUrl,
      rawOcrText: rawText,
      medicineName: analysisResult.medicineName || 'Unknown Medicine',
      activeIngredients: analysisResult.activeIngredients || 'Not detected',
      dosage: analysisResult.dosage || 'Consult a healthcare professional',
      usageInstructions: analysisResult.usageInstructions || 'Use as directed',
      sideEffects: analysisResult.sideEffects || 'Consult packaging or pharmacist',
      warnings: analysisResult.warnings || 'Keep out of reach of children',
      precautions: analysisResult.precautions || 'Consult a physician'
    });

    res.status(201).json({
      success: true,
      data: newScan
    });
  } catch (error) {
    console.error('Scan controller error:', error);
    res.status(500).json({ success: false, error: 'Server error during medicine scan analysis' });
  }
};

module.exports = {
  scanMedicineLabel
};
