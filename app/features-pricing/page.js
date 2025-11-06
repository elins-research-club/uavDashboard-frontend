// app/features-pricing/page.js
'use client';
import DashboardLayout from '../../components/DashboardLayout';
import { useUserRole } from '../../context/UserRoleContext';

export default function FeaturesPricingPage() {
  const { userRole } = useUserRole();
  if (!userRole || userRole === 'guest') return null; // Protect route

  return (
    <DashboardLayout>
      <div style={{ padding: '20px' }}>
        <h2>Fitur & Harga</h2>
        <p>This is the features and pricing page, accessible by Users.</p>
      </div>
    </DashboardLayout>
  );
}