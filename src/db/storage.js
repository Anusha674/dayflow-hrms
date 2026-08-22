import {
  INITIAL_USERS,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PAYROLL,
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS
} from './seedData';

const KEYS = {
  USERS: 'dayflow_users',
  ATTENDANCE: 'dayflow_attendance',
  LEAVE: 'dayflow_leave_requests',
  PAYROLL: 'dayflow_payroll',
  DOCUMENTS: 'dayflow_documents',
  NOTIFICATIONS: 'dayflow_notifications',
  ACTIVE_PUNCH: 'dayflow_active_punch_',
  CURRENT_USER: 'dayflow_current_user'
};

const getItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const initStorage = () => {
  if (!localStorage.getItem(KEYS.USERS)) {
    setItem(KEYS.USERS, INITIAL_USERS);
  } else {
    // Migration: Clean up any dummy phone numbers or addresses saved on older test accounts
    const users = getItem(KEYS.USERS, []);
    let changed = false;
    const migratedUsers = users.map((u) => {
      let userChanged = false;
      let newPhone = u.phone;
      let newAddress = u.address;

      if (u.id !== 'usr_admin') {
        if (u.phone === '+1 (555) 100-2000') {
          newPhone = '';
          userChanged = true;
        }
        if (u.address === 'Standard Corporate Address') {
          newAddress = '';
          userChanged = true;
        }
      }

      if (userChanged) {
        changed = true;
        return { ...u, phone: newPhone, address: newAddress };
      }
      return u;
    });

    if (changed) {
      setItem(KEYS.USERS, migratedUsers);
      const session = getCurrentUserSession();
      if (session && session.id !== 'usr_admin') {
        const updatedSession = migratedUsers.find((u) => u.id === session.id);
        if (updatedSession) {
          setCurrentUserSession(updatedSession);
        }
      }
    }
  }
  if (!localStorage.getItem(KEYS.ATTENDANCE)) {
    setItem(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }
  if (!localStorage.getItem(KEYS.LEAVE)) {
    setItem(KEYS.LEAVE, INITIAL_LEAVE_REQUESTS);
  }
  if (!localStorage.getItem(KEYS.PAYROLL)) {
    setItem(KEYS.PAYROLL, INITIAL_PAYROLL);
  } else {
    // Migration: Update any payroll item that has paymentStatus === 'ACTIVE' to 'PAID'
    const payrolls = getItem(KEYS.PAYROLL, []);
    let payrollChanged = false;
    const migratedPayrolls = payrolls.map((p) => {
      if (p.paymentStatus === 'ACTIVE') {
        payrollChanged = true;
        return { ...p, paymentStatus: 'PAID' };
      }
      return p;
    });
    if (payrollChanged) {
      setItem(KEYS.PAYROLL, migratedPayrolls);
    }
  }
  if (!localStorage.getItem(KEYS.DOCUMENTS)) {
    setItem(KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    setItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
};

export const resetStorageToDefaults = () => {
  setItem(KEYS.USERS, INITIAL_USERS);
  setItem(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  setItem(KEYS.LEAVE, INITIAL_LEAVE_REQUESTS);
  setItem(KEYS.PAYROLL, INITIAL_PAYROLL);
  setItem(KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  setItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
};

// === USERS & AUTH ===
export const getUsers = () => getItem(KEYS.USERS, []);

export const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
};

export const findUserByIdentifier = (identifier) => {
  const users = getUsers();
  const lower = identifier.toLowerCase();
  return users.find(
    (u) =>
      u.email.toLowerCase() === lower ||
      u.employeeId.toLowerCase() === lower ||
      u.name.toLowerCase() === lower
  );
};

export const findUserById = (id) => {
  const users = getUsers();
  return users.find((u) => u.id === id);
};

export const createUser = (userData) => {
  const users = getUsers();
  const newUser = {
    id: `usr_${Date.now()}`,
    dateOfJoining: new Date().toISOString().split('T')[0],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
    ...userData
  };
  users.push(newUser);
  setItem(KEYS.USERS, users);

  const payrolls = getItem(KEYS.PAYROLL, []);
  payrolls.push({
    id: `pay_${newUser.id}`,
    userId: newUser.id,
    basicSalary: 5000,
    hra: 2000,
    specialAllowance: 1000,
    pfDeduction: 600,
    taxDeduction: 400,
    grossSalary: 8000,
    netSalary: 7000,
    payPeriod: 'Current Month',
    paymentStatus: 'PAID'
  });
  setItem(KEYS.PAYROLL, payrolls);

  return newUser;
};

export const updateUserProfile = (userId, updatedData) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedData };
    setItem(KEYS.USERS, users);

    const currentUser = getCurrentUserSession();
    if (currentUser && currentUser.id === userId) {
      setCurrentUserSession(users[index]);
    }
    return users[index];
  }
  return null;
};

export const getCurrentUserSession = () => getItem(KEYS.CURRENT_USER, null);
export const setCurrentUserSession = (user) => setItem(KEYS.CURRENT_USER, user);
export const clearCurrentUserSession = () => localStorage.removeItem(KEYS.CURRENT_USER);

// === ATTENDANCE TIME-BASED CALCULATION API ===
export const getAttendance = () => getItem(KEYS.ATTENDANCE, []);

export const getUserAttendance = (userId) => {
  const all = getAttendance();
  return all.filter((a) => a.userId === userId);
};

export const getActivePunch = (userId) => {
  return getItem(`${KEYS.ACTIVE_PUNCH}${userId}`, null);
};

// Calculate exact time difference string (e.g. "8h 43m") from two ISO timestamps or time strings
export const calculateWorkDuration = (checkInIso, checkOutIso) => {
  try {
    const start = new Date(checkInIso).getTime();
    const end = new Date(checkOutIso).getTime();
    const diffMs = Math.max(0, end - start);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  } catch (e) {
    return '0h 0m';
  }
};

export const checkInUser = (userId, customTime = null, notes = '') => {
  const now = customTime ? new Date(customTime) : new Date();
  const activePunch = {
    checkInTime: now.toISOString(),
    displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: now.toISOString().split('T')[0],
    notes
  };
  setItem(`${KEYS.ACTIVE_PUNCH}${userId}`, activePunch);
  window.dispatchEvent(new Event('dayflow_punch_update'));
  return activePunch;
};

export const checkOutUser = (userId, customOutTime = null, notes = '') => {
  const activePunch = getActivePunch(userId);
  const now = customOutTime ? new Date(customOutTime) : new Date();
  const checkOutDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const checkOutIso = now.toISOString();

  let checkInDisplay = '09:00 AM';
  let checkInIso = new Date().toISOString();
  let workHours = '8h 0m';

  if (activePunch) {
    checkInDisplay = activePunch.displayTime;
    checkInIso = activePunch.checkInTime;
    workHours = calculateWorkDuration(checkInIso, checkOutIso);
  }

  // Calculate status based on work hours duration
  const start = new Date(checkInIso).getTime();
  const end = new Date(checkOutIso).getTime();
  const hoursDecimal = (end - start) / (1000 * 60 * 60);

  let status = 'PRESENT';
  // For demo/testing: any punch under 2 minutes (0.033 hrs) is treated as a test punch and marked as PRESENT.
  // Real working sessions between 2 minutes and 4 hours are marked as HALF_DAY.
  if (hoursDecimal > 0.033 && hoursDecimal < 4) {
    status = 'HALF_DAY';
  }

  const newRecord = {
    id: `att_${Date.now()}`,
    userId,
    date: activePunch ? activePunch.date : now.toISOString().split('T')[0],
    checkIn: checkInDisplay,
    checkOut: checkOutDisplay,
    checkInIso,
    checkOutIso,
    workHours,
    status,
    notes: notes || (activePunch ? activePunch.notes : 'Punch completed.')
  };

  const attendanceList = getAttendance();
  attendanceList.unshift(newRecord);
  setItem(KEYS.ATTENDANCE, attendanceList);

  localStorage.removeItem(`${KEYS.ACTIVE_PUNCH}${userId}`);
  window.dispatchEvent(new Event('dayflow_punch_update'));
  return newRecord;
};

// === LEAVE API ===
export const getLeaveRequests = () => getItem(KEYS.LEAVE, []);

export const getUserLeaveRequests = (userId) => {
  const all = getLeaveRequests();
  return all.filter((l) => l.userId === userId);
};

export const applyLeaveRequest = (leaveData) => {
  const requests = getLeaveRequests();
  const newLeave = {
    id: `lv_${Date.now()}`,
    status: 'PENDING',
    adminComment: '',
    createdAt: new Date().toISOString(),
    ...leaveData
  };
  requests.unshift(newLeave);
  setItem(KEYS.LEAVE, requests);

  addNotification({
    userId: 'usr_admin',
    title: 'New Leave Request',
    message: `${leaveData.userName || 'An employee'} submitted a ${leaveData.leaveType} request (${leaveData.daysCount} days).`,
    type: 'action'
  });

  return newLeave;
};

export const updateLeaveStatus = (leaveId, status, adminComment = '') => {
  const requests = getLeaveRequests();
  const index = requests.findIndex((l) => l.id === leaveId);
  if (index !== -1) {
    requests[index].status = status;
    requests[index].adminComment = adminComment;
    setItem(KEYS.LEAVE, requests);

    const targetLeave = requests[index];
    addNotification({
      userId: targetLeave.userId,
      title: `Leave Request ${status}`,
      message: `Your ${targetLeave.leaveType} request (${targetLeave.startDate} to ${targetLeave.endDate}) was ${status.toLowerCase()}.${adminComment ? ` HR Note: ${adminComment}` : ''}`,
      type: status === 'APPROVED' ? 'success' : 'error'
    });

    return requests[index];
  }
  return null;
};

// === PAYROLL API ===
export const getPayrollList = () => getItem(KEYS.PAYROLL, []);

export const getUserPayroll = (userId) => {
  const payrolls = getPayrollList();
  return payrolls.find((p) => p.userId === userId) || {
    userId,
    basicSalary: 5000,
    hra: 2000,
    specialAllowance: 1000,
    pfDeduction: 600,
    taxDeduction: 400,
    grossSalary: 8000,
    netSalary: 7000,
    payPeriod: 'August 2026',
    paymentStatus: 'PAID'
  };
};

export const updateUserPayroll = (userId, payrollData) => {
  const payrolls = getPayrollList();
  const index = payrolls.findIndex((p) => p.userId === userId);

  const basic = Number(payrollData.basicSalary) || 0;
  const hra = Number(payrollData.hra) || 0;
  const allowance = Number(payrollData.specialAllowance) || 0;
  const pf = Number(payrollData.pfDeduction) || 0;
  const tax = Number(payrollData.taxDeduction) || 0;

  const grossSalary = basic + hra + allowance;
  const netSalary = grossSalary - (pf + tax);

  const updatedRecord = {
    id: index !== -1 ? payrolls[index].id : `pay_${userId}`,
    userId,
    basicSalary: basic,
    hra,
    specialAllowance: allowance,
    pfDeduction: pf,
    taxDeduction: tax,
    grossSalary,
    netSalary,
    payPeriod: payrollData.payPeriod || 'August 2026',
    paymentStatus: payrollData.paymentStatus || 'PAID'
  };

  if (index !== -1) {
    payrolls[index] = updatedRecord;
  } else {
    payrolls.push(updatedRecord);
  }

  setItem(KEYS.PAYROLL, payrolls);
  return updatedRecord;
};

// === DOCUMENTS API ===
export const getDocuments = () => getItem(KEYS.DOCUMENTS, []);

export const getUserDocuments = (userId) => {
  const docs = getDocuments();
  return docs.filter((d) => d.userId === userId);
};

export const uploadDocument = (docData) => {
  const docs = getDocuments();
  const newDoc = {
    id: `doc_${Date.now()}`,
    uploadedAt: new Date().toISOString().split('T')[0],
    ...docData
  };
  docs.unshift(newDoc);
  setItem(KEYS.DOCUMENTS, docs);
  return newDoc;
};

export const deleteDocument = (docId) => {
  const docs = getDocuments().filter((d) => d.id !== docId);
  setItem(KEYS.DOCUMENTS, docs);
};

// === NOTIFICATIONS API ===
export const getNotifications = () => getItem(KEYS.NOTIFICATIONS, []);

export const getUserNotifications = (userId) => {
  const all = getNotifications();
  return all.filter((n) => n.userId === userId || n.userId === 'ALL');
};

export const addNotification = (notifData) => {
  const notifs = getNotifications();
  const newNotif = {
    id: `notif_${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notifData
  };
  notifs.unshift(newNotif);
  setItem(KEYS.NOTIFICATIONS, notifs);
  return newNotif;
};

export const markNotificationRead = (notifId) => {
  const notifs = getNotifications();
  const index = notifs.findIndex((n) => n.id === notifId);
  if (index !== -1) {
    notifs[index].read = true;
    setItem(KEYS.NOTIFICATIONS, notifs);
  }
};

export const markAllNotificationsRead = (userId) => {
  const notifs = getNotifications();
  const updated = notifs.map((n) => {
    if (n.userId === userId || n.userId === 'ALL') {
      return { ...n, read: true };
    }
    return n;
  });
  setItem(KEYS.NOTIFICATIONS, updated);
};
