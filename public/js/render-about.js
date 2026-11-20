/* render-about.js — sobre mí */
(function () {
  const S = window.SITE || {}, U = window.SITE_UTIL;
  const A = S.about || {};

  const intro = document.getElementById("about-intro");
  if (intro) intro.innerHTML = U.paragraphs(A.intro);

  const favs = document.getElementById("about-favs");
  if (favs) favs.innerHTML = (A.favorites || []).map((f) => "<li>" + U.esc(f) + "</li>").join("");

  const motto = document.getElementById("about-motto");
  if (motto) motto.textContent = A.motto ? '"' + A.motto + '"' : "";

  const friends = document.getElementById("about-friends");
  if (friends) {
    friends.innerHTML = (A.friends || [])
      .map((src) => U.safeUrl(src))
      .filter(Boolean)
      .map((src) => '<img src="' + U.esc(src) + '" alt="" style="height:90px;max-width:140px;object-fit:contain">')
      .join("");
  }
})();
