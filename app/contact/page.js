// app/contact/page.js
'use client';
import DashboardLayout from '../../components/DashboardLayout';
import { useUserRole } from '../../context/UserRoleContext';

export default function ContactPage() {
  const { userRole } = useUserRole();
  if (!userRole || userRole === 'guest') return null; // Protect route

  return (
    <DashboardLayout>
      <div style={{ padding: '20px' }}>
        <h2>Contact Us</h2>
        <p>This is the contact page.</p>
      </div>
    </DashboardLayout>
  );
}