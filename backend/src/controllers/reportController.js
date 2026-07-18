const ReportHistory = require('../models/ReportHistory');
const { extractTextFromImage } = require('../utils/ocr');
const { extractTextFromPDF } = require('../utils/pdfExtractor');
const { analyzeMedicalReport } = require('../utils/llm');
const path = require('path');
const fs = require('fs');

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
      if (req.file.mimetype === 'application/pdf') {
        rawText = await extractTextFromPDF(filePath);
      } else if (req.file.mimetype.startsWith('text/') || req.file.mimetype === 'application/json') {
        rawText = fs.readFileSync(filePath, 'utf-8');
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

    console.log('--- STAGE 1: RAW OCR TEXT EXTRACTED ---');
    console.log(rawText);
    console.log('---------------------------------------');

    // 2. Perform AI Analysis on the extracted text
    let analysisResult;
    try {
      analysisResult = await analyzeMedicalReport(rawText);
    } catch (llmError) {
      console.error('Report LLM analysis error:', llmError);
      return res.status(500).json({ success: false, error: 'Failed to analyze report using AI' });
    }

    console.log('--- STAGE 3: VALIDATED AND MAPPED JSON OBJECT ---');
    console.log(JSON.stringify(analysisResult, null, 2));
    console.log('-------------------------------------------------');

    // 3. Save to database history
    const newReportRecord = await ReportHistory.create({
      userId: req.user.id,
      fileUrl,
      fileType,
      fileName,
      rawText,
      reportType: analysisResult.reportType || 'Other',
      patient: analysisResult.patient || {},
      doctor: analysisResult.doctor || {},
      lifestyleInformation: analysisResult.lifestyleInformation || [],
      patientDetails: analysisResult.patientDetails || {},
      doctorDetails: analysisResult.doctorDetails || {},
      summary: analysisResult.summary || 'Summary not generated',
      medicalHistory: analysisResult.medicalHistory || [],
      symptoms: analysisResult.symptoms || [],
      familyHistory: analysisResult.familyHistory || [],
      lifestyle: analysisResult.lifestyle || [],
      labResults: analysisResult.labResults || [],
      keyFindings: analysisResult.keyFindings || [],
      highlightedInsights: analysisResult.highlightedInsights || [],
      criticalAlerts: analysisResult.criticalAlerts || [],
      recommendations: analysisResult.recommendations || 'Consult your physician',
      doctorNotes: analysisResult.doctorNotes || [],
      hasLabValues: analysisResult.hasLabValues || false,
      hasCriticalFindings: analysisResult.hasCriticalFindings || false,
      reportConfidence: analysisResult.reportConfidence || 95,
      ocrConfidence: analysisResult.ocrConfidence || 95,
      classificationConfidence: analysisResult.classificationConfidence || 95,
      analysisConfidence: analysisResult.analysisConfidence || 95,
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
