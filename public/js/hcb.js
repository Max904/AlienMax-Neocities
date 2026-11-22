/* ============================================
   hcb.js — comentarios con HTML Comment Box (htmlcommentbox.com)
   Sin aprobación previa y sin tocar el repo: los comentarios viven en su servidor.
   Se activa al poner «mod» en data/social.js → hcb (viene del código que da su panel).
   Su widget solo admite uno por página, así que se mueve al hilo que se abre.
   ============================================ */
(function () {
  const C = (window.SOCIAL && window.SOCIAL.hcb) || {};
  const H = "https://www.htmlcommentbox.com";
  const enabled = !!(C.mod && /^[\w$.%\-]+$/.test(C.mod));

  // cada hilo va en su propio iframe: así cada entrada tiene sus comentarios y no se mezclan
  const CSS =
    "html,body{margin:0;background:transparent!important;color:#e8dcff;font-size:13px;line-height:1.5}" +
    "#HCB_comment_box,#HCB_comment_box *{font-family:inherit}" +
    "#HCB_comment_box{color:#e8dcff}" +
    "#HCB_comment_box a{color:#c9a7ff!important}#HCB_comment_box a:hover{color:#fff!important}" +
    "#HCB_comment_box h3,#HCB_comment_box .hcb-title{color:#ffb0ea;font-size:14px;margin:4px 0 8px}" +
    "#HCB_comment_box textarea,#HCB_comment_box input[type=text],#HCB_comment_box input[type=email],#HCB_comment_box input[type=url],#HCB_comment_box input[type=password],#HCB_comment_box input:not([type]){" +
      "color:#f3e9ff!important;background:linear-gradient(180deg,#0e0322,#1a0840)!important;border:1px solid #5e3aa6!important;border-radius:5px!important;padding:8px 10px!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.7)!important;max-width:100%;box-sizing:border-box}" +
    "#HCB_comment_box textarea{width:100%!important;min-height:80px}" +
    "#HCB_comment_box ::placeholder{color:#8a6fc0!important;font-style:italic;opacity:1}" +
    "#HCB_comment_box textarea:focus,#HCB_comment_box input:focus{outline:0;border-color:#c9a6ff!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.7),0 0 0 3px rgba(165,107,255,.35)!important}" +
    "#HCB_comment_box button,#HCB_comment_box input[type=submit],#HCB_comment_box input[type=button],#HCB_comment_box .btn,#HCB_comment_box a.btn{" +
      "color:#fff!important;text-shadow:0 -1px 0 rgba(0,0,0,.5);font-weight:bold;font-size:11px;padding:6px 14px!important;background:linear-gradient(180deg,#9a5cf5,#6a2fd0 50%,#5a22b8 51%,#6c32d6)!important;" +
      "border:1px solid #2a0d55!important;border-radius:4px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 1px 2px rgba(0,0,0,.5)!important;cursor:pointer}" +
    "#HCB_comment_box button:hover,#HCB_comment_box .btn:hover{background:linear-gradient(180deg,#b27cff,#7f45e6 50%,#6e34cf 51%,#8044e6)!important}" +
    "#HCB_comment_box b,#HCB_comment_box strong{color:#ffb0ea}" +
    "#HCB_comment_box [class*=time i],#HCB_comment_box small,#HCB_comment_box .muted{color:#8a6fc0!important}" +
    // fuera: puerta de login, aviso de «gracias» y RSS
    "#HCB_comment_box [class*=login i],#HCB_comment_box [id*=login i],#HCB_comment_box [title*=login i],#HCB_comment_box [title*='log in' i],#HCB_comment_box [title*='sign in' i],#HCB_comment_box [href*=login i],#HCB_comment_box [onclick*=login i]," +
    "#HCB_comment_box [class*=rss i],#HCB_comment_box [id*=rss i],#HCB_comment_box a[href*=rss i],#HCB_comment_box a[href*=feed i],#HCB_comment_box img[src*=rss i],#HCB_comment_box img[src*=feed i],#HCB_comment_box [class*=thank i],#HCB_comment_box [class*=login-],#HCB_comment_box [class*=signin i]{display:none!important}";
  const jsStr = (v) => JSON.stringify(String(v)).replace(/</g, "\\u003c");

  // un nombre escrito como @usuario se convierte en enlace a usuario.neocities.org (solo ese dominio; no se verifica que sea quien dice)
  const NAME_RE = /^@([a-z0-9][a-z0-9-]{0,31})$/i;
  function linkNames(f) {
    let d;
    try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.body) return;
    const hide = (el) => { if (el && el !== d.body && el.id !== "HCB_comment_box") el.style.display = "none"; };
    const run = () => {
      // «Thank you for commenting!»
      d.querySelectorAll("#HCB_comment_box *").forEach((el) => {
        if (el.children.length === 0 && /^\s*thank you for commenting!?\s*$/i.test(el.textContent)) hide(el);
      });
      // iconos de RSS / puerta de login que no se pueden reconocer por su nombre
      d.querySelectorAll("#HCB_comment_box a, #HCB_comment_box img, #HCB_comment_box span, #HCB_comment_box i, #HCB_comment_box svg").forEach((el) => {
        const t = ((el.getAttribute("src") || "") + (el.getAttribute("href") || "") + (el.getAttribute("class") || "") + (el.getAttribute("title") || "") + (el.getAttribute("alt") || "")).toLowerCase();
        if (/\b(rss|feed|login|log-in|signin|sign-in|log in|sign in)|(rss|feed|login)[._-]/.test(t)) hide(el);
      });
      const w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
      const hits = [];
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const par = n.parentNode;
        if (!par || /^(A|SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(par.nodeName)) continue;
        const m = NAME_RE.exec(n.nodeValue.trim());
        if (m) hits.push([n, m[1].toLowerCase()]);
      }
      hits.forEach(([n, u]) => {
        const a = d.createElement("a");
        a.href = "https://" + u + ".neocities.org/";
        a.target = "_blank"; a.rel = "noopener nofollow";
        a.title = "Ir a " + u + ".neocities.org";
        a.textContent = u;
        n.parentNode.replaceChild(a, n);
      });
    };
    run();
    new MutationObserver(run).observe(d.body, { childList: true, subtree: true });
  }

  function mount(host, key) {
    if (!enabled || !host || host.dataset.hcb) return;
    host.dataset.hcb = "1";
    const src = H + "/jread?page=" + encodeURIComponent(key).replace("+", "%2B") +
      "&mod=" + encodeURIComponent(C.mod) + "&opts=" + encodeURIComponent(C.opts || "16798") +
      "&num=" + encodeURIComponent(C.num || 10);
    const css = C.css && /^https:\/\/www\.htmlcommentbox\.com\//.test(C.css) ? '<link rel="stylesheet" href="' + C.css + '">' : "";
    const f = document.createElement("iframe");
    f.className = "hcb-frame"; f.title = "Comentarios"; f.scrolling = "auto";
    f.style.cssText = "width:100%;border:0;height:480px;background:transparent";
    f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base target="_blank">' + css + "<style>" + CSS + "</style></head><body>" +
      '<div id="HCB_comment_box">Cargando comentarios…</div><script>window.hcb_user={PAGE:' + jsStr(key) + '};<\/script>' +
      '<script src=' + jsStr(src) + "><\/script></body></html>";
    host.appendChild(f);
    // altura fija con desplazamiento propio: medir el contenido hacía crecer el recuadro sin parar
    f.addEventListener("load", () => linkNames(f));
  }

  // identificador estable del hilo (igual en GitHub Pages y en Neocities)
  const key = (id) => "https://alienmax.neocities.org/" + id;
  window.HCB = { enabled, mount, key,
    tip: '<p class="fine">Escribe tu nombre o «Anónimo». Para mostrar tu página de Neocities, escribe <b>@tuusuario</b> como nombre: al hacerle clic irá a tuusuario.neocities.org (no se verifica).</p>' };
})();
