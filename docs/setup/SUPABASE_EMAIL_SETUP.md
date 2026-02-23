# Configuración de Email Templates en Supabase

Este documento explica cómo configurar los templates de email en Supabase para el sistema de autenticación de BarFlow.

## 1. Acceder a la configuración de Email Templates

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Navega a **Authentication** → **Email Templates**

## 2. Configurar el Email de Confirmación

### Template: "Confirm signup"

Reemplaza el contenido con el siguiente HTML personalizado:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a BarFlow</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🍸 BarFlow</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema Inteligente de Gestión</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">¡Bienvenido a BarFlow! 🎉</h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Estamos emocionados de tenerte con nosotros. Has dado el primer paso para optimizar la gestión de tu bar con tecnología de punta.
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Para comenzar, por favor confirma tu dirección de correo electrónico haciendo clic en el botón de abajo:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      Confirmar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                O copia y pega este enlace en tu navegador:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
              
              <!-- Trial Info Box -->
              <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 18px;">✨ Tu período de prueba gratuito</h3>
                <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.6;">
                  Tienes <strong>30 días gratis</strong> para explorar todas las funcionalidades de BarFlow:
                </p>
                <ul style="color: #4a5568; margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                  <li>Gestión completa de inventario</li>
                  <li>Análisis de ventas en tiempo real</li>
                  <li>Proyecciones con IA</li>
                  <li>Gestión de menús ilimitados</li>
                  <li>Soporte prioritario</li>
                </ul>
              </div>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                © 2024 BarFlow. Todos los derechos reservados.
              </p>
              <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                Este email fue enviado a {{ .Email }}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## 3. Configurar el Email de Recuperación de Contraseña

### Template: "Reset Password"

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Contraseña - BarFlow</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🍸 BarFlow</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Recuperar Contraseña</h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Si no solicitaste este cambio, puedes ignorar este email de forma segura.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 14px; margin: 0;">
                © 2024 BarFlow. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## 4. Configurar la URL de Redirección

En **Authentication** → **URL Configuration**, configura:

- **Site URL**: `http://localhost:3000` (desarrollo) o tu dominio en producción
- **Redirect URLs**: Agrega las siguientes URLs:
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/dashboard`
  - Tu dominio de producción cuando lo tengas

## 5. Habilitar Email Confirmations

En **Authentication** → **Settings**:

1. Marca la opción **"Enable email confirmations"**
2. Asegúrate de que **"Confirm email"** esté habilitado

## 6. Configurar SMTP (Opcional pero Recomendado)

Para producción, configura tu propio servidor SMTP:

1. Ve a **Project Settings** → **Auth**
2. En la sección **SMTP Settings**, configura:
   - **Sender email**: tu email (ej: `noreply@tudominio.com`)
   - **Sender name**: `BarFlow`
   - **Host**: servidor SMTP (ej: `smtp.gmail.com`)
   - **Port**: `587` (TLS) o `465` (SSL)
   - **Username**: tu email
   - **Password**: contraseña de aplicación

### Proveedores SMTP Recomendados:
- **SendGrid**: Hasta 100 emails/día gratis
- **Mailgun**: Hasta 5,000 emails/mes gratis
- **Amazon SES**: Muy económico para volúmenes altos
- **Resend**: Moderno y fácil de usar

## 7. Probar el Sistema

1. Registra una nueva cuenta
2. Verifica que recibas el email de confirmación
3. Haz clic en el enlace de confirmación
4. Verifica que seas redirigido al dashboard

## Notas Importantes

- Los emails de Supabase pueden tardar unos minutos en llegar
- Revisa la carpeta de spam si no recibes el email
- En desarrollo, puedes ver los emails en los logs de Supabase
- Para producción, es altamente recomendado usar tu propio SMTP

## Soporte

Si tienes problemas con la configuración de emails, consulta:
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
