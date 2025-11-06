// app/dashboard/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '../../context/UserRoleContext';
import DashboardLayout from '../../components/DashboardLayout';

export default function DashboardPage() {
  const { userRole } = useUserRole();
  const router = useRouter();

  // Redirect to home if no role is set
  useEffect(() => {
    if (!userRole || userRole === 'guest') {
      router.push('/');
    }
  }, [userRole, router]);

  if (!userRole || userRole === 'guest') {
    return null; // or a loading spinner
  }

  return (
    <DashboardLayout roleName={userRole.toUpperCase()}>
      {/* Specific content for dashboard if needed, or just rely on layout */}
    </DashboardLayout>
  );
}