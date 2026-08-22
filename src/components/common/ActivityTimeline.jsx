import React from 'react';
import { Clock, Calendar, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export const ActivityTimeline = ({ items }) => {
  if (!items || items.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No recent activity.</div>;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'punch':
        return <Clock size={16} />;
      case 'leave':
        return <Calendar size={16} />;
      case 'approval':
        return <CheckCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="timeline-feed">
      {items.map((item) => (
        <div key={item.id} className="timeline-item">
          <div className="timeline-icon">{getIcon(item.type)}</div>
          <div className="timeline-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem' }}>{item.title}</strong>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{item.time}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
