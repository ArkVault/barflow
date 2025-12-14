import { NextRequest, NextResponse } from 'next/server';

// Email address to receive quote requests
// TODO: Replace with actual email when ready
const QUOTE_EMAIL = 'ventas@barflow.mx';

export async function POST(request: NextRequest) {
     try {
          const body = await request.json();
          const { name, email, phone, businessName, branches, message } = body;

          // Validate required fields
          if (!name || !email || !phone || !branches) {
               return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
               );
          }

          // For now, we'll log the quote request
          // In production, integrate with an email service like Resend, SendGrid, etc.
          console.log('=== NEW QUOTE REQUEST ===');
          console.log('Name:', name);
          console.log('Email:', email);
          console.log('Phone:', phone);
          console.log('Business:', businessName);
          console.log('Branches:', branches);
          console.log('Message:', message);
          console.log('Timestamp:', new Date().toISOString());
          console.log('========================');

          // TODO: Implement actual email sending
          // Example with Resend:
          /*
          const { Resend } = require('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          await resend.emails.send({
            from: 'Barflow <noreply@barflow.mx>',
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
              <p><em>Enviado desde Barflow el ${new Date().toLocaleDateString('es-MX')}</em></p>
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
