import ComingSoon from '@/components/ComingSoon';
import LandingPageClient from '@/components/LandingPageClient';

const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

export default function Page() {
  if (isMaintenanceMode) {
    return <ComingSoon />;
  }

  return <LandingPageClient />;
}
