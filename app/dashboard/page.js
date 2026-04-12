import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import App from '@/components/App';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect('/');
  }
  return <App user={session.user} />;
}
