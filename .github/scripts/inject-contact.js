// Pone el secreto CONTACT_EMAIL en public/data/social.js durante el deploy.
// El valor nunca se guarda en el repo ni se imprime en los logs.
const fs = require("fs");
const v = (process.env.CONTACT_EMAIL || "").trim();
const p = "public/data/social.js";
if (!v) { console.log("CONTACT_EMAIL no está configurado: los mensajes se enviarán como Issue de GitHub."); process.exit(0); }
if (/[\s"'<>\\]/.test(v)) { console.error("CONTACT_EMAIL tiene caracteres no válidos."); process.exit(1); }
const s = fs.readFileSync(p, "utf8");
if (!/email:\s*"[^"]*"/.test(s)) { console.error("No encuentro el campo email en " + p); process.exit(1); }
fs.writeFileSync(p, s.replace(/email:\s*"[^"]*"/, () => "email: " + JSON.stringify(v)));
console.log("Correo de contacto inyectado desde el secreto CONTACT_EMAIL.");
