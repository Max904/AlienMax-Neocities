/* ============================================
   social.js — firmas y comentarios moderados + identidad
   Identidad: "Anónimo" o un usuario de Neocities (sin verificar; enlaza a su sitio).
   El visitante envía su mensaje sin cuenta (aviso en ntfy.sh) o, si no hay ntfy, como Issue de GitHub (ver data/social.js);
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
    return '<span class="anon">' + esc(!e.name || /^an[óo]nim(o|ous)$/i.test(e.name) ? window.I18N.t("anon") : e.name) + "</span>";
  }

  function fmt(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    if (m) return m[3] + "/" + m[2] + "/" + m[1];
    const d = new Date(s);
    return isNaN(d) ? esc(s || "") : d.toLocaleDateString(window.I18N.locale);
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
  const canSend = !!(C.ntfy || C.repo);

  const asyncFail = (via, e) => ({ ok: false, via: via, detail: "sin conexión con " + via + " (" + ((e && e.message) || "error") + ")" });

  // aviso instantáneo en ntfy.sh (sin cuentas): recibes el mensaje en el celular o en https://ntfy.sh/<tu-tema>
  // reviewUrl abre el panel con el mensaje ya cargado, listo para aprobar o descartar
  function reviewUrl(body) {
    return C.admin ? C.admin.replace(/#.*$/, "") + "#msg=" + encodeURIComponent(body) : "";
  }

  function sendNtfy(title, body) {
    const url = reviewUrl(body);
    const note = { topic: C.ntfy, title: title, message: body, tags: ["alien"] };
    if (url) { note.click = url; note.actions = [{ action: "view", label: "Revisar y aprobar", url: url, clear: true }]; }
    return fetch("https://ntfy.sh/", {
      method: "POST",
      body: JSON.stringify(note),
    }).then((r) => ({ ok: r.ok, via: "ntfy", detail: r.ok ? "" : "ntfy respondió HTTP " + r.status })).catch((e) => asyncFail("ntfy", e));
  }

  /**
   * Manda el mensaje al dueño. kind = "firma" | "comentario".
   * Canales (data/social.js):
   *   ntfy → aviso instantáneo, sin cuentas ni activación
   *   repo → solo si no hay ntfy: abre una Issue (el visitante necesita cuenta de GitHub)
   * Formato (el panel lo lee tal cual): tipo / entrada / nombre / neocities / mensaje.
   * Devuelve una promesa {ok, via, detail}.
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
    const jobs = [];
    if (C.ntfy) jobs.push(sendNtfy(title, body));
    if (!jobs.length) {
      window.open("https://github.com/" + C.repo + "/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(body), "_blank", "noopener");
      return Promise.resolve({ ok: true, via: "github" });
    }
    return Promise.all(jobs).then((rs) => rs.find((r) => r.ok) || rs[0]);
  }

  const failNote = (r) => "No se pudo enviar" + (r && r.detail ? ": " + r.detail : "") + ".";

  const sentNote = (r) =>
    r && r.via === "github"
      ? "Se abrió GitHub: pulsa «Submit new issue» para enviarlo. AlienMax lo revisará antes de publicarlo."
      : "¡Enviado! AlienMax lo revisará y, cuando lo apruebe, lo verá todo el mundo.";

  window.SOCIAL_API = { canSend, send, sentNote, failNote, who, fmt, identityHTML, readIdentity, wireIdentity, cooldown, esc };
})();
