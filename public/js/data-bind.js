/* ============================================
   data-bind.js — utilidades y enlace de datos
   Lee window.SITE (data/content.js) y rellena
   los elementos con data-bind / data-bind-src.
   Con ?preview=1 usa el borrador guardado por el panel admin.
   ============================================ */
(function () {
  // vista previa del borrador del panel admin
  if (/[?&]preview=1/.test(location.search)) {
    try {
      const draft = localStorage.getItem("alienmax-draft");
      if (draft) window.SITE = JSON.parse(draft);
      document.addEventListener("DOMContentLoaded", () => {
        const tag = document.createElement("div");
        tag.textContent = "VISTA PREVIA DEL BORRADOR (sin publicar)";
        tag.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:999;padding:4px;text-align:center;font:12px monospace;background:#ff8be0;color:#0d0221";
        document.body.appendChild(tag);
      });
    } catch (e) {}
  }

  const S = window.SITE || {};

  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MESES_LARGO = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // solo permite http(s) y rutas relativas (evita javascript:)
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "";
    return u;
  }

  // texto -> párrafos HTML (línea en blanco = párrafo, [texto](url) = enlace)
  function paragraphs(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        let h = esc(p).replace(/\n/g, "<br>");
        h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        return "<p>" + h + "</p>";
      })
      .join("");
  }

  function parseDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
  }

  function fmtDate(iso) {
    const p = parseDate(iso);
    if (!p) return esc(iso || "");
    const cap = MESES[p.m].charAt(0).toUpperCase() + MESES[p.m].slice(1);
    return String(p.d).padStart(2, "0") + " · " + cap + " · " + p.y;
  }

  function monthKey(iso) {
    const p = parseDate(iso);
    return p ? { key: p.y + "-" + String(p.m + 1).padStart(2, "0"), label: MESES_LARGO[p.m] + " " + p.y } : null;
  }

  function slug(t) {
    return String(t || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9áéíóúñü-]/g, "");
  }

  function get(path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), S);
  }

  window.SITE_UTIL = { esc, safeUrl, paragraphs, fmtDate, monthKey, slug, get };

  document.querySelectorAll("[data-bind]").forEach((el) => {
    const v = get(el.dataset.bind);
    if (v != null && v !== "") el.textContent = v;
  });

  document.querySelectorAll("[data-bind-src]").forEach((el) => {
    const v = safeUrl(get(el.dataset.bindSrc));
    if (v) el.setAttribute("src", v);
  });

  // título de la pestaña del navegador
  const part = document.body.dataset.pageTitle;
  if (S.site && S.site.title) document.title = "✦ " + S.site.title + " ✦ " + (part || "");
})();
