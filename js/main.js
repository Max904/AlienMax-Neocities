/* ============================================
   main.js — contador de visitas, reloj, año
   ============================================ */
(function () {
  // contador de visitas (guardado en el navegador)
  const counterEl = document.getElementById("visit-counter");
  if (counterEl) {
    let n = 1337;
    try {
      n = parseInt(localStorage.getItem("alienmax-visits") || "1337", 10) + 1;
      localStorage.setItem("alienmax-visits", String(n));
    } catch (e) {}
    counterEl.textContent = String(n).padStart(7, "0");
  }

  // reloj galáctico
  const clockEl = document.getElementById("clock");
  if (clockEl) {
    const tick = () => {
      const d = new Date();
      clockEl.textContent = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };
    tick();
    setInterval(tick, 1000);
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
