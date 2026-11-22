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
  const CSS = "html,body{margin:0;background:transparent;color:#e8dcff;font:12px Verdana,sans-serif}" +
    "a{color:#c9a7ff}textarea,input[type=text],input[type=email],input[type=url]{background:#1a0a3a;color:#f0e6ff;border:1px solid #7a4fd0;border-radius:3px;padding:5px;max-width:100%;box-sizing:border-box}" +
    "input[type=submit],button,.btn{background:linear-gradient(#9a63ee,#5b2aa8);color:#fff;border:1px solid #c9a7ff;border-radius:3px;padding:4px 12px;cursor:pointer}" +
    "#HCB_comment_box,#HCB_comment_box *{color:inherit}#HCB_comment_box a{color:#c9a7ff}";
  const jsStr = (v) => JSON.stringify(String(v)).replace(/</g, "\\u003c");

  // un nombre escrito como @usuario se convierte en enlace a usuario.neocities.org (solo ese dominio; no se verifica que sea quien dice)
  const NAME_RE = /^@([a-z0-9][a-z0-9-]{0,31})$/i;
  function linkNames(f) {
    let d;
    try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.body) return;
    const run = () => {
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
    f.className = "hcb-frame"; f.title = "Comentarios";
    f.style.cssText = "width:100%;border:0;height:220px;background:transparent";
    f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base target="_blank">' + css + "<style>" + CSS + "</style></head><body>" +
      '<div id="HCB_comment_box">Cargando comentarios…</div><script>window.hcb_user={PAGE:' + jsStr(key) + '};<\/script>' +
      '<script src=' + jsStr(src) + "><\/script></body></html>";
    host.appendChild(f);
    const fit = () => { try { const h = f.contentDocument.documentElement.scrollHeight; if (h > 40) f.style.height = h + 8 + "px"; } catch (e) {} };
    f.addEventListener("load", () => { fit(); linkNames(f); });
    setInterval(fit, 600);
  }

  // identificador estable del hilo (igual en GitHub Pages y en Neocities)
  const key = (id) => "https://alienmax.neocities.org/" + id;
  window.HCB = { enabled, mount, key,
    tip: '<p class="fine">Escribe tu nombre o «Anónimo». Para mostrar tu página de Neocities, escribe <b>@tuusuario</b> como nombre: al hacerle clic irá a tuusuario.neocities.org (no se verifica).</p>' };
})();
