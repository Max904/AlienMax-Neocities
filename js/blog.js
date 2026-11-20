/* ============================================
   blog.js — filtros, likes y comentarios de los posts
   ============================================ */
(function () {
  const posts = document.querySelectorAll(".post");

  // ---- filtros por etiqueta ----
  const buttons = document.querySelectorAll(".filter-bar button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tag = btn.dataset.tag;
      posts.forEach((p) => {
        const tags = (p.dataset.tags || "").split(" ");
        p.style.display = tag === "todos" || tags.includes(tag) ? "" : "none";
      });
    });
  });

  // ---- likes (se guardan en el navegador) ----
  let likes = {};
  try { likes = JSON.parse(localStorage.getItem("alienmax-likes") || "{}"); } catch (e) {}

  document.querySelectorAll(".like-btn").forEach((btn) => {
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
  document.querySelectorAll(".comment-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(btn.dataset.target);
      if (box) box.classList.toggle("open");
    });
  });
})();
