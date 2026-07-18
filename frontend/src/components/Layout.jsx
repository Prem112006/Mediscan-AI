import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Pill, 
  FileText, 
  History, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user && user.email && (
    user.email.trim().toLowerCase().includes('premkardani2006') ||
    user.email.trim().toLowerCase().includes('panchaldhyan007')
  );

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Medicine Scanner', path: '/scanner', icon: Pill },
    { name: 'Report Analyzer', path: '/report', icon: FileText },
    { name: 'Medical History', path: '/history', icon: History },
    ...(isAdmin ? [{ name: 'Admin Panel', path: '/admin', icon: ShieldCheck }] : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        padding: '1.5rem 1rem'
      }} className="desktop-sidebar">
        
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800'
          }}>
            M
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }} className="gradient-text">MediScan AI</h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.1em', fontWeight: '700', textTransform: 'uppercase' }}>Clinical Portal</span>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="glass-panel" style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--secondary-glow), transparent)',
              border: '1px solid var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--secondary)'
            }}>
              <UserIcon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: '600', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  justifyContent: 'flex-start',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 4px 15px -3px var(--primary-glow)' : 'none',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{
            justifyContent: 'flex-start',
            padding: '0.85rem 1rem',
            fontSize: '0.9rem',
            background: 'transparent',
            borderColor: 'transparent',
            color: 'var(--danger)',
            marginTop: 'auto',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </aside>

      {/* Mobile Top Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4rem',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'between',
        padding: '0 1.5rem',
        zIndex: 99
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '0.75rem'
          }}>
            M
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800' }} className="gradient-text">MediScan AI</h2>
        </div>

        <button 
          onClick={toggleMobileMenu} 
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '4rem',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          zIndex: 98,
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1.5rem',
          animation: 'slide-down 0.2s ease-out'
        }} className="mobile-drawer">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    padding: '1rem',
                    fontSize: '1rem'
                  }}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
          
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="btn btn-secondary"
            style={{
              justifyContent: 'flex-start',
              padding: '1rem',
              color: 'var(--danger)',
              background: 'transparent',
              borderColor: 'transparent'
            }}
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {children}
        
        {/* Footnote Clinical Disclaimer */}
        <footer style={{
          marginTop: '4rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-dark)',
          fontSize: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            <ShieldCheck size={14} className="badge-normal" style={{ padding: 0, background: 'none' }} />
            <span>Certified HIPAA Compliant Mock Session</span>
          </div>
          <p>© 2026 MediScan AI Inc. For educational purposes. AI interpretations are suggestions and should not replace a physician's advice.</p>
        </footer>
      </main>

      {/* Mobile Drawer Styles & Media Queries */}
      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1024px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-header {
            display: flex !important;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
