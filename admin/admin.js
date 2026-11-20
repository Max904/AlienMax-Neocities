/* ============================================
   admin.js — panel para editar el contenido del sitio

   - Edita window.SITE (data/content.js) con formularios.
   - Guarda un borrador en este navegador (localStorage).
   - "Publicar" hace un commit a GitHub por API; el workflow de
     Deploy to Neocities sube el cambio al sitio.
   ============================================ */
(function () {
  "use strict";

  const DRAFT_KEY = "alienmax-draft";
  const CFG_KEY = "alienmax-admin-cfg";
  const CONTENT_PATH = "public/data/content.js";
  const UPLOAD_DIR = "public/assets/uploads/";

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const $ = (s, r) => (r || document).querySelector(s);

  // ---------- estado ----------
  let original = clone(window.SITE || {});
  let data = clone(original);

  function normalize(d) {
    d.site = d.site || {};
    d.profile = d.profile || {};
    d.home = d.home || {};
    d.about = d.about || {};
    d.about.favorites = d.about.favorites || [];
    d.about.friends = d.about.friends || [];
    d.posts = d.posts || [];
    d.music = d.music || [];
    d.gallery = d.gallery || [];
    return d;
  }
  normalize(original);
  normalize(data);

  let cfg = { owner: "", repo: "", branch: "main", token: "", remember: true };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(CFG_KEY) || "{}")); } catch (e) {}

  // en GitHub Pages (usuario.github.io/repo/admin/) el usuario y el repo se deducen de la URL
  if (/\.github\.io$/i.test(location.hostname)) {
    if (!cfg.owner) cfg.owner = location.hostname.split(".")[0];
    if (!cfg.repo) cfg.repo = location.pathname.split("/").filter(Boolean)[0] || "";
  }

  // ---------- helpers DOM ----------
  function el(tag, attrs) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n[k] = v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach((c) => {
        if (c == null) return;
        n.append(c.nodeType ? c : document.createTextNode(c));
      });
    }
    return n;
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ---------- borrador / estado de cambios ----------
  function isDirty() { return JSON.stringify(data) !== JSON.stringify(original); }

  function paintPill() {
    const pill = $("#dirty-pill");
    const d = isDirty();
    pill.textContent = d ? "Cambios sin publicar" : "Sin cambios";
    pill.className = "pill " + (d ? "dirty" : "ok");
  }

  function changed() {
    try {
      if (isDirty()) localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      else localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
    paintPill();
  }

  function saveCfg() {
    try {
      const copy = Object.assign({}, cfg);
      if (!cfg.remember) copy.token = "";
      localStorage.setItem(CFG_KEY, JSON.stringify(copy));
    } catch (e) {}
  }

  // ---------- campos ----------
  function parseComments(text) {
    return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? { name: l.slice(0, i).trim(), text: l.slice(i + 1).trim() } : { name: "anónimo", text: l };
    });
  }

  /**
   * obj[key] <-> input. Tipos: text, textarea, date, number,
   * lines (una por línea), tags (separadas por coma), comments ("nombre: texto").
   */
  function field(label, obj, key, o) {
    o = o || {};
    const type = o.type || "text";
    const multi = type === "textarea" || type === "lines" || type === "comments";
    const input = multi ? el("textarea", { rows: o.rows || 4 }) : el("input", { type: type === "tags" ? "text" : type });

    const read = () => {
      const v = obj[key];
      if (type === "lines") return (v || []).join("\n");
      if (type === "tags") return (v || []).join(", ");
      if (type === "comments") return (v || []).map((c) => c.name + ": " + c.text).join("\n");
      return v == null ? "" : v;
    };
    input.value = read();

    let thumb = null;
    if (o.thumb) {
      thumb = el("img", { class: "thumb", alt: "" });
      if (obj[key]) thumb.src = obj[key];
    }

    input.addEventListener("input", () => {
      let v = input.value;
      if (type === "lines") v = v.split("\n").map((s) => s.trim()).filter(Boolean);
      else if (type === "tags") v = v.split(",").map((s) => s.trim()).filter(Boolean);
      else if (type === "comments") v = parseComments(v);
      else if (type === "number") v = parseInt(v || "0", 10) || 0;
      obj[key] = v;
      if (thumb) thumb.src = v || "";
      changed();
    });

    const parts = [el("span", null, label)];
    if (o.hint) parts.push(el("small", null, o.hint));

    if (o.upload) {
      const up = uploadButton("⬆ Subir imagen", (path) => {
        obj[key] = path;
        input.value = path;
        if (thumb) thumb.src = path;
        changed();
      });
      parts.push(el("div", { class: "input-row" }, input, up));
    } else {
      parts.push(input);
    }
    if (thumb) parts.push(thumb);

    return el("label", { class: "f" + (o.wide ? " wide" : "") }, parts);
  }

  // ---------- subida de imágenes (commit a GitHub) ----------
  function uploadButton(text, onDone) {
    const file = el("input", { type: "file", accept: "image/*", hidden: true });
    const btn = el("button", { type: "button", class: "btn" }, text);
    btn.onclick = (e) => { e.preventDefault(); file.click(); };
    file.onchange = async () => {
      const f = file.files[0];
      if (!f) return;
      if (!configReady()) { alert("Primero configura GitHub en la pestaña Publicar."); file.value = ""; return; }
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = "Subiendo…";
      try {
        const safe = Date.now().toString(36) + "-" + f.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const b64 = await readAsBase64(f);
        await putFile(UPLOAD_DIR + safe, b64, "Subir imagen " + safe);
        onDone("assets/uploads/" + safe);
      } catch (err) {
        alert("No se pudo subir la imagen:\n" + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = old;
        file.value = "";
      }
    };
    return el("span", null, btn, file);
  }

  function readAsBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.onerror = () => reject(new Error("No se pudo leer el archivo"));
      r.readAsDataURL(file);
    });
  }

  // ---------- API de GitHub ----------
  function configReady() { return cfg.owner && cfg.repo && cfg.branch && cfg.token; }

  function api(method, path, body) {
    return fetch("https://api.github.com" + path, {
      method: method,
      headers: Object.assign(
        { Accept: "application/vnd.github+json", Authorization: "Bearer " + cfg.token },
        body ? { "Content-Type": "application/json" } : {}
      ),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function apiError(res) {
    let msg = "";
    try { msg = (await res.json()).message || ""; } catch (e) {}
    const hints = {
      401: "El token no es válido o venció.",
      403: "El token no tiene permiso (necesita Contents: Read and write) o se alcanzó un límite.",
      404: "No se encontró el repo, la rama o la ruta. Si el repo es privado, revisa que el token tenga acceso a él.",
      409: "Conflicto: el archivo cambió en GitHub mientras editabas.",
      422: "GitHub rechazó el cambio.",
    };
    return new Error("GitHub respondió " + res.status + (msg ? " (" + msg + ")" : "") + ". " + (hints[res.status] || ""));
  }

  async function putFile(path, b64, message) {
    const base = "/repos/" + encodeURIComponent(cfg.owner) + "/" + encodeURIComponent(cfg.repo) + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
    for (let attempt = 0; attempt < 2; attempt++) {
      let sha;
      const g = await api("GET", base + "?ref=" + encodeURIComponent(cfg.branch));
      if (g.ok) sha = (await g.json()).sha;
      else if (g.status !== 404) throw await apiError(g);

      const p = await api("PUT", base, { message: message, content: b64, branch: cfg.branch, sha: sha });
      if (p.ok) return p.json();
      if (p.status === 409 && attempt === 0) continue; // sha desactualizado: reintenta una vez
      throw await apiError(p);
    }
  }

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  function serialize() { return "window.SITE = " + JSON.stringify(data, null, 2) + ";\n"; }

  // ---------- listas editables ----------
  function listPanel(arr, o) {
    const wrap = el("div");
    let openIdx = -1;

    function draw() {
      wrap.innerHTML = "";
      const add = el("button", { type: "button", class: "btn go" }, o.addLabel);
      add.onclick = () => { arr.unshift(o.create()); openIdx = 0; changed(); draw(); };
      wrap.append(add);
      if (o.extraTop) wrap.append(o.extraTop(() => { openIdx = 0; changed(); draw(); }));

      if (!arr.length) wrap.append(el("p", { class: "hint", style: "margin-top:10px" }, "Aún no hay nada aquí."));

      arr.forEach((item, i) => {
        const d = el("details", { class: "item" });
        if (i === openIdx) d.open = true;
        d.append(el("summary", null, o.title(item, i)));

        const body = el("div", { class: "item-body" }, el("div", { class: "grid-2" }, o.fields(item)));
        const up = el("button", { type: "button", class: "btn" }, "↑ subir");
        const down = el("button", { type: "button", class: "btn" }, "↓ bajar");
        const del = el("button", { type: "button", class: "btn danger" }, "🗑 borrar");
        up.onclick = () => { if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; openIdx = i - 1; changed(); draw(); } };
        down.onclick = () => { if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; openIdx = i + 1; changed(); draw(); } };
        del.onclick = () => { if (confirm("¿Borrar esto?")) { arr.splice(i, 1); openIdx = -1; changed(); draw(); } };
        body.append(el("div", { class: "btn-row" }, up, down, del));
        d.append(body);
        wrap.append(d);
      });
    }
    draw();
    return wrap;
  }

  // ---------- pestañas ----------
  const TABS = {
    sitio: { title: "⚙ SITIO Y PERFIL", render: tabSitio },
    textos: { title: "✎ INICIO Y SOBRE MÍ", render: tabTextos },
    blogs: { title: "📓 BLOGS", render: tabBlogs },
    musica: { title: "♪ MÚSICA RECOMENDADA", render: tabMusica },
    galeria: { title: "❀ GALERÍA", render: tabGaleria },
    publicar: { title: "🚀 PUBLICAR", render: tabPublicar },
  };

  function tabSitio() {
    const s = data.site, p = data.profile;
    return el("div", { class: "grid-2" },
      field("Título del sitio", s, "title"),
      field("Subtítulo (inicio)", s, "tagline"),
      field("Subtítulo (blogs)", s, "blogTagline"),
      el("span"),
      field("Texto que se desplaza (marquee)", s, "marquee", { type: "textarea", rows: 2, wide: true }),
      field("Tu nombre de usuario", p, "name"),
      field("Estado", p, "status", { hint: "Puedes usar emojis" }),
      field("Ánimo", p, "mood"),
      field("Planeta", p, "planet"),
      field("Color favorito", p, "color"),
      field("Foto de perfil (ruta o URL)", p, "avatar", { upload: true, thumb: true })
    );
  }

  function tabTextos() {
    const h = data.home, a = data.about;
    return el("div", { class: "grid-2" },
      field("Bienvenida del inicio", h, "welcome", { type: "textarea", rows: 8, wide: true, hint: "Línea en blanco = párrafo nuevo. Enlaces: [texto](https://...)" }),
      field("Sobre mí: presentación", a, "intro", { type: "textarea", rows: 5, wide: true }),
      field("Mis cosas favoritas", a, "favorites", { type: "lines", rows: 6, wide: true, hint: "Una por línea" }),
      field("Lema", a, "motto", { wide: true }),
      field("Amigos del espacio (imágenes)", a, "friends", { type: "lines", rows: 4, wide: true, hint: "Una ruta o URL por línea, por ejemplo assets/flower.gif" })
    );
  }

  function tabBlogs() {
    return listPanel(data.posts, {
      addLabel: "+ Nueva entrada",
      create: () => ({ id: "p" + Date.now().toString(36), title: "Nueva entrada", date: todayISO(), mood: "", tags: [], image: "", likes: 0, body: "", comments: [] }),
      title: (p) => (p.date || "sin fecha") + " — " + (p.title || "sin título"),
      fields: (p) => [
        field("Título", p, "title", { wide: true }),
        field("Fecha", p, "date", { type: "date" }),
        field("Ánimo", p, "mood", { hint: "Ej: ✦ curioso" }),
        field("Etiquetas", p, "tags", { type: "tags", hint: "Separadas por coma" }),
        field("Likes iniciales", p, "likes", { type: "number" }),
        field("Imagen (opcional)", p, "image", { upload: true, thumb: true, wide: true }),
        field("Texto", p, "body", { type: "textarea", rows: 9, wide: true, hint: "Línea en blanco = párrafo nuevo. Enlaces: [texto](https://...)" }),
        field("Comentarios", p, "comments", { type: "comments", rows: 3, wide: true, hint: "Uno por línea con el formato  nombre: comentario" }),
      ],
    });
  }

  function tabMusica() {
    return listPanel(data.music, {
      addLabel: "+ Nueva canción",
      create: () => ({ title: "Título", artist: "", note: "", url: "", cover: "" }),
      title: (m) => (m.title || "sin título") + (m.artist ? " — " + m.artist : ""),
      fields: (m) => [
        field("Canción / álbum", m, "title"),
        field("Artista", m, "artist"),
        field("Enlace", m, "url", { wide: true, hint: "Si es de YouTube se podrá reproducir en la página" }),
        field("Portada (opcional)", m, "cover", { upload: true, thumb: true, wide: true }),
        field("Por qué la recomiendas", m, "note", { type: "textarea", rows: 3, wide: true }),
      ],
    });
  }

  function tabGaleria() {
    return listPanel(data.gallery, {
      addLabel: "+ Nueva imagen",
      create: () => ({ src: "", caption: "" }),
      title: (g) => g.caption || g.src || "sin título",
      fields: (g) => [
        field("Imagen", g, "src", { upload: true, thumb: true, wide: true }),
        field("Texto", g, "caption", { wide: true }),
      ],
    });
  }

  function tabPublicar() {
    const root = el("div");
    root.append(
      el("p", { class: "hint" },
        "Aquí conectas el panel con tu repo de GitHub. Al publicar se hace un commit a ",
        el("code", null, CONTENT_PATH),
        " y el workflow de Deploy to Neocities actualiza el sitio (tarda uno o dos minutos)."
      )
    );

    const form = el("div", { class: "grid-2" },
      field("Usuario u organización de GitHub", cfg, "owner", { }),
      field("Nombre del repo", cfg, "repo"),
      field("Rama", cfg, "branch"),
      (() => {
        const lab = field("Token de GitHub", cfg, "token", { type: "password", hint: "Token fine-grained solo para este repo, con Contents: Read and write" });
        return lab;
      })()
    );
    // los datos de conexión no son contenido del sitio: guardarlos aparte
    form.querySelectorAll("input").forEach((i) => i.addEventListener("input", saveCfg));

    const remember = el("input", { type: "checkbox" });
    remember.checked = !!cfg.remember;
    remember.onchange = () => { cfg.remember = remember.checked; saveCfg(); };

    const log = el("div", { class: "log" }, "Listo.");
    const say = (msg, cls) => { log.className = "log" + (cls ? " " + cls : ""); log.textContent = msg; };

    const test = el("button", { type: "button", class: "btn" }, "Probar conexión");
    test.onclick = async () => {
      if (!configReady()) return say("Completa usuario, repo, rama y token.", "err");
      say("Probando…");
      try {
        const r = await api("GET", "/repos/" + encodeURIComponent(cfg.owner) + "/" + encodeURIComponent(cfg.repo));
        if (!r.ok) throw await apiError(r);
        const j = await r.json();
        const canPush = j.permissions && j.permissions.push;
        say("Conectado a " + j.full_name + (canPush ? ". El token puede escribir." : ". ¡Ojo! El token no parece poder escribir."), canPush ? "ok" : "err");
      } catch (e) { say(e.message, "err"); }
    };

    const publish = el("button", { type: "button", class: "btn go" }, "🚀 Publicar cambios");
    publish.onclick = async () => {
      if (!configReady()) return say("Completa usuario, repo, rama y token.", "err");
      if (!isDirty()) return say("No hay cambios que publicar.");
      publish.disabled = true;
      say("Publicando…");
      try {
        await putFile(CONTENT_PATH, toBase64(serialize()), "Actualizar contenido desde el panel");
        original = clone(data);
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
        paintPill();
        $("#draft-banner").hidden = true;
        say("Publicado ✔\nGitHub Actions subirá los cambios a Neocities en uno o dos minutos. Puedes ver el progreso en la pestaña Actions de tu repo.", "ok");
      } catch (e) { say(e.message, "err"); }
      publish.disabled = false;
    };

    const dl = el("button", { type: "button", class: "btn" }, "⬇ Descargar content.js");
    dl.onclick = () => {
      const a = el("a", { href: URL.createObjectURL(new Blob([serialize()], { type: "text/javascript" })), download: "content.js" });
      document.body.append(a); a.click(); a.remove();
      say("Descargado. Reemplaza public/data/content.js en tu repo con este archivo.");
    };

    root.append(
      form,
      el("label", { class: "check", style: "margin-top:10px" }, remember, "Recordar el token en este navegador (no lo uses en un computador compartido)"),
      el("div", { class: "btn-row" }, test, publish, dl),
      log,
      el("p", { class: "hint", style: "margin-top:12px" },
        "El token solo se guarda en este navegador y solo se envía a api.github.com. Crea uno en GitHub: Settings → Developer settings → Personal access tokens → Fine-grained tokens, limitado a este repo."
      )
    );
    return root;
  }

  // ---------- navegación ----------
  function show(name) {
    const t = TABS[name];
    $("#panel-title").textContent = t.title;
    const panel = $("#panel");
    panel.innerHTML = "";
    panel.append(t.render());
    document.querySelectorAll("#admin-tabs a[data-tab]").forEach((a) => a.classList.toggle("active", a.dataset.tab === name));
  }

  document.querySelectorAll("#admin-tabs a[data-tab]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); show(a.dataset.tab); });
  });

  // ---------- borrador previo ----------
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = normalize(JSON.parse(raw));
      if (JSON.stringify(draft) !== JSON.stringify(original)) {
        data = draft;
        $("#draft-banner").hidden = false;
      }
    }
  } catch (e) {}

  $("#discard-draft").addEventListener("click", () => {
    if (!confirm("¿Descartar el borrador y volver a la versión publicada?")) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    data = clone(original);
    $("#draft-banner").hidden = true;
    paintPill();
    const active = document.querySelector("#admin-tabs a.active[data-tab]");
    show(active ? active.dataset.tab : "sitio");
  });

  // avisar si se cierra con cambios sin publicar
  window.addEventListener("beforeunload", (e) => {
    if (isDirty()) { e.preventDefault(); e.returnValue = ""; }
  });

  paintPill();
  show("sitio");
})();
