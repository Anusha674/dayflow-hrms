import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initStorage,
  getUsers,
  findUserByEmail,
  findUserByIdentifier,
  createUser,
  getCurrentUserSession,
  setCurrentUserSession,
  clearCurrentUserSession,
  updateUserProfile as updateStorageProfile
} from '../db/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [viewAsUser, setViewAsUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    initStorage();
    const session = getCurrentUserSession();
    if (session) {
      setCurrentUser(session);
    }
    setUsersList(getUsers());
    setLoading(false);
  }, []);

  const login = (identifier, password) => {
    const user = findUserByIdentifier(identifier);
    if (!user) {
      throw new Error('No user found with this email, name, or Employee ID.');
    }
    if (user.password !== password) {
      throw new Error('Invalid password. Please check your credentials.');
    }
    setCurrentUser(user);
    setCurrentUserSession(user);
    setViewAsUser(null);
    return user;
  };

  const register = (userData) => {
    const existing = findUserByEmail(userData.email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
    const newUser = createUser(userData);
    setCurrentUser(newUser);
    setCurrentUserSession(newUser);
    setViewAsUser(null);
    setUsersList(getUsers());
    return newUser;
  };

  const logout = () => {
    setCurrentUser(null);
    setViewAsUser(null);
    clearCurrentUserSession();
  };

  const updateProfile = (updatedFields) => {
    if (!currentUser) return;
    const updated = updateStorageProfile(currentUser.id, updatedFields);
    if (updated) {
      setCurrentUser(updated);
      setUsersList(getUsers());
    }
    return updated;
  };

  const refreshUsers = () => {
    setUsersList(getUsers());
  };

  // Admin feature: Switch view to inspect app as another employee
  const switchViewAs = (targetUser) => {
    if (currentUser?.role === 'ADMIN') {
      setViewAsUser(targetUser);
    }
  };

  const activeUser = viewAsUser || currentUser;
  const isViewingAsAnother = Boolean(viewAsUser && viewAsUser.id !== currentUser?.id);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeUser,
        isViewingAsAnother,
        viewAsUser,
        switchViewAs,
        login,
        register,
        logout,
        updateProfile,
        loading,
        refreshUsers,
        allUsers: usersList
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
