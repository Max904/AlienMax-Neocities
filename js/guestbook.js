/* ============================================
   guestbook.js — libro de visitas (localStorage)
   ============================================ */
(function () {
  const form = document.getElementById("guest-form");
  const list = document.getElementById("guest-list");
  if (!form || !list) return;

  const KEY = "alienmax-guestbook";
  const defaults = [
    { name: "Ditto", msg: "dit... to?", date: "01/01/2010" },
    { name: "gatito_lila", msg: "¡me encanta tu fondo morado! ✦ vuelve pronto", date: "14/02/2011" },
  ];

  let entries = [];
  try { entries = JSON.parse(localStorage.getItem(KEY) || "null") || defaults; } catch (e) { entries = defaults; }

  function esc(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function render() {
    list.innerHTML = entries
      .map((e) => '<div class="guest-entry"><b>' + esc(e.name) + "</b><small>" + esc(e.date) + "</small><p>" + esc(e.msg) + "</p></div>")
      .join("");
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = form.elements["name"].value.trim();
    const msg = form.elements["msg"].value.trim();
    if (!name || !msg) return;
    entries.unshift({ name: name, msg: msg, date: new Date().toLocaleDateString("es-CL") });
    try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (e) {}
    form.reset();
    render();
  });

  render();
})();
