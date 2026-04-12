import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

export default async function Page() {
  const session = await auth();
  if (session) {
    redirect('/dashboard');
  }
  return <LandingPage />;
}
