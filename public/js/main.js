/* ============================================
   main.js — reloj y año (el contador de visitas es el script de WebsiteOut)
   ============================================ */
(function () {
  // El contador de visitas es el de WebsiteOut (script en el HTML de cada página, dentro de #visit-counter).

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
