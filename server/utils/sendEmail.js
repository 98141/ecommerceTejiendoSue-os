// utils/sendEmail.js
const { Resend } = require('resend');
const resend = new Resend((process.env.RESEND_API_KEY || '').trim());
const isProd = process.env.NODE_ENV === 'production';

async function sendEmail({ to, subject, html, from }) {
  const fromAddress = from || process.env.EMAIL_FROM || 'Tejiendo Sueños <onboarding@resend.dev>';
  const effectiveTo = isProd ? to : (process.env.TEST_RECIPIENT || 'tejiendos128@gmail.com');

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: effectiveTo,
    subject,
    html,
  });

  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error(error.message || 'Error enviando email con Resend');
  }
  console.log('📧 Email enviado (Resend id):', data?.id, '→', effectiveTo);
  return data;
}

exports.sendVerificationEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await sendEmail({
    to,
    subject: 'Verifica tu cuenta - Tejiendo Sueños',
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h3>Bienvenido a Tejiendo Sueños</h3>
        <p>Para activar tu cuenta, haz clic en:</p>
        <p><a href="${link}" target="_blank" style="color:#3b82f6; text-decoration:none; font-weight:bold;">Verificar correo</a></p>
        <p>Si no creaste esta cuenta, ignora este correo.</p>
      </div>
    `,
  });
};

exports.sendResetEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendEmail({
    to,
    subject: 'Restablecer contraseña - Tejiendo Sueños',
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h3>¿Olvidaste tu contraseña?</h3>
        <p>Haz clic para establecer una nueva:</p>
        <p><a href="${link}" target="_blank" style="color:#3b82f6; text-decoration:none; font-weight:bold;">Restablecer contraseña</a></p>
        <p>Este enlace expirará en 15 minutos.</p>
      </div>
    `,
  });
};
