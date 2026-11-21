/* ============================================
   render-gifs.js — gifs configurables
   - [data-top-gif="<pestaña>"]  gif de la parte superior (uno solo)
   - [data-home-box]             cuadro grande del inicio
   Sin imagen elegida, el elemento se elimina.
   ============================================ */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL, P = window.PAGE_GIFS;

  // 1) parte superior
  document.querySelectorAll("[data-top-gif]").forEach((slot) => {
    const src = U.safeUrl(P.topFor(S, slot.dataset.topGif));
    if (!src) { slot.remove(); return; }
    const img = new Image();
    img.alt = "";
    // los gifs pequeños (pixel art) se agrandan sin suavizar
    img.onload = () => { if (img.naturalWidth && img.naturalWidth < 200) img.classList.add("pixel"); };
    img.src = src;
    slot.append(img);
  });

  // 2) cuadro grande del inicio
  document.querySelectorAll("[data-home-box]").forEach((slot) => {
    const cfg = P.homeBox(S);
    const src = U.safeUrl(cfg.src);
    if (!src) { slot.remove(); return; }
    const img = new Image();
    img.alt = cfg.title || "";
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
