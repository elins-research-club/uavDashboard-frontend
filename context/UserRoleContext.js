// context/UserRoleContext.js
'use client'; // This component uses client-side features like useState

import React, { createContext, useState, useContext, useEffect } from 'react';

const UserRoleContext = createContext(null);

export function UserRoleProvider({ children }) {
  const [userRole, setUserRole] = useState('guest'); // Default role
  const [userName, setUserName] = useState('GUEST'); // Default name
  const [memberTier, setMemberTier] = useState(null); // Default member tier

  // You might load the user role from local storage or an API here
  useEffect(() => {
    // Example: load from localStorage
    const storedRole = localStorage.getItem('userRole');
    const storedName = localStorage.getItem('userName');
    const storedTier = localStorage.getItem('memberTier');
    if (storedRole) setUserRole(storedRole);
    if (storedName) setUserName(storedName);
    if (storedTier) setMemberTier(storedTier);
  }, []);

  const loginAs = (role, name = 'USERNAME', tier = null) => {
    setUserRole(role);
    setUserName(name);
    setMemberTier(tier);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    if (tier) {
      localStorage.setItem('memberTier', tier);
    } else {
      localStorage.removeItem('memberTier');
    }
  };

  const logout = () => {
    setUserRole('guest');
    setUserName('GUEST');
    setMemberTier(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('memberTier');
  };

  return (
    <UserRoleContext.Provider value={{ userRole, userName, memberTier, loginAs, logout }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}