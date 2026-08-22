import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BellRing, LogOut, ShieldCheck, RefreshCw, Menu, ChevronDown } from 'lucide-react';

export const Navbar = ({ sidebarOpen, onToggleSidebar }) => {
  const { currentUser, activeUser, isViewingAsAnother, switchViewAs, logout, allUsers } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPortalDropdown, setShowPortalDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.navbar')) {
        setShowNotifications(false);
        setShowPortalDropdown(false);
      }
    };

    const handleScroll = () => {
      setShowNotifications(false);
      setShowPortalDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  return (
    <header className="navbar relative z-10">
      {/* Sidebar Toggle & Brand Logo */}
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!sidebarOpen && (
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
        )}

        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{
            fontWeight: 800,
            fontSize: '2rem',
            background: 'linear-gradient(135deg, #ffffff 30%, #3B82F6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
            fontFamily: 'var(--font-body)',
            textShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
          }}>
            Dayflow
          </span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Admin Impersonation Switcher Custom Dropdown */}
        {currentUser?.role === 'ADMIN' && (
          <div className="portal-switcher" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPortalDropdown(!showPortalDropdown)}
              className="liquid-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: '#fff',
                background: isViewingAsAnother ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                border: isViewingAsAnother ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.25s ease'
              }}
              title="Switch Portal Impersonation View"
            >
              <ShieldCheck size={15} color={isViewingAsAnother ? '#10B981' : 'hsl(var(--muted-foreground))'} />
              <span style={{ fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
                {isViewingAsAnother ? 'Simulating View:' : 'View Portal As:'}
              </span>
              <span style={{ fontWeight: 600, color: isViewingAsAnother ? '#10B981' : '#ffffff' }}>
                {isViewingAsAnother ? activeUser?.name : 'Choose User...'}
              </span>
              <ChevronDown size={14} style={{ marginLeft: '2px', opacity: 0.8 }} />
            </button>

            {showPortalDropdown && (
              <div
                className="liquid-glass"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '42px',
                  width: '280px',
                  background: 'rgba(0, 16, 32, 0.75)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  zIndex: 100,
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchViewAs(u.id === currentUser.id ? null : u);
                      setShowPortalDropdown(false);
                    }}
                    style={{
                      background: activeUser?.id === u.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border: 'none',
                      color: '#fff',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.825rem',
                      fontWeight: activeUser?.id === u.id ? 600 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { if (activeUser?.id !== u.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e) => { if (activeUser?.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{u.name}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
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
                background: 'rgba(0, 16, 32, 0.75)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.12)',
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

        {/* User Profile Info & Logout Pill */}
        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '1.25rem' }}>
          <div className="liquid-glass profile-pill" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.35rem 0.75rem 0.35rem 0.35rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <img
              src={activeUser?.avatar || 'https://via.placeholder.com/44'}
              alt={activeUser?.name}
              className="avatar"
              style={{ width: '32px', height: '32px', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#fff', whiteSpace: 'nowrap' }}>
                {activeUser?.name}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>
                {activeUser?.role}
              </span>
            </div>

            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.6)',
                padding: '0.35rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.25rem',
                transition: 'all 0.2s ease',
                width: '26px',
                height: '26px'
              }}
              title="Log out"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'; e.currentTarget.style.color = '#F43F5E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
