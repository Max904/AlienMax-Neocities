/* ============================================
   admin.js — panel para editar el contenido del sitio

   - Edita window.SITE (data/content.js) con formularios.
   - Guarda un borrador en este navegador (localStorage).
   - Paso 1 "Guardar en GitHub": commit a GitHub por API; el workflow
     pages.yml actualiza la copia en GitHub Pages para revisarla.
   - Paso 2 "Publicar en Neocities": lanza (workflow_dispatch) el workflow
     Deploy to Neocities con lo que ya está guardado en GitHub.
   ============================================ */
(function () {
  "use strict";

  const DRAFT_KEY = "alienmax-draft";
  const CFG_KEY = "alienmax-admin-cfg";
  const CONTENT_PATH = "public/data/content.js";
  const UPLOAD_DIR = "public/assets/uploads/";
  const PENDING_KEY = "alienmax-pending-neocities";

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
    // gifs: si falta algo se usan los valores por defecto (js/page-gifs.js)
    const PG = window.PAGE_GIFS;
    const t = d.topGif || {};
    d.topGif = { src: t.src == null ? PG.defaults.topGif : t.src, pages: {} };
    PG.pages.forEach((pg) => { d.topGif.pages[pg.key] = (t.pages && t.pages[pg.key]) || ""; });
    d.homeBox = PG.homeBox(d); // acepta el formato antiguo pageGifs.home
    delete d.pageGifs;
    return d;
  }
  normalize(original);
  normalize(data);

  // true = hay cambios guardados en GitHub que todavía no se publican en Neocities
  let pending = false;
  try { pending = localStorage.getItem(PENDING_KEY) === "1"; } catch (e) {}

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
    if (isDirty()) { pill.textContent = "Cambios sin guardar en GitHub"; pill.className = "pill dirty"; }
    else if (pending) { pill.textContent = "Guardado en GitHub · falta publicar en Neocities"; pill.className = "pill warn"; }
    else { pill.textContent = "Todo al día"; pill.className = "pill ok"; }
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

  // ---------- imágenes: rutas, biblioteca y selector ----------
  const IMG_RE = /\.(gif|png|jpe?g|webp|svg|avif)$/i;
  const sessionImgs = []; // subidas en esta sesión: { path, preview }
  const lib = { loaded: false, loading: null, files: [] }; // archivos del repo: { path, name, thumb }

  const baseName = (p) => String(p || "").split("/").pop();

  // las rutas del sitio son relativas a public/; el panel vive en admin/, un nivel más adentro
  function imgSrc(p) {
    p = String(p || "");
    return /^(https?:|data:|blob:)/i.test(p) ? p : "../" + p.replace(/^\/+/, "");
  }

  function thumbSrc(p) {
    const s = sessionImgs.find((x) => x.path === p);
    return s ? s.preview : imgSrc(p);
  }

  // muestra una miniatura; si la copia de Pages aún no la tiene, prueba la URL directa del repo
  function setThumb(img, path, fallback) {
    img.onerror = null;
    if (!path) { img.removeAttribute("src"); return; }
    img.onerror = () => {
      img.onerror = null;
      const f = fallback || (lib.files.find((x) => x.path === path) || {}).thumb;
      if (f) img.src = f;
    };
    img.src = thumbSrc(path);
  }

  async function listDir(dir) {
    const r = await api("GET", repoPath() + "/contents/" + dir.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(cfg.branch));
    if (r.status === 404) return [];
    if (!r.ok) throw await apiError(r);
    const j = await r.json();
    return (Array.isArray(j) ? j : [])
      .filter((f) => f.type === "file" && IMG_RE.test(f.name))
      .map((f) => ({ path: f.path.replace(/^public\//, ""), name: f.name, thumb: f.download_url || "" }));
  }

  async function loadLibrary(force) {
    if (!configReady()) return lib;
    if (lib.loaded && !force) return lib;
    if (lib.loading) return lib.loading;
    lib.loading = (async () => {
      try {
        const res = await Promise.all([listDir("public/assets"), listDir("public/assets/uploads")]);
        lib.files = res[0].concat(res[1]);
        lib.loaded = true;
      } finally { lib.loading = null; }
      return lib;
    })();
    return lib.loading;
  }

  // imágenes que el contenido ya usa en algún lado
  function referencedImages() {
    const out = [];
    const add = (p) => { if (p && IMG_RE.test(String(p).split("?")[0])) out.push(String(p)); };
    add(data.profile.avatar);
    data.posts.forEach((x) => add(x.image));
    data.music.forEach((x) => add(x.cover));
    data.gallery.forEach((x) => add(x.src));
    data.about.friends.forEach(add);
    add(data.topGif.src);
    Object.keys(data.topGif.pages).forEach((k) => add(data.topGif.pages[k]));
    add(data.homeBox.src);
    return out;
  }

  function libraryGroups() {
    const uploads = [], site = [];
    const put = (p, extra) => (/^assets\/uploads\//.test(p) ? uploads : site).push(Object.assign({ path: p, label: baseName(p) }, extra));
    sessionImgs.forEach((x) => put(x.path));
    lib.files.forEach((f) => put(f.path, { thumb: f.thumb }));
    referencedImages().forEach((p) => put(p));
    return [
      { title: "Imágenes subidas desde el panel", items: uploads },
      { title: "Imágenes del sitio", items: site },
    ];
  }

  // carátulas que ya usan otras canciones (para repetirla en el mismo álbum)
  function coverGroups(current) {
    const byPath = {};
    data.music.forEach((m) => {
      if (m === current || !m.cover) return;
      const label = (m.title || "sin título") + (m.artist ? " — " + m.artist : "");
      (byPath[m.cover] = byPath[m.cover] || []).push(label);
    });
    return [{
      title: "Carátulas de otras canciones (usa la misma para el mismo álbum)",
      items: Object.keys(byPath).map((path) => ({ path: path, label: byPath[path].join(" · ") })),
    }];
  }

  function pickThumb(it, o) {
    const img = el("img", { alt: "" });
    setThumb(img, it.path, it.thumb);
    const cur = o.current ? o.current() : "";
    const b = el("button", { type: "button", class: "thumb-btn" + (cur === it.path ? " sel" : ""), title: it.label || it.path },
      img, el("span", null, it.label || baseName(it.path)));
    b.onclick = () => {
      o.onPick(it.path);
      const box = b.closest(".picker");
      if (box) box.querySelectorAll(".thumb-btn.sel").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
    };
    return b;
  }

  /**
   * Selector de imágenes ya subidas. o: { onPick(path), current(), extra() -> grupos, open, label }
   * Grupo = { title, items: [{ path, label, thumb? }] }
   */
  function imagePicker(o) {
    const det = el("details", { class: "picker" }, el("summary", null, o.label || "🖼 Elegir una imagen ya subida"));
    const body = el("div", { class: "picker-body" });
    det.append(body);
    let drawn = false;

    async function draw(force) {
      drawn = true;
      body.textContent = "Cargando…";
      let note = "";
      if (configReady()) {
        try { await loadLibrary(force); } catch (e) { note = "No pude leer las imágenes del repo: " + e.message; }
      } else {
        note = "Conecta el panel con GitHub (pestaña Guardar y publicar) para ver también las imágenes subidas al repo.";
      }
      body.textContent = "";
      const seen = new Set();
      const groups = (o.extra ? o.extra() : []).concat(libraryGroups())
        .map((g) => ({ title: g.title, items: g.items.filter((it) => !seen.has(it.path) && seen.add(it.path)) }))
        .filter((g) => g.items.length);

      if (note) body.append(el("p", { class: "hint" }, note));
      groups.forEach((g) => {
        body.append(el("h4", null, g.title));
        body.append(el("div", { class: "thumbs" }, g.items.map((it) => pickThumb(it, o))));
      });
      if (!groups.length) body.append(el("p", { class: "hint" }, "Aún no hay imágenes para elegir."));
      if (configReady()) {
        const rf = el("button", { type: "button", class: "btn" }, "⟳ Actualizar lista");
        rf.onclick = () => draw(true);
        body.append(el("div", { class: "btn-row" }, rf));
      }
    }

    det.addEventListener("toggle", () => { if (det.open && !drawn) draw(false); });
    if (o.open) { det.open = true; if (!drawn) draw(false); }
    return det;
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
      setThumb(thumb, obj[key]);
    }

    const setValue = (path) => {
      obj[key] = path;
      input.value = path;
      if (thumb) setThumb(thumb, path);
      changed();
    };

    input.addEventListener("input", () => {
      let v = input.value;
      if (type === "lines") v = v.split("\n").map((s) => s.trim()).filter(Boolean);
      else if (type === "tags") v = v.split(",").map((s) => s.trim()).filter(Boolean);
      else if (type === "comments") v = parseComments(v);
      else if (type === "number") v = parseInt(v || "0", 10) || 0;
      obj[key] = v;
      if (thumb) setThumb(thumb, v);
      changed();
    });

    const parts = [el("span", null, label)];
    if (o.hint) parts.push(el("small", null, o.hint));

    if (o.upload) {
      parts.push(el("div", { class: "input-row" }, input, uploadButton("⬆ Subir imagen", setValue)));
    } else {
      parts.push(input);
    }
    if (thumb) parts.push(thumb);

    const wrap = el("div", { class: "fw" + (o.wide ? " wide" : "") }, el("label", { class: "f" }, parts));
    if (o.upload) {
      wrap.append(imagePicker({ onPick: setValue, current: () => obj[key], extra: o.pick, open: o.pickOpen, label: o.pickLabel }));
    }
    return wrap;
  }

  // ---------- subida de imágenes (commit a GitHub) ----------
  function uploadButton(text, onDone) {
    const file = el("input", { type: "file", accept: "image/*", hidden: true });
    const btn = el("button", { type: "button", class: "btn" }, text);
    btn.onclick = (e) => { e.preventDefault(); file.click(); };
    file.onchange = async () => {
      const f = file.files[0];
      if (!f) return;
      if (!configReady()) { alert("Primero configura GitHub en la pestaña Guardar y publicar."); file.value = ""; return; }
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = "Subiendo…";
      try {
        const safe = Date.now().toString(36) + "-" + f.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const b64 = await readAsBase64(f);
        await putFile(UPLOAD_DIR + safe, b64, "Subir imagen " + safe);
        const path = "assets/uploads/" + safe;
        sessionImgs.unshift({ path: path, preview: "data:" + (f.type || "image/png") + ";base64," + b64 });
        lib.loaded = false; // el selector vuelve a leer el repo la próxima vez
        onDone(path);
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
      409: "Conflicto: el archivo cambió en GitHub mientras editabas. Usa «Cargar última versión de GitHub».",
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

  // ---------- Actions: ejecuciones, estado y sincronización ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const repoPath = () => "/repos/" + encodeURIComponent(cfg.owner) + "/" + encodeURIComponent(cfg.repo);
  const pagesUrl = () => "https://" + cfg.owner.toLowerCase() + ".github.io/" +
    (cfg.repo.toLowerCase() === cfg.owner.toLowerCase() + ".github.io" ? "" : cfg.repo + "/");

  async function listRuns(file, query) {
    const r = await api("GET", repoPath() + "/actions/workflows/" + file + "/runs?" + query);
    if (!r.ok) throw await apiError(r);
    return (await r.json()).workflow_runs || [];
  }

  // espera a que aparezca y termine una ejecución; find(runs) devuelve la que buscamos
  async function watchRun(file, query, find, onTick) {
    for (let i = 0; i < 60; i++) {
      const run = find(await listRuns(file, query));
      onTick(run || null);
      if (run && run.status === "completed") return run;
      await sleep(4000);
    }
    return null;
  }

  function setPending(v) {
    pending = !!v;
    try { localStorage.setItem(PENDING_KEY, pending ? "1" : "0"); } catch (e) {}
    paintPill();
  }

  const fmtWhen = (iso) => (iso ? new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) : "?");

  let statusEl = null;

  // compara el último cambio del sitio en GitHub con el último deploy exitoso a Neocities
  async function refreshStatus() {
    if (!configReady()) return;
    const lines = [];
    try {
      const cm = await api("GET", repoPath() + "/commits?sha=" + encodeURIComponent(cfg.branch) + "&path=public&per_page=1");
      if (!cm.ok) throw await apiError(cm);
      const last = (await cm.json())[0];
      if (last) lines.push("GitHub: último cambio del sitio el " + fmtWhen(last.commit.committer.date) + " (" + last.sha.slice(0, 7) + ").");

      let runs = null;
      try { runs = await listRuns("deploy.yml", "status=success&per_page=1"); }
      catch (e) { lines.push("Neocities: no pude comprobarlo (el token necesita Actions en Read and write)."); }

      if (runs && last) {
        const dep = runs[0];
        if (!dep) {
          setPending(true);
          lines.push("Neocities: todavía no se ha publicado desde el panel.");
        } else {
          const cmp = await api("GET", repoPath() + "/compare/" + dep.head_sha + "..." + last.sha);
          if (cmp.ok) {
            const c = await cmp.json();
            setPending(c.status === "ahead" || c.status === "diverged");
            lines.push(pending
              ? "Neocities: hay cambios guardados en GitHub que aún no se publican (último deploy: " + fmtWhen(dep.updated_at) + ")."
              : "Neocities: al día (último deploy: " + fmtWhen(dep.updated_at) + ").");
          }
        }
      }
    } catch (e) { lines.push("No pude leer el estado: " + e.message); }
    if (statusEl) statusEl.textContent = lines.join("\n") || "Sin información.";
  }

  // lee public/data/content.js directo del repo (la copia de Pages puede estar en caché)
  async function fetchLatest() {
    const r = await fetch("https://api.github.com" + repoPath() + "/contents/" + CONTENT_PATH.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(cfg.branch), {
      headers: { Accept: "application/vnd.github.raw+json", Authorization: "Bearer " + cfg.token },
      cache: "no-store",
    });
    if (!r.ok) throw await apiError(r);
    const txt = await r.text();
    return normalize(JSON.parse(txt.replace(/^\s*window\.SITE\s*=\s*/, "").replace(/;\s*$/, "")));
  }

  // original = lo que hay en GitHub; data = lo que se edita (se conserva el borrador si lo hay)
  async function syncFromGitHub(force) {
    const latest = await fetchLatest();
    const wasClean = JSON.stringify(data) === JSON.stringify(original);
    original = latest;
    let replaced = false;
    if (wasClean || force) { data = clone(latest); replaced = true; }
    if (!isDirty()) {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      $("#draft-banner").hidden = true;
    }
    paintPill();
    if (replaced) {
      const active = document.querySelector("#admin-tabs a.active[data-tab]");
      if (!active || active.dataset.tab !== "publicar") show(active ? active.dataset.tab : "sitio");
    }
  }

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
    gifs: { title: "🎞 GIFS", render: tabGifs },
    publicar: { title: "🚀 GUARDAR Y PUBLICAR", render: tabPublicar },
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
        field("Portada (opcional)", m, "cover", {
          upload: true, thumb: true, wide: true,
          pick: () => coverGroups(m),
          pickOpen: coverGroups(m)[0].items.length > 0,
          pickLabel: "♪ Reusar la carátula de otra canción o elegir una ya subida",
        }),
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

  function tabGifs() {
    const P = window.PAGE_GIFS;
    const top = data.topGif, hb = data.homeBox;
    const root = el("div");

    // --- gif de la parte superior: uno solo, para todas las páginas ---
    const clearTop = el("button", { type: "button", class: "btn danger" }, "✕ Quitar gif");
    clearTop.onclick = () => { top.src = ""; changed(); show("gifs"); };
    const resetTop = el("button", { type: "button", class: "btn" }, "↺ Volver al original");
    resetTop.onclick = () => { top.src = P.defaults.topGif; changed(); show("gifs"); };

    root.append(
      el("h3", { class: "sec" }, "GIF DE LA PARTE SUPERIOR"),
      el("p", { class: "hint" }, "Un solo gif, arriba de todas las páginas. Si lo dejas vacío, no se muestra ninguno."),
      el("div", { class: "grid-2" }, field("Gif / imagen", top, "src", { upload: true, thumb: true, wide: true })),
      el("div", { class: "btn-row" }, clearTop, resetTop, el("a", { href: "../index.html?preview=1", target: "_blank", rel: "noopener" }, "vista previa"))
    );

    // --- opcional: otro gif solo en una pestaña ---
    const body = el("div", { class: "item-body" },
      el("p", { class: "hint" }, "Normalmente todas usan el gif de arriba. Aquí puedes poner otro solo en una pestaña; vacío = usa el general."));
    P.pages.forEach((pg) => {
      const reset = el("button", { type: "button", class: "btn" }, "↺ Usar el general");
      reset.onclick = () => { top.pages[pg.key] = ""; changed(); show("gifs"); };
      body.append(
        el("div", { class: "grid-2" }, field(pg.label, top.pages, pg.key, { upload: true, thumb: true, wide: true })),
        el("div", { class: "btn-row" }, reset, el("a", { href: "../" + pg.file + "?preview=1", target: "_blank", rel: "noopener" }, "vista previa"))
      );
    });
    const anyOwn = P.pages.some((pg) => top.pages[pg.key]);
    root.append(el("details", { class: "item", open: anyOwn }, el("summary", null, "Usar otro gif solo en una pestaña (opcional)"), body));

    // --- cuadro grande del inicio ---
    const clearBox = el("button", { type: "button", class: "btn danger" }, "✕ Quitar cuadro");
    clearBox.onclick = () => { hb.src = ""; changed(); show("gifs"); };
    const resetBox = el("button", { type: "button", class: "btn" }, "↺ Volver al original");
    resetBox.onclick = () => { Object.assign(hb, P.defaults.homeBox); changed(); show("gifs"); };

    root.append(
      el("h3", { class: "sec" }, "CUADRO GRANDE DEL INICIO"),
      el("p", { class: "hint" }, "El cuadro que aparece debajo de «Última transmisión», solo en el inicio. Si lo dejas vacío, se oculta."),
      el("div", { class: "grid-2" },
        field("Gif / imagen", hb, "src", { upload: true, thumb: true, wide: true }),
        field("Título del cuadro", hb, "title", { wide: true, hint: "Opcional. Con título va dentro de un cuadro; sin título se muestra solo." })
      ),
      el("div", { class: "btn-row" }, clearBox, resetBox, el("a", { href: "../index.html?preview=1", target: "_blank", rel: "noopener" }, "vista previa"))
    );
    return root;
  }

  function runLabel(r) {
    if (r.status === "queued" || r.status === "waiting" || r.status === "pending") return "en cola…";
    if (r.status !== "completed") return "ejecutándose…";
    return r.conclusion === "success" ? "lista ✔" : "terminó con error (" + r.conclusion + ")";
  }

  function sayTo(log, msg, cls, link) {
    log.className = "log" + (cls ? " " + cls : "");
    log.textContent = msg;
    if (link) log.append(document.createTextNode("\n"), el("a", { href: link.href, target: "_blank", rel: "noopener" }, link.text));
  }

  function tabPublicar() {
    const root = el("div");
    root.append(
      el("p", { class: "hint" },
        "Se publica en dos pasos: primero guardas en GitHub y revisas la copia en GitHub Pages; " +
        "cuando todo se vea bien, la subes a Neocities."
      )
    );

    const form = el("div", { class: "grid-2" },
      field("Usuario u organización de GitHub", cfg, "owner"),
      field("Nombre del repo", cfg, "repo"),
      field("Rama", cfg, "branch"),
      field("Token de GitHub", cfg, "token", { type: "password", hint: "Fine-grained, solo este repo: Contents y Actions en Read and write" })
    );
    // los datos de conexión no son contenido del sitio: guardarlos aparte
    form.querySelectorAll("input").forEach((i) => i.addEventListener("input", saveCfg));

    const remember = el("input", { type: "checkbox" });
    remember.checked = !!cfg.remember;
    remember.onchange = () => { cfg.remember = remember.checked; saveCfg(); };

    const logConn = el("div", { class: "log" }, "Listo.");
    const test = el("button", { type: "button", class: "btn" }, "Probar conexión");
    test.onclick = async () => {
      if (!configReady()) return sayTo(logConn, "Completa usuario, repo, rama y token.", "err");
      sayTo(logConn, "Probando…");
      try {
        const r = await api("GET", repoPath());
        if (!r.ok) throw await apiError(r);
        const j = await r.json();
        const canPush = j.permissions && j.permissions.push;
        let msg = "Conectado a " + j.full_name + (canPush ? ". El token puede escribir." : ". ¡Ojo! El token no parece poder escribir.");
        let ok = !!canPush;
        try { await listRuns("deploy.yml", "per_page=1"); msg += "\nActions: el token puede leer las ejecuciones."; }
        catch (e) { ok = false; msg += "\n¡Ojo! No puedo leer Actions: agrega el permiso Actions (Read and write) al token. Sin eso no podré lanzar ni seguir el deploy a Neocities."; }
        sayTo(logConn, msg, ok ? "ok" : "err");
        refreshStatus();
      } catch (e) { sayTo(logConn, e.message, "err"); }
    };

    const reload = el("button", { type: "button", class: "btn" }, "⟳ Cargar última versión de GitHub");
    reload.onclick = async () => {
      if (!configReady()) return sayTo(logConn, "Completa usuario, repo, rama y token.", "err");
      if (isDirty() && !confirm("Tienes cambios sin guardar. ¿Reemplazarlos por la versión que está en GitHub?")) return;
      try {
        await syncFromGitHub(true);
        sayTo(logConn, "Se cargó la última versión guardada en GitHub.", "ok");
      } catch (e) { sayTo(logConn, e.message, "err"); }
    };

    const dl = el("button", { type: "button", class: "btn" }, "⬇ Descargar content.js");
    dl.onclick = () => {
      const a = el("a", { href: URL.createObjectURL(new Blob([serialize()], { type: "text/javascript" })), download: "content.js" });
      document.body.append(a); a.click(); a.remove();
      sayTo(logConn, "Descargado. Reemplaza public/data/content.js en tu repo con este archivo.");
    };

    // ---- estado ----
    const status = el("div", { class: "log" }, "Conecta el panel para ver el estado.");
    statusEl = status;

    // ---- paso 1: guardar en GitHub ----
    const log1 = el("div", { class: "log" }, "Listo.");
    const save = el("button", { type: "button", class: "btn go" }, "💾 Guardar en GitHub");
    save.onclick = async () => {
      if (!configReady()) return sayTo(log1, "Completa usuario, repo, rama y token.", "err");
      if (!isDirty()) return sayTo(log1, "No hay cambios nuevos que guardar.");
      save.disabled = true;
      sayTo(log1, "Guardando en GitHub…");
      try {
        const res = await putFile(CONTENT_PATH, toBase64(serialize()), "Actualizar contenido desde el panel");
        original = clone(data);
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
        setPending(true);
        $("#draft-banner").hidden = true;

        const sha = res && res.commit && res.commit.sha;
        const base = "Guardado en GitHub ✔" + (sha ? " (commit " + sha.slice(0, 7) + ")" : "") + ".\n";
        if (!sha) { sayTo(log1, base + "Revisa la pestaña Actions para ver cuándo se actualiza la copia.", "ok"); return; }

        sayTo(log1, base + "Copia en GitHub Pages: esperando que empiece…");
        let run = null;
        try {
          run = await watchRun("pages.yml", "head_sha=" + sha + "&per_page=1", (rs) => rs[0],
            (r) => sayTo(log1, base + "Copia en GitHub Pages: " + (r ? runLabel(r) : "esperando que empiece…")));
        } catch (e) {
          return sayTo(log1, base + "No pude seguir el avance (" + e.message + "). Revisa la pestaña Actions de tu repo.");
        }
        if (!run) return sayTo(log1, base + "Sigue en proceso. Revisa la pestaña Actions de tu repo.");
        if (run.conclusion === "success") {
          sayTo(log1, base + "La copia en GitHub Pages ya está actualizada ✔\nRevísala; si todo está bien, pasa al paso 2.\n(Si ves la versión anterior, recarga con Ctrl+F5.)", "ok", { href: pagesUrl(), text: "→ abrir la copia en GitHub Pages" });
        } else {
          sayTo(log1, base + "La copia en GitHub Pages falló (" + run.conclusion + ").", "err", { href: run.html_url, text: "→ ver qué pasó en Actions" });
        }
      } catch (e) { sayTo(log1, e.message, "err"); }
      finally { save.disabled = false; refreshStatus(); }
    };

    // ---- paso 2: publicar en Neocities ----
    const log2 = el("div", { class: "log" }, "Listo.");
    const neo = el("button", { type: "button", class: "btn go" }, "🚀 Publicar en Neocities");
    neo.onclick = async () => {
      if (!configReady()) return sayTo(log2, "Completa usuario, repo, rama y token.", "err");
      if (isDirty() && !confirm("Tienes cambios que aún no guardaste en GitHub; esos NO se publicarán en Neocities. ¿Continuar igual?")) return;
      neo.disabled = true;
      sayTo(log2, "Lanzando el deploy a Neocities…");
      try {
        let prevId = 0;
        try { const rs = await listRuns("deploy.yml", "event=workflow_dispatch&per_page=1"); prevId = rs[0] ? rs[0].id : 0; } catch (e) {}

        const r = await api("POST", repoPath() + "/actions/workflows/deploy.yml/dispatches", { ref: cfg.branch });
        if (!r.ok) {
          const e = await apiError(r);
          if (r.status === 422) e.message += " Probablemente el deploy.yml de tu repo es la versión antigua: sube la nueva (debe tener workflow_dispatch).";
          else if (r.status === 403 || r.status === 404) e.message += " Revisa que el token tenga el permiso Actions (Read and write) y que .github/workflows/deploy.yml exista en la rama.";
          throw e;
        }

        sayTo(log2, "Deploy lanzado. Esperando que empiece…");
        let run = null;
        try {
          run = await watchRun("deploy.yml", "event=workflow_dispatch&per_page=5", (rs) => rs.find((x) => x.id > prevId),
            (x) => sayTo(log2, "Deploy a Neocities: " + (x ? runLabel(x) : "esperando que empiece…")));
        } catch (e) {
          return sayTo(log2, "Deploy lanzado, pero no pude seguir el avance (" + e.message + "). Revisa la pestaña Actions de tu repo.");
        }
        if (!run) return sayTo(log2, "Sigue en proceso. Revisa la pestaña Actions de tu repo.");
        if (run.conclusion === "success") {
          setPending(false);
          sayTo(log2, "Publicado en Neocities ✔", "ok");
        } else {
          sayTo(log2, "El deploy a Neocities falló (" + run.conclusion + ").\nSi es la primera vez, revisa que exista el secret NEOCITIES_API_TOKEN.", "err", { href: run.html_url, text: "→ ver qué pasó en Actions" });
        }
      } catch (e) { sayTo(log2, e.message, "err"); }
      finally { neo.disabled = false; refreshStatus(); }
    };

    root.append(
      form,
      el("label", { class: "check", style: "margin-top:10px" }, remember, "Recordar el token en este navegador (no lo uses en un computador compartido)"),
      el("div", { class: "btn-row" }, test, reload, dl),
      logConn,

      el("h3", { class: "sec" }, "ESTADO"),
      status,

      el("div", { class: "step" },
        el("h3", null, "PASO 1 · GUARDAR EN GITHUB Y REVISAR"),
        el("p", { class: "hint" }, "Guarda tus cambios en el repo y actualiza la copia en GitHub Pages. Neocities no se toca."),
        el("div", { class: "btn-row", style: "margin-top:0" }, save),
        log1
      ),
      el("div", { class: "step" },
        el("h3", null, "PASO 2 · PUBLICAR EN NEOCITIES"),
        el("p", { class: "hint" }, "Sube a Neocities lo que ya está guardado en GitHub. Hazlo después de revisar la copia."),
        el("div", { class: "btn-row", style: "margin-top:0" }, neo),
        log2
      ),
      el("p", { class: "hint", style: "margin-top:12px" },
        "El token solo se guarda en este navegador y solo se envía a api.github.com. Créalo en GitHub: Settings → Developer settings → Personal access tokens → Fine-grained tokens, limitado a este repo, con Contents y Actions en Read and write."
      )
    );

    refreshStatus();
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

  // si el panel ya conoce el repo y el token, trae la versión real de GitHub
  // (la copia de Pages puede estar en caché o desactualizada)
  if (configReady()) {
    syncFromGitHub(false).catch(() => {}).then(() => refreshStatus());
  }
})();
