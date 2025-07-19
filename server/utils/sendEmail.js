const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // o tu proveedor
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await transporter.sendMail({
    from: `"Tejiendo Sueños" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verifica tu cuenta",
    html: `
      <h3>Bienvenido a Tejiendo Sueños</h3>
      <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
      <a href="${link}">Verificar correo</a>
      <p>Este enlace expirará pronto.</p>
    `,
  });
};
