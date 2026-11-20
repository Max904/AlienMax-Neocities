/* render-home.js — inicio: bienvenida y última transmisión */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL;

  const welcome = document.getElementById("welcome");
  if (welcome) welcome.innerHTML = U.paragraphs(S.home && S.home.welcome);

  const latest = document.getElementById("latest");
  const p = (S.posts || [])[0];
  if (latest) {
    if (!p) {
      latest.innerHTML = "<p>Todavía no hay entradas.</p>";
    } else {
      const first = String(p.body || "").split(/\n{2,}/)[0];
      const short = first.length > 220 ? first.slice(0, 220).trim() + "…" : first;
      latest.innerHTML =
        "<p><b>" + U.esc(p.title) + "</b> <small style='color:var(--text-dim)'>(" + U.fmtDate(p.date) + ")</small></p>" +
        "<p>" + U.esc(short) + "</p>" +
        '<p style="margin-top:8px"><a href="blog.html">→ leer todas las entradas</a></p>';
    }
  }
})();
