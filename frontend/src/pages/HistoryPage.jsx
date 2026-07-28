import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import HighlightedInsights from '../components/HighlightedInsights';
import { 
  Search, 
  Trash2, 
  Eye, 
  Pill, 
  FileText, 
  Calendar, 
  X,
  FileCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const UI_STRINGS = {
  English: {
    fileName: "File Name",
    executiveSummary: "Executive Summary",
    keyFindings: "Key Findings",
    testColumn: "Biomarker",
    valueColumn: "Value",
    refRangeColumn: "Reference Range",
    statusColumn: "Status",
    clinicalAlerts: "Clinical Alerts",
    recommendations: "Clinical Recommendations"
  },
  Hindi: {
    fileName: "फ़ाइल का नाम",
    executiveSummary: "मुख्य सारांश",
    keyFindings: "प्रमुख निष्कर्ष",
    testColumn: "बायोमार्कर",
    valueColumn: "मान",
    refRangeColumn: "संदर्भ सीमा",
    statusColumn: "स्थिति",
    clinicalAlerts: "नैदानिक अलर्ट",
    recommendations: "नैदानिक सिफारिशें"
  },
  Gujarati: {
    fileName: "ફાઇલનું નામ",
    executiveSummary: "મુખ્ય સારાંશ",
    keyFindings: "મુખ્ય તારણો",
    testColumn: "બાયોમાર્કર",
    valueColumn: "મૂલ્ય",
    refRangeColumn: "સંદર્ભ સીમા",
    statusColumn: "સ્થિતિ",
    clinicalAlerts: "ક્લિનિકલ ચેતવણીઓ",
    recommendations: "ક્લિનિકલ ભલામણો"
  }
};

const HistoryPage = () => {
  const [activeSubTab, setActiveSubTab] = useState('scans'); // 'scans' or 'reports'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [scans, setScans] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected item for detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'scan' or 'report'

  // Multi-language support for report detail modal
  const [modalLanguage, setModalLanguage] = useState('English');
  const [originalSelectedItem, setOriginalSelectedItem] = useState(null);
  const [translatedItems, setTranslatedItems] = useState({}); // Cache structure: { [reportId]: { Hindi: reportObj, Gujarati: reportObj } }
  const [modalLoading, setModalLoading] = useState(false);

  // State for expanded tests in the report modal
  const [expandedTests, setExpandedTests] = useState({});
  const toggleTestExpand = (idx) => {
    setExpandedTests(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'scans') {
        const res = await api.getScans(searchQuery);
        if (res.success) setScans(res.data);
      } else {
        const res = await api.getReports(searchQuery);
        if (res.success) setReports(res.data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to retrieve history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeSubTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDeleteItem = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'scan' ? 'medicine scan' : 'report analysis'} record?`)) {
      return;
    }

    try {
      if (type === 'scan') {
        await api.deleteScan(id);
        setScans(scans.filter(item => item.id !== id));
      } else {
        await api.deleteReport(id);
        setReports(reports.filter(item => item.id !== id));
      }
      
      // Close modal if deleted item was selected
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('WARNING: This will permanently delete ALL scan and analysis records from your account. Proceed?')) {
      return;
    }

    try {
      await api.clearHistory();
      setScans([]);
      setReports([]);
      setSelectedItem(null);
    } catch (err) {
      alert(err.message || 'Failed to clear history.');
    }
  };

  const openDetails = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setExpandedTests({});
    if (type === 'report') {
      setOriginalSelectedItem(item);
      setModalLanguage('English');
    }
  };

  const closeDetails = () => {
    setSelectedItem(null);
    setSelectedItemType(null);
    setOriginalSelectedItem(null);
    setModalLanguage('English');
    setExpandedTests({});
  };

  const handleModalLanguageChange = async (lang) => {
    setModalLanguage(lang);
    if (lang === 'English') {
      if (originalSelectedItem) {
        setSelectedItem(originalSelectedItem);
      }
      return;
    }

    const reportId = originalSelectedItem?.id || originalSelectedItem?._id;
    if (!reportId) return;

    if (translatedItems[reportId]?.[lang]) {
      setSelectedItem(translatedItems[reportId][lang]);
      return;
    }

    setModalLoading(true);
    try {
      const res = await api.translateReport(originalSelectedItem, lang);
      if (res.success) {
        setSelectedItem(res.data);
        setTranslatedItems(prev => ({
          ...prev,
          [reportId]: {
            ...(prev[reportId] || {}),
            [lang]: res.data
          }
        }));
      }
    } catch (err) {
      alert(err.message || `Failed to translate report to ${lang}`);
      setModalLanguage('English');
      if (originalSelectedItem) setSelectedItem(originalSelectedItem);
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'high':
        return <span className="badge badge-warning">High</span>;
      case 'low':
        return <span className="badge badge-info">Low</span>;
      case 'critical':
        return <span className="badge badge-danger">Critical</span>;
      case 'normal':
      default:
        return <span className="badge badge-normal">Normal</span>;
    }
  };

  return (
    <div className="fade-in">
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }} className="gradient-text">
            Medical History Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
            Browse, search, or review your historical medicine scans and clinical report results.
          </p>
        </div>
        
        {(scans.length > 0 || reports.length > 0) && (
          <button onClick={handleClearAll} className="btn btn-danger" style={{ padding: '0.6rem 1.25rem' }}>
            <Trash2 size={16} /> Clear All History
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Toggle sub tab */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveSubTab('scans')}
            className={`btn ${activeSubTab === 'scans' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.5rem 1.25rem',
              background: activeSubTab === 'scans' ? 'linear-gradient(135deg, var(--primary), #059669)' : 'transparent',
              border: activeSubTab === 'scans' ? 'none' : '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}
          >
            <Pill size={16} /> Medicine Scans
          </button>
          
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`btn ${activeSubTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.5rem 1.25rem',
              background: activeSubTab === 'reports' ? 'linear-gradient(135deg, var(--secondary), #4f46e5)' : 'transparent',
              border: activeSubTab === 'reports' ? 'none' : '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}
          >
            <FileText size={16} /> Document Analyses
          </button>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '320px', maxWidth: '100%' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder={activeSubTab === 'scans' ? 'Search by medicine...' : 'Search by report...'}
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', paddingRight: '0.5rem', height: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Main List Area */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 size={32} className="badge-normal" style={{ animation: 'spin 2s linear infinite', background: 'none' }} />
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          {activeSubTab === 'scans' ? (
            scans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dark)' }}>
                <Pill size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No matching medicine scans found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scans.map(scan => (
                  <div key={scan.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--primary)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Pill size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{scan.medicineName}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Active: {scan.activeIngredients}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dark)', fontSize: '0.8rem' }}>
                        <Calendar size={14} />
                        <span>{formatDate(scan.createdAt)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openDetails(scan, 'scan')} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                          <Eye size={14} /> Details
                        </button>
                        <button onClick={() => handleDeleteItem(scan.id, 'scan')} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dark)' }}>
                <FileText size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No matching report analysis logs found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {reports.map(report => (
                  <div key={report.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--secondary)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{report.fileName}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Summary: {report.summary}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dark)', fontSize: '0.8rem' }}>
                        <Calendar size={14} />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openDetails(report, 'report')} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                          <Eye size={14} /> Details
                        </button>
                        <button onClick={() => handleDeleteItem(report.id, 'report')} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* DETAIL MODAL PANEL */}
      {selectedItem && (
        <div 
          onClick={closeDetails}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(11, 15, 25, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '2rem 1.5rem',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel fade-in" 
            style={{
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#161c2d',
              padding: '2rem',
              position: 'relative',
              cursor: 'default'
            }}
          >
            {/* Close Button */}
            <button onClick={closeDetails} style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}>
              <X size={24} />
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: selectedItemType === 'scan' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  color: selectedItemType === 'scan' ? 'var(--primary)' : 'var(--secondary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedItemType === 'scan' ? <Pill size={22} /> : <FileText size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                    {selectedItemType === 'scan' ? 'Medicine Scan Details' : 'Lab Document Analysis'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Scanned on {formatDate(selectedItem.createdAt)}
                  </span>
                </div>
              </div>

              {selectedItemType === 'report' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {modalLoading && <Loader2 size={14} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--secondary)' }} />}
                  <label htmlFor="modal-language-select" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Language:</label>
                  <select
                    id="modal-language-select"
                    value={modalLanguage}
                    disabled={modalLoading}
                    onChange={(e) => handleModalLanguageChange(e.target.value)}
                    style={{
                      background: 'rgba(25, 30, 45, 0.95)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.25rem 0.5rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: modalLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Modal Body Contents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              
              {selectedItemType === 'scan' ? (
                <>
                  {/* Medicine Scan Details */}
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid var(--primary-glow)', borderRadius: 'var(--radius-sm)' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)' }}>{selectedItem.medicineName}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Active Ingredients: {selectedItem.activeIngredients}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>Recommended Dosage</h4>
                    <p style={{ color: 'var(--text-muted)' }}>{selectedItem.dosage}</p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>Directions for Use</h4>
                    <p style={{ color: 'var(--text-muted)' }}>{selectedItem.usageInstructions}</p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--danger)', marginBottom: '0.25rem' }}>Side Effects</h4>
                    <p style={{ color: 'var(--text-muted)' }}>{selectedItem.sideEffects}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.25rem' }}>Warnings</h4>
                      <p style={{ color: 'var(--text-muted)' }}>{selectedItem.warnings}</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Precautions</h4>
                      <p style={{ color: 'var(--text-muted)' }}>{selectedItem.precautions}</p>
                    </div>
                  </div>
                </>
              ) : selectedItem.cardAnalysis ? (() => {
                const card = selectedItem.cardAnalysis;
                
                const getScoreColor = (score) => {
                  if (score >= 90) return '#10b981'; // Green
                  if (score >= 75) return '#6366f1'; // Indigo/Blue
                  if (score >= 60) return '#f59e0b'; // Amber/Yellow
                  if (score >= 45) return '#f97316'; // Orange
                  return '#ef4444'; // Red
                };

                const getRiskBadgeStyles = (risk) => {
                  const r = (risk || '').toLowerCase();
                  if (r.includes('low')) return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
                  if (r.includes('medium')) return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' };
                  if (r.includes('high')) return { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', border: 'rgba(249, 115, 22, 0.2)' };
                  return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' };
                };

                const getStatusBadgeStyles = (status) => {
                  const s = (status || '').toLowerCase();
                  if (s.includes('normal')) return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
                  if (s.includes('low') || s.includes('high')) return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
                  return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
                };

                const scoreColor = getScoreColor(card.overall_summary.health_score);
                const riskStyles = getRiskBadgeStyles(card.overall_summary.overall_risk);

                return (
                  <>
                    {/* Header Info */}
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid var(--secondary-glow)', borderRadius: 'var(--radius-sm)' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Report Type / File</h4>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.15rem' }}>{card.report_information.report_type}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>File Name: {selectedItem.fileName}</p>
                    </div>

                    {/* Patient & Score Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Health Score</h4>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                          <span style={{ fontSize: '2rem', fontWeight: '800', color: scoreColor }}>{card.overall_summary.health_score}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
                        </div>
                        <div style={{ fontWeight: '700', color: scoreColor, marginTop: '0.25rem' }}>{card.overall_summary.health_status}</div>
                        <div style={{ marginTop: '0.35rem', background: riskStyles.bg, color: riskStyles.text, border: `1px solid ${riskStyles.border}`, padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '700' }}>
                          Risk: {card.overall_summary.overall_risk}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <div><strong>Patient:</strong> {card.patient_information.patient_name}</div>
                        <div><strong>Age / Gender:</strong> {card.patient_information.age} / {card.patient_information.gender}</div>
                        <div><strong>Patient ID:</strong> {card.patient_information.patient_id}</div>
                        <div><strong>Doctor Name:</strong> {card.report_information.doctor_name}</div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Executive Summary</h4>
                      <p style={{ color: 'var(--text-muted)' }}>{card.overall_summary.summary}</p>
                    </div>

                    {/* Critical Alerts Banner (If present) */}
                    {card.critical_alerts && card.critical_alerts.length > 0 && !card.critical_alerts[0].toLowerCase().includes('no immediate') && !card.critical_alerts[0].toLowerCase().includes('no critical') && (
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#f87171'
                      }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444' }}>
                          ⚠️ CRITICAL ALERTS DETECTED
                        </h4>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                          {card.critical_alerts.map((alert, idx) => (
                            <li key={idx} style={{ fontWeight: '600' }}>{alert}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Test Breakdown Grid of Cards */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Test Results</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {card.tests.map((test, index) => {
                          const isExpanded = !!expandedTests[index];
                          const tStatus = getStatusBadgeStyles(test.status);
                          
                          return (
                            <div key={index} className="glass-panel" style={{
                              padding: '1rem',
                              borderLeft: `4px solid ${tStatus.text}`,
                              transition: 'all 0.3s ease'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{test.test_name}</span>
                                  <span style={{
                                    background: tStatus.bg,
                                    color: tStatus.text,
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '3px',
                                    fontSize: '0.65rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase'
                                  }}>{test.status}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                                  <div><strong>{test.value} {test.unit}</strong></div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Range: {test.reference_range}</div>
                                  <button onClick={() => toggleTestExpand(index)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                    {isExpanded ? 'Hide' : 'Details'}
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="fade-in" style={{
                                  marginTop: '0.75rem',
                                  paddingTop: '0.75rem',
                                  borderTop: '1px solid var(--border-color)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.75rem',
                                  fontSize: '0.8rem'
                                }}>
                                  <div>
                                    <h6 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.2rem', margin: 0 }}>Simple Explanation</h6>
                                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>{test.simple_explanation}</p>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                    {test.possible_causes && test.possible_causes.length > 0 && (
                                      <div>
                                        <h6 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2, margin: 0' }}>Possible Causes</h6>
                                        <ul style={{ paddingLeft: '1rem', margin: 0, color: 'var(--text-muted)' }}>
                                          {test.possible_causes.map((c, i) => <li key={i}>{c}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    {test.common_symptoms && test.common_symptoms.length > 0 && (
                                      <div>
                                        <h6 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2, margin: 0' }}>Common Symptoms</h6>
                                        <ul style={{ paddingLeft: '1rem', margin: 0, color: 'var(--text-muted)' }}>
                                          {test.common_symptoms.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                    {test.recommended_foods && test.recommended_foods.length > 0 && (
                                      <div>
                                        <h6 style={{ fontWeight: '700', color: '#10b981', marginBottom: '0.2, margin: 0' }}>Foods</h6>
                                        <ul style={{ paddingLeft: '1rem', margin: 0, color: 'var(--text-muted)' }}>
                                          {test.recommended_foods.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    {test.lifestyle_changes && test.lifestyle_changes.length > 0 && (
                                      <div>
                                        <h6 style={{ fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.2, margin: 0' }}>Lifestyle</h6>
                                        <ul style={{ paddingLeft: '1rem', margin: 0, color: 'var(--text-muted)' }}>
                                          {test.lifestyle_changes.map((l, i) => <li key={i}>{l}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '3px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {test.common_treatments && <div><strong>Treatments:</strong> <span style={{ color: 'var(--text-muted)' }}>{test.common_treatments}</span></div>}
                                    {test.recovery_time && <div><strong>Recovery:</strong> <span style={{ color: 'var(--text-muted)' }}>{test.recovery_time}</span></div>}
                                    {test.when_to_see_doctor && <div><strong>When to see doctor:</strong> <span style={{ color: '#f87171' }}>{test.when_to_see_doctor}</span></div>}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Positives vs Concerns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="glass-panel" style={{ padding: '1rem', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                        <h5 style={{ fontWeight: '700', color: '#10b981', fontSize: '0.85rem', marginBottom: '0.5rem' }}>✨ Positive Findings</h5>
                        <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {card.positive_findings.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="glass-panel" style={{ padding: '1rem', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                        <h5 style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>⚠️ Concerns</h5>
                        <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {card.abnormal_findings.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                      <h5 style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>❓ Suggested Questions to Ask Your Doctor</h5>
                      <ol style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {card.questions_for_doctor.map((q, idx) => <li key={idx}>{q}</li>)}
                      </ol>
                    </div>

                    {/* Disclaimer */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textAlign: 'center', lineHeight: '1.4' }}>
                      {card.disclaimer}
                    </div>
                  </>
                );
              })() : (
                <>
                  {/* Report Details */}
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid var(--secondary-glow)', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase' }}>{UI_STRINGS[modalLanguage].fileName}</h4>
                    <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedItem.fileName}</p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.25rem' }}>{UI_STRINGS[modalLanguage].executiveSummary}</h4>
                    <p style={{ color: 'var(--text-muted)' }}>{selectedItem.summary}</p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.5rem' }}>{UI_STRINGS[modalLanguage].keyFindings}</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '0.4rem', fontWeight: '600' }}>{UI_STRINGS[modalLanguage].testColumn}</th>
                            <th style={{ padding: '0.4rem', fontWeight: '600' }}>{UI_STRINGS[modalLanguage].valueColumn}</th>
                            <th style={{ padding: '0.4rem', fontWeight: '600' }}>{UI_STRINGS[modalLanguage].refRangeColumn}</th>
                            <th style={{ padding: '0.4rem', fontWeight: '600' }}>{UI_STRINGS[modalLanguage].statusColumn}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItem.keyFindings.map((finding, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.5rem 0.4rem', fontWeight: '600', color: 'var(--text-main)' }}>{finding.test}</td>
                              <td style={{ padding: '0.5rem 0.4rem', color: 'var(--text-main)' }}>{finding.value}</td>
                              <td style={{ padding: '0.5rem 0.4rem', color: 'var(--text-muted)' }}>{finding.referenceRange}</td>
                              <td style={{ padding: '0.5rem 0.4rem' }}>{getStatusBadge(finding.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--danger)', marginBottom: '0.5rem' }}>{UI_STRINGS[modalLanguage].clinicalAlerts}</h4>
                    <HighlightedInsights insights={selectedItem.highlightedInsights} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>{UI_STRINGS[modalLanguage].recommendations}</h4>
                    <p style={{ color: 'var(--text-muted)' }}>{selectedItem.recommendations}</p>
                  </div>
                </>
              )}

              {/* Disclaimer */}
              <MedicalDisclaimer />
            </div>

            {/* Modal Footer Controls */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button onClick={() => handleDeleteItem(selectedItem.id, selectedItemType)} className="btn btn-danger" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Trash2 size={16} /> Delete Record
              </button>
              <button onClick={closeDetails} className="btn btn-secondary">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
