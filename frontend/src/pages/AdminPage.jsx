import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Pill,
  FileText,
  ShieldAlert,
  Search,
  Calendar,
  X,
  ExternalLink,
  Loader2,
  TrendingUp,
  Fingerprint,
  Activity,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Verification checks: strict email list
  const hasAccess = user && user.email && (
    user.email.trim().toLowerCase().includes('premkardani2006') ||
    user.email.trim().toLowerCase().includes('panchaldhyan007')
  );

  // States
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'scans', 'reports'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview stats states
  const [stats, setStats] = useState(null);

  // Users registry states
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Scans registry states
  const [scansList, setScansList] = useState([]);
  const [scanSearch, setScanSearch] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  // Reports registry states
  const [reportsList, setReportsList] = useState([]);
  const [reportSearch, setReportSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    fetchAdminData();
  }, [activeTab, hasAccess]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'overview') {
        const res = await api.getAdminStats();
        if (res.success) {
          setStats(res.data);
        }
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers(userSearch);
        if (res.success) {
          setUsersList(res.data);
        }
      } else if (activeTab === 'scans') {
        const res = await api.getAdminScans(scanSearch);
        if (res.success) {
          setScansList(res.data);
        }
      } else if (activeTab === 'reports') {
        const res = await api.getAdminReports(reportSearch);
        if (res.success) {
          setReportsList(res.data);
        }
      }
    } catch (err) {
      console.error('Admin API error:', err);
      setError(err.message || 'Failed to retrieve administrative data records.');
    } finally {
      setLoading(false);
    }
  };

  // Perform search actions when search inputs change (or on enter)
  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleScanSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleReportSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleUserSelect = async (userId) => {
    setDetailLoading(true);
    setSelectedUserDetail(null);
    try {
      const res = await api.getAdminUserDetail(userId);
      if (res.success) {
        setSelectedUserDetail(res.data);
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
      alert('Failed to fetch detailed records for this user.');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDOB = (dobString) => {
    if (!dobString) return 'Unspecified';
    try {
      return new Date(dobString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dobString;
    }
  };

  if (!hasAccess) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '2rem'
      }} className="fade-in">
        <div className="glass-panel" style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px solid var(--danger-glow)'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', fontWeight: '800' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            This panel is restricted to system administrators. Your credentials are not authorized to view this page.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header Banner */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }} className="gradient-text">
            Administrative Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
            System-wide logs, user directories, and patient diagnostic search histories.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'var(--primary-glow)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Mode</span>
        </div>
      </div>

      {/* Tabs Control Row */}
      <div className="glass-panel" style={{
        padding: '0.35rem',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '2rem',
        overflowX: 'auto',
        background: 'rgba(15, 23, 42, 0.3)'
      }}>
        {[
          { id: 'overview', name: 'Overview Stats', icon: TrendingUp },
          { id: 'users', name: 'User Registry', icon: Users },
          { id: 'scans', name: 'Medicine Scans', icon: Pill },
          { id: 'reports', name: 'Report Analyses', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn"
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '0.65rem 1rem',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, var(--secondary), var(--secondary-hover))' : 'transparent',
                color: isActive ? '#white' : 'var(--text-muted)',
                boxShadow: isActive ? '0 4px 12px var(--secondary-glow)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--danger-glow)', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem' }}>
          <AlertTriangle color="var(--danger)" size={20} />
          <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={36} className="badge-normal" style={{ animation: 'spin 2s linear infinite', background: 'none', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Fetching administrative data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && stats && (
            <div className="fade-in">
              <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                {/* Metric Card 1 */}
                <div className="col-4 glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyCenter: 'center', display: 'flex', justifyContent: 'center' }}>
                    <Users size={24} style={{ margin: 'auto' }} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Registered Patients</p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.15rem' }}>{stats.stats.totalUsers}</h3>
                  </div>
                </div>
                {/* Metric Card 2 */}
                <div className="col-4 glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                    <Pill size={24} style={{ margin: 'auto' }} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Medicine Scans</p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.15rem' }}>{stats.stats.totalScans}</h3>
                  </div>
                </div>
                {/* Metric Card 3 */}
                <div className="col-4 glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                    <FileText size={24} style={{ margin: 'auto' }} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Reports Analyzed</p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.15rem' }}>{stats.stats.totalReports}</h3>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                {/* Breakdown Statistics */}
                <div className="col-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Account Types Breakdown */}
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Fingerprint size={18} color="var(--secondary)" />
                      <span>Registration Methods</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Email signup */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                          <span>Email & Password Logins</span>
                          <span style={{ fontWeight: '700' }}>{stats.authStats.email} users</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${(stats.authStats.email / (stats.stats.totalUsers || 1)) * 100}%`,
                            height: '100%',
                            background: 'var(--secondary)'
                          }}></div>
                        </div>
                      </div>
                      {/* Google signup */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                          <span>Google OAuth Signups</span>
                          <span style={{ fontWeight: '700' }}>{stats.authStats.google} users</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${(stats.authStats.google / (stats.stats.totalUsers || 1)) * 100}%`,
                            height: '100%',
                            background: 'var(--primary)'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Gender Distribution */}
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} color="var(--primary)" />
                      <span>Demographics (Gender)</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {Object.keys(stats.genderStats).map(gender => (
                        <div key={gender} style={{
                          flex: '1 1 120px',
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 'var(--radius-sm)',
                          textAlign: 'center',
                          border: '1px solid var(--border-color)'
                        }}>
                          <p style={{ textTransform: 'capitalize', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{gender}</p>
                          <h4 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>{stats.genderStats[gender]}</h4>
                        </div>
                      ))}
                      {Object.keys(stats.genderStats).length === 0 && (
                        <p style={{ color: 'var(--text-dark)' }}>No gender metrics available.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Registrations Log */}
                <div className="col-6">
                  <div className="glass-panel" style={{ padding: '1.5rem', height: '100%' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Recent Registrations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {stats.recentUsers.map(u => (
                        <div key={u._id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: '700',
                              background: u.oauthProvider === 'google' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                              color: u.oauthProvider === 'google' ? 'var(--primary)' : 'var(--secondary)',
                              textTransform: 'uppercase'
                            }}>
                              {u.oauthProvider || 'Email'}
                            </span>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER REGISTRY */}
          {activeTab === 'users' && (
            <div className="fade-in">
              {/* Search Bar */}
              <form onSubmit={handleUserSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search patients by name or email address..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.75rem',
                      background: 'rgba(22, 28, 45, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-secondary">Search</button>
              </form>

              {/* Users Grid Table */}
              <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Patient Name</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Provider</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Registered Date</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'var(--transition)' }} className="table-row-hover">
                        <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{u.name}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{u.email}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{u.phone || 'N/A'}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: '700',
                            background: u.oauthProvider === 'google' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            color: u.oauthProvider === 'google' ? 'var(--primary)' : 'var(--secondary)',
                            textTransform: 'uppercase'
                          }}>
                            {u.oauthProvider || 'Email'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-dark)', fontSize: '0.85rem' }}>{formatDate(u.createdAt)}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleUserSelect(u.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Inspect Patient
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                          No patients found matching the search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICINE SCANS */}
          {activeTab === 'scans' && (
            <div className="fade-in">
              {/* Search Bar */}
              <form onSubmit={handleScanSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={scanSearch}
                    onChange={(e) => setScanSearch(e.target.value)}
                    placeholder="Search global scan history by medicine name..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.75rem',
                      background: 'rgba(22, 28, 45, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-secondary">Search</button>
              </form>

              {/* Scans List Table */}
              <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Patient Details</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Medicine Name</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Active Ingredients</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Scan Date</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scansList.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontWeight: '600', display: 'block', fontSize: '0.9rem' }}>{s.userId?.name || 'Deleted User'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.userId?.email || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--primary)' }}>{s.medicineName}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {s.activeIngredients ? (s.activeIngredients.length > 50 ? `${s.activeIngredients.substring(0, 50)}...` : s.activeIngredients) : 'Unspecified'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-dark)', fontSize: '0.85rem' }}>{formatDate(s.createdAt)}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedScan(s)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            View Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                    {scansList.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                          No medicine scan logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REPORTS LOG */}
          {activeTab === 'reports' && (
            <div className="fade-in">
              {/* Search Bar */}
              <form onSubmit={handleReportSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search global report analyses by file name or keywords..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.75rem',
                      background: 'rgba(22, 28, 45, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-secondary">Search</button>
              </form>

              {/* Reports List Table */}
              <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Patient Details</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>File Name</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Summary Extract</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Parsed Date</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsList.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontWeight: '600', display: 'block', fontSize: '0.9rem' }}>{r.userId?.name || 'Deleted User'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.userId?.email || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--secondary)' }}>
                          {r.fileName || 'document.pdf'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{
                            fontSize: '0.6rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            fontWeight: '800',
                            background: r.fileType === 'pdf' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: r.fileType === 'pdf' ? '#fca5a5' : '#fcd34d',
                            textTransform: 'uppercase'
                          }}>
                            {r.fileType}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {r.summary ? (r.summary.length > 55 ? `${r.summary.substring(0, 55)}...` : r.summary) : 'No summary'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-dark)', fontSize: '0.85rem' }}>{formatDate(r.createdAt)}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            View Diagnostic
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reportsList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                          No diagnostic report logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* OVERLAY MODAL: DRILL-DOWN PATIENT INSPECT VIEW */}
      {selectedUserDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999,
          padding: '2rem 1rem', overflowY: 'auto'
        }}>
          <div className="glass-panel fade-in" style={{
            maxWidth: '900px', width: '100%', maxHeight: '90vh', margin: 'auto',
            display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Patient Records Portfolio</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {selectedUserDetail.user.id}</span>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* User Bio Information */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', padding: '1.25rem',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)'
              }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--secondary)' }}>Administrative Details</h4>
                <div className="dashboard-grid">
                  <div className="col-4">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedUserDetail.user.name}</p>
                  </div>
                  <div className="col-4">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedUserDetail.user.email}</p>
                  </div>
                  <div className="col-4">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedUserDetail.user.phone || 'Unspecified'}</p>
                  </div>
                </div>
                <div className="dashboard-grid" style={{ marginTop: '1rem' }}>
                  <div className="col-4">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date of Birth</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{formatDOB(selectedUserDetail.user.dateOfBirth)}</p>
                  </div>
                  <div className="col-4">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gender</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'capitalize' }}>{selectedUserDetail.user.gender || 'Unspecified'}</p>
                  </div>
                  <div className="col-4">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OAuth Provider</p>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      fontWeight: '700',
                      background: selectedUserDetail.user.oauthProvider === 'google' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: selectedUserDetail.user.oauthProvider === 'google' ? 'var(--primary)' : 'var(--secondary)',
                      textTransform: 'uppercase',
                      marginTop: '0.2rem'
                    }}>
                      {selectedUserDetail.user.oauthProvider || 'Email/Local'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scanned Medicines section */}
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Pill size={18} color="var(--primary)" />
                  <span>Medicine Log History ({selectedUserDetail.scans.length})</span>
                </h4>
                {selectedUserDetail.scans.length === 0 ? (
                  <p style={{ color: 'var(--text-dark)', fontSize: '0.85rem', paddingLeft: '0.5rem' }}>No medicines scanned by this patient.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {selectedUserDetail.scans.map(scan => (
                      <div key={scan.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-color)', borderRadius: '6px'
                      }}>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{scan.medicineName}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ingredients: {scan.activeIngredients || 'N/A'}</p>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>{formatDate(scan.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parsed Reports section */}
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="var(--secondary)" />
                  <span>Medical Diagnostic Reports ({selectedUserDetail.reports.length})</span>
                </h4>
                {selectedUserDetail.reports.length === 0 ? (
                  <p style={{ color: 'var(--text-dark)', fontSize: '0.85rem', paddingLeft: '0.5rem' }}>No medical reports uploaded by this patient.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {selectedUserDetail.reports.map(rep => (
                      <div key={rep.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-color)', borderRadius: '6px'
                      }}>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{rep.fileName || 'diagnostics.pdf'}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
                            {rep.summary || 'No diagnostic summary extracted.'}
                          </p>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>{formatDate(rep.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.01)' }}>
              <button onClick={() => setSelectedUserDetail(null)} className="btn btn-secondary">Close Records</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: MEDICINE SCAN DETAIL VIEW */}
      {selectedScan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999,
          padding: '2rem 1rem', overflowY: 'auto'
        }}>
          <div className="glass-panel fade-in" style={{
            maxWidth: '650px', width: '100%', maxHeight: '85vh', margin: 'auto',
            display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>{selectedScan.medicineName}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded by {selectedScan.userId?.name || 'Deleted User'} on {formatDate(selectedScan.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedScan.imageUrl && (
                <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Label Attachment Preview</span>
                  <div style={{
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    display: 'inline-block',
                    width: '100%',
                    maxWidth: '450px'
                  }}>
                    <img
                      src={selectedScan.imageUrl.startsWith('http') ? selectedScan.imageUrl : selectedScan.imageUrl}
                      alt="Medicine label preview"
                      style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '4px', display: 'block', margin: '0 auto' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div style="padding: 1.5rem 1rem; color: var(--text-muted); font-size: 0.8rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"opacity: 0.5; color: var(--text-dark);\"><line x1=\"22\" x2=\"2\" y1=\"2\" y2=\"22\"/><path d=\"M10.41 10.41A2 2 0 1 1 7.58 7.58\"/><path d=\"M9.5 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5\"/><path d=\"m2 13 4.5-4.5a2.5 2.5 0 0 1 3.5 0l4 4\"/><path d=\"m18 13 2 2\"/></svg><span style=\"font-weight: 500;\">Label attachment image not found in local workspace uploads.</span><span style=\"font-size: 0.7rem; opacity: 0.7;\">If uploaded in another session or host, the file will not be present on this local machine.</span></div>';
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={selectedScan.imageUrl.startsWith('http') ? selectedScan.imageUrl : selectedScan.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>Open Image in New Tab</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Active Ingredients</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedScan.activeIngredients || 'Not analyzed.'}</p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Dosage & Guide</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedScan.dosage || 'Not analyzed.'}</p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Usage Instructions</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedScan.usageInstructions || 'Not analyzed.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Side Effects</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedScan.sideEffects || 'None reported.'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Warnings</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedScan.warnings || 'None reported.'}</p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Raw OCR Text Detection</h4>
                <div style={{
                  background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px',
                  fontFamily: 'monospace', fontSize: '0.75rem', maxHeight: '120px', overflowY: 'auto',
                  border: '1px solid var(--border-color)', color: 'var(--text-muted)', whiteSpace: 'pre-wrap'
                }}>
                  {selectedScan.rawOcrText || 'No text extracted.'}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedScan(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: REPORT ANALYTICS VIEW */}
      {selectedReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999,
          padding: '2rem 1rem', overflowY: 'auto'
        }}>
          <div className="glass-panel fade-in" style={{
            maxWidth: '750px', width: '100%', maxHeight: '85vh', margin: 'auto',
            display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--secondary)' }}>{selectedReport.fileName || 'diagnostics.pdf'}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded by {selectedReport.userId?.name || 'Deleted User'} on {formatDate(selectedReport.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedReport.fileUrl && (
                <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                  {selectedReport.fileType === 'image' || (selectedReport.fileName && /\.(png|jpe?g|gif|webp|svg)$/i.test(selectedReport.fileName)) ? (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Lab Report Attachment (Image Preview)</span>
                      <div style={{
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.2)',
                        display: 'inline-block',
                        width: '100%',
                        maxWidth: '550px'
                      }}>
                        <img
                          src={selectedReport.fileUrl.startsWith('http') ? selectedReport.fileUrl : selectedReport.fileUrl}
                          alt="Report attachment diagnostic preview"
                          style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', display: 'block', margin: '0 auto' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div style="padding: 1.5rem 1rem; color: var(--text-muted); font-size: 0.8rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"opacity: 0.5; color: var(--text-dark);\"><line x1=\"22\" x2=\"2\" y1=\"2\" y2=\"22\"/><path d=\"M10.41 10.41A2 2 0 1 1 7.58 7.58\"/><path d=\"M9.5 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5\"/><path d=\"m2 13 4.5-4.5a2.5 2.5 0 0 1 3.5 0l4 4\"/><path d=\"m18 13 2 2\"/></svg><span style=\"font-weight: 500;\">Report attachment image not found in local workspace uploads.</span><span style=\"font-size: 0.7rem; opacity: 0.7;\">If uploaded in another session or host, the file will not be present on this local machine.</span></div>';
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Lab Report Attachment (PDF Document Preview)</span>
                      <div style={{
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(0, 0, 0, 0.15)',
                        overflow: 'hidden',
                        height: '350px',
                        width: '100%'
                      }}>
                        <iframe
                          src={selectedReport.fileUrl.startsWith('http') ? selectedReport.fileUrl : selectedReport.fileUrl}
                          title="PDF diagnostic preview"
                          style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                    </>
                  )}
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={selectedReport.fileUrl.startsWith('http') ? selectedReport.fileUrl : selectedReport.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>Open File in New Tab</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Diagnostic Summary</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedReport.summary || 'No summary parsed.'}</p>
              </div>

              {/* Key findings list */}
              {selectedReport.keyFindings && selectedReport.keyFindings.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Key Lab Findings</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedReport.keyFindings.map((finding, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: finding.status.toLowerCase() !== 'normal' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px'
                      }}>
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{finding.test}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Range: {finding.referenceRange || 'Unspecified'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{finding.value}</span>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            fontWeight: '800',
                            background: finding.status.toLowerCase() !== 'normal' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: finding.status.toLowerCase() !== 'normal' ? 'var(--danger)' : 'var(--primary)'
                          }}>
                            {finding.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recommendations</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedReport.recommendations || 'None reported.'}</p>
              </div>

              {selectedReport.warnings && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Critical Medical Warnings</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '6px' }}>
                    <AlertTriangle color="var(--danger)" size={18} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedReport.warnings}</p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedReport(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
