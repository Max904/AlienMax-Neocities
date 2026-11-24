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
    // comentarios: los antiguos ya aprobados (data/content.js) y debajo el widget de HTML Comment Box
    const commentsHTML =
      '<div class="comment-list" id="cl' + i + '">' + staticComments(comments) + "</div>" +
      '<div class="hcb-host" data-key="' + U.esc(window.HCB ? window.HCB.key("blog/" + (p.id || "post" + i)) : "") + '"></div>';

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
          '<button class="comment-toggle" data-target="c' + i + '">' + T("blog.comments") + "" + "</button>" +
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

    // Lee los DOS contadores y solo cambia lo que se ve si llegaron los dos (con reintentos):
    // si uno falla (bloqueador, límite del servicio) se queda lo último que se sabía, no un número a medias.
    const refresh = async () => {
      if (!C) return;
      for (let i = 0; i < 3; i++) {
        try {
          const a = await C.get("like-" + id);
          const b = await C.get("unlike-" + id);
          up = a; down = b; keep();
          return;
        } catch (e) { await new Promise((r) => setTimeout(r, 1500 * (i + 1))); }
      }
    };

    btn.addEventListener("click", () => {
      if (!likes[id]) {
        likes[id] = true;
        if (!synced[id]) { synced[id] = true; up += 1; if (C) C.hit("like-" + id).then(refresh).catch(() => {}); }
      } else {
        likes[id] = false;
        if (synced[id]) { synced[id] = false; down += 1; if (C) C.hit("unlike-" + id).then(refresh).catch(() => {}); }
        // si el me gusta era antiguo (solo local), no hay nada que quitar en el servicio
      }
      save(); keep();
    });
    paint();
    refresh();
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
})();
