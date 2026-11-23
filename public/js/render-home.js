/* render-home.js — inicio: bienvenida y última transmisión */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL;

  const welcome = document.getElementById("welcome");
  if (welcome) welcome.innerHTML = U.paragraphs(S.home && U.f(S.home, "welcome"));

  const latest = document.getElementById("latest");
  const p = (S.posts || [])[0];
  if (latest) {
    if (!p) {
      latest.innerHTML = "<p>" + window.I18N.t("blog.empty") + "</p>";
    } else {
      const first = String(U.f(p, "body") || "").split(/\n{2,}/)[0];
      const short = first.length > 220 ? first.slice(0, 220).trim() + "…" : first;
      latest.innerHTML =
        "<p><b>" + U.esc(U.f(p, "title")) + "</b> <small style='color:var(--text-dim)'>(" + U.fmtDate(p.date) + ")</small></p>" +
        "<p>" + U.esc(short) + "</p>" +
        '<p style="margin-top:8px"><a href="blog.html">' + window.I18N.t("home.readall") + '</a></p>';
    }
  }
})();
