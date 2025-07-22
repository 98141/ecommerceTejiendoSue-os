const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía un correo de verificación al usuario.
 */
exports.sendVerificationEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email/${token}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Verifica tu cuenta - Tejiendo Sueños",
      html: `
        <h3>Bienvenido a Tejiendo Sueños</h3>
        <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
        <a href="${link}" target="_blank" style="color: #3b82f6; text-decoration: none;">Verificar correo</a>
        <p>Si no creaste esta cuenta, ignora este correo.</p>
      `,
    });
    console.log(`📧 Correo de verificación enviado a ${to}`);
  } catch (err) {
    console.error(`❌ Error al enviar correo a ${to}:`, err.message);
  }
};

exports.sendResetEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: `"Tejiendo Sueños" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Restablecer contraseña",
    html: `
      <h3>¿Olvidaste tu contraseña?</h3>
      <p>Haz clic en el siguiente enlace para establecer una nueva:</p>
      <a href="${link}">Restablecer contraseña</a>
      <p>Este enlace expirará en 15 minutos.</p>
    `,
  });
};
