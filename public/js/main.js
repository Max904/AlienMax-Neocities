/* ============================================
   main.js — contador de visitas (compartido), reloj, año
   ============================================ */
(function () {
  // contador de visitas: el mismo para todos (counters.js). Cada carga de página suma 1, como los contadores de antes.
  // El número empieza en START para que no parezca un blog recién nacido.
  const START = 1337;
  const counterEl = document.getElementById("visit-counter");
  if (counterEl) {
    const show = (n) => { counterEl.textContent = String(n).padStart(7, "0"); };
    let cached = START;
    try { cached = parseInt(localStorage.getItem("alienmax-visits") || String(START), 10) || START; } catch (e) {}
    show(cached); // lo último que se vio, mientras llega el número real
    const C = window.COUNTERS;
    if (C) {
      C.hit("visitas").then((v) => {
        try { localStorage.setItem("alienmax-visits", String(START + v)); } catch (e) {}
        show(START + v);
        counterEl.title = "";
      }).catch((e) => {
        counterEl.title = window.I18N.t("counter.err") + " (" + (e && e.message || "error") + ")";
        if (window.console) console.warn("contador de visitas:", e);
      });
    }
  }

  // reloj galáctico
  const clockEl = document.getElementById("clock");
  if (clockEl) {
    const tick = () => {
      const d = new Date();
      clockEl.textContent = d.toLocaleTimeString(window.I18N.locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };
    tick();
    setInterval(tick, 1000);
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
