/* ============================================
   counters.js — contadores compartidos (visitas y me gusta)
   Usa CounterAPI (https://counterapi.dev), gratis y sin registro:
     /v1/<espacio>/<nombre>/up   suma 1   · /down  resta 1   · /  solo lee.
   Devuelve el total ya calculado, así que la página no hace ninguna resta.
   Si el servicio no responde, el sitio sigue funcionando con los valores guardados en el navegador.
   Para empezar de cero, cambia NS.
   ============================================ */
(function () {
  const NS = "alienmax-max904";                 // «nombre único» de tu sitio en CounterAPI
  const BASE = "https://api.counterapi.dev/v1";
  const safe = (k) => String(k).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 60).padEnd(3, "-");

  async function call(op, key) {
    const url = BASE + "/" + NS + "/" + safe(key) + (op === "get" ? "/" : "/" + op);
    const r = await fetch(url, { cache: "no-store" });
    if (op === "get" && (r.status === 404 || r.status === 400)) return 0; // todavía no existe: vale 0
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const n = typeof j.count === "number" ? j.count : typeof j.value === "number" ? j.value : parseInt(j.count != null ? j.count : j.value, 10);
    if (!isFinite(n)) throw new Error("respuesta inesperada");
    return n;
  }

  // peticiones una detrás de otra, con pausa, para no pasarse de los límites del servicio
  let chain = Promise.resolve();
  const slow = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 400))); return p; };

  window.COUNTERS = {
    up: (key) => slow(() => call("up", key)),
    down: (key) => slow(() => call("down", key)),
    get: (key) => slow(() => call("get", key)),
    hit: (key) => slow(() => call("up", key)),   // alias: sumar 1 (visitas)
  };
})();
