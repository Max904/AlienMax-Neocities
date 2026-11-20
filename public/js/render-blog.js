/* ============================================
   render-blog.js — entradas, filtros, archivo, likes y comentarios
   ============================================ */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL;
  const posts = S.posts || [];
  const box = document.getElementById("posts");
  if (!box) return;

  // ---- entradas ----
  function postHTML(p, i) {
    const tags = p.tags || [];
    const comments = p.comments || [];
    const img = U.safeUrl(p.image);
    const commentsHTML = comments.length
      ? comments.map((c) => '<div class="comment"><b>' + U.esc(c.name) + ":</b> " + U.esc(c.text) + "</div>").join("")
      : '<div class="comment">Aún no hay comentarios, ¡sé el primero en el <a href="libro-de-visitas.html">libro de visitas</a>!</div>';

    return (
      '<article class="post" data-tags="' + U.esc(tags.map(U.slug).join(" ")) + '">' +
        '<div class="post-head"><h2>' + U.esc(p.title) + '</h2><span class="post-date">' + U.fmtDate(p.date) + "</span></div>" +
        '<div class="post-body">' +
          (img ? '<img class="inline" src="' + U.esc(img) + '" alt="">' : "") +
          U.paragraphs(p.body) +
        "</div>" +
        '<div class="post-foot">' +
          '<div class="tags">' + tags.map((t) => "<span>" + U.esc(t) + "</span>").join("") + "</div>" +
          (p.mood ? '<span class="mood">Ánimo: ' + U.esc(p.mood) + "</span>" : "") +
          '<button class="like-btn" data-post="' + U.esc(p.id || "post" + i) + '" data-base="' + (parseInt(p.likes, 10) || 0) + '"></button>' +
          '<button class="comment-toggle" data-target="c' + i + '">💬 comentarios (' + comments.length + ")</button>" +
        "</div>" +
        '<div class="comments" id="c' + i + '">' + commentsHTML + "</div>" +
      "</article>"
    );
  }

  box.innerHTML = posts.length
    ? posts.map(postHTML).join("")
    : '<div class="box"><div class="box-body">Todavía no hay entradas.</div></div>';

  const articles = box.querySelectorAll(".post");

  // ---- filtros por etiqueta (se generan desde los datos) ----
  const bar = document.getElementById("filter-bar");
  if (bar) {
    const seen = {};
    posts.forEach((p) => (p.tags || []).forEach((t) => (seen[U.slug(t)] = t)));
    bar.innerHTML =
      '<span style="color:var(--lilac)">Filtrar:</span><button class="active" data-tag="todos">TODOS</button>' +
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
      : "<li>Sin entradas</li>";
  }

  // ---- likes (se guardan en el navegador de cada visitante) ----
  let likes = {};
  try { likes = JSON.parse(localStorage.getItem("alienmax-likes") || "{}"); } catch (e) {}

  box.querySelectorAll(".like-btn").forEach((btn) => {
    const id = btn.dataset.post;
    const base = parseInt(btn.dataset.base || "0", 10);
    const paint = () => {
      const liked = !!likes[id];
      btn.classList.toggle("liked", liked);
      btn.textContent = (liked ? "💜 " : "🤍 ") + (base + (liked ? 1 : 0));
    };
    btn.addEventListener("click", () => {
      likes[id] = !likes[id];
      try { localStorage.setItem("alienmax-likes", JSON.stringify(likes)); } catch (e) {}
      paint();
    });
    paint();
  });

  // ---- mostrar / ocultar comentarios ----
  box.querySelectorAll(".comment-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = document.getElementById(btn.dataset.target);
      if (c) c.classList.toggle("open");
    });
  });
})();
