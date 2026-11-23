/* ============================================
   render-blog.js — entradas, filtros, archivo, likes y comentarios
   ============================================ */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL;
  const posts = S.posts || [];
  const box = document.getElementById("posts");
  if (!box) return;

  const A = window.SOCIAL_API, T = window.I18N.t, F = U.f;
  const staticComments = (arr) => arr.map((c) => '<div class="comment"><b>' + A.who(c) + ":</b> " + U.esc(c.text) + (c.date ? " <small>" + A.fmt(c.date) + "</small>" : "") + "</div>").join("");

  // ---- entradas ----
  function postHTML(p, i) {
    const tags = F(p, "tags") || [];
    const comments = p.comments || [];
    const img = U.safeUrl(p.image);
    const mood = F(p, "mood");
    const HC = window.HCB && window.HCB.enabled;
    const commentsHTML =
      '<div class="comment-list" id="cl' + i + '">' + staticComments(comments) + "</div>" +
      (HC ? window.HCB.tip + '<div class="hcb-host" data-key="' + U.esc(window.HCB.key("blog/" + (p.id || "post" + i))) + '"></div>' : '<form class="comment-form" data-post="' + U.esc(p.id || "post" + i) + '" data-i="' + i + '">' +
        '<textarea name="text" maxlength="300" rows="2" placeholder="' + T("cm.ph") + '" required></textarea>' +
        '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        A.identityHTML("c" + i) +
        '<div class="row"><button type="submit">' + T("cm.send") + '</button><span class="form-status"></span></div>' +
      "</form>");

    return (
      '<article class="post" data-tags="' + U.esc(tags.map(U.slug).join(" ")) + '">' +
        '<div class="post-head"><h2>' + U.esc(F(p, "title")) + '</h2><span class="post-date">' + U.fmtDate(p.date) + "</span></div>" +
        '<div class="post-body">' +
          (img ? '<img class="inline" src="' + U.esc(img) + '" alt="">' : "") +
          U.paragraphs(F(p, "body")) +
        "</div>" +
        '<div class="post-foot">' +
          '<div class="tags">' + tags.map((t) => "<span>" + U.esc(t) + "</span>").join("") + "</div>" +
          (mood ? '<span class="mood">' + T("blog.mood") + " " + U.esc(mood) + "</span>" : "") +
          '<button class="like-btn" data-post="' + U.esc(p.id || "post" + i) + '" data-base="' + (parseInt(p.likes, 10) || 0) + '"></button>' +
          '<button class="comment-toggle" data-target="c' + i + '">' + T("blog.comments") + (HC ? "" : " (" + comments.length + ")") + "</button>" +
        "</div>" +
        '<div class="comments" id="c' + i + '">' + commentsHTML + "</div>" +
      "</article>"
    );
  }

  box.innerHTML = posts.length
    ? posts.map(postHTML).join("")
    : '<div class="box"><div class="box-body">' + T("blog.empty") + '</div></div>';

  const articles = box.querySelectorAll(".post");

  // ---- filtros por etiqueta (se generan desde los datos) ----
  const bar = document.getElementById("filter-bar");
  if (bar) {
    const seen = {};
    posts.forEach((p) => (F(p, "tags") || []).forEach((t) => (seen[U.slug(t)] = t)));
    bar.innerHTML =
      '<span style="color:var(--lilac)">' + T("blog.filter") + '</span><button class="active" data-tag="todos">' + T("blog.all") + '</button>' +
      Object.keys(seen).map((k) => '<button data-tag="' + U.esc(k) + '">' + U.esc(seen[k].toUpperCase()) + "</button>").join("");

    const buttons = bar.querySelectorAll("button");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        articles.forEach((a) => {
          const tags = (a.dataset.tags || "").split(" ");
          a.style.display = btn.dataset.tag === "todos" || tags.includes(btn.dataset.tag) ? "" : "none";
        });
      });
    });
  }

  // ---- archivo por mes ----
  const archive = document.getElementById("archive");
  if (archive) {
    const groups = {};
    posts.forEach((p) => {
      const m = U.monthKey(p.date);
      if (!m) return;
      groups[m.key] = groups[m.key] || { label: m.label, n: 0 };
      groups[m.key].n++;
    });
    const keys = Object.keys(groups).sort().reverse();
    archive.innerHTML = keys.length
      ? keys.map((k) => "<li>" + U.esc(groups[k].label) + " (" + groups[k].n + ")</li>").join("")
      : "<li>" + T("blog.none") + "</li>";
  }

  // ---- likes: el total es el mismo para todos (counters.js) y cada navegador puede dar y quitar el suyo ----
  // El servicio de contadores solo suma, así que se guardan dos: «like-<id>» (me gusta) y «unlike-<id>» (quitados).
  // Total = me gusta − quitados. Cada navegador aporta como mucho +1 neto.
  let likes = {};   // este navegador: ¿le gusta?
  let synced = {};  // este navegador: ¿su +1 ya está en el servicio?
  try { likes = JSON.parse(localStorage.getItem("alienmax-likes") || "{}") || {}; } catch (e) {}
  try { synced = JSON.parse(localStorage.getItem("alienmax-likes-synced") || "{}") || {}; } catch (e) {}
  const save = () => {
    try { localStorage.setItem("alienmax-likes", JSON.stringify(likes)); localStorage.setItem("alienmax-likes-synced", JSON.stringify(synced)); } catch (e) {}
  };

  box.querySelectorAll(".like-btn").forEach((btn) => {
    const id = btn.dataset.post;
    const base = parseInt(btn.dataset.base || "0", 10);
    const C = window.COUNTERS;
    const ck = "alienmax-likecount-" + id;
    let up = 0, down = 0;
    try { const c = JSON.parse(localStorage.getItem(ck) || "[0,0]"); up = c[0] | 0; down = c[1] | 0; } catch (e) {}
    const total = () => base + Math.max(0, up - down);
    const paint = () => {
      const liked = !!likes[id];
      btn.classList.toggle("liked", liked);
      btn.title = liked ? "Quitar mi me gusta" : "Me gusta";
      btn.textContent = (liked ? "💜 " : "🤍 ") + total();
    };
    const keep = () => { try { localStorage.setItem(ck, JSON.stringify([up, down])); } catch (e) {} paint(); };

    btn.addEventListener("click", () => {
      if (!likes[id]) {
        likes[id] = true;
        if (!synced[id]) { synced[id] = true; up += 1; if (C) C.hit("like-" + id).then((v) => { up = v; keep(); }).catch(() => {}); }
      } else {
        likes[id] = false;
        if (synced[id]) { synced[id] = false; down += 1; if (C) C.hit("unlike-" + id).then((v) => { down = v; keep(); }).catch(() => {}); }
        // si el me gusta era antiguo (solo local), no hay nada que quitar en el servicio
      }
      save(); keep();
    });
    paint();
    if (C) {
      C.get("like-" + id).then((v) => { up = v; keep(); }).catch(() => {});
      C.get("unlike-" + id).then((v) => { down = v; keep(); }).catch(() => {});
    }
  });

  // ---- mostrar / ocultar comentarios ----
  box.querySelectorAll(".comment-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = document.getElementById(btn.dataset.target);
      if (c) c.classList.toggle("open");
      const host = c && c.classList.contains("open") && c.querySelector(".hcb-host");
      if (host && window.HCB) window.HCB.mount(host, host.dataset.key);
    });
  });

  // ---- comentarios: los aprobados los ve todo el mundo; los recién enviados quedan «pendientes» en tu navegador ----
  const LKEY = "alienmax-comments-pending";
  let localC = {};
  try { localC = JSON.parse(localStorage.getItem(LKEY) || "{}") || {}; } catch (e) {}

  // lo que ya fue aprobado (o tiene más de 30 días) deja de figurar como pendiente
  const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
  const sameWho = (a, b) => String(a.neocities || a.name || "").toLowerCase() === String(b.neocities || b.name || "").toLowerCase();
  let cleaned = false;
  posts.forEach((p, i) => {
    const id = p.id || "post" + i;
    if (!localC[id]) return;
    const left = localC[id].filter((c) =>
      (!c.t || Date.now() - c.t < 30 * 864e5) &&
      !(p.comments || []).some((a) => norm(a.text) === norm(c.text) && sameWho(a, c)));
    if (left.length !== localC[id].length) { cleaned = true; if (left.length) localC[id] = left; else delete localC[id]; }
  });
  if (cleaned) { try { localStorage.setItem(LKEY, JSON.stringify(localC)); } catch (e) {} }

  function paintComments(i, p) {
    const id = p.id || "post" + i;
    const mine = (localC[id] || []).map((c) => '<div class="comment pending"><b>' + A.who(c) + ":</b> " + U.esc(c.text) + " <small>" + T("gb.pending") + "</small></div>");
    const approved = p.comments || [];
    const list = document.getElementById("cl" + i);
    const none = window.HCB && window.HCB.enabled ? "" : '<div class="comment">' + T("cm.none") + "</div>";
    list.innerHTML = mine.join("") + staticComments(approved) || none;
    if (window.HCB && window.HCB.enabled) return;
    const btn = box.querySelector('.comment-toggle[data-target="c' + i + '"]');
    if (btn) btn.textContent = T("blog.comments") + " (" + approved.length + ")";
  }

  box.querySelectorAll(".comment-form").forEach((form) => {
    const i = +form.dataset.i, p = posts[i], id = form.dataset.post;
    const st = form.querySelector(".form-status");
    const say = (t, bad) => { st.textContent = t; st.className = "form-status" + (bad ? " bad" : ""); };
    A.wireIdentity(form, "c" + i);
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (form.elements["website"].value) return;
      const text = form.elements["text"].value.trim();
      const who = A.readIdentity(form, "c" + i);
      if (who.error) { say(who.error, true); return; }
      if (!text) return;
      if (!A.cooldown()) { say(T("cm.wait"), true); return; }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; say("Enviando…");
      const r = await A.send("comentario", who, text, { id: id, title: p.title });
      btn.disabled = false;
      if (A.canSend && !r.ok) { say(A.failNote(r), true); return; }
      (localC[id] = localC[id] || []).unshift({ name: who.name, neocities: who.neocities, text: text, t: Date.now() });
      try { localStorage.setItem(LKEY, JSON.stringify(localC)); } catch (e) {}
      paintComments(i, p);
      form.elements["text"].value = "";
      say(A.canSend ? A.sentNote(r) : "Guardado solo en tu navegador (aún no hay a dónde enviarlo).");
    });
  });

  posts.forEach((p, i) => paintComments(i, p));
})();
