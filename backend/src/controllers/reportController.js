const ReportHistory = require('../models/ReportHistory');
const { extractTextFromImage } = require('../utils/ocr');
const { extractTextFromPDF } = require('../utils/pdfExtractor');
const { analyzeMedicalReport } = require('../utils/llm');
const path = require('path');

/**
 * @desc    Upload report (image/PDF), extract text, analyze using LLM, save to history
 * @route   POST /api/report
 * @access  Private
 */
const analyzeReportFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a medical report file (Image or PDF)' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    const fileName = req.file.originalname;

    // 1. Extract text depending on file type
    let rawText = '';
    try {
      if (fileType === 'pdf') {
        rawText = await extractTextFromPDF(filePath);
      } else {
        rawText = await extractTextFromImage(filePath);
      }
    } catch (extractError) {
      console.error('File text extraction error:', extractError);
      return res.status(500).json({ success: false, error: 'Failed to parse text from the uploaded document' });
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'The uploaded file appears to be empty or unreadable. Please check file quality.'
      });
    }

    // 2. Perform AI Analysis on the extracted text
    let analysisResult;
    try {
      analysisResult = await analyzeMedicalReport(rawText);
    } catch (llmError) {
      console.error('Report LLM analysis error:', llmError);
      return res.status(500).json({ success: false, error: 'Failed to analyze report using AI' });
    }

    // 3. Save to database history
    const newReportRecord = await ReportHistory.create({
      userId: req.user.id,
      fileUrl,
      fileType,
      fileName,
      rawText,
      summary: analysisResult.summary || 'Summary not generated',
      keyFindings: analysisResult.keyFindings || [],
      highlightedInsights: analysisResult.highlightedInsights || [],
      recommendations: analysisResult.recommendations || 'Consult your physician',
      warnings: analysisResult.warnings || 'For educational use only'
    });

    res.status(201).json({
      success: true,
      data: newReportRecord
    });
  } catch (error) {
    console.error('Report controller error:', error);
    res.status(500).json({ success: false, error: 'Server error during report analysis' });
  }
};

module.exports = {
  analyzeReportFile
};
