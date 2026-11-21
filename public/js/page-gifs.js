/* ============================================
   page-gifs.js — gif (o imagen) de cada pestaña

   Lo usan el sitio (render-pagegif.js) y el panel (admin/admin.js).
   Los valores elegidos se guardan en data/content.js -> "pageGifs".
   Si una pestaña no aparece allí, se usa el valor de "defaults".
   ============================================ */
window.PAGE_GIFS = {
  pages: [
    { key: "home",      label: "Inicio",           file: "index.html",            where: "cuadro grande, debajo de «Última transmisión»" },
    { key: "blog",      label: "Blogs",            file: "blog.html",             where: "columna lateral" },
    { key: "music",     label: "Música",           file: "musica.html",           where: "columna lateral" },
    { key: "about",     label: "Sobre mí",         file: "sobre-mi.html",         where: "columna lateral" },
    { key: "gallery",   label: "Galería",          file: "galeria.html",          where: "arriba de la colección" },
    { key: "guestbook", label: "Libro de visitas", file: "libro-de-visitas.html", where: "columna lateral" }
  ],
  defaults: {
    home:      { src: "assets/space-alien.gif",       title: "👽 SEÑAL DEL ESPACIO" },
    blog:      { src: "assets/flower.gif",            title: "" },
    music:     { src: "assets/cat-cat-licking.gif",   title: "" },
    about:     { src: "assets/eye.gif",               title: "" },
    gallery:   { src: "",                             title: "" },
    guestbook: { src: "assets/flower.gif",            title: "" }
  }
};
