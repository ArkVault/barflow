import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, getRequesterIp } from '@/lib/security/rate-limit';
import { QuoteRequestSchema } from '@/lib/dtos/schemas';
import { sendQuoteNotification } from '@/lib/email/resend';

const QUOTE_EMAIL = 'ventas@barflow.mx';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

export async function POST(request: NextRequest) {
     try {
          const requesterIp = getRequesterIp(request.headers);
          const limiter = consumeRateLimit(`quotes:${requesterIp}`, {
               windowMs: RATE_LIMIT_WINDOW_MS,
               maxRequests: RATE_LIMIT_MAX_REQUESTS,
          });
          if (!limiter.allowed) {
               return NextResponse.json(
                    { error: 'Too many requests. Please try again later.' },
                    {
                         status: 429,
                         headers: {
                              'Retry-After': String(Math.ceil((limiter.resetAt - Date.now()) / 1000)),
                         },
                    }
               );
          }

          const body = await request.json();
          const parsed = QuoteRequestSchema.safeParse(body);

          if (!parsed.success) {
               return NextResponse.json(
                    { error: 'Missing or invalid fields', details: parsed.error.flatten().fieldErrors },
                    { status: 400 }
               );
          }

          const { name, email, phone, businessName, branches, message } = parsed.data;

          // Log only minimal metadata to avoid exposing PII in server logs.
          console.log('Quote request received', {
               hasBusinessName: Boolean(businessName),
               branches,
               hasMessage: Boolean(message),
               timestamp: new Date().toISOString(),
          });

          // Send notification email to sales team
          const emailSent = await sendQuoteNotification(QUOTE_EMAIL, {
               name,
               email,
               phone,
               businessName,
               branches,
               message,
          });

          if (!emailSent) {
               console.warn('Quote notification email not sent (RESEND_API_KEY may be missing)');
          }

          return NextResponse.json({
               success: true,
               message: 'Quote request received successfully',
          });

     } catch (error) {
          console.error('Error processing quote request:', error);
          return NextResponse.json(
               { error: 'Failed to process quote request' },
               { status: 500 }
          );
     }
}
