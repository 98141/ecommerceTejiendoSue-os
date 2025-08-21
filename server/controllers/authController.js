const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const logEvent = require("../middleware/logEvent");

// Duraciones configurables
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Helpers para firmar tokens
function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, // usa otro secret si lo tienes
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logEvent("login_failed", `Intento fallido para: ${email}`);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: "Verifica tu correo antes de iniciar sesión" });
    }

    // Genera tokens
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Cookie httpOnly para refresh token
    // - sameSite: "lax" para SPA en mismo dominio/puerto
    // - secure: false en dev (true en prod con HTTPS)
    res.cookie("rt", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // cambia a true en producción con HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días (alinea con REFRESH_EXPIRES_IN)
      path: "/",
    });

    logEvent("login_success", `Usuario logueado: ${user.email}`);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Endpoint de refresh token (usado por el frontend)
exports.refreshToken = async (req, res) => {
  try {
    const rt = req.cookies?.rt;
    if (!rt) return res.status(401).json({ error: "No refresh token" });

    let payload;
    try {
      payload = jwt.verify(
        rt,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (e) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // (Opcional) rota refresh en cada uso
    const fakeUser = { _id: payload.id, role: payload.role };
    const newAccess = signAccessToken(fakeUser);
    const newRefresh = signRefreshToken(fakeUser);

    res.cookie("rt", newRefresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ token: newAccess });
  } catch (err) {
    console.error("Error en refresh-token:", err);
    return res.status(500).json({ error: "Error al refrescar token" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("rt", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    return res.json({ message: "Sesión cerrada" });
  } catch (e) {
    return res.status(500).json({ error: "Error al cerrar sesión" });
  }
};
