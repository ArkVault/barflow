import { NextResponse } from 'next/server';

/**
 * DEPRECATED: This route is a duplicate.
 * The canonical Stripe webhook handler is at /api/stripe/webhook.
 * Configure your Stripe dashboard to point to /api/stripe/webhook instead.
 */
export async function POST() {
     return NextResponse.json(
          { error: 'This webhook endpoint is deprecated. Use /api/stripe/webhook instead.' },
          { status: 410 }
     );
}
