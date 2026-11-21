/* ============================================
   early.js — se carga en el <head> de cada página, antes de dibujarla

   1) Con ?preview=1 usa el borrador guardado por el panel admin.
   2) Aplica el fondo elegido para esta pestaña (js/page-gifs.js).
      Sin fondo elegido se queda el fondo de galaxia de css/base.css.
   ============================================ */
(function () {
  const root = document.documentElement;

  // 1) vista previa del borrador
  if (/[?&]preview=1/.test(location.search)) {
    try {
      const draft = localStorage.getItem("alienmax-draft");
      if (draft) { window.SITE = JSON.parse(draft); window.SITE_PREVIEW = true; }
    } catch (e) {}
  }

  // 2) fondo de la pestaña
  const P = window.PAGE_GIFS;
  const url = P ? String(P.backgroundFor(window.SITE, root.dataset.page) || "").trim() : "";
  if (!url) return;
  // solo http(s) o rutas relativas
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^https?:/i.test(url)) return;
  const safe = url.replace(/["\\\r\n]/g, "");

  const OVERLAY = "linear-gradient(180deg, rgba(13, 2, 33, 0.35), rgba(45, 11, 90, 0.35))";
  const style = document.createElement("style");
  style.id = "page-bg";
  style.textContent = "html body { background: " + OVERLAY + ', url("' + safe + '") center / cover fixed no-repeat; }';
  document.head.appendChild(style);
  root.classList.add("has-bg"); // estrellas más suaves para que se vea el fondo

  // las imágenes pequeñas (pixel art) se repiten como mosaico en vez de estirarse
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth && img.naturalWidth < 200) {
      style.textContent = "html body { background: " + OVERLAY + ', url("' + safe + '") top left / auto repeat; image-rendering: pixelated; }';
    }
  };
  img.src = safe;
})();
