import './globals.css';

export const metadata = {
  title: 'PerformanceHub',
  description: 'Employee performance management dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
