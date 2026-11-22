// Pone el secreto NTFY_TOPIC en public/data/social.js durante el deploy.
// Los valores nunca se guardan en el repo ni se imprimen en los logs.
const fs = require("fs");
const p = "public/data/social.js";
let s = fs.readFileSync(p, "utf8");
let bad = false;

function inject(field, value, valid, secret) {
  value = (value || "").trim();
  if (!value) { console.log(secret + " no está configurado: se omite."); return; }
  if (!valid.test(value)) { console.error(secret + " tiene caracteres no válidos."); bad = true; return; }
  const re = new RegExp(field + ':\\s*"[^"]*"');
  if (!re.test(s)) { console.error("No encuentro el campo " + field + " en " + p); bad = true; return; }
  s = s.replace(re, () => field + ": " + JSON.stringify(value));
  console.log(secret + " inyectado.");
}

inject("ntfy", process.env.NTFY_TOPIC, /^[A-Za-z0-9_-]{6,64}$/, "NTFY_TOPIC");
if (bad) process.exit(1);
fs.writeFileSync(p, s);
