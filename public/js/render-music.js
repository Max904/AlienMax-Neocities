/* ============================================
   render-music.js — música recomendada
   Si el enlace es de YouTube, se puede reproducir aquí mismo.
   ============================================ */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL;
  const list = document.getElementById("music-list");
  if (!list) return;

  const items = S.music || [];
  const t = window.I18N.t;

  function ytId(url) {
    const m = /(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/.exec(url || "");
    return m ? m[1] : null;
  }

  list.innerHTML = items.length
    ? items.map((m, i) => {
        const url = U.safeUrl(m.url);
        const cover = U.safeUrl(m.cover);
        const yt = ytId(url);
        return (
          '<div class="music-card">' +
            (cover ? '<img class="music-cover" src="' + U.esc(cover) + '" alt="">' : '<div class="music-cover music-nocover">♪</div>') +
            '<div class="music-info">' +
              "<h3>" + U.esc(m.title) + "</h3>" +
              '<div class="music-artist">' + U.esc(m.artist) + "</div>" +
              (U.f(m, "note") ? '<div class="music-note">' + U.esc(U.f(m, "note")) + "</div>" : "") +
              '<div class="music-actions">' +
                (yt ? '<button type="button" class="music-play" data-i="' + i + '" data-yt="' + yt + '">' + t("music.play") + '</button>' : "") +
                (url ? '<a href="' + U.esc(url) + '" target="_blank" rel="noopener">' + t("music.open") + '</a>' : "") +
              "</div>" +
              '<div class="music-player" id="player-' + i + '"></div>' +
            "</div>" +
          "</div>"
        );
      }).join("")
    : '<div class="box-body">' + t("music.empty") + '</div>';

  list.querySelectorAll(".music-play").forEach((btn) => {
    btn.addEventListener("click", () => {
      const holder = document.getElementById("player-" + btn.dataset.i);
      if (!holder) return;
      if (holder.firstChild) {
        holder.innerHTML = "";
        btn.textContent = t("music.play");
      } else {
        holder.innerHTML =
          '<iframe width="100%" height="200" src="https://www.youtube-nocookie.com/embed/' + btn.dataset.yt +
          '" title="' + t("music.player") + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
        btn.textContent = t("music.close");
      }
    });
  });
})();
