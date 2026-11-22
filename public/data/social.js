/* ============================================
   social.js (datos) — a dónde llegan las firmas y comentarios de los visitantes.
   No hay servidor propio: el mensaje te llega y tú lo apruebas en el panel
   (pestaña «Mensajes»); al publicar lo ve todo el mundo.
   El visitante no necesita nada: escribe y envía.

   El tema de ntfy va en un secreto de repo y se pone solo al publicar (ver README):
   ntfy  = secreto NTFY_TOPIC: nombre del "tema" de ntfy.sh. Aviso instantáneo, sin cuentas.
   repo  = "usuario/repositorio" de GitHub. Solo se usa si no hay ntfy:
           el mensaje se abre como una Issue (el visitante necesita cuenta de GitHub).
   ============================================ */
window.SOCIAL = {
  // panel de admin (GitHub Pages): el aviso de ntfy trae un botón «Revisar y aprobar» que lo abre con el mensaje cargado
  admin: "https://max904.github.io/AlienMax-Neocities/admin/",
  ntfy: "",
  // HTML Comment Box: copia «mod» y «opts» del código que te da htmlcommentbox.com (dentro de la URL «jread?...&mod=...&opts=...»).
  // css = la dirección del <link rel="stylesheet"> del mismo código (opcional).
  // Con «mod» vacío se siguen usando los formularios con aprobación por ntfy.
  hcb: { mod: "$1$wq1rdBcg$GqSzSxLH04g9ZlAL4xGL.0", opts: "16798", num: 10, css: "https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0" },
  repo: "Max904/AlienMax-Neocities"
};
