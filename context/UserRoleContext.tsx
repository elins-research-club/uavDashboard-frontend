'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const UserRoleContext = createContext(null);

export function UserRoleProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const loginAs = (role, name = 'USERNAME', tier = null) => {
    const nextUser = { role, username: name, tier };
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const setAuthenticatedUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('memberTier');
  };

  return (
    <UserRoleContext.Provider
      value={{
        user,
        userRole: user?.role || 'guest',
        userName: user?.username || 'GUEST',
        memberTier: user?.tier || null,
        loginAs,
        setAuthenticatedUser,
        logout,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error('useUserRole must be used within a UserRoleProvider');
  return context;
}
