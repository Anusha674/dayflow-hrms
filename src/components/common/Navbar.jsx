import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BellRing, LogOut, ShieldCheck, RefreshCw, Menu } from 'lucide-react';

export const Navbar = ({ sidebarOpen, onToggleSidebar }) => {
  const { currentUser, activeUser, isViewingAsAnother, switchViewAs, logout, allUsers } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="navbar relative z-10">
      {/* Sidebar Toggle & Brand Logo */}
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          className="liquid-glass btn-liquid"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Toggle Navigation Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-brand">
          <span>Dayflow</span>
          <sup style={{ fontSize: '0.65rem', verticalAlign: 'super', marginLeft: '1px' }}>®</sup>
        </div>
      </div>

      <div className="navbar-right">
        {/* Admin Impersonation Switcher */}
        {currentUser?.role === 'ADMIN' && (
          <div className="portal-switcher liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
            <ShieldCheck size={15} color="hsl(var(--muted-foreground))" />
            <span style={{ fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Portal View:</span>
            <select
              value={activeUser?.id || ''}
              onChange={(e) => {
                const target = allUsers.find((u) => u.id === e.target.value);
                switchViewAs(target || null);
              }}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#fff', cursor: 'pointer', outline: 'none' }}
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id} style={{ background: '#00192d', color: '#fff' }}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            {isViewingAsAnother && (
              <button
                onClick={() => switchViewAs(null)}
                title="Reset to Admin View"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        )}

        {/* Notifications Bell Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="liquid-glass"
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '0.6rem',
              color: 'hsl(var(--foreground))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BellRing size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#F43F5E',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="liquid-glass"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '320px',
                background: 'hsl(201, 100%, 13%)',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 100,
                padding: '1.1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>Notifications</strong>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', padding: '1rem' }}>No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '12px',
                        marginBottom: '0.5rem',
                        background: n.read ? 'transparent' : 'rgba(255,255,255,0.06)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#fff' }}>{n.title}</div>
                      <div style={{ fontSize: '0.775rem', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info & Logout Button */}
        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '1.25rem' }}>
          <img src={activeUser?.avatar || 'https://via.placeholder.com/44'} alt={activeUser?.name} className="avatar" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{activeUser?.name}</span>
            <span style={{ fontSize: '0.725rem', color: 'hsl(var(--muted-foreground))' }}>{activeUser?.role}</span>
          </div>

          <button onClick={logout} className="liquid-glass btn-liquid btn-sm" title="Log out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
