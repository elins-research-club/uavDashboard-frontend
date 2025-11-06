// components/Sidebar.js
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserRole } from '../context/UserRoleContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { userRole, userName, memberTier, logout } = useUserRole();

  const getNavItems = (role) => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Contact', href: '/contact' },
          { name: 'Upload File', href: '/upload' },
          { name: 'Log', href: '/log' },
        ];
      case 'member':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Contact', href: '/contact' },
          { name: 'Status', href: '/status' },
        ];
      case 'user':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Contact', href: '/contact' },
          { name: 'Fitur & Harga', href: '/features-pricing' },
        ];
      default: // guest or no role
        return [];
    }
  };

  const navItems = getNavItems(userRole);

  return (
    <aside className="sidebar">
      <div>
        {/* Top section: Name, Username, Role/Tier */}
        <div className="sidebar-profile">
          <h3>NAMA</h3>
          <p>USERNAME</p>
          <p>{userName}</p>
          {userRole === 'member' && memberTier && (
            <p>Tier: {memberTier.charAt(0).toUpperCase() + memberTier.slice(1)}</p>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a href="#" onClick={logout}>
                Logout
              </a>
            </li>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={pathname === item.href ? 'active' : ''}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Bottom Navigation */}
      <ul className="sidebar-bottom">
        <li>
          <Link href="/subscription">Subscription</Link>
        </li>
        <li>
          <Link href="/settings">Settings</Link>
        </li>
        <li>
          <Link href="/help">Help</Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;