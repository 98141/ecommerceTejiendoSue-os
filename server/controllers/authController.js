const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const logEvent = require("../middleware/logEvent");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logEvent("login_failed", `Intento fallido para: ${email}`);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Verifica tu correo antes de iniciar sesión" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    logEvent("login_success", `Usuario logueado: ${user.email}`);

    res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
