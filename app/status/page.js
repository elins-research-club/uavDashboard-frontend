// app/status/page.js
'use client';
import DashboardLayout from '../../components/DashboardLayout';
import { useUserRole } from '../../context/UserRoleContext';

export default function StatusPage() {
  const { userRole } = useUserRole();
  if (!userRole || userRole === 'guest') return null; // Protect route

  return (
    <DashboardLayout>
      <div style={{ padding: '20px' }}>
        <h2>Status</h2>
        <p>This is the status page, accessible by Members.</p>
      </div>
    </DashboardLayout>
  );
}