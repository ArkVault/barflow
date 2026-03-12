import { NextResponse } from 'next/server';

/**
 * DEPRECATED: This route is a duplicate.
 * The canonical Stripe checkout handler is at /api/stripe/create-checkout-session.
 * Update any client calls to use that path instead.
 */
export async function POST() {
     return NextResponse.json(
          { error: 'This endpoint is deprecated. Use /api/stripe/create-checkout-session instead.' },
          { status: 410 }
     );
}
