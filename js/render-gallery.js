/* render-gallery.js — galería */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL;
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const items = (S.gallery || []).filter((g) => U.safeUrl(g.src));
  grid.innerHTML = items.length
    ? items.map((g) =>
        '<figure class="gallery-item"><img src="' + U.esc(U.safeUrl(g.src)) + '" alt="' + U.esc(g.caption) + '">' +
        "<figcaption>" + U.esc(g.caption) + "</figcaption></figure>"
      ).join("")
    : "<p style='padding:12px'>La galería está vacía.</p>";
})();
