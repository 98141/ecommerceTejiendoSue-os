// scripts/test-email.js
require('dotenv').config({ override: true });
const { Resend } = require('resend');

function mask(k) {
  if (!k) return '(undefined)';
  const t = k.trim();
  return t.slice(0, 4) + '...' + t.slice(-4);
}

(async () => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = process.env.EMAIL_FROM || 'Tejiendo Sueños <onboarding@resend.dev>';
  const to = (process.env.TEST_RECIPIENT || '').trim(); // 👈 forzado al permitido

  console.log('[DEBUG] RESEND_API_KEY:', mask(apiKey));
  console.log('[DEBUG] FROM:', from);
  console.log('[DEBUG] TO:', to);

  if (!apiKey.startsWith('re_')) {
    console.error('❌ RESEND_API_KEY inválida o no cargada.');
    process.exit(1);
  }
  if (!to) {
    console.error('❌ TEST_RECIPIENT vacío. Ponlo en .env.');
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to, // 👈 debe ser tejiendos128@gmail.com en modo onboarding
    subject: 'Prueba Resend (development)',
    html: '<strong>Hola!</strong> Prueba con Resend usando onboarding.',
  });

  if (error) {
    console.error('❌ Resend error:', error);
    process.exit(1);
  }

  console.log('✅ Enviado:', data);
  process.exit(0);
})();
