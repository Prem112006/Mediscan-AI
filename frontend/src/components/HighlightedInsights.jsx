import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const HighlightedInsights = ({ insights = [] }) => {
  if (!insights || insights.length === 0) {
    return (
      <div style={{ color: 'var(--text-dark)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
        No critical insights detected in the document.
      </div>
    );
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={18} style={{ color: 'var(--danger)' }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--accent)' }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--secondary)' }} />;
    }
  };

  const getInsightStyle = (type) => {
    switch (type) {
      case 'danger':
        return {
          borderLeft: '3px solid var(--danger)',
          background: 'rgba(239, 68, 68, 0.02)',
        };
      case 'warning':
        return {
          borderLeft: '3px solid var(--accent)',
          background: 'rgba(245, 158, 11, 0.02)',
        };
      case 'info':
      default:
        return {
          borderLeft: '3px solid var(--secondary)',
          background: 'rgba(99, 102, 241, 0.02)',
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className="glass-panel"
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            ...getInsightStyle(insight.type)
          }}
        >
          <div style={{ marginTop: '2px' }}>{getInsightIcon(insight.type)}</div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              fontSize: '0.875rem', 
              lineHeight: '1.45', 
              color: 'var(--text-main)',
              fontWeight: '500'
            }}>
              {insight.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HighlightedInsights;
