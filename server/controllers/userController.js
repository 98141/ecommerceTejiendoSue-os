const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { sendVerificationEmail, sendResetEmail } = require("../utils/sendEmail");

// ====== Config por ENV (fallbacks sensatos) ======
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d"; // ← antes 60m
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// ====== Funciones para tokens ======
const createAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN } // ← 1 día por defecto
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN } // ← 7 días por defecto
  );
};

// Util de cookie para refresh (dev/prod)
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd, // ← false en dev (HTTP), true en prod (HTTPS)
    sameSite: "lax", // ← evita bloqueos innecesarios; 'Strict' puede romper flujos
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

// ====== Registro ======
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Correo inválido" });
    }
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        error:
          "Contraseña débil. Usa mínimo 8 caracteres, un número y un símbolo.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Crear el usuario
    const user = await User.create({ name, email, password });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    // ====== Enviar correo de verificación ======
    if (!process.env.JWT_EMAIL_SECRET) {
      console.error("Falta JWT_EMAIL_SECRET en el .env");
    } else {
      try {
        const verifyToken = jwt.sign(
          { id: user._id },
          process.env.JWT_EMAIL_SECRET,
          { expiresIn: "15m" }
        );
        await sendVerificationEmail(user.email, verifyToken);
      } catch (emailErr) {
        console.error("❌ Error enviando correo de verificación:", emailErr);
      }
    }

    res.status(201).json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error al registrar: " + err.message });
  }
};

// ====== Login ======
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validator.isEmail(email))
      return res.status(400).json({ error: "Correo inválido" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ error: "Verifica tu cuenta antes de iniciar sesión." });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    res.json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// ====== Refrescar token ======
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "Token requerido" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ error: "Token inválido o caducado" });
    }

    const newAccessToken = createAccessToken(user);
    // (Opcional) Rotar refresh en cada uso:
    const newRefresh = createRefreshToken(user);
    user.refreshToken = newRefresh;
    await user.save();
    res.cookie("refreshToken", newRefresh, refreshCookieOptions());

    res.json({ token: newAccessToken });
  } catch (err) {
    console.error("Error refrescando token:", err);
    return res.status(403).json({ error: "Error al refrescar el token" });
  }
};

// ====== Verificar correo ======
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (user.isVerified) {
      return res.status(200).json({ message: "La cuenta ya está verificada." });
    }

    user.isVerified = true;
    await user.save();

    // 📩 Notificación (si usas transporter aquí, asegúrate de tenerlo importado)
    // await transporter.sendMail({...});

    res.status(200).json({ message: "Cuenta verificada exitosamente" });
  } catch (err) {
    return res.status(400).json({ error: "Token inválido o expirado" });
  }
};

// ====== Reenviar verificación ======
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    if (user.isVerified)
      return res.status(400).json({ error: "La cuenta ya está verificada" });

    const verifyToken = jwt.sign(
      { id: user._id },
      process.env.JWT_EMAIL_SECRET,
      { expiresIn: "15m" }
    );
    await sendVerificationEmail(user.email, verifyToken);

    res.json({ message: "Correo de verificación reenviado" });
  } catch (err) {
    console.error("Error reenviando verificación:", err);
    res.status(500).json({ error: "No se pudo reenviar el correo" });
  }
};

// ====== Logout ======
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    const opts = refreshCookieOptions();
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: opts.sameSite,
      secure: opts.secure,
      path: "/",
    });

    return res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    return res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

// ====== Recuperación de contraseña ======
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Correo requerido" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_RESET_SECRET, {
    expiresIn: "15m",
  });

  await sendResetEmail(user.email, resetToken);
  res
    .status(200)
    .json({ message: "Correo enviado para restablecer la contraseña" });
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    user.password = password;
    await user.save();

    // 📩 Notificación (si usas transporter aquí, asegúrate de tenerlo importado)
    // await transporter.sendMail({...});

    res.status(200).json({ message: "Contraseña actualizada con éxito" });
  } catch (err) {
    return res.status(400).json({ error: "Token inválido o expirado" });
  }
};
