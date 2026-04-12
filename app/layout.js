import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';

export const metadata = {
  title: 'PerformanceHub',
  description: 'Employee performance management dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
