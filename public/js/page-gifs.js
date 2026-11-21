/* ============================================
   page-gifs.js — gifs configurables del sitio

   Lo usan el sitio (render-gifs.js) y el panel (admin/admin.js).
   Los valores elegidos se guardan en data/content.js:
     topGif  = { src, pages: { <pestaña>: "otro gif solo en esa pestaña" } }
     homeBox = { src, title }   (cuadro grande del inicio)
     backgrounds = { <pestaña>: "fondo de esa pestaña" }  ("" = galaxia)
   Si falta algo, se usan los valores por defecto de aquí.
   ============================================ */
window.PAGE_GIFS = {
  pages: [
    { key: "home",      label: "Inicio",           file: "index.html" },
    { key: "blog",      label: "Blogs",            file: "blog.html" },
    { key: "music",     label: "Música",           file: "musica.html" },
    { key: "about",     label: "Sobre mí",         file: "sobre-mi.html" },
    { key: "gallery",   label: "Galería",          file: "galeria.html" },
    { key: "guestbook", label: "Libro de visitas", file: "libro-de-visitas.html" }
  ],

  defaults: {
    topGif: "assets/flower.gif",
    homeBox: { src: "assets/space-alien.gif", title: "👽 SEÑAL DEL ESPACIO" },
    // fondo de cada pestaña; las que no aparecen aquí usan el fondo de galaxia
    backgrounds: { blog: "assets/purple-water.gif" }
  },

  // fondo de una pestaña ("" = fondo de galaxia)
  backgroundFor: function (site, key) {
    const b = site && site.backgrounds;
    const v = b && b[key];
    return v == null ? (this.defaults.backgrounds[key] || "") : v;
  },

  // gif de la parte superior para una pestaña: el suyo si lo tiene, si no el general
  topFor: function (site, key) {
    const t = site && site.topGif;
    if (!t) return this.defaults.topGif;
    const own = t.pages && t.pages[key];
    if (own) return own;
    return t.src == null ? this.defaults.topGif : t.src;
  },

  // cuadro grande del inicio (acepta el formato antiguo pageGifs.home)
  homeBox: function (site) {
    const h = site && (site.homeBox || (site.pageGifs && site.pageGifs.home));
    return h ? { src: h.src || "", title: h.title || "" } : Object.assign({}, this.defaults.homeBox);
  }
};
