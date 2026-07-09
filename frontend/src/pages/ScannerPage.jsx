import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { 
  Upload, 
  Camera, 
  Pill, 
  RefreshCw, 
  CheckCircle,
  FileCheck,
  AlertOctagon,
  Sparkles,
  Loader2
} from 'lucide-react';

const ScannerPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Tab states: 'info', 'dosage', 'warnings', 'sideeffects'
  const [activeTab, setActiveTab] = useState('info');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  // Simulated Live Camera Frame Capture
  const handleSimulateCamera = () => {
    setError('');
    setLoading(true);
    setScanProgress(10);
    
    // Simulate picking a sample bottle of Amoxicillin
    setTimeout(() => {
      setScanProgress(40);
      setImagePreview('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop');
      
      // We will generate a mock blob that represents the file, so our API request still works!
      const mockBlob = new Blob(["mock_amoxicillin_label_text"], { type: "image/jpeg" });
      const mockFile = new File([mockBlob], "amoxicillin_label.jpg", { type: "image/jpeg" });
      setSelectedFile(mockFile);

      setScanProgress(80);
      setTimeout(() => {
        setLoading(false);
        setScanProgress(0);
      }, 500);
    }, 1000);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      return setError('Please select or capture a medicine label image first.');
    }

    setError('');
    setLoading(true);
    setScanProgress(15);

    const formData = new FormData();
    formData.append('image', selectedFile);

    // Increment progress counter for visual effect
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 400);

    try {
      const res = await api.scanMedicine(formData);
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setTimeout(() => {
        if (res.success) {
          setResult(res.data);
        }
        setLoading(false);
        setScanProgress(0);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setLoading(false);
      setScanProgress(0);
      setError(err.message || 'Failed to analyze medicine label. Ensure image has readable text.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setError('');
    setActiveTab('info');
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }} className="gradient-text">
          Medicine Scanner
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Scan drug prescription labels to generate AI structured dosages, side effects, and warnings.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Upload & Laser Beam Visual */}
        <div className="col-6">
          <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Upload or Capture Label</h3>
            
            {/* Hidden Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }}
            />

            {/* Container for Preview */}
            <div 
              className={`scanner-container ${loading ? 'active' : ''}`}
              style={{
                flex: 1,
                minHeight: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: 'rgba(0, 0, 0, 0.2)',
                marginBottom: '1.5rem'
              }}
            >
              {/* Laser Animation when loading */}
              {loading && <div className="scanner-laser" />}

              {imagePreview ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '1rem' }}>
                  <img 
                    src={imagePreview} 
                    alt="Medicine Preview" 
                    style={{
                      maxHeight: '300px',
                      maxWidth: '100%',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'contain',
                      opacity: loading ? 0.7 : 1
                    }} 
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                  <Upload size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Drag & drop image here or click to select</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Supports PNG, JPG, JPEG</p>
                </div>
              )}

              {/* Progress Indicator */}
              {loading && (
                <div style={{
                  position: 'absolute',
                  background: 'rgba(11, 15, 25, 0.85)',
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  border: '1px solid var(--primary-glow)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  color: 'white',
                  zIndex: 20
                }}>
                  <Loader2 size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>OCR Scanning: {scanProgress}%</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
              {!result && (
                <>
                  <button onClick={triggerUpload} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
                    <Upload size={16} /> Choose File
                  </button>
                  <button onClick={handleSimulateCamera} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
                    <Camera size={16} /> Simulate Camera
                  </button>
                </>
              )}
              
              {imagePreview && !result && (
                <button onClick={handleScan} className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  <Pill size={16} /> Analyze Label
                </button>
              )}

              {result && (
                <button onClick={handleReset} className="btn btn-secondary" style={{ width: '100%' }}>
                  <RefreshCw size={16} /> Scan Another Label
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

        {/* Right Side: Structured AI Results Panels */}
        <div className="col-6">
          <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: result ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                color: result ? 'var(--primary)' : 'var(--text-dark)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>AI Analysis Results</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {result ? 'Scan complete. Clinical metrics extracted.' : 'Awaiting medicine scan...'}
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
                padding: '3rem 1rem'
              }}>
                <Pill size={48} style={{ opacity: 0.15, marginBottom: '1rem', transform: 'rotate(-45deg)' }} />
                <p style={{ fontSize: '0.95rem' }}>Please upload and scan a prescription bottle or drug packaging box to generate structured health guides.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }} className="fade-in">
                {/* Medicine Title Header */}
                <div style={{
                  padding: '1rem',
                  background: 'rgba(16, 185, 129, 0.03)',
                  border: '1px solid var(--primary-glow)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)' }}>{result.medicineName}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Active: {result.activeIngredients}
                    </p>
                  </div>
                  <CheckCircle size={24} style={{ color: 'var(--primary)' }} />
                </div>

                {/* Tabs Panel */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  {['info', 'dosage', 'sideeffects', 'warnings'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
                        color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab === 'info' && 'Directions'}
                      {tab === 'dosage' && 'Dosage'}
                      {tab === 'sideeffects' && 'Side Effects'}
                      {tab === 'warnings' && 'Precautions'}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div style={{ flex: 1, minHeight: '180px', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {activeTab === 'info' && (
                    <div className="fade-in">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>Usage Instructions</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{result.usageInstructions}</p>
                    </div>
                  )}

                  {activeTab === 'dosage' && (
                    <div className="fade-in">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>Recommended Dosage</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{result.dosage}</p>
                    </div>
                  )}

                  {activeTab === 'sideeffects' && (
                    <div className="fade-in">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--danger)' }}>Potential Side Effects</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{result.sideEffects}</p>
                    </div>
                  )}

                  {activeTab === 'warnings' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)' }}>
                          <AlertOctagon size={16} /> Important Warnings
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{result.warnings}</p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary)' }}>Precautions</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{result.precautions}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Built-in Disclaimer */}
                <MedicalDisclaimer />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
