/* ============================================
   counters.js — contadores compartidos (visitas y me gusta)
   Usa Abacus (https://abacus.jasoncameron.dev), un servicio gratis sin registro:
     /hit/<ns>/<clave>  suma 1 y devuelve el valor · /get/<ns>/<clave> solo lo lee.
   Si el servicio no responde, el sitio sigue funcionando con los valores guardados en el navegador.
   Para empezar de cero o cambiar de contador, cambia NS.
   ============================================ */
(function () {
  const NS = "alienmax-max904";                 // «nombre único» de tu sitio en Abacus
  const BASE = "https://abacus.jasoncameron.dev";
  const safe = (k) => String(k).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 60).padEnd(3, "-");

  async function call(kind, key) {
    const r = await fetch(BASE + "/" + kind + "/" + NS + "/" + safe(key), { cache: "no-store" });
    if (r.status === 404) return 0;             // todavía no existe: vale 0
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    return typeof j.value === "number" ? j.value : parseInt(j.value, 10) || 0;
  }

  // lecturas una detrás de otra, con pausa (el servicio permite 30 peticiones cada 10 s por IP)
  let chain = Promise.resolve();
  const slow = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 400))); return p; };

  window.COUNTERS = {
    hit: (key) => slow(() => call("hit", key)),
    get: (key) => slow(() => call("get", key)),
  };
})();
