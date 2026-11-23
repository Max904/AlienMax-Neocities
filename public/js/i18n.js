/* ============================================
   i18n.js — español / inglés
   - Idioma: ?lang=es|en  →  lo último elegido (botón ES/EN)  →  idioma del navegador.
   - Textos fijos: [data-i18n], [data-i18n-html], [data-i18n-ph], [data-i18n-title] y I18N.t("clave").
   - Contenido (data/content.js): cada campo puede tener su versión en inglés con el sufijo _en
     (title_en, body_en, note_en, favorites_en, tags_en…). Si falta, se usa el texto base.
   ============================================ */
(function () {
  let lang = "";
  try {
    const q = /[?&]lang=(es|en)\b/.exec(location.search);
    if (q) { lang = q[1]; localStorage.setItem("alienmax-lang", lang); }
    else lang = localStorage.getItem("alienmax-lang") || "";
  } catch (e) {}
  if (lang !== "es" && lang !== "en") lang = /^es\b/i.test(navigator.language || "") ? "es" : "en";
  const EN = lang === "en";
  document.documentElement.lang = lang;

  // clave: [español, inglés]
  const K = {
    "nav.home": ["★ Inicio", "★ Home"], "nav.blog": ["✎ Blogs", "✎ Blogs"], "nav.music": ["♪ Música", "♪ Music"],
    "nav.about": ["👽 Sobre mí", "👽 About me"], "nav.gallery": ["❀ Galería", "❀ Gallery"], "nav.guestbook": ["✉ Visitas", "✉ Guestbook"],
    "page.home": ["Inicio", "Home"], "page.blog": ["Blogs", "Blogs"], "page.music": ["Música", "Music"], "page.about": ["Sobre mí", "About me"],
    "page.gallery": ["Galería", "Gallery"], "page.guestbook": ["Libro de visitas", "Guestbook"],
    "side.profile": ["★ MI PERFIL ★", "★ MY PROFILE ★"], "side.info": ["♥ DATOS ♥", "♥ INFO ♥"], "side.status": ["Estado:", "Status:"],
    "side.planet": ["Planeta:", "Planet:"], "side.color": ["Color:", "Color:"], "side.time": ["Hora galáctica:", "Galactic time:"],
    "side.visits": ["☆ VISITAS ☆", "☆ VISITS ☆"], "side.buttons": ["♪ BOTONES ♪", "♪ BUTTONS ♪"],
    "foot.back": ["volver a la nave", "back to the ship"], "foot.home": ["hecho con amor y mucho morado", "made with love and lots of purple"],
    "foot.blog": ["fondo: ondas moradas de noche", "background: purple waves at night"],
    "home.welcome": ["✦ BIENVENID@ A BORDO ✦", "✦ WELCOME ABOARD ✦"], "home.latest": ["✎ ÚLTIMA TRANSMISIÓN", "✎ LATEST TRANSMISSION"],
    "home.readall": ["→ leer todas las entradas", "→ read all posts"],
    "blog.h1": ["✦ Blogs de {name} ✦", "✦ {name}'s Blogs ✦"], "blog.archive": ["✦ ARCHIVO ✦", "✦ ARCHIVE ✦"],
    "blog.filter": ["Filtrar:", "Filter:"], "blog.all": ["TODOS", "ALL"], "blog.none": ["Sin entradas", "No posts"],
    "blog.empty": ["Todavía no hay entradas.", "No posts yet."], "blog.mood": ["Ánimo:", "Mood:"], "blog.comments": ["💬 comentarios", "💬 comments"],
    "music.h1": ["✦ Música recomendada ✦", "✦ Recommended music ✦"], "music.tag": ["lo que suena en mi nave", "what's playing on my ship"],
    "music.list": ["♪ LA LISTA ♪", "♪ THE LIST ♪"], "music.empty": ["Todavía no hay recomendaciones.", "No recommendations yet."],
    "music.play": ["▶ reproducir aquí", "▶ play here"], "music.open": ["↗ abrir enlace", "↗ open link"], "music.close": ["■ cerrar", "■ close"], "music.player": ["reproductor", "player"],
    "about.h1": ["✦ Sobre {name} ✦", "✦ About {name} ✦"], "about.tag": ["archivo clasificado nivel 9", "classified file, level 9"],
    "about.who": ["👽 QUIÉN SOY", "👽 WHO I AM"], "about.favs": ["MIS COSAS FAVORITAS", "MY FAVORITE THINGS"], "about.motto": ["LEMA", "MOTTO"],
    "about.friends": ["💜 MIS AMIGOS DEL ESPACIO", "💜 MY SPACE FRIENDS"],
    "gal.h1": ["✦ Galería Morada ✦", "✦ Purple Gallery ✦"], "gal.tag": ["mis gifs favoritos del universo", "my favorite gifs in the universe"],
    "gal.box": ["❀ COLECCIÓN ❀", "❀ COLLECTION ❀"], "gal.empty": ["La galería está vacía.", "The gallery is empty."],
    "gb.h1": ["✦ Libro de Visitas ✦", "✦ Guestbook ✦"], "gb.tag": ["deja tu huella en la galaxia", "leave your mark on the galaxy"],
    "gb.sign": ["✉ FIRMA AQUÍ", "✉ SIGN HERE"], "gb.messages": ["♥ MENSAJES ♥", "♥ MESSAGES ♥"],
    "gb.as": ["Firmar como:", "Sign as:"], "gb.msg": ["Tu mensaje:", "Your message:"], "gb.ph": ["Escribe algo bonito para la galaxia…", "Write something nice for the galaxy…"],
    "gb.send": ["✦ ENVIAR ✦", "✦ SEND ✦"], "gb.fine": ["Tu firma se envía a AlienMax; cuando la apruebe la verá todo el mundo. El usuario de Neocities no se verifica: solo enlaza a ese sitio.", "Your message goes to AlienMax; once approved everyone will see it. Neocities usernames are not verified: they only link to that site."],
    "gb.none": ["Aún no hay firmas. ¡Sé el primero!", "No signatures yet. Be the first!"], "gb.pending": ["pendiente de aprobación", "pending approval"],
    "anon": ["Anónimo", "Anonymous"],
    "counter.err": ["No pude conectar con el contador compartido; se muestra el último valor.", "Couldn't reach the shared counter; showing the last value."],
    // comentarios (barra «Comentar como»)
    "id.anon": ["👤 Anónimo", "👤 Anonymous"], "id.nc": ["🛸 Usuario de Neocities", "🛸 Neocities user"], "id.custom": ["🔗 Nombre y enlace", "🔗 Name & link"],
    "id.user.ph": ["tuusuario", "yourusername"], "id.name.ph": ["Tu nombre", "Your name"], "id.link.ph": ["Enlace: instagram.com/tuusuario", "Link: instagram.com/yourname"],
    "id.n.anon": ["Comentarás como Anónimo.", "You'll comment as Anonymous."],
    "id.n.nc": ["Comentarás como {u} (enlaza a {u}.neocities.org, no se verifica).", "You'll comment as {u} (links to {u}.neocities.org, not verified)."],
    "id.n.ncbad": ["Ese usuario de Neocities no es válido: saldrás como Anónimo.", "That Neocities username isn't valid: you'll appear as Anonymous."],
    "id.n.ncempty": ["Escribe tu usuario de Neocities (o elige Anónimo).", "Type your Neocities username (or pick Anonymous)."],
    "id.n.custom": ["Comentarás como {n} (enlaza a {h}).", "You'll comment as {n} (links to {h})."],
    "id.n.customnolink": ["Comentarás como {n} (sin enlace).", "You'll comment as {n} (no link)."],
    "id.n.linkbad": ["Ese enlace no parece válido: saldrás solo con el nombre.", "That link doesn't look valid: you'll appear with just the name."],
    "id.n.customempty": ["Escribe tu nombre (y un enlace si quieres).", "Type your name (and a link if you like)."],
    "cm.ph": ["Escribe un comentario…", "Write a comment…"], "cm.send": ["Comentar", "Comment"], "cm.none": ["Aún no hay comentarios. ¡Sé el primero!", "No comments yet. Be the first!"],
    "cm.wait": ["Espera unos segundos antes de comentar otra vez.", "Wait a few seconds before commenting again."], "gb.wait": ["Espera unos segundos antes de volver a firmar.", "Wait a few seconds before signing again."],
    "cm.as": ["Comentar como", "Comment as"], "cm.title": ["Comentarios", "Comments"]
  };
  const MS = [["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]];
  const ML = [["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
              ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]];

  const t = (key, vars) => {
    const p = K[key];
    let s = p ? p[EN ? 1 : 0] : key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  };
  // campo con versión en inglés (campo_en) si estamos en inglés y existe
  const f = (obj, key) => {
    if (!obj) return undefined;
    if (EN) {
      const v = obj[key + "_en"];
      if (v != null && v !== "" && !(Array.isArray(v) && !v.length)) return v;
    }
    return obj[key];
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const I18N = { lang, en: EN, t, f, esc, months: MS[EN ? 1 : 0], monthsLong: ML[EN ? 1 : 0], locale: EN ? "en-US" : "es-CL" };
  window.I18N = I18N;

  function apply() {
    const name = esc(((window.SITE || {}).profile || {}).name || "AlienMax");
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml, { name: name }); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.setAttribute("placeholder", t(el.dataset.i18nPh)); });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.setAttribute("title", t(el.dataset.i18nTitle)); });
    // interruptor ES / EN
    const head = document.querySelector(".site-header");
    if (head && !head.querySelector(".lang-switch")) {
      const box = document.createElement("div");
      box.className = "lang-switch";
      box.setAttribute("role", "group");
      box.setAttribute("aria-label", "Idioma / Language");
      ["es", "en"].forEach((l) => {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = l.toUpperCase(); b.title = l === "es" ? "Español" : "English";
        if (l === lang) b.className = "on";
        b.addEventListener("click", () => {
          try { localStorage.setItem("alienmax-lang", l); } catch (e) {}
          const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.toString();
        });
        box.appendChild(b);
      });
      head.appendChild(box);
    }
  }
  apply();
})();
