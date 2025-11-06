// app/layout.js
import './globals.css';
import { UserRoleProvider } from '../context/UserRoleContext'; // Adjust path if needed

export const metadata = {
  title: 'UAV Dashboard',
  description: 'Dashboard for UAV management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserRoleProvider>
          {children}
        </UserRoleProvider>
      </body>
    </html>
  );
}