import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, getRequesterIp } from '@/lib/security/rate-limit';

// Email address to receive quote requests
// TODO: Replace with actual email when ready
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
          const { name, email, phone, businessName, branches, message } = body;

          // Validate required fields
          if (!name || !email || !phone || !branches) {
               return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
               );
          }

          // Log only minimal metadata to avoid exposing PII in server logs.
          console.log('Quote request received', {
               hasBusinessName: Boolean(businessName),
               branches,
               hasMessage: Boolean(message),
               timestamp: new Date().toISOString(),
          });

          // TODO: Implement actual email sending
          // Example with Resend:
          /*
          const { Resend } = require('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          await resend.emails.send({
            from: 'Flowstock <noreply@barflow.mx>',
            to: [QUOTE_EMAIL],
            subject: `Nueva Solicitud de Cotización - ${businessName || name}`,
            html: `
              <h2>Nueva Solicitud de Cotización - Plan Cadena</h2>
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Teléfono:</strong> ${phone}</p>
              <p><strong>Negocio:</strong> ${businessName || 'No especificado'}</p>
              <p><strong>Sucursales:</strong> ${branches}</p>
              <p><strong>Mensaje:</strong> ${message || 'Sin mensaje adicional'}</p>
              <hr>
              <p><em>Enviado desde Flowstock el ${new Date().toLocaleDateString('es-MX')}</em></p>
            `,
          });
          */

          // Store in Supabase for tracking (optional)
          // const supabase = await createServerClient();
          // await supabase.from('quote_requests').insert({
          //   name, email, phone, business_name: businessName, branches, message
          // });

          return NextResponse.json({
               success: true,
               message: 'Quote request received successfully'
          });

     } catch (error) {
          console.error('Error processing quote request:', error);
          return NextResponse.json(
               { error: 'Failed to process quote request' },
               { status: 500 }
          );
     }
}
