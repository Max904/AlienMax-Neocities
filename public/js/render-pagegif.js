/* ============================================
   render-pagegif.js — muestra el gif elegido para esta pestaña
   Busca los elementos con data-page-gif="<clave>" (ver page-gifs.js).
   Sin imagen elegida, el elemento se elimina.
   ============================================ */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL, P = window.PAGE_GIFS || { defaults: {} };

  document.querySelectorAll("[data-page-gif]").forEach((slot) => {
    const key = slot.dataset.pageGif;
    const cfg = (S.pageGifs && S.pageGifs[key]) || P.defaults[key] || {};
    const src = U.safeUrl(cfg.src);
    if (!src) { slot.remove(); return; }

    const img = new Image();
    img.alt = cfg.title || "";
    // los gifs pequeños (pixel art) se agrandan sin suavizar
    img.onload = () => {
      if (img.naturalWidth && img.naturalWidth < 200) {
        img.classList.add("pixel");
        img.style.width = Math.min(img.naturalWidth * 4, 240) + "px";
      }
    };
    img.src = src;

    if (cfg.title) {
      slot.innerHTML = '<div class="box-title">' + U.esc(cfg.title) + '</div><div class="box-body"></div>';
      slot.querySelector(".box-body").append(img);
    } else {
      slot.classList.remove("box");
      slot.classList.add("bare");
      slot.append(img);
    }
  });
})();
