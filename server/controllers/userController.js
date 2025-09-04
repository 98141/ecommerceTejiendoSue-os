const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { sendVerificationEmail, sendResetEmail } = require("../utils/sendEmail");

// ====== Config por ENV (fallbacks sensatos) ======
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Util de cookie para refresh (dev/prod)
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/", // usa "/" si en dev te resulta más simple; debe coincidir en clearCookie
  };
}

// ====== Funciones para tokens ======
const createAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });

const createRefreshToken = (user) =>
  jwt.sign({ id: user._id, use: "refresh" }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

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

    // 🔔 IMPORTANTE: NO bloquear el login por no verificado.
    // Muestra limitaciones en frontend o protege rutas con requireVerified en backend.

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    res.json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

/* ====== Logout ====== */
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
      path: "/", // 👈 igual que en setCookie
    });

    return res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    return res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

// ====== Refrescar token ======
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "Falta refresh cookie" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: "Refresh inválido o expirado" });
    }

    const user = await User.findById(decoded.id).select(
      "_id name email role isVerified refreshToken"
    );
    if (!user) return res.status(401).json({ error: "Refresh inválido" });

    // Importante: compara contra el almacenado (anti-replay)
    if (!user.refreshToken || user.refreshToken !== token) {
      return res.status(401).json({ error: "Refresh inválido" });
    }

    // ⚠️ NO rotamos aquí para evitar condiciones de carrera
    // res.cookie("refreshToken", token, refreshCookieOptions());  // opcional: reestablecer mismas flags

    const access = createAccessToken(user);
    res.json({
      token: access,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error refrescando token:", err);
    return res.status(401).json({ error: "Refresh inválido" });
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

/*Informacion de perfil */
exports.getMe = async (req, res) => {
  const u = await User.findById(req.user.id).lean();
  if (!u) return res.status(404).json({ error: "No encontrado" });
  res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    phone: u.phone || "",
    avatar: u.avatar || { full: "", thumb: "" },
    address: u.address || {},
  });

  const me = await User.findById(req.user.id)
    .select("name email role isVerified createdAt")
    .lean();
  if (!me) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ user: me });
};

// PATCH (editar nombre/telefono, etc.)
exports.updateMe = async (req, res) => {
  const { name, phone, address } = req.body || {};
  const patch = {};

  if (typeof name === "string" && name.trim()) patch.name = name.trim().slice(0, 100);
  if (typeof phone === "string") patch.phone = phone.trim().slice(0, 30);

  if (address && typeof address === "object") {
    patch.address = {
      line1: address.line1?.slice(0, 140) || "",
      line2: address.line2?.slice(0, 140) || "",
      city: address.city?.slice(0, 60) || "",
      state: address.state?.slice(0, 60) || "",
      zip: address.zip?.slice(0, 20) || "",
      country: address.country?.slice(0, 60) || "",
    };
  }

  const u = await User.findByIdAndUpdate(req.user.id, { $set: patch }, { new: true }).lean();
  res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    phone: u.phone || "",
    avatar: u.avatar || { full: "", thumb: "" },
    address: u.address || {},
  });
};

// PATCH /api/users/me/password (currentPassword, newPassword)
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Datos incompletos" });

  const u = await User.findById(req.user.id).select("+password");
  if (!u) return res.status(404).json({ error: "No encontrado" });

  const ok = await bcrypt.compare(currentPassword, u.password);
  if (!ok) return res.status(400).json({ error: "Contraseña actual incorrecta" });

  if (
    !validator.isStrongPassword(newPassword, { minLength: 8, minNumbers: 1, minSymbols: 1 })
  ) {
    return res.status(400).json({ error: "Contraseña débil (8+car, 1 número, 1 símbolo)" });
  }

  u.password = newPassword;
  await u.save();
  res.json({ ok: true, message: "Contraseña actualizada" });
};

// PATCH /api/users/me/password
exports.changeMyPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Contraseña actual y nueva son requeridas" });
  }
  const me = await User.findById(req.user.id).select("+password");
  if (!me) return res.status(404).json({ error: "Usuario no encontrado" });

  const ok = await bcrypt.compare(currentPassword, me.password);
  if (!ok)
    return res.status(401).json({ error: "Contraseña actual incorrecta" });

  me.password = newPassword;
  await me.save();
  res.json({ message: "Contraseña actualizada" });
};

//  (multipart: avatar)
exports.updateAvatar = async (req, res) => {
  if (!req.avatarProcessed) return res.status(400).json({ error: "Archivo requerido" });
  const u = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { avatar: req.avatarProcessed } },
    { new: true }
  ).lean();
  res.json({ avatar: u.avatar });
};