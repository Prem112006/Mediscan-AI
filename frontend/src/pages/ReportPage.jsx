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

const ReportPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Active view tab: 'summary', 'findings', 'insights'
  const [activeTab, setActiveTab] = useState('summary');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
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
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 20;
      });
    }, 500);

    try {
      const res = await api.analyzeReport(formData);
      clearInterval(progressInterval);
      setAnalyzeProgress(100);

      setTimeout(() => {
        if (res.success) {
          setResult(res.data);
        }
        setLoading(false);
        setAnalyzeProgress(0);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setLoading(false);
      setAnalyzeProgress(0);
      setError(err.message || 'Failed to analyze report file. Ensure it is a valid image or PDF.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
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
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                flex: 1,
                minHeight: '260px',
                border: '2px dashed rgba(99, 102, 241, 0.3)',
                background: selectedFile ? 'rgba(99, 102, 241, 0.03)' : 'rgba(0, 0, 0, 0.2)',
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

              <FileText size={48} style={{ color: selectedFile ? 'var(--secondary)' : 'var(--text-dark)', marginBottom: '1rem', opacity: selectedFile ? 0.9 : 0.3 }} />
              
              {selectedFile ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem', wordBreak: 'break-all' }}>{selectedFile.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Type: {(selectedFile.type || 'document').toUpperCase()} | Size: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-dark)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Drag & drop file here or click to browse</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Supports images (PNG, JPG) and PDF files</p>
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
                    background: 'var(--primary)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700' }}>Detected Report Type</span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>{result.reportType || 'Medical Report'}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                        OCR: {result.ocrConfidence || 95}%
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                        Class: {result.classificationConfidence || 95}%
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
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
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: '700' }}>Patient Details</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <div><strong>Name:</strong> {result.patientDetails.name || 'Not Available'}</div>
                        <div><strong>Age:</strong> {result.patientDetails.age || 'Not Available'}</div>
                        <div><strong>Gender:</strong> {result.patientDetails.gender || 'Not Available'}</div>
                        <div><strong>Patient ID:</strong> {result.patientDetails.patientID || 'Not Available'}</div>
                        <div><strong>Date of Birth:</strong> {result.patientDetails.dob || 'Not Available'}</div>
                        <div><strong>Date of Report:</strong> {result.patientDetails.reportDate || 'Not Available'}</div>
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
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: '700' }}>Doctor & Clinic Information</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <div><strong>Physician Name:</strong> {result.doctorDetails.physicianName || 'Not Available'}</div>
                        <div><strong>Specialty:</strong> {result.doctorDetails.specialty || 'Not Available'}</div>
                        <div><strong>Contact Info:</strong> {result.doctorDetails.contact || 'Not Available'}</div>
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
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>Executive Summary</h4>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}>{result.summary}</p>
                    </div>
                  )}

                  {/* Medical History Section */}
                  {result.medicalHistory && result.medicalHistory.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>Medical History</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.medicalHistory.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Symptoms Section */}
                  {result.symptoms && result.symptoms.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>Presenting Symptoms</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.symptoms.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Family History Section */}
                  {result.familyHistory && result.familyHistory.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>Family History</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.familyHistory.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Lifestyle Information Section */}
                  {result.lifestyle && result.lifestyle.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>Lifestyle Information</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.lifestyle.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Biomarkers / Lab Results Table */}
                  {isLabReport && result.hasLabValues && result.labResults && result.labResults.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.75rem' }}>Laboratory Test Biomarkers</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>Biomarker / Test</th>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>Value</th>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>Ref Range</th>
                              <th style={{ padding: '0.5rem', fontWeight: '600' }}>Status</th>
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
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>Key Findings</h4>
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
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.5rem' }}>Doctor Notes & Clinical Remarks</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {result.doctorNotes.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Critical Alerts Section */}
                  <div className="glass-panel" style={{ padding: '1.25rem', borderColor: result.hasCriticalFindings ? 'var(--danger-glow)' : 'var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: result.hasCriticalFindings ? 'var(--danger)' : 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldAlert size={16} /> Critical Alerts
                    </h4>
                    {result.hasCriticalFindings && result.criticalAlerts && result.criticalAlerts.length > 0 && !result.criticalAlerts[0]?.toLowerCase()?.includes('no critical alerts') ? (
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: '500' }}>
                        {result.criticalAlerts.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        No critical alerts detected.
                      </p>
                    )}
                  </div>

                  {/* Recommendations Section (Hide completely if empty) */}
                  {result.recommendations && (Array.isArray(result.recommendations) ? result.recommendations.length > 0 : result.recommendations.trim() !== '') && (
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>Clinical Recommendations</h4>
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
    </div>
  );
};

export default ReportPage;
