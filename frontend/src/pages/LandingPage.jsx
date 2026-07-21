import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, FileText, LayoutDashboard, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(255, 255, 255, 0.03) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(255, 255, 255, 0.01) 0%, transparent 45%)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Top Navbar */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            fontWeight: '800'
          }}>
            M
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }} className="gradient-text">MediScan AI</h2>
            <span style={{ fontSize: '0.6rem', color: 'var(--primary)', letterSpacing: '0.1em', fontWeight: '700', textTransform: 'uppercase' }}>Clinical Portal</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: 'none' }}>
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '6rem 1.5rem 4rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }} className="fade-in">
        
        {/* Shield Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '50px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--primary)',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          <ShieldCheck size={16} />
          Secure, AI-Powered Clinical Intelligence
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          lineHeight: '1.1',
          fontWeight: '800',
          letterSpacing: '-0.03em',
          maxWidth: '800px',
          marginTop: '0.5rem'
        }} className="gradient-text">
          Understand Your Health. Instantly Analyze Medicines & Reports.
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          lineHeight: '1.6'
        }}>
          MediScan AI matches high-resolution OCR text extraction with clinical reasoning to break down complicated labels and lab reports into clear, easy-to-understand metrics.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            {user ? 'View Health Dashboard' : 'Create Free Account'} <ArrowRight size={18} />
          </Link>
          <Link to={user ? "/scanner" : "/login"} className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            Scan Label Now
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '4rem 1.5rem 6rem',
      }}>
        <h3 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '3rem',
          letterSpacing: '-0.02em'
        }}>
          AI Health Assistant Features
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {/* Card 1: Scanner */}
          <div className="glass-panel interactive" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--primary)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Pill size={24} />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Medicine Label Scanner</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: '1.6' }}>
              Upload images of drug labels. Our OCR extracts chemical names and strengths, feeding them to Gemini AI to structure dosages, directions, and severe contraindications.
            </p>
          </div>

          {/* Card 2: Diagnostics */}
          <div className="glass-panel interactive" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--secondary)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={24} />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Report Analysis</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: '1.6' }}>
              Upload lab blood reports or clinical charts (PDF/Image formats). We parse physiological ranges and highlight abnormal results, complete with medical warnings.
            </p>
          </div>

          {/* Card 3: Dashboard */}
          <div className="glass-panel interactive" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              color: 'var(--accent)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LayoutDashboard size={24} />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Clinical History Log</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: '1.6' }}>
              Maintain a personal history of medication guides and physiological analyses. Search, filter, and review previous records securely on your user dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        color: 'var(--text-dark)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <span>Privacy Policy</span>
          <span>Terms of Use</span>
          <span>FDA AI Disclaimer</span>
        </div>
        <p>© 2026 MediScan AI. Created with next-generation medical OCR & clinical AI tools.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
