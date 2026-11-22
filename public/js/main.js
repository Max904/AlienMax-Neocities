/* ============================================
   main.js — contador de visitas (compartido), reloj, año
   ============================================ */
(function () {
  // contador de visitas: el mismo para todos (counters.js). Cuenta 1 visita por sesión del navegador.
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
      let counted = false;
      try { counted = sessionStorage.getItem("alienmax-visit-counted") === "1"; } catch (e) {}
      C[counted ? "get" : "hit"]("visitas").then((v) => {
        try { sessionStorage.setItem("alienmax-visit-counted", "1"); localStorage.setItem("alienmax-visits", String(START + v)); } catch (e) {}
        show(START + v);
      }).catch(() => {});
    }
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
