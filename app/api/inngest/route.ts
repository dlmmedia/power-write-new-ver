import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { functions } from '@/lib/inngest/functions';

// Create and export the Inngest serve handler
// This endpoint handles all Inngest function invocations
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});











