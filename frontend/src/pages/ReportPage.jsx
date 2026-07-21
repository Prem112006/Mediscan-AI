import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import HighlightedInsights from '../components/HighlightedInsights';
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  CheckSquare,
  ShieldAlert,
  Sliders,
  Table,
  Eye,
  Loader2
} from 'lucide-react';

const UI_STRINGS = {
  English: {
    detectedReportType: "Detected Report Type",
    patientDetails: "Patient Details",
    name: "Name",
    age: "Age",
    gender: "Gender",
    patientId: "Patient ID",
    dob: "Date of Birth",
    reportDate: "Date of Report",
    doctorClinicInfo: "Doctor & Clinic Information",
    physicianName: "Physician Name",
    specialty: "Specialty",
    contactInfo: "Contact Info",
    executiveSummary: "Executive Summary",
    medicalHistory: "Medical History",
    presentingSymptoms: "Presenting Symptoms",
    familyHistory: "Family History",
    lifestyleInfo: "Lifestyle Information",
    labBiomarkers: "Laboratory Test Biomarkers",
    testColumn: "Biomarker / Test",
    valueColumn: "Value",
    refRangeColumn: "Ref Range",
    statusColumn: "Status",
    keyFindings: "Key Findings",
    doctorNotes: "Doctor Notes & Clinical Remarks",
    criticalAlerts: "Critical Alerts",
    noAlerts: "No critical alerts detected.",
    recommendations: "Clinical Recommendations"
  },
  Hindi: {
    detectedReportType: "पहचाना गया रिपोर्ट प्रकार",
    patientDetails: "मरीज का विवरण",
    name: "नाम",
    age: "उम्र",
    gender: "लिंग",
    patientId: "मरीज आईडी",
    dob: "जन्म तिथि",
    reportDate: "रिपोर्ट की तिथि",
    doctorClinicInfo: "डॉक्टर और क्लिनिक की जानकारी",
    physicianName: "चिकित्सक का नाम",
    specialty: "विशेषज्ञता",
    contactInfo: "संपर्क जानकारी",
    executiveSummary: "मुख्य सारांश",
    medicalHistory: "चिकित्सा इतिहास",
    presentingSymptoms: "वर्तमान लक्षण",
    familyHistory: "पारिवारिक इतिहास",
    lifestyleInfo: "जीवनशैली की जानकारी",
    labBiomarkers: "प्रयोगशाला परीक्षण बायोमार्कर",
    testColumn: "बायोमार्कर / परीक्षण",
    valueColumn: "मान",
    refRangeColumn: "संदर्भ सीमा",
    statusColumn: "स्थिति",
    keyFindings: "प्रमुख निष्कर्ष",
    doctorNotes: "डॉक्टर के नोट्स और नैदानिक टिप्पणियां",
    criticalAlerts: "महत्वपूर्ण अलर्ट",
    noAlerts: "कोई महत्वपूर्ण अलर्ट नहीं पाया गया।",
    recommendations: "नैदानिक सिफारिशें"
  },
  Gujarati: {
    detectedReportType: "ઓળખાયેલ રિપોર્ટ પ્રકાર",
    patientDetails: "દર્દીની વિગતો",
    name: "નામ",
    age: "ઉંમર",
    gender: "જાતિ",
    patientId: "દર્દી આઈડી",
    dob: "જન્મ તારીખ",
    reportDate: "રિપોર્ટની તારીખ",
    doctorClinicInfo: "તબીબ અને ક્લિનિક માહિતી",
    physicianName: "તબીબનું નામ",
    specialty: "સ્પેશિયાલિટી",
    contactInfo: "સંપર્ક માહિતી",
    executiveSummary: "મુખ્ય સારાંશ",
    medicalHistory: "તબીબી ઇતિહાસ",
    presentingSymptoms: "હાલના લક્ષણો",
    familyHistory: "કૌટુંબિક ઇતિહાસ",
    lifestyleInfo: "જીવનશૈલી માહિતી",
    labBiomarkers: "લેબોરેટરી ટેસ્ટ બાયોમાર્કર્સ",
    testColumn: "બાયોમાર્કર / ટેસ્ટ",
    valueColumn: "મૂલ્ય",
    refRangeColumn: "સંદર્ભ સીમા",
    statusColumn: "સ્થિતિ",
    keyFindings: "મુખ્ય તારણો",
    doctorNotes: "તબીબની નોંધ અને ક્લિનિકલ ટિપ્પણીઓ",
    criticalAlerts: "મહત્વપૂર્ણ ચેતવણીઓ",
    noAlerts: "કોઈ મહત્વપૂર્ણ ચેતવણીઓ મળી નથી.",
    recommendations: "ક્લિનિકલ ભલામણો"
  }
};

const ReportPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Multi-Language state management
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [originalResult, setOriginalResult] = useState(null);
  const [translatedResults, setTranslatedResults] = useState({});

  // Active view tab: 'summary', 'findings', 'insights'
  const [activeTab, setActiveTab] = useState('summary');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      } else {
        setImagePreview(null);
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  // Simulated Lab Report PDF Upload
  const handleSimulatePDF = () => {
    setError('');
    setLoading(true);
    setAnalyzeProgress(20);

    setTimeout(() => {
      setAnalyzeProgress(60);
      
      // Simulate creating a dummy PDF file
      const mockBlob = new Blob(["mock_cbc_lipid_panel_report_pdf"], { type: "application/pdf" });
      const mockFile = new File([mockBlob], "blood_lipid_panel.pdf", { type: "application/pdf" });
      setSelectedFile(mockFile);

      setAnalyzeProgress(90);
      setTimeout(() => {
        setLoading(false);
        setAnalyzeProgress(0);
      }, 400);
    }, 800);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      return setError('Please upload a PDF or image medical report first.');
    }

    setError('');
    setLoading(true);
    setAnalyzeProgress(20);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Visual loading effect increments
    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + 20;
      });
    }, 500);

    try {
      const res = await api.analyzeReport(formData);
      clearInterval(progressInterval);

      if (res.success) {
        let finalResult = res.data;
        let transCache = {};

        if (selectedLanguage !== 'English') {
          setAnalyzeProgress(90);
          const transRes = await api.translateReport(finalResult, selectedLanguage);
          if (transRes.success) {
            finalResult = transRes.data;
            transCache = { [selectedLanguage]: transRes.data };
          }
        }

        setAnalyzeProgress(100);
        setTimeout(() => {
          setResult(finalResult);
          setOriginalResult(res.data);
          setTranslatedResults(transCache);
          setLoading(false);
          setAnalyzeProgress(0);
        }, 500);
      } else {
        setLoading(false);
        setAnalyzeProgress(0);
      }

    } catch (err) {
      clearInterval(progressInterval);
      setLoading(false);
      setAnalyzeProgress(0);
      setError(err.message || 'Failed to analyze report file. Ensure it is a valid image or PDF.');
    }
  };

  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    setError('');

    if (lang === 'English') {
      if (originalResult) {
        setResult(originalResult);
      }
      return;
    }

    // Use cached translation if available
    if (translatedResults[lang]) {
      setResult(translatedResults[lang]);
      return;
    }

    setLoading(true);
    setAnalyzeProgress(30);
    try {
      const reportToTranslate = originalResult || result;
      setAnalyzeProgress(70);
      const res = await api.translateReport(reportToTranslate, lang);
      setAnalyzeProgress(100);
      
      setTimeout(() => {
        if (res.success) {
          setResult(res.data);
          setTranslatedResults(prev => ({
            ...prev,
            [lang]: res.data
          }));
        }
        setLoading(false);
        setAnalyzeProgress(0);
      }, 400);
    } catch (err) {
      setLoading(false);
      setAnalyzeProgress(0);
      setError(err.message || `Failed to translate report to ${lang}.`);
      setSelectedLanguage('English'); // Fall back to English
      if (originalResult) setResult(originalResult);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setOriginalResult(null);
    setTranslatedResults({});
    setSelectedLanguage('English');
    setError('');
    setActiveTab('summary');
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'high':
        return 'badge badge-warning';
      case 'low':
        return 'badge badge-info';
      case 'critical':
        return 'badge badge-danger';
      case 'normal':
      default:
        return 'badge badge-normal';
    }
  };

  if (result) {
    console.log('--- STAGE 4: FRONTEND RENDERED JSON ---', result);
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }} className="gradient-text">
          Report Analyzer
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Upload PDF or image medical documents (blood work, clinical panels) to extract key findings and highlights.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Left Card: Document Drop Zone */}
        <div className="col-5">
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: result ? 'auto' : '100%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Upload Document</h3>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="*/*" 
              style={{ display: 'none' }}
            />

            {/* Drop Zone Box */}
            <div 
              onClick={!result && !loading ? triggerUpload : null}
              style={{
                flex: result ? 'none' : 1,
                minHeight: result ? '160px' : '260px',
                border: '2px dashed var(--border-color)',
                background: selectedFile || result ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                cursor: !result && !loading ? 'pointer' : 'default',
                position: 'relative',
                transition: 'all 0.3s'
              }}
            >
              {loading && <div className="scanner-laser" style={{ background: 'linear-gradient(to right, transparent, var(--secondary), transparent)', boxShadow: '0 0 12px 3px var(--secondary)' }} />}

              {selectedFile || result ? (
                <div style={{ textAlign: 'center', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  {imagePreview || (result && result.fileType === 'image') ? (
                    <img 
                      src={imagePreview || result.fileUrl} 
                      alt="Report Preview" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLightbox(true);
                      }}
                      style={{
                        maxHeight: '220px',
                        maxWidth: '100%',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'contain',
                        border: '1px solid var(--border-color)',
                        marginBottom: '0.25rem',
                        cursor: 'zoom-in',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <FileText size={48} style={{ color: 'var(--primary)', opacity: 0.9 }} />
                  )}
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {selectedFile ? selectedFile.name : (result.fileName || 'Analyzed Report')}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {selectedFile 
                      ? `Type: ${(selectedFile.type || 'document').toUpperCase()} | Size: ${(selectedFile.size / 1024).toFixed(1)} KB`
                      : `Type: ${result.reportType || 'Medical Report'}`
                    }
                  </p>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    ✓ Analysis Active
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={48} style={{ color: 'var(--text-dark)', opacity: 0.4 }} />
                  <div>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '600' }}>Drag & drop file here or click to browse</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>Supports images (PNG, JPG) and PDF files</p>
                  </div>
                </div>
              )}

              {loading && (
                <div style={{
                  position: 'absolute',
                  background: 'rgba(11, 15, 25, 0.9)',
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--secondary-glow)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  zIndex: 20,
                  color: 'white'
                }}>
                  <Loader2 size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>AI Analysis: {analyzeProgress}%</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {!result && (
                <>
                  <button onClick={triggerUpload} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
                    <Upload size={16} /> Choose File
                  </button>
                  <button onClick={handleSimulatePDF} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
                    <FileText size={16} /> Simulate Lab PDF
                  </button>
                </>
              )}

              {selectedFile && !result && (
                <button onClick={handleAnalyze} className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, var(--secondary), #4f46e5)', boxShadow: '0 4px 15px -3px var(--secondary-glow)' }} disabled={loading}>
                  <CheckSquare size={16} /> Run Analysis
                </button>
              )}

              {result && (
                <button onClick={handleReset} className="btn btn-secondary" style={{ width: '100%' }}>
                  <RefreshCw size={16} /> Upload New Report
                </button>
              )}
            </div>

            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Clinical Findings Display */}
        <div className="col-7">
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: result ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  color: result ? 'var(--secondary)' : 'var(--text-dark)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Eye size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Document Insights</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {result ? 'Analysis report finalized.' : 'Awaiting document upload...'}
                  </p>
                </div>
              </div>

              {result && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor="language-select" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Language:</label>
                  <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    style={{
                      background: 'rgba(25, 30, 45, 0.95)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.6rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  </select>
                </div>
              )}
            </div>

            {!result ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--text-dark)',
                padding: '3rem 1.5rem'
              }}>
                <FileText size={48} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.95rem' }}>Please drop your lab results or blood chart documents to review aggregated diagnostic findings.</p>
              </div>
            ) : (() => {
              const reportTypeLower = (result.reportType || '').toLowerCase();
              const isLabReport = result.hasLabValues || (
                result.reportType && (
                  reportTypeLower.includes('blood') ||
                  reportTypeLower.includes('cbc') ||
                  reportTypeLower.includes('lipid') ||
                  reportTypeLower.includes('thyroid') ||
                  reportTypeLower.includes('kidney') ||
                  reportTypeLower.includes('liver') ||
                  reportTypeLower.includes('diabetes') ||
                  reportTypeLower.includes('urine')
                )
              );

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }} className="fade-in">
                  {/* Report Type Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700', color: 'var(--text-muted)' }}>{UI_STRINGS[selectedLanguage].detectedReportType}</span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>{result.reportType || 'Medical Report'}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '700', color: 'var(--text-muted)' }}>
                        OCR: {result.ocrConfidence || 95}%
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '700', color: 'var(--text-muted)' }}>
                        Class: {result.classificationConfidence || 95}%
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '700', color: 'var(--text-muted)' }}>
                        AI Analysis: {result.analysisConfidence || 95}%
                      </span>
                    </div>
                  </div>

                  {/* Patient Details Card */}
                  {result.patientDetails && (
                    result.patientDetails.name !== 'Not Available' || 
                    result.patientDetails.age !== 'Not Available' || 
                    result.patientDetails.gender !== 'Not Available' ||
                    result.patientDetails.dob !== 'Not Available' ||
                    result.patientDetails.reportDate !== 'Not Available'
                  ) && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: '700' }}>{UI_STRINGS[selectedLanguage].patientDetails}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <div><strong>{UI_STRINGS[selectedLanguage].name}:</strong> {result.patientDetails.name || 'Not Available'}</div>
                        <div><strong>{UI_STRINGS[selectedLanguage].age}:</strong> {result.patientDetails.age || 'Not Available'}</div>
                        <div><strong>{UI_STRINGS[selectedLanguage].gender}:</strong> {result.patientDetails.gender || 'Not Available'}</div>
                        <div><strong>{UI_STRINGS[selectedLanguage].patientId}:</strong> {result.patientDetails.patientID || 'Not Available'}</div>
                        <div><strong>{UI_STRINGS[selectedLanguage].dob}:</strong> {result.patientDetails.dob || 'Not Available'}</div>
                        <div><strong>{UI_STRINGS[selectedLanguage].reportDate}:</strong> {result.patientDetails.reportDate || 'Not Available'}</div>
                      </div>
                    </div>
                  )}

                  {/* Doctor Details Card */}
                  {result.doctorDetails && (
                    result.doctorDetails.physicianName !== 'Not Available' ||
                    result.doctorDetails.specialty !== 'Not Available' ||
                    result.doctorDetails.contact !== 'Not Available'
                  ) && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: '700' }}>{UI_STRINGS[selectedLanguage].doctorClinicInfo}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <div><strong>{UI_STRINGS[selectedLanguage].physicianName}:</strong> {result.doctorDetails.physicianName || 'Not Available'}</div>
                        <div><strong>{UI_STRINGS[selectedLanguage].specialty}:</strong> {result.doctorDetails.specialty || 'Not Available'}</div>
                        <div><strong>{UI_STRINGS[selectedLanguage].contactInfo}:</strong> {result.doctorDetails.contact || 'Not Available'}</div>
                      </div>
                    </div>
                  )}

                  {/* OCR Quality Validation warning */}
                  {(result.ocrConfidence && result.ocrConfidence < 85) && (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid var(--danger)',
                      color: 'var(--danger)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      ⚠️ Some portions of the uploaded report could not be extracted accurately.
                    </div>
                  )}

                  {/* Executive Summary Card */}
                  {result.summary && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].executiveSummary}</h4>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}>{result.summary}</p>
                    </div>
                  )}

                  {/* Medical History Section */}
                  {result.medicalHistory && result.medicalHistory.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].medicalHistory}</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.medicalHistory.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Symptoms Section */}
                  {result.symptoms && result.symptoms.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].presentingSymptoms}</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.symptoms.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Family History Section */}
                  {result.familyHistory && result.familyHistory.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].familyHistory}</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.familyHistory.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Lifestyle Information Section */}
                  {result.lifestyle && result.lifestyle.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].lifestyleInfo}</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.lifestyle.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Biomarkers / Lab Results Table */}
                  {isLabReport && result.hasLabValues && result.labResults && result.labResults.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.75rem' }}>{UI_STRINGS[selectedLanguage].labBiomarkers}</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>{UI_STRINGS[selectedLanguage].testColumn}</th>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>{UI_STRINGS[selectedLanguage].valueColumn}</th>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>{UI_STRINGS[selectedLanguage].refRangeColumn}</th>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>{UI_STRINGS[selectedLanguage].statusColumn}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.labResults.map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>{item.test}</td>
                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-main)', fontWeight: '600' }}>
                                  {item.value} {item.unit && item.unit !== 'Not Available' ? item.unit : ''}
                                </td>
                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{item.referenceRange}</td>
                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                  <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Key Findings Card */}
                  {result.keyFindings && result.keyFindings.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].keyFindings}</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.keyFindings.map((item, idx) => (
                          <li key={idx}>
                            {typeof item === 'string'
                              ? item
                              : (isLabReport
                                  ? `${item.test}: ${item.value}`
                                  : item.test
                                )
                            }
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Doctor Notes Section */}
                  {result.doctorNotes && result.doctorNotes.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].doctorNotes}</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.doctorNotes.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Critical Alerts Section */}
                  <div className="glass-panel" style={{ padding: '1.25rem', borderColor: result.hasCriticalFindings ? 'var(--danger-glow)' : 'var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: result.hasCriticalFindings ? 'var(--danger)' : 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldAlert size={16} /> {UI_STRINGS[selectedLanguage].criticalAlerts}
                    </h4>
                    {result.hasCriticalFindings && result.criticalAlerts && result.criticalAlerts.length > 0 && !result.criticalAlerts[0]?.toLowerCase()?.includes('no critical alerts') ? (
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: '500' }}>
                        {result.criticalAlerts.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {UI_STRINGS[selectedLanguage].noAlerts}
                      </p>
                    )}
                  </div>

                  {/* Recommendations Section (Hide completely if empty) */}
                  {result.recommendations && (Array.isArray(result.recommendations) ? result.recommendations.length > 0 : result.recommendations.trim() !== '') && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>{UI_STRINGS[selectedLanguage].recommendations}</h4>
                      {Array.isArray(result.recommendations) ? (
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {result.recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.45', whiteSpace: 'pre-line' }}>{result.recommendations}</p>
                      )}
                    </div>
                  )}

                  {/* Disclaimer */}
                  <MedicalDisclaimer />
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (imagePreview || (result && result.fileType === 'image')) && (
        <div 
          onClick={() => setShowLightbox(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.93)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            cursor: 'zoom-out',
            padding: '2rem',
            animation: 'fade-in 0.2s ease-out'
          }}
        >
          <img 
            src={imagePreview || result.fileUrl} 
            alt="Full Report Preview" 
            style={{
              maxHeight: '90vh',
              maxWidth: '90vw',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              objectFit: 'contain'
            }} 
          />
          <button 
            onClick={() => setShowLightbox(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
