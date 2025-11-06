// app/page.js
'use client';

import { useUserRole } from '../context/UserRoleContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { userRole, loginAs } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (userRole !== 'guest' && userRole !== null) {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  const handleLogin = (role, tier = null) => {
    let name;
    switch(role) {
      case 'admin': name = 'ADMIN'; break;
      case 'member': name = 'Member'; break;
      case 'user': name = 'User'; break;
      default: name = 'GUEST';
    }
    loginAs(role, name, tier);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      gap: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Select Your Role</h1>
      <button
        onClick={() => handleLogin('admin')}
        style={{ padding: '10px 20px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#ffd700', border: 'none', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
      >
        Login as Admin
      </button>
      <button
        onClick={() => handleLogin('member', 'bronze')}
        style={{ padding: '10px 20px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#ffd700', border: 'none', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
      >
        Login as Bronze Member
      </button>
      <button
        onClick={() => handleLogin('member', 'silver')}
        style={{ padding: '10px 20px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#ffd700', border: 'none', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
      >
        Login as Silver Member
      </button>
      <button
        onClick={() => handleLogin('member', 'gold')}
        style={{ padding: '10px 20px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#ffd700', border: 'none', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
      >
        Login as Gold Member
      </button>
      <button
        onClick={() => handleLogin('user')}
        style={{ padding: '10px 20px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#ffd700', border: 'none', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
      >
        Login as User
      </button>
    </div>
  );
}