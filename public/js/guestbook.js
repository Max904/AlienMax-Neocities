/* ============================================
   guestbook.js — libro de visitas
   Muestra las firmas aprobadas (data/content.js → guestbook) y las que el
   visitante acaba de mandar (pendientes, solo en su navegador).
   ============================================ */
(function () {
  const form = document.getElementById("guest-form");
  const list = document.getElementById("guest-list");
  const A = window.SOCIAL_API;
  if (!form || !list || !A) return;

  const S = window.SITE || {};
  const KEY = "alienmax-guestbook-pending";
  const status = document.getElementById("guest-status");
  const say = (t, bad) => { status.textContent = t; status.className = "form-status" + (bad ? " bad" : ""); };

  let pending = [];
  try { pending = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) {}

  function render() {
    const rows = [];
    pending.forEach((e) => rows.push({ who: A.who(e), date: "pendiente de aprobación", msg: e.message, cls: " pending" }));
    (S.guestbook || []).forEach((e) => rows.push({ who: A.who(e), date: A.fmt(e.date), msg: e.message, cls: "" }));
    list.innerHTML = rows.length
      ? rows.map((r) => '<div class="guest-entry' + r.cls + '"><b>' + r.who + "</b><small>" + A.esc(r.date) + "</small><p>" + A.esc(r.msg) + "</p></div>").join("")
      : '<div class="guest-entry">Aún no hay firmas. ¡Sé el primero!</div>';
  }

  document.getElementById("g-ident").innerHTML = A.identityHTML("g");
  A.wireIdentity(form, "g");
  const msgBox = form.elements["msg"], counter = document.getElementById("msg-count");
  msgBox.addEventListener("input", () => { counter.textContent = msgBox.value.length + " / 300"; });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (form.elements["website"].value) return; // trampa para bots
    const msg = msgBox.value.trim();
    const who = A.readIdentity(form, "g");
    if (who.error) { say(who.error, true); return; }
    if (!msg) { say("Escribe un mensaje.", true); return; }
    if (!A.cooldown()) { say("Espera unos segundos antes de volver a firmar.", true); return; }
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; say("Enviando…");
    const r = await A.send("firma", who, msg);
    btn.disabled = false;
    if (A.canSend && !r.ok) { say(A.failNote(r), true); return; }
    pending.unshift({ name: who.name, neocities: who.neocities, message: msg });
    try { localStorage.setItem(KEY, JSON.stringify(pending.slice(0, 20))); } catch (e) {}
    render();
    msgBox.value = ""; counter.textContent = "0 / 300";
    say(A.canSend ? A.sentNote(r) : "Guardado solo en tu navegador (aún no hay a dónde enviarlo).");
  });

  render();
})();
