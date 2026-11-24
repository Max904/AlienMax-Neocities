/* ============================================
   social.js — ayudas para mostrar las firmas y comentarios antiguos ya aprobados
   (los nuevos los maneja HTML Comment Box: ver js/hcb.js).
   Identidad: "Anónimo" o un usuario de Neocities (sin verificar; enlaza a su sitio).
   ============================================ */
(function () {
  const USER_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/i;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function who(e) {
    if (e.neocities && USER_RE.test(e.neocities)) {
      const u = String(e.neocities).toLowerCase();
      return '<a class="nc-user" href="https://' + u + '.neocities.org" target="_blank" rel="noopener nofollow">👽 ' + esc(u) + "</a>";
    }
    return '<span class="anon">' + esc(!e.name || /^an[óo]nim(o|ous)$/i.test(e.name) ? window.I18N.t("anon") : e.name) + "</span>";
  }

  function fmt(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    if (m) return m[3] + "/" + m[2] + "/" + m[1];
    const d = new Date(s);
    return isNaN(d) ? esc(s || "") : d.toLocaleDateString(window.I18N.locale);
  }

  window.SOCIAL_API = { who, fmt, esc };
})();
