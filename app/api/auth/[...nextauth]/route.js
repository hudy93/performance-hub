import { handlers } from '@/lib/auth';

// Force Node.js runtime — the pg adapter doesn't work on Edge
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
