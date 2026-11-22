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
  repo: "Max904/AlienMax-Neocities"
};
