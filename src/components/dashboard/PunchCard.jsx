import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getActivePunch, checkInUser, checkOutUser, calculateWorkDuration } from '../../db/storage';
import { Timer, CalendarCheck2, Clock4, CheckCircle2 } from 'lucide-react';

export const PunchCard = () => {
  const { activeUser } = useAuth();
  const { showToast } = useNotifications();

  const [activePunch, setActivePunch] = useState(null);
  const [customInTime, setCustomInTime] = useState('');
  const [customOutTime, setCustomOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [calculatedHours, setCalculatedHours] = useState('0h 0m');

  useEffect(() => {
    if (activeUser) {
      const punch = getActivePunch(activeUser.id);
      setActivePunch(punch);
    }
  }, [activeUser]);

  useEffect(() => {
    let timerId = null;

    const updateTimer = () => {
      if (activePunch) {
        const nowIso = new Date().toISOString();
        const duration = calculateWorkDuration(activePunch.checkInTime, nowIso);
        setCalculatedHours(duration);
      } else {
        setCalculatedHours('0h 0m');
      }
    };

    updateTimer();

    if (activePunch) {
      timerId = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [activePunch]);

  const handleCheckIn = () => {
    if (!activeUser) return;
    let timeVal = null;
    if (customInTime) {
      const [hours, minutes] = customInTime.split(':').map(Number);
      const d = new Date();
      d.setHours(hours);
      d.setMinutes(minutes);
      d.setSeconds(0);
      d.setMilliseconds(0);
      timeVal = d.toISOString();
    }
    const newPunch = checkInUser(activeUser.id, timeVal, notes);
    setActivePunch(newPunch);
    setNotes('');
    setCustomInTime('');
    showToast(`Checked in at ${newPunch.displayTime}!`, 'success');
  };

  const handleCheckOut = () => {
    if (!activeUser) return;
    let timeVal = null;
    if (customOutTime) {
      const [hours, minutes] = customOutTime.split(':').map(Number);
      const d = new Date();
      d.setHours(hours);
      d.setMinutes(minutes);
      d.setSeconds(0);
      d.setMilliseconds(0);
      timeVal = d.toISOString();
    }
    const record = checkOutUser(activeUser.id, timeVal, notes);
    setActivePunch(null);
    setNotes('');
    setCustomOutTime('');
    showToast(`Checked out! Work duration: ${record.workHours} (${record.checkIn} to ${record.checkOut})`, 'info');
  };

  return (
    <div className="card liquid-glass">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.5rem', borderRadius: '10px', color: '#fff' }}>
            <Timer size={20} />
          </div>
          <div>
            <h3 className="card-title">Attendance Check-In Card</h3>
            <p style={{ fontSize: '0.775rem', color: 'hsl(var(--muted-foreground))' }}>Work duration calculated from exact Check-In & Check-Out times</p>
          </div>
        </div>

        {activePunch ? (
          <span className="badge badge-present" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
            CHECKED IN ({activePunch.displayTime})
          </span>
        ) : (
          <span className="badge badge-pending">NOT CHECKED IN</span>
        )}
      </div>

      {/* Calculated Time Display */}
      <div style={{ background: 'rgba(0, 20, 38, 0.5)', border: '1px solid rgba(255, 255, 255, 0.18)', padding: '1.25rem', borderRadius: '16px', margin: '1rem 0' }}>
        <div className="grid-3" style={{ textAlign: 'center', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CHECK-IN TIME
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: activePunch ? '#10B981' : 'hsl(var(--muted-foreground))', marginTop: '0.2rem' }}>
              {activePunch ? activePunch.displayTime : '—'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              WORK DURATION
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem', fontFamily: 'monospace' }}>
              {calculatedHours}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              STATUS EVALUATION
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span className={`badge ${activePunch ? 'badge-present' : 'badge-info'}`}>
                {activePunch ? 'CHECKED IN' : 'READY TO CHECK IN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Check In / Out Time Picker & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!activePunch ? (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem', display: 'block' }}>
                Check-In Time (Optional)
              </label>
              <input
                type="time"
                className="form-input"
                value={customInTime}
                onChange={(e) => setCustomInTime(e.target.value)}
              />
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem', display: 'block' }}>
                Check-In Note
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional check-in remark..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem', display: 'block' }}>
                Check-Out Time (Optional)
              </label>
              <input
                type="time"
                className="form-input"
                value={customOutTime}
                onChange={(e) => setCustomOutTime(e.target.value)}
              />
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem', display: 'block' }}>
                Check-Out Note
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional check-out remark..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          {!activePunch ? (
            <button onClick={handleCheckIn} className="btn btn-primary" style={{ flex: 1, padding: '0.85rem' }}>
              CHECK IN
            </button>
          ) : (
            <button onClick={handleCheckOut} className="btn btn-danger" style={{ flex: 1, padding: '0.85rem' }}>
              CHECK OUT & CALCULATE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
