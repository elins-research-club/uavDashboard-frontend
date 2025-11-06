// app/log/page.js
'use client';
import DashboardLayout from '../../components/DashboardLayout';
import { useUserRole } from '../../context/UserRoleContext';

export default function LogPage() {
  const { userRole } = useUserRole();
  if (!userRole || userRole === 'guest') return null; // Protect route

  return (
    <DashboardLayout>
      <div style={{ padding: '20px' }}>
        <h2>Log</h2>
        <p>This is the log page, accessible by Admins.</p>
      </div>
    </DashboardLayout>
  );
}