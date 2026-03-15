import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — email sending is disabled');
    return null;
  }
  if (!_resend) {
    _resend = new Resend(apiKey);
  }
  return _resend;
}

const FROM_ADDRESS = 'Flowstock <noreply@barflow.mx>';

// ─── Quote Request Notification ───────────────────────────────────────────────

interface QuoteEmailData {
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  branches: string | number;
  message?: string;
}

export async function sendQuoteNotification(
  to: string,
  data: QuoteEmailData
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject: `Nueva Solicitud de Cotización — ${data.businessName || data.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Nueva Solicitud de Cotización — Plan Cadena</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; font-weight: 600; color: #555;">Nombre</td><td style="padding: 8px 0;">${data.name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #555;">Email</td><td style="padding: 8px 0;">${data.email}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #555;">Teléfono</td><td style="padding: 8px 0;">${data.phone}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #555;">Negocio</td><td style="padding: 8px 0;">${data.businessName || 'No especificado'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #555;">Sucursales</td><td style="padding: 8px 0;">${data.branches}</td></tr>
            ${data.message ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #555;">Mensaje</td><td style="padding: 8px 0;">${data.message}</td></tr>` : ''}
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="font-size: 12px; color: #999;">Enviado desde Flowstock el ${new Date().toLocaleDateString('es-MX')}</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send quote notification email:', error);
    return false;
  }
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject: 'Bienvenido a Flowstock 🎉',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">¡Bienvenido a Flowstock!</h1>
          <p>Hola ${userName},</p>
          <p>Tu cuenta ha sido creada exitosamente. Tienes <strong>30 días de prueba gratuita</strong> para explorar todas las funcionalidades:</p>
          <ul style="line-height: 1.8;">
            <li>📊 Control de inventario en tiempo real</li>
            <li>🍹 Punto de venta inteligente</li>
            <li>📈 Proyecciones con IA</li>
            <li>📋 Importación automática de menús</li>
          </ul>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://flowstock-686958505968.us-central1.run.app'}/dashboard"
               style="background: #1a1a2e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Ir al Dashboard
            </a>
          </div>
          <p style="color: #666;">¿Tienes preguntas? Responde a este correo o escríbenos a soporte@barflow.mx</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="font-size: 12px; color: #999;">Flowstock — Gestión inteligente de bares</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// ─── Trial Ending Soon Email ──────────────────────────────────────────────────

export async function sendTrialEndingEmail(
  to: string,
  userName: string,
  daysLeft: number
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject: `Tu prueba gratuita termina en ${daysLeft} días`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Tu prueba gratuita termina pronto</h2>
          <p>Hola ${userName},</p>
          <p>Tu periodo de prueba en Flowstock termina en <strong>${daysLeft} días</strong>.</p>
          <p>Para seguir utilizando todas las funcionalidades sin interrupción, elige un plan que se adapte a tu negocio:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Bar Sucursal</strong><br><span style="color: #666;">$899 MXN/mes</span></td>
              <td style="padding: 12px; border: 1px solid #eee;">Ideal para 1 ubicación</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Bar Anual</strong><br><span style="color: #666;">$700 MXN/mes</span></td>
              <td style="padding: 12px; border: 1px solid #eee;">Ahorra $2,388/año</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Cadena</strong><br><span style="color: #666;">$2,999 MXN/mes</span></td>
              <td style="padding: 12px; border: 1px solid #eee;">Hasta 5 sucursales</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://flowstock-686958505968.us-central1.run.app'}/dashboard"
               style="background: #1a1a2e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Elegir Plan
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="font-size: 12px; color: #999;">Flowstock — Gestión inteligente de bares</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send trial ending email:', error);
    return false;
  }
}

// ─── Subscription Confirmed Email ─────────────────────────────────────────────

export async function sendSubscriptionConfirmedEmail(
  to: string,
  userName: string,
  planName: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject: '¡Tu suscripción está activa! ✅',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">¡Suscripción activada!</h2>
          <p>Hola ${userName},</p>
          <p>Tu plan <strong>${planName}</strong> está ahora activo. Tienes acceso completo a todas las funcionalidades de Flowstock.</p>
          <p>Tu factura se encuentra disponible en tu <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://flowstock-686958505968.us-central1.run.app'}/dashboard/cuenta">panel de cuenta</a>.</p>
          <p style="color: #666;">¡Gracias por confiar en Flowstock!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="font-size: 12px; color: #999;">Flowstock — Gestión inteligente de bares</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send subscription confirmed email:', error);
    return false;
  }
}

// ─── Payment Failed Email ─────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(
  to: string,
  userName: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject: '⚠️ Problema con tu pago',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Problema con tu pago</h2>
          <p>Hola ${userName},</p>
          <p>No pudimos procesar tu último pago. Para evitar una interrupción del servicio, por favor actualiza tu método de pago.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://flowstock-686958505968.us-central1.run.app'}/dashboard/cuenta"
               style="background: #e74c3c; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Actualizar Pago
            </a>
          </div>
          <p style="color: #666;">Si necesitas ayuda, responde a este correo.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="font-size: 12px; color: #999;">Flowstock — Gestión inteligente de bares</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    return false;
  }
}
