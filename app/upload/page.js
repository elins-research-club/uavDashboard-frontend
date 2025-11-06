// app/upload/page.js
'use client';
import DashboardLayout from '../../components/DashboardLayout';
import { useUserRole } from '../../context/UserRoleContext';

export default function UploadPage() {
  const { userRole } = useUserRole();
  if (!userRole || userRole === 'guest') return null; // Protect route

  return (
    <DashboardLayout>
      <div style={{ padding: '20px' }}>
        <h2>Upload File</h2>
        <p>This is the file upload page, accessible by Admins.</p>
      </div>
    </DashboardLayout>
  );
}