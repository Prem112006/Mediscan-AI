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
              accept=".pdf,image/*" 
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }} className="fade-in">
                
                {/* Result Title Header */}
                <div style={{
                  padding: '1rem',
                  background: 'rgba(99, 102, 241, 0.03)',
                  border: '1px solid var(--secondary-glow)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem'
                }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Document Name
                  </h4>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {result.fileName}
                  </p>
                </div>

                {/* Tabs Selector */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                  {['summary', 'findings', 'insights'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === tab ? '2px solid var(--secondary)' : 'none',
                        color: activeTab === tab ? 'var(--secondary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab === 'summary' && 'Summary'}
                      {tab === 'findings' && 'Key Findings'}
                      {tab === 'insights' && 'Critical Alerts'}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div style={{ flex: 1, minHeight: '220px' }}>
                  {activeTab === 'summary' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.35rem' }}>Executive Summary</h4>
                        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}>{result.summary}</p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.35rem' }}>Clinical Recommendations</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.45' }}>{result.recommendations}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'findings' && (
                    <div className="fade-in" style={{ overflowX: 'auto' }}>
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
                          {result.keyFindings.map((finding, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>{finding.test}</td>
                              <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-main)' }}>{finding.value}</td>
                              <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{finding.referenceRange}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span className={getStatusBadgeClass(finding.status)}>{finding.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'insights' && (
                    <div className="fade-in">
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--danger)', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldAlert size={16} /> Clinical Warnings & Insights
                      </h4>
                      <HighlightedInsights insights={result.highlightedInsights} />
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <MedicalDisclaimer />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
