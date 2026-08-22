import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Gauge,
  UserCheck,
  CalendarCheck2,
  CalendarOff,
  Receipt,
  LineChart,
  RotateCcw,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onToggleSidebar }) => {
  const { activeUser } = useAuth();
  const isAdmin = activeUser?.role === 'ADMIN';

  return (
    <aside className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Navigation</span>
        <button
          onClick={onToggleSidebar}
          className="liquid-glass btn-liquid btn-sm"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          title="Close Navigation"
        >
          <X size={18} color="#ffffff" />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Gauge size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <UserCheck size={18} />
          <span>Profile</span>
        </NavLink>

        <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CalendarCheck2 size={18} />
          <span>Attendance</span>
        </NavLink>

        <NavLink to="/leave" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CalendarOff size={18} />
          <span>Time-Off</span>
        </NavLink>

        <NavLink to="/payroll" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Receipt size={18} />
          <span>Payroll</span>
        </NavLink>

        {isAdmin && (
          <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LineChart size={18} />
            <span>HR Analytics</span>
          </NavLink>
        )}

        <div style={{ margin: '1.5rem 0 0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '1rem' }}>
          <NavLink to="/reset" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: '#F43F5E' }}>
            <RotateCcw size={18} />
            <span>Reset Demo Data</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};
