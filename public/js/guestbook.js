/* ============================================
   guestbook.js — libro de visitas
   Las firmas nuevas van con HTML Comment Box (js/hcb.js). Aquí solo se muestran
   las firmas antiguas ya aprobadas (data/content.js → guestbook); si no hay, la caja se quita.
   ============================================ */
(function () {
  const host = document.getElementById("guest-hcb");
  const list = document.getElementById("guest-list");
  const A = window.SOCIAL_API;
  if (!host || !A) return;
  if (window.HCB) window.HCB.mount(host, window.HCB.key("libro-de-visitas"));
  if (!list) return;

  const old = (window.SITE || {}).guestbook || [];
  if (!old.length) { const bx = list.closest(".box") || list.parentNode; if (bx) bx.remove(); return; }
  list.innerHTML = old.map((e) => '<div class="guest-entry"><b>' + A.who(e) + "</b><small>" + A.fmt(e.date) + "</small><p>" + A.esc(e.message) + "</p></div>").join("");
})();
