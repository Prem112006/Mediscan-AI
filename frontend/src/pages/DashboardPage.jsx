import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Pill, 
  FileText, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Sparkles,
  Loader2
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [dailyTip, setDailyTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.data.stats);
          setRecentScans(res.data.recentScans);
          setRecentReports(res.data.recentReports);
          setDailyTip(res.data.dailyTip);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="badge-normal" style={{ animation: 'spin 2s linear infinite', background: 'none', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading health metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }} className="gradient-text">
          Clinical Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Welcome back, {user?.name}. Here is your healthcare summary.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        {/* Total Scans */}
        <div className="col-4 glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--primary)',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Pill size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Medicine Scans</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.15rem' }}>{stats?.totalScans || 0}</h3>
          </div>
        </div>

        {/* Total Reports */}
        <div className="col-4 glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--secondary)',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Reports Parsed</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.15rem' }}>{stats?.totalReports || 0}</h3>
          </div>
        </div>

        {/* Last Activity */}
        <div className="col-4 glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--accent)',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Last Sync Date</p>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginTop: '0.4rem', color: 'var(--text-main)' }}>
              {stats?.lastActivityDate ? formatDate(stats.lastActivityDate) : 'No recent scans'}
            </h3>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Recent Scans/Reports & Health Tip */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Health Tip Box */}
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(99, 102, 241, 0.05))',
            borderColor: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--primary)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Tip of the Day</span>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginTop: '0.15rem', lineHeight: '1.4' }}>
                {dailyTip || "Keep record scans up to date to easily review them in consultation with your doctor."}
              </p>
            </div>
          </div>

          {/* Recent Scans */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Recent Medicine Scans</h3>
              <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>View all history</Link>
            </div>
            
            {recentScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dark)' }}>
                <Pill size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                <p>No medicine scans completed yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentScans.map(scan => (
                  <div key={scan.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Pill size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{scan.medicineName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active: {scan.activeIngredients}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>{formatDate(scan.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Medical Reports */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Recent Document Analyses</h3>
              <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>View all history</Link>
            </div>

            {recentReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dark)' }}>
                <FileText size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                <p>No medical reports analyzed yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentReports.map(report => (
                  <div key={report.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={16} style={{ color: 'var(--secondary)' }} />
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{report.fileName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {report.summary}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>{formatDate(report.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Actions Panel */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem' }}>Quick Actions</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Action 1 */}
              <Link to="/scanner" className="btn btn-primary" style={{ justifyContent: 'space-between', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Pill size={18} />
                  <span>Scan Medicine Label</span>
                </div>
                <ArrowRight size={16} />
              </Link>

              {/* Action 2 */}
              <Link to="/report" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'var(--secondary-glow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--secondary)' }}>
                  <FileText size={18} />
                  <span style={{ color: 'var(--text-main)' }}>Analyze Lab Report</span>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--secondary)' }} />
              </Link>
            </div>
          </div>

          {/* Demographic summary card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem' }}>Clinical Profile Settings</h4>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <div>Gender: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{user?.gender || 'Not specified'}</span></div>
              <div>Date of Birth: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{user?.dateOfBirth || 'Not specified'}</span></div>
              <div>Phone: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{user?.phone || 'Not specified'}</span></div>
              <div>Auth Provider: <span style={{ color: 'var(--text-main)', fontWeight: '600', textTransform: 'capitalize' }}>{user?.oauthProvider || 'Email/Password'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
