/* ============================================
   ditto.js — Ditto camina por toda la página
   Recuerda su posición entre páginas (sessionStorage)
   ============================================ */
(function () {
  const PHRASES = [
    "dit... to?",
    "¡Hola AlienMax!",
    "creo en los aliens 👽",
    "~ blob blob ~",
    "¡me transformo en ti!",
    "💜💜💜",
    "¿viste esa estrella?",
  ];

  const el = document.createElement("div");
  el.id = "ditto";
  el.innerHTML = '<div class="bubble"></div><img src="assets/ditto.gif" alt="Ditto caminando">';
  document.body.appendChild(el);

  const bubble = el.querySelector(".bubble");

  // estado guardado entre páginas
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem("ditto") || "{}"); } catch (e) {}

  let x = typeof saved.x === "number" ? saved.x : 20;
  let dir = saved.dir === -1 ? -1 : 1;
  let speed = 1.1;
  let paused = false;
  let last = performance.now();

  function maxX() { return window.innerWidth - el.offsetWidth; }

  function render() {
    el.style.transform = "translateX(" + x + "px)";
    el.classList.toggle("facing-left", dir === -1);
  }

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add("show");
    setTimeout(() => bubble.classList.remove("show"), ms || 1800);
  }

  function randomPause() {
    // de vez en cuando se detiene o cambia de dirección
    const wait = 3000 + Math.random() * 5000;
    setTimeout(() => {
      paused = true;
      if (Math.random() < 0.5) say(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
      setTimeout(() => {
        paused = false;
        if (Math.random() < 0.5) dir *= -1;
        randomPause();
      }, 900 + Math.random() * 1400);
    }, wait);
  }

  function step(now) {
    const dt = Math.min(now - last, 50) / 16.67;
    last = now;
    if (!paused) {
      x += dir * speed * dt;
      const m = maxX();
      if (x <= 0) { x = 0; dir = 1; }
      if (x >= m) { x = m; dir = -1; }
    }
    render();
    requestAnimationFrame(step);
  }

  // click = salto + frase
  el.addEventListener("click", () => {
    el.classList.remove("jump");
    void el.offsetWidth; // reinicia la animación
    el.classList.add("jump");
    say(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  });

  window.addEventListener("beforeunload", () => {
    try { sessionStorage.setItem("ditto", JSON.stringify({ x: x, dir: dir })); } catch (e) {}
  });

  render();
  requestAnimationFrame(step);
  randomPause();
})();
