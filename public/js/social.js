/* ============================================
   social.js — firmas y comentarios moderados + identidad
   Identidad: "Anónimo" o un usuario de Neocities (sin verificar; enlaza a su sitio).
   El visitante envía su mensaje sin cuenta (formsubmit.co → tu correo) o, si no hay email, como Issue de GitHub (ver data/social.js);
   el dueño lo aprueba en el panel y entonces lo ve todo el mundo.
   Mientras tanto el visitante lo ve en su navegador como «pendiente».
   ============================================ */
(function () {
  const C = window.SOCIAL || {};
  const USER_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/i;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // "Anónimo" o usuario de Neocities con enlace
  function who(e) {
    if (e.neocities && USER_RE.test(e.neocities)) {
      const u = String(e.neocities).toLowerCase();
      return '<a class="nc-user" href="https://' + u + '.neocities.org" target="_blank" rel="noopener nofollow">👽 ' + esc(u) + "</a>";
    }
    return '<span class="anon">' + esc(e.name || "Anónimo") + "</span>";
  }

  function fmt(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    if (m) return m[3] + "/" + m[2] + "/" + m[1];
    const d = new Date(s);
    return isNaN(d) ? esc(s || "") : d.toLocaleDateString("es-CL");
  }

  function identityHTML(prefix) {
    return (
      '<div class="ident">' +
        '<label class="pill"><input type="radio" name="' + prefix + '-who" value="anon" checked> 🕶 Anónimo</label>' +
        '<label class="pill"><input type="radio" name="' + prefix + '-who" value="nc"> 👽 Usuario de Neocities</label>' +
        '<input class="nc-input" name="' + prefix + '-nc" maxlength="32" placeholder="tu usuario (sin .neocities.org)" autocomplete="off" hidden>' +
      "</div>"
    );
  }

  // lee y valida la identidad de un <form>; devuelve {name, neocities} o {error}
  function readIdentity(form, prefix) {
    const mode = (form.querySelector('input[name="' + prefix + '-who"]:checked') || {}).value;
    if (mode === "nc") {
      const u = String(form.elements[prefix + "-nc"].value || "").trim().replace(/^@/, "").replace(/\.neocities\.org.*$/i, "");
      if (!USER_RE.test(u)) return { error: "Escribe tu usuario de Neocities (letras, números, - o _)." };
      try { localStorage.setItem("alienmax-ncuser", u); } catch (e) {}
      return { name: u.toLowerCase(), neocities: u.toLowerCase() };
    }
    return { name: "Anónimo", neocities: null };
  }

  function wireIdentity(form, prefix) {
    const input = form.elements[prefix + "-nc"];
    const sync = () => {
      const nc = (form.querySelector('input[name="' + prefix + '-who"]:checked') || {}).value === "nc";
      input.hidden = !nc;
      if (nc) input.focus();
    };
    form.querySelectorAll('input[name="' + prefix + '-who"]').forEach((r) => r.addEventListener("change", sync));
    try { const saved = localStorage.getItem("alienmax-ncuser"); if (saved) input.value = saved; } catch (e) {}
  }

  // anti-spam sencillo: 1 envío cada 20 s por navegador
  function cooldown() {
    try {
      const last = +localStorage.getItem("alienmax-lastpost") || 0;
      if (Date.now() - last < 20000) return false;
      localStorage.setItem("alienmax-lastpost", String(Date.now()));
    } catch (e) {}
    return true;
  }

  // ¿hay a dónde mandar los mensajes?
  const canSend = !!(C.email || C.repo);

  /**
   * Manda el mensaje al dueño. kind = "firma" | "comentario".
   * Con `email` (data/social.js) se envía por formsubmit.co: el visitante no necesita nada.
   * Sin email abre una Issue de GitHub ya escrita (el visitante necesita cuenta de GitHub).
   * Formato (el panel lo lee tal cual): tipo / entrada / nombre / neocities / mensaje.
   * Devuelve una promesa {ok, via}. Llamarla dentro del submit (la ventana de GitHub se abre en el acto).
   */
  function send(kind, who, text, post) {
    if (!canSend) return Promise.resolve({ ok: false, via: "" });
    const title = (kind === "firma" ? "[Firma] " : "[Comentario] ") + who.name + (post ? " · " + post.title : "");
    const body =
      "tipo: " + kind + "\n" +
      (post ? "entrada: " + post.id + "\n" : "") +
      "nombre: " + who.name + "\n" +
      "neocities: " + (who.neocities || "") + "\n" +
      "mensaje:\n" + text + "\n\n" +
      "(Envía este mensaje tal cual. AlienMax lo revisará antes de publicarlo.)";
    if (C.email) {
      return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(C.email), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: title, _template: "box", _captcha: "false", mensaje_para_el_panel: body }),
      }).then((r) => ({ ok: r.ok, via: "email" })).catch(() => ({ ok: false, via: "email" }));
    }
    window.open("https://github.com/" + C.repo + "/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(body), "_blank", "noopener");
    return Promise.resolve({ ok: true, via: "github" });
  }

  const sentNote = (r) =>
    r && r.via === "github"
      ? "Se abrió GitHub: pulsa «Submit new issue» para enviarlo. AlienMax lo revisará antes de publicarlo."
      : "¡Enviado! AlienMax lo revisará y, cuando lo apruebe, lo verá todo el mundo.";

  window.SOCIAL_API = { canSend, send, sentNote, who, fmt, identityHTML, readIdentity, wireIdentity, cooldown, esc };
})();
