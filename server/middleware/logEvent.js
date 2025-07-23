const fs = require("fs");
const path = require("path");

const logEvent = (type, message) => {
  const filePath = path.join(__dirname, "../logs/events.log");
  const logMsg = `[${new Date().toISOString()}] [${type.toUpperCase()}] ${message}\n`;
  fs.appendFile(filePath, logMsg, (err) => {
    if (err) console.error("Error al registrar evento:", err);
  });
};

module.exports = logEvent;
