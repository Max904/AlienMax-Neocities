/* ============================================
   hcb.js — comentarios con HTML Comment Box (htmlcommentbox.com)
   Sin aprobación previa y sin tocar el repo: los comentarios viven en su servidor.
   Se activa al poner «mod» en data/social.js → hcb (viene del código que da su panel).
   Su widget solo admite uno por página, así que se mueve al hilo que se abre.
   ============================================ */
(function () {
  const C = (window.SOCIAL && window.SOCIAL.hcb) || {};
  const H = "https://www.htmlcommentbox.com";
  const enabled = !!(C.mod && /^[\w$.%\-]+$/.test(C.mod));

  function mount(host, key) {
    if (!enabled || !host) return;
    const old = document.getElementById("HCB_comment_box");
    if (old) old.remove();
    const old2 = document.getElementById("hcb");
    if (old2) old2.remove();
    const box = document.createElement("div");
    box.id = "HCB_comment_box";
    box.textContent = "Cargando comentarios…";
    host.appendChild(box);
    if (C.css && /^https:\/\/www\.htmlcommentbox\.com\//.test(C.css) && !document.getElementById("hcb-skin")) {
      const l = document.createElement("link");
      l.id = "hcb-skin"; l.rel = "stylesheet"; l.href = C.css;
      document.head.appendChild(l);
    }
    window.hcb_user = { PAGE: key };
    const s = document.createElement("script");
    s.id = "hcb"; s.type = "text/javascript";
    s.src = H + "/jread?page=" + encodeURIComponent(key).replace("+", "%2B") +
      "&mod=" + encodeURIComponent(C.mod) + "&opts=" + encodeURIComponent(C.opts || "16798") +
      "&num=" + encodeURIComponent(C.num || 10);
    document.head.appendChild(s);
  }

  // identificador estable del hilo (igual en GitHub Pages y en Neocities)
  const key = (id) => "https://alienmax.neocities.org/" + id;
  window.HCB = { enabled, mount, key,
    tip: '<p class="fine">Escribe tu nombre (o «Anónimo»). Si quieres que te enlace a tu sitio, pon <b>usuario.neocities.org</b> en «Website».</p>' };
})();
