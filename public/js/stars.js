/* ============================================
   stars.js — campo de estrellas parpadeantes
   ============================================ */
(function () {
  const canvas = document.createElement("canvas");
  canvas.id = "starfield";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const COLORS = ["#ffffff", "#d9b8ff", "#a56bff", "#ff8be0", "#9dff6b"];
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 4500);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.03 + 0.01,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      cross: Math.random() < 0.12,
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(s.phase + t * s.speed * 0.06));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      if (s.cross) {
        // estrellita en forma de cruz, muy 2010
        const l = s.r * 3;
        ctx.fillRect(s.x - l, s.y - 0.5, l * 2, 1);
        ctx.fillRect(s.x - 0.5, s.y - l, 1, l * 2);
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
})();
