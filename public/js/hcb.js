/* ============================================
   hcb.js — comentarios con HTML Comment Box (htmlcommentbox.com)
   Sin aprobación previa y sin tocar el repo: los comentarios viven en su servidor.
   Se activa al poner «mod» en data/social.js → hcb (viene del código que da su panel).
   Su widget solo admite uno por página, así que se mueve al hilo que se abre.
   ============================================ */
(function () {
  const C = (window.SOCIAL && window.SOCIAL.hcb) || {};
  const H = "https://www.htmlcommentbox.com";
  const T = window.I18N.t, EN = window.I18N.en;
  const enabled = !!(C.mod && /^[\w$.%\-]+$/.test(C.mod));

  // cada hilo va en su propio iframe: así cada entrada tiene sus comentarios y no se mezclan
  const CSS =
    "html,body{margin:0;background:transparent!important;color:#e8dcff;font-size:13px;line-height:1.5}" +
    "#HCB_comment_box,#HCB_comment_box *{font-family:inherit}" +
    "#HCB_comment_box{color:#e8dcff}" +
    "#HCB_comment_box a{color:#c9a7ff!important}#HCB_comment_box a:hover{color:#fff!important}" +
    "#HCB_comment_box h3,#HCB_comment_box .hcb-title{color:#ffb0ea;font-size:14px;margin:4px 0 8px}" +
    "#HCB_comment_box textarea,#HCB_comment_box input[type=text],#HCB_comment_box input[type=email],#HCB_comment_box input[type=url],#HCB_comment_box input[type=password],#HCB_comment_box input:not([type]){" +
      "color:#f3e9ff!important;background:linear-gradient(180deg,#0e0322,#1a0840)!important;border:1px solid #5e3aa6!important;border-radius:5px!important;padding:8px 10px!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.7)!important;max-width:100%;box-sizing:border-box}" +
    "#HCB_comment_box textarea{width:100%!important;min-height:80px}" +
    "#HCB_comment_box ::placeholder{color:#8a6fc0!important;font-style:italic;opacity:1}" +
    "#HCB_comment_box textarea:focus,#HCB_comment_box input:focus{outline:0;border-color:#c9a6ff!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.7),0 0 0 3px rgba(165,107,255,.35)!important}" +
    "#HCB_comment_box button,#HCB_comment_box input[type=submit],#HCB_comment_box input[type=button],#HCB_comment_box .btn,#HCB_comment_box a.btn{" +
      "color:#fff!important;text-shadow:0 -1px 0 rgba(0,0,0,.5);font-weight:bold;font-size:11px;padding:6px 14px!important;background:linear-gradient(180deg,#9a5cf5,#6a2fd0 50%,#5a22b8 51%,#6c32d6)!important;" +
      "border:1px solid #2a0d55!important;border-radius:4px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 1px 2px rgba(0,0,0,.5)!important;cursor:pointer}" +
    "#HCB_comment_box button:hover,#HCB_comment_box .btn:hover{background:linear-gradient(180deg,#b27cff,#7f45e6 50%,#6e34cf 51%,#8044e6)!important}" +
    "#HCB_comment_box b,#HCB_comment_box strong{color:#ffb0ea}" +
    "#HCB_comment_box [class*=time i],#HCB_comment_box small,#HCB_comment_box .muted{color:#8a6fc0!important}" +
    // fuera: puerta de login, aviso de «gracias» y RSS
    "#HCB_comment_box [class*=login i],#HCB_comment_box [id*=login i],#HCB_comment_box [title*=login i],#HCB_comment_box [title*='log in' i],#HCB_comment_box [title*='sign in' i],#HCB_comment_box [href*=login i],#HCB_comment_box [onclick*=login i]," +
    "#HCB_comment_box [class*=rss i],#HCB_comment_box [id*=rss i],#HCB_comment_box a[href*=rss i],#HCB_comment_box a[href*=feed i],#HCB_comment_box img[src*=rss i],#HCB_comment_box img[src*=feed i],#HCB_comment_box [class*=thank i],#HCB_comment_box [class*=login-],#HCB_comment_box [class*=signin i]{display:none!important}";
  const jsStr = (v) => JSON.stringify(String(v)).replace(/</g, "\\u003c");

  // un nombre escrito como @usuario se convierte en enlace a usuario.neocities.org (solo ese dominio; no se verifica que sea quien dice)
  const NAME_RE = /^@([a-z0-9][a-z0-9-]{0,31})$/i;
  // «Nombre :: enlace» = nombre con enlace propio (solo http/https)
  function parseName(t) {
    t = String(t || "").trim();
    let m = NAME_RE.exec(t);
    if (m) { const u = m[1].toLowerCase(); return { label: u, url: "https://" + u + ".neocities.org/", title: u + ".neocities.org" }; }
    m = /^(.{1,40}?)\s*::\s*(\S{4,200})$/.exec(t);
    if (!m) return null;
    let link = m[2];
    if (!/^[a-z][a-z0-9+.-]*:/i.test(link)) link = "https://" + link;
    try {
      const u = new URL(link);
      if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null;
      return { label: m[1], url: u.href, title: u.hostname };
    } catch (e) { return null; }
  }

  // el widget viene en inglés: en español se traducen sus textos conocidos (lo que no conozco se queda en inglés)
  const ES = { "Comments": "Comentarios", "Name": "Nombre", "Enter your comment here": "Escribe tu comentario aquí", "Comment": "Comentar", "Add Image": "Añadir imagen",
    "Post another comment": "Publicar otro comentario", "Like": "Me gusta", "Unlike": "Ya no me gusta", "Reply": "Responder", "Flag": "Reportar", "Cancel": "Cancelar", "Delete": "Eliminar", "Edit": "Editar",
    "Not using": "¿Aún no usas", "yet?": "?", "No one has commented yet. Be the first!": "Nadie ha comentado aún. ¡Sé el primero!", "Show more": "Ver más", "Load more": "Cargar más",
    "within the last minute": "hace menos de un minuto", "Anonymous": "Anónimo", "Reply to": "Responder a", "Post": "Publicar", "Submit": "Enviar", "Your comment": "Tu comentario" };
  const UNITS = { second: "segundo", minute: "minuto", hour: "hora", day: "día", week: "semana", month: "mes", year: "año" };
  function toEs(txt) {
    const m = /^(\s*[·•]?\s*)(.*?)(\s*[·•]?\s*)$/s.exec(txt);
    const core = m[2];
    if (ES[core]) return (ES[core] === "?" ? "" : m[1]) + ES[core] + m[3];
    const ago = /^(\d+|an?|one) (second|minute|hour|day|week|month|year)s? ago$/i.exec(core);
    if (ago) {
      const n = /^\d+$/.test(ago[1]) ? +ago[1] : 1, u = UNITS[ago[2].toLowerCase()];
      return m[1] + "hace " + n + " " + (n === 1 ? u : (u === "mes" ? "meses" : u + "s")) + m[3];
    }
    return null;
  }
  // «Anónimo» / «Anonymous» se muestra en el idioma de quien lee
  function localize(d) {
    const w = d.createTreeWalker(d.getElementById("HCB_comment_box") || d.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const par = n.parentNode;
      if (!par || /^(SCRIPT|STYLE|TEXTAREA)$/.test(par.nodeName)) continue;
      const raw = n.nodeValue;
      if (!raw.trim()) continue;
      if (/^\s*an[óo]nim(o|ous)\s*$/i.test(raw)) { const v = T("anon"); if (raw.trim() !== v) n.nodeValue = raw.replace(raw.trim(), v); continue; }
      if (EN) continue;
      const out = toEs(raw);
      if (out != null && out !== raw) n.nodeValue = out;
    }
    if (EN) return;
    d.querySelectorAll("#HCB_comment_box [placeholder]").forEach((el) => { const v = ES[el.getAttribute("placeholder")]; if (v) el.setAttribute("placeholder", v); });
    d.querySelectorAll("#HCB_comment_box input[type=submit],#HCB_comment_box input[type=button]").forEach((el) => { const v = ES[el.value]; if (v) el.value = v; });
  }

  function linkNames(f, ident) {
    let d;
    try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.body) return;
    const hide = (el) => {
      if (!el || el === d.body || el.id === "HCB_comment_box") return;
      el.style.display = "none";
      // si el contenedor se queda sin nada visible, también fuera (evita huecos)
      let par = el.parentElement;
      while (par && par.id !== "HCB_comment_box" && par !== d.body) {
        const vis = [...par.childNodes].some((c) => (c.nodeType === 3 && c.nodeValue.trim()) || (c.nodeType === 1 && c.style.display !== "none" && getComputedStyle(c).display !== "none"));
        if (vis) break;
        par.style.display = "none"; par = par.parentElement;
      }
    };
    const run = () => {
      localize(d);
      // «Thank you for commenting!»
      d.querySelectorAll("#HCB_comment_box *").forEach((el) => {
        if (el.children.length === 0 && /^\s*thank you for commenting!?\s*$/i.test(el.textContent)) hide(el);
      });
      // iconos de RSS / puerta de login que no se pueden reconocer por su nombre
      d.querySelectorAll("#HCB_comment_box a, #HCB_comment_box img, #HCB_comment_box span, #HCB_comment_box i, #HCB_comment_box svg").forEach((el) => {
        const t = ((el.getAttribute("src") || "") + (el.getAttribute("href") || "") + (el.getAttribute("class") || "") + (el.getAttribute("title") || "") + (el.getAttribute("alt") || "")).toLowerCase();
        if (/\b(rss|feed|login|log-in|signin|sign-in|log in|sign in)|(rss|feed|login)[._-]/.test(t)) hide(el);
      });
      // el campo «Nombre» del widget lo rellena la barra de identidad (y se esconde)
      const nameIn = [...d.querySelectorAll("#HCB_comment_box input")].find((i) => (!i.type || i.type === "text") && /name|nombre/i.test((i.placeholder || "") + (i.name || "") + (i.id || ""))) ||
        d.querySelector("#HCB_comment_box input[type=text]");
      if (nameIn && ident) {
        if (nameIn.value !== ident.value) {
          nameIn.value = ident.value;
          ["input", "change", "keyup"].forEach((ev) => nameIn.dispatchEvent(new Event(ev, { bubbles: true })));
        }
        nameIn.style.display = "none";
      }
      const w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
      const hits = [];
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const par = n.parentNode;
        if (!par || /^(A|SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(par.nodeName)) continue;
        const pn = parseName(n.nodeValue);
        if (pn) hits.push([n, pn]);
      }
      hits.forEach(([n, pn]) => {
        const a = d.createElement("a");
        a.href = pn.url;
        a.target = "_blank"; a.rel = "noopener nofollow ugc";
        a.title = "Ir a " + pn.title;
        a.textContent = pn.label;
        n.parentNode.replaceChild(a, n);
      });
    };
    run();
    if (ident) ident.refresh = run;
    new MutationObserver(run).observe(d.body, { childList: true, subtree: true });
  }

  // barra «Comentar como»: Anónimo / usuario de Neocities / nombre + enlace propio
  const USER_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
  function identityBar(host, ident) {
    const bar = document.createElement("div");
    bar.className = "hcb-ident";
    bar.innerHTML =
      '<div class="hcb-modes" role="radiogroup" aria-label="' + T("cm.as") + '">' +
        '<button type="button" class="hcb-mode on" data-m="anon">' + T("id.anon") + '</button>' +
        '<button type="button" class="hcb-mode" data-m="nc">' + T("id.nc") + '</button>' +
        '<button type="button" class="hcb-mode" data-m="custom">' + T("id.custom") + '</button>' +
      "</div>" +
      '<div class="hcb-fields" data-for="nc" hidden><input type="text" class="nc-input" data-f="user" maxlength="32" placeholder="' + T("id.user.ph") + '" autocomplete="off" spellcheck="false"><span class="hcb-suf">.neocities.org</span></div>' +
      '<div class="hcb-fields" data-for="custom" hidden><input type="text" class="nc-input" data-f="name" maxlength="40" placeholder="' + T("id.name.ph") + '" autocomplete="off"><input type="text" class="nc-input" data-f="link" maxlength="120" placeholder="' + T("id.link.ph") + '" autocomplete="off" spellcheck="false"></div>' +
      '<div class="hcb-as fine"></div>';
    host.appendChild(bar);
    let mode = "anon";
    const q = (sel) => bar.querySelector(sel);
    // se recuerda la última elección (modo, usuario, nombre y enlace) en este navegador
    const MEM = "alienmax-ident";
    const apply = () => {
      bar.querySelectorAll(".hcb-mode").forEach((x) => x.classList.toggle("on", x.dataset.m === mode));
      bar.querySelectorAll(".hcb-fields").forEach((x) => { x.hidden = x.dataset.for !== mode; });
    };
    try {
      const m = JSON.parse(localStorage.getItem(MEM) || "null");
      if (m && /^(anon|nc|custom)$/.test(m.mode)) {
        mode = m.mode;
        ["user", "name", "link"].forEach((k) => { if (typeof m[k] === "string") q("[data-f=" + k + "]").value = m[k].slice(0, 120); });
        apply();
      }
    } catch (e) {}
    const remember = () => {
      try {
        localStorage.setItem(MEM, JSON.stringify({ mode: mode, user: q("[data-f=user]").value, name: q("[data-f=name]").value, link: q("[data-f=link]").value }));
      } catch (e) {}
    };
    const update = () => {
      let v = "Anónimo", note = T("id.n.anon");
      if (mode === "nc") {
        const u = q('[data-f=user]').value.trim().toLowerCase().replace(/^@/, "").replace(/\.neocities\.org.*$/, "");
        if (USER_RE.test(u)) { v = "@" + u; note = T("id.n.nc", { u: u }); }
        else note = T(u ? "id.n.ncbad" : "id.n.ncempty");
      } else if (mode === "custom") {
        const n = q('[data-f=name]').value.trim().replace(/\s*::\s*/g, " "), l = q('[data-f=link]').value.trim();
        if (n) {
          const pn = l ? parseName(n + " :: " + l) : null;
          if (pn) { v = n + " :: " + l.replace(/^https?:\/\//i, ""); note = T("id.n.custom", { n: n, h: pn.title }); }
          else { v = n; note = l ? T("id.n.linkbad") : T("id.n.customnolink", { n: n }); }
        } else note = T("id.n.customempty");
      }
      ident.value = v;
      remember();
      q(".hcb-as").textContent = note;
      if (ident.refresh) ident.refresh();
    };
    bar.addEventListener("click", (e) => {
      const b = e.target.closest(".hcb-mode");
      if (!b) return;
      mode = b.dataset.m;
      apply();
      update();
    });
    bar.addEventListener("input", update);
    update();
  }

  function mount(host, key) {
    if (!enabled || !host || host.dataset.hcb) return;
    host.dataset.hcb = "1";
    const ident = { value: "Anónimo" };
    identityBar(host, ident);
    const src = H + "/jread?page=" + encodeURIComponent(key).replace("+", "%2B") +
      "&mod=" + encodeURIComponent(C.mod) + "&opts=" + encodeURIComponent(C.opts || "16798") +
      "&num=" + encodeURIComponent(C.num || 10);
    const css = C.css && /^https:\/\/www\.htmlcommentbox\.com\//.test(C.css) ? '<link rel="stylesheet" href="' + C.css + '">' : "";
    const f = document.createElement("iframe");
    f.className = "hcb-frame"; f.title = "Comentarios"; f.scrolling = "no";
    f.style.cssText = "width:100%;border:0;height:160px;background:transparent";
    f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base target="_blank">' + css + "<style>" + CSS + "</style></head><body>" +
      '<div id="HCB_comment_box">Cargando comentarios…</div><script>window.hcb_user={PAGE:' + jsStr(key) + '};<\/script>' +
      '<script src=' + jsStr(src) + "><\/script></body></html>";
    host.appendChild(f);
    // altura fija con desplazamiento propio: medir el contenido hacía crecer el recuadro sin parar
    // altura = parte baja del último contenido real (hojas: texto, campos, botones). Los contenedores no cuentan,
    // así el recuadro no depende de su propio tamaño y no puede crecer solo.
    let last = 0;
    const fit = () => {
      try {
        const d = f.contentDocument, root = d.getElementById("HCB_comment_box");
        if (!root) return;
        let bottom = 0;
        root.querySelectorAll("*").forEach((el) => {
          const leaf = el.children.length === 0 || /^(TEXTAREA|INPUT|BUTTON|IMG|SELECT)$/.test(el.tagName);
          if (!leaf || el.nodeName === "SCRIPT" || el.nodeName === "STYLE") return;
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) bottom = Math.max(bottom, r.bottom);
        });
        const h = Math.min(1600, Math.ceil(bottom + (d.defaultView.scrollY || 0)) + 14);
        if (h > 60 && Math.abs(h - last) > 3) { last = h; f.style.height = h + "px"; }
      } catch (e) {}
    };
    f.addEventListener("load", () => { linkNames(f, ident); fit(); setInterval(fit, 500); });
  }

  // mientras se arrastra algo (p. ej. Ditto) el iframe no debe «tragarse» el ratón
  if (enabled) {
    const st = document.createElement("style");
    st.textContent = "html.hcb-drag iframe.hcb-frame{pointer-events:none!important}";
    document.head.appendChild(st);
    const on = () => document.documentElement.classList.add("hcb-drag");
    const off = () => document.documentElement.classList.remove("hcb-drag");
    window.addEventListener("pointerdown", on, true);
    window.addEventListener("touchstart", on, true);
    ["pointerup", "pointercancel", "touchend", "touchcancel", "blur", "dragend"].forEach((ev) => window.addEventListener(ev, off, true));
  }

  // identificador estable del hilo (igual en GitHub Pages y en Neocities)
  const key = (id) => "https://alienmax.neocities.org/" + id;
  window.HCB = { enabled, mount, key,
    tip: "" };
})();
