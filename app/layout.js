import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';

const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

export const metadata = {
  title: isMaintenanceMode ? 'PerformanceHub — Coming Soon' : 'PerformanceHub',
  description: isMaintenanceMode
    ? 'Something great is on its way.'
    : 'Employee performance management dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        {isMaintenanceMode ? children : <SessionWrapper>{children}</SessionWrapper>}
      </body>
    </html>
  );
}
