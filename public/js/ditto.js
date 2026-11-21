/* ============================================
   ditto.js — Ditto shimeji (0132 - Ditto Shimeji)
   Port a JavaScript del motor de Shimeji-ee: lee actions.xml / behaviors.xml
   (compilados en ditto-config.js) y los ejecuta igual que el original:
   camina, corre, se sienta, duerme, trepa paredes y techo, salta, se divide
   en más Dittos (a veces shiny), se deja agarrar, lanzar, etc.

   Requiere cargar antes  js/ditto-config.js
   Sprites en assets/ditto/<Set>/ · sonidos en js/ditto-sounds.js (carga diferida)
   ============================================ */
(function () {
  "use strict";

  var CFG = window.DITTO_CONFIG;
  if (!CFG) { console.warn("ditto.js: falta js/ditto-config.js"); return; }

  /* ---------- ajustes ---------- */
  var SETTINGS = {
    tickMs: 40,        // el motor original corre a 25 ticks por segundo
    maxMascots: 50,    // tope de Dittos a la vez (Breeding = true en el original)
    sound: true,       // gritos de Ditto/Pikachu/Eevee (solo suenan tras un clic o toque en la página)
    phrases: [         // frases al hacer clic (sin arrastrar)
      "dit... to?",
      "¡Hola AlienMax!",
      "creo en los aliens 👽",
      "~ blob blob ~",
      "¡me transformo en ti!",
      "💜💜💜",
      "¿viste esa estrella?"
    ]
  };

  var scriptEl = document.currentScript;
  var JS_BASE = scriptEl && scriptEl.src ? scriptEl.src.replace(/[^\/]*$/, "") : "js/";
  var ASSETS = new URL("../assets/ditto/", JS_BASE).href;

  var LOST = { lostGround: true };            // "LostGroundException" del original
  var TICK_LIMIT = 6;

  /* ---------- expresiones (${...} se evalúa una vez, #{...} cada vez) ---------- */
  var exprCache = {};
  function compileExpr(src) {
    var f = exprCache[src];
    if (!f) {
      f = exprCache[src] = new Function("__s", "with(__s){return (" + src + "\n);}");
    }
    return f;
  }
  var EXPR_RE = /^\s*([$#])\{([\s\S]*)\}\s*$/;

  function evalCondString(str, scope) {
    if (str == null || str === "") return true;
    var m = EXPR_RE.exec(str);
    if (m) return !!compileExpr(m[2])(scope);
    return String(str).trim() === "true";
  }

  function literal(raw) {
    var s = String(raw).trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if (s === "true") return true;
    if (s === "false") return false;
    return raw;
  }

  /* ---------- bordes (suelo, techo, paredes) ---------- */
  function Border(kind, wa) { this.kind = kind; this.wa = wa; }
  Border.prototype.isOn = function (p) {
    var w = this.wa;
    switch (this.kind) {
      case "floor":   return p.y === w.bottom && p.x >= w.left && p.x <= w.right;
      case "ceiling": return p.y === w.top && p.x >= w.left && p.x <= w.right;
      case "left":    return p.x === w.left && p.y >= w.top && p.y <= w.bottom;
      case "right":   return p.x === w.right && p.y >= w.top && p.y <= w.bottom;
    }
    return false;
  };
  Border.prototype.move = function (p) {
    var w = this.wa;
    function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
    switch (this.kind) {
      case "floor":   return { x: cl(p.x, w.left, w.right), y: w.bottom };
      case "ceiling": return { x: cl(p.x, w.left, w.right), y: w.top };
      case "left":    return { x: w.left, y: cl(p.y, w.top, w.bottom) };
      case "right":   return { x: w.right, y: cl(p.y, w.top, w.bottom) };
    }
    return p;
  };
  var NullBorder = { isOn: function () { return false; }, move: function (p) { return p; } };

  /* ---------- entorno: la ventana del navegador es el "work area" ---------- */
  var wa = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  var env = {
    cursor: { x: 0, y: 0, dx: 0, dy: 0 },
    workArea: wa,
    screen: wa,
    floor: new Border("floor", wa),
    ceiling: new Border("ceiling", wa),
    // en la web no hay ventanas de Internet Explorer: "activeIE" existe pero siempre invisible
    activeIE: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, visible: false,
                topBorder: NullBorder, bottomBorder: NullBorder, leftBorder: NullBorder, rightBorder: NullBorder }
  };
  wa.leftBorder = new Border("left", wa);
  wa.rightBorder = new Border("right", wa);
  wa.topBorder = env.ceiling;
  wa.bottomBorder = env.floor;

  function updateWorkArea() {
    var de = document.documentElement;
    wa.left = 0; wa.top = 0;
    wa.right = de.clientWidth || window.innerWidth;
    wa.bottom = de.clientHeight || window.innerHeight;
    wa.width = wa.right - wa.left;
    wa.height = wa.bottom - wa.top;
  }
  updateWorkArea();
  env.cursor.x = Math.round(wa.width / 2);
  env.cursor.y = wa.bottom;
  var prevCursor = { x: env.cursor.x, y: env.cursor.y };

  /* ---------- imágenes ---------- */
  var imgCache = {};
  function getImage(setName, file) {
    var key = setName + "/" + file;
    var e = imgCache[key];
    if (!e) {
      e = imgCache[key] = { img: new Image(), ok: false, w: 0, h: 0 };
      e.img.onload = function () { e.ok = true; e.w = e.img.naturalWidth; e.h = e.img.naturalHeight; };
      e.img.src = ASSETS + setName + "/" + file;
    }
    return e;
  }

  /* ---------- sonido ---------- */
  var soundsRequested = false;
  var soundCache = {};
  function loadSounds() {
    if (soundsRequested || !SETTINGS.sound) return;
    soundsRequested = true;
    var s = document.createElement("script");
    s.src = JS_BASE + "ditto-sounds.js";
    document.head.appendChild(s);
  }
  function playSound(file, db) {
    if (!SETTINGS.sound || !file || !window.DITTO_SOUNDS) return;
    var uri = window.DITTO_SOUNDS[file];
    if (!uri) return;
    try {
      var a = soundCache[file] || (soundCache[file] = new Audio(uri));
      var c = a.cloneNode();
      c.volume = Math.max(0, Math.min(1, Math.pow(10, db / 20)));
      var p = c.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  /* ---------- configuración por set (Ditto / Ditto_Shiny) ---------- */
  var sets = {};
  function getSet(name) {
    var s = sets[name];
    if (s) return s;
    var base = CFG.sets[CFG.base], own = CFG.sets[name];
    s = sets[name] = { name: name, actions: {}, behaviors: null, byName: {} };
    var k;
    for (k in base.actions) s.actions[k] = base.actions[k];
    if (own && own.actions) for (k in own.actions) s.actions[k] = own.actions[k];
    s.behaviors = (own && own.behaviors) || base.behaviors;
    s.behaviors.forEach(function (b) { s.byName[b.n] = b; });
    // precarga de sprites
    (function collect(d) {
      (d.an || []).forEach(function (an) {
        an.total = an.ps.reduce(function (t, p) { return t + p[5]; }, 0);
        an.ps.forEach(function (p) { getImage(name, p[0]); });
      });
      (d.ch || []).forEach(function (c) { if (c.d) collect(c.d); });
    })({ ch: Object.keys(s.actions).map(function (n) { return { d: s.actions[n] }; }) });
    return s;
  }

  /* =====================================================================
     ACCIONES
     ===================================================================== */
  function ActionBase(set, def, refParams) {
    this.set = set;
    this.def = def;
    var p = {}, k;
    if (def.p) for (k in def.p) p[k] = def.p[k];
    if (refParams) for (k in refParams) p[k] = refParams[k];
    this.params = p;
  }
  ActionBase.prototype.init = function (m) {
    this.mascot = m;
    this.startTime = m.time;
    this.cache = {};
    this.vars = {};
    var self = this;
    this.scope = new Proxy({}, {
      has: function (_, key) {
        return typeof key === "string" && (key === "mascot" || key in self.vars || key in self.params);
      },
      get: function (_, key) {
        if (typeof key !== "string") return undefined;
        if (key === "mascot") return self.mascot;
        if (key in self.vars) return self.vars[key];
        return self.param(key);
      }
    });
  };
  ActionBase.prototype.param = function (name, def) {
    var raw = this.params[name];
    if (raw === undefined) return def;
    var mm = EXPR_RE.exec(raw);
    if (mm) {
      if (mm[1] === "$") {
        if (name in this.cache) return this.cache[name];
        return (this.cache[name] = compileExpr(mm[2])(this.scope));
      }
      return compileExpr(mm[2])(this.scope);
    }
    return literal(raw);
  };
  ActionBase.prototype.num = function (name, def) {
    var v = this.param(name, def);
    return typeof v === "number" ? v : Number(v);
  };
  ActionBase.prototype.time = function () { return this.mascot.time - this.startTime; };
  ActionBase.prototype.isEffective = function () {
    var c = this.param("Condition", true);
    return c === true || (c !== false && !!c && c !== "false");
  };
  ActionBase.prototype.duration = function () {
    var d = this.param("Duration", null);
    return d === null || d === undefined ? Infinity : Number(d);
  };
  ActionBase.prototype.hasNext = function () {
    return this.isEffective() && this.time() < this.duration();
  };
  ActionBase.prototype.next = function () { this.tick(); };
  ActionBase.prototype.tick = function () {};

  /* animaciones (poses) */
  ActionBase.prototype.animation = function () {
    var ans = this.def.an;
    if (!ans) return null;
    for (var i = 0; i < ans.length; i++) {
      if (!ans[i].c || evalCondString(ans[i].c, this.scope)) return ans[i];
    }
    return null;
  };
  ActionBase.prototype.animTotal = function () {
    var an = this.animation();
    return an ? an.total : 0;
  };
  ActionBase.prototype.animate = function () {
    var an = this.animation();
    if (!an || !an.total) return;
    var m = this.mascot;
    var t = this.time() % an.total, acc = 0, pose = null, elapsed = 0;
    for (var i = 0; i < an.ps.length; i++) {
      if (t < acc + an.ps[i][5]) { pose = an.ps[i]; elapsed = t - acc; break; }
      acc += an.ps[i][5];
    }
    if (!pose) pose = an.ps[an.ps.length - 1];
    m.setPose(pose[0], pose[1], pose[2]);
    m.anchor.x += m.lookRight ? -pose[3] : pose[3];
    m.anchor.y += pose[4];
    if (elapsed === 0 && pose[6]) playSound(pose[6], pose[7]);
  };

  /* acciones con borde (Floor / Wall / Ceiling) */
  function Bordered(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Bordered.prototype = Object.create(ActionBase.prototype);
  Bordered.prototype.init = function (m) {
    ActionBase.prototype.init.call(this, m);
    this.border = null;
    var bt = this.def.b, a = m.anchor;
    if (bt === "Floor") { if (env.activeIE.topBorder.isOn(a)) this.border = env.activeIE.topBorder; else if (env.floor.isOn(a)) this.border = env.floor; }
    else if (bt === "Ceiling") { if (env.activeIE.bottomBorder.isOn(a)) this.border = env.activeIE.bottomBorder; else if (env.ceiling.isOn(a)) this.border = env.ceiling; }
    else if (bt === "Wall") {
      if (m.lookRight) { if (env.activeIE.leftBorder.isOn(a)) this.border = env.activeIE.leftBorder; else if (wa.rightBorder.isOn(a)) this.border = wa.rightBorder; }
      else { if (env.activeIE.rightBorder.isOn(a)) this.border = env.activeIE.rightBorder; else if (wa.leftBorder.isOn(a)) this.border = wa.leftBorder; }
    }
  };
  Bordered.prototype.next = function () {
    var m = this.mascot;
    if (this.def.b && (!this.border || !this.border.isOn(m.anchor))) throw LOST;
    this.tick();
    if (this.border) { var p = this.border.move(m.anchor); m.anchor.x = p.x; m.anchor.y = p.y; }
  };

  /* Stay: se queda quieto animándose */
  function Stay(set, def, ref) { Bordered.call(this, set, def, ref); }
  Stay.prototype = Object.create(Bordered.prototype);
  Stay.prototype.tick = function () { this.animate(); };

  /* Animate: reproduce la animación una vez */
  function Animate(set, def, ref) { Bordered.call(this, set, def, ref); }
  Animate.prototype = Object.create(Bordered.prototype);
  Animate.prototype.tick = function () { this.animate(); };
  Animate.prototype.hasNext = function () {
    return Bordered.prototype.hasNext.call(this) && this.time() < this.animTotal();
  };

  /* Move: camina hacia TargetX / TargetY */
  function Move(set, def, ref) { Bordered.call(this, set, def, ref); }
  Move.prototype = Object.create(Bordered.prototype);
  Move.prototype.target = function (name) {
    var v = this.param(name, null);
    return v === null || v === undefined || isNaN(Number(v)) ? null : Math.trunc(Number(v));
  };
  Move.prototype.tick = function () {
    var m = this.mascot, a = m.anchor;
    var tx = this.target("TargetX"), ty = this.target("TargetY");
    if (tx !== null && a.x !== tx) m.lookRight = a.x < tx;
    var down = ty !== null && a.y < ty;
    this.animate();
    if (tx !== null) { if ((m.lookRight && a.x >= tx) || (!m.lookRight && a.x <= tx)) a.x = tx; }
    if (ty !== null) { if ((down && a.y >= ty) || (!down && a.y <= ty)) a.y = ty; }
  };
  Move.prototype.hasNext = function () {
    var ok = Bordered.prototype.hasNext.call(this);
    if (!ok) return false;
    var a = this.mascot.anchor, tx = this.target("TargetX"), ty = this.target("TargetY");
    if (tx !== null && a.x === tx) return false;
    if (ty !== null && a.y === ty) return false;
    return true;
  };

  /* Sequence: una acción tras otra (Loop opcional) */
  function Sequence(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Sequence.prototype = Object.create(ActionBase.prototype);
  Sequence.prototype.init = function (m) {
    ActionBase.prototype.init.call(this, m);
    this.idx = -1;
    this.cur = null;
    if (this.isEffective()) this.advance(true);   // si su Condition falla no se ejecuta nada (ni Offset/Look)
  };
  Sequence.prototype.advance = function (first) {
    var kids = this.def.ch || [], guard = 0;
    while (true) {
      if (!first && this.cur && this.cur.hasNext()) return;
      first = false;
      this.idx++;
      if (this.idx >= kids.length) {
        if (this.def.l && kids.length && guard++ < kids.length * 2) this.idx = 0;
        else { this.cur = null; return; }
      }
      this.cur = buildChild(this.set, kids[this.idx]);
      this.cur.init(this.mascot);
      if (this.cur.hasNext()) return;
    }
  };
  Sequence.prototype.hasNext = function () {
    return !!this.cur && ActionBase.prototype.hasNext.call(this) && this.cur.hasNext();
  };
  Sequence.prototype.next = function () {
    if (!this.cur) return;
    this.cur.next();
    this.advance(false);
  };

  /* Select: elige la primera acción cuya Condition se cumple */
  function Select(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Select.prototype = Object.create(ActionBase.prototype);
  Select.prototype.init = function (m) {
    ActionBase.prototype.init.call(this, m);
    this.cur = null;
    if (!this.isEffective()) return;
    var kids = this.def.ch || [];
    for (var i = 0; i < kids.length; i++) {
      var a = buildChild(this.set, kids[i]);
      a.init(m);
      if (a.hasNext()) { this.cur = a; break; }
    }
  };
  Select.prototype.hasNext = function () {
    return !!this.cur && ActionBase.prototype.hasNext.call(this) && this.cur.hasNext();
  };
  Select.prototype.next = function () { if (this.cur) this.cur.next(); };

  /* ---- acciones "Embedded" (clases Java del original) ---- */
  function instant(fn) {
    function A(set, def, ref) { ActionBase.call(this, set, def, ref); }
    A.prototype = Object.create(ActionBase.prototype);
    A.prototype.init = function (m) { ActionBase.prototype.init.call(this, m); fn.call(this, m); this.done = true; };
    A.prototype.hasNext = function () { return false; };
    return A;
  }
  var Look = instant(function (m) {
    var v = this.param("LookRight", null);
    m.lookRight = (v === null || v === undefined) ? !m.lookRight : (v === true || v === "true");
  });
  var Offset = instant(function (m) {
    m.anchor.x += Math.trunc(this.num("X", 0));
    m.anchor.y += Math.trunc(this.num("Y", 0));
  });
  var Mute = instant(function () {});
  var Nop = instant(function () {});   // acciones de ventanas de IE: no existen en la web

  /* Fall: caída con gravedad y resistencia del aire */
  function Fall(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Fall.prototype = Object.create(ActionBase.prototype);
  Fall.prototype.init = function (m) {
    ActionBase.prototype.init.call(this, m);
    this.vx = this.num("InitialVX", 0);
    this.vy = this.num("InitialVY", 0);
    this.landed = false;
  };
  Fall.prototype.tick = function () {
    var m = this.mascot, a = m.anchor;
    var resX = this.num("RegistanceX", 0.05), resY = this.num("RegistanceY", 0.1), g = this.num("Gravity", 2);
    if (this.vx !== 0) m.lookRight = this.vx > 0;
    this.vx -= this.vx * resX;
    this.vy += g - this.vy * resY;
    var dev = Math.max(1, Math.trunc(Math.max(Math.abs(this.vx), Math.abs(this.vy))));
    var sx = a.x, sy = a.y;
    for (var i = 0; i <= dev; i++) {
      var x = Math.round(sx + this.vx * i / dev), y = Math.round(sy + this.vy * i / dev);
      a.x = x; a.y = y;
      if (x <= wa.left && this.vx <= 0) { a.x = wa.left; this.landed = true; break; }
      if (x >= wa.right && this.vx >= 0) { a.x = wa.right; this.landed = true; break; }
      if (this.vy > 0 && y >= wa.bottom) { a.y = wa.bottom; this.landed = true; break; }
      if (this.vy < 0 && y <= wa.top) { a.y = wa.top; this.vy = 0; break; }
    }
    this.animate();
  };
  Fall.prototype.hasNext = function () { return !this.landed && ActionBase.prototype.hasNext.call(this); };

  /* Jump: salto en arco hacia (TargetX, TargetY) */
  function Jump(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Jump.prototype = Object.create(ActionBase.prototype);
  Jump.prototype.init = function (m) { ActionBase.prototype.init.call(this, m); this.done = false; };
  Jump.prototype.tick = function () {
    var m = this.mascot, a = m.anchor;
    var vel = this.num("VelocityParam", 20);
    var tx = Math.trunc(this.num("TargetX", a.x)), ty = Math.trunc(this.num("TargetY", a.y));
    var dx = tx - a.x, dy = ty - a.y - Math.abs(dx) / 2;
    var dist = Math.sqrt(dx * dx + dy * dy), vx = 0, vy = 0;
    if (dist !== 0) { vx = Math.trunc(dx / dist * vel); vy = Math.trunc(dy / dist * vel); }
    m.lookRight = vx > 0;
    a.x += vx; a.y += vy;
    this.animate();
    var rx = tx - a.x, ry = ty - a.y;
    if (rx * rx + ry * ry <= vel * vel) { a.x = tx; a.y = ty; this.done = true; }
  };
  Jump.prototype.hasNext = function () { return !this.done && ActionBase.prototype.hasNext.call(this); };

  /* Dragged: el Ditto agarrado por el cursor */
  function Dragged(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Dragged.prototype = Object.create(ActionBase.prototype);
  Dragged.prototype.init = function (m) {
    ActionBase.prototype.init.call(this, m);
    var c = env.cursor;
    this.offX = m.anchor.x - c.x;
    this.offY = m.anchor.y - c.y;
    this.footX = c.x;
    this.footDX = 0;
    this.timeToRegist = 250;
    this.vars.FootX = this.footX;
    this.vars.FootDX = 0;
  };
  Dragged.prototype.tick = function () {
    var m = this.mascot, c = env.cursor;
    m.lookRight = false;
    if (Math.abs(c.dx) >= 5 || Math.abs(c.dy) >= 5) this.timeToRegist = 250; else this.timeToRegist--;
    this.footDX = (this.footDX + (c.x - this.footX) * 0.1) * 0.8;
    this.footX += this.footDX;
    this.vars.FootX = this.footX;
    this.vars.FootDX = this.footDX;
    this.animate();
    m.anchor.x = Math.max(wa.left, Math.min(wa.right, c.x + this.offX));
    m.anchor.y = Math.max(wa.top, Math.min(wa.bottom, c.y + this.offY));
  };
  Dragged.prototype.hasNext = function () { return this.timeToRegist > 0 && ActionBase.prototype.hasNext.call(this); };

  /* Regist: se resiste cuando lo sostienen quieto un rato */
  function Regist(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Regist.prototype = Object.create(ActionBase.prototype);
  Regist.prototype.init = function (m) {
    ActionBase.prototype.init.call(this, m);
    this.sx = env.cursor.x; this.sy = env.cursor.y;
  };
  Regist.prototype.tick = function () { this.mascot.lookRight = false; this.animate(); };
  Regist.prototype.hasNext = function () {
    var c = env.cursor;
    return Math.abs(c.x - this.sx) < 5 && Math.abs(c.y - this.sy) < 5 &&
           this.time() < this.animTotal() && ActionBase.prototype.hasNext.call(this);
  };

  /* Breed: se divide / crea otro Ditto */
  function Breed(set, def, ref) { ActionBase.call(this, set, def, ref); }
  Breed.prototype = Object.create(ActionBase.prototype);
  Breed.prototype.init = function (m) { ActionBase.prototype.init.call(this, m); this.bred = false; };
  Breed.prototype.tick = function () {
    this.animate();
    if (!this.bred && this.time() >= this.animTotal() - 1) { this.bred = true; this.breed(); }
  };
  Breed.prototype.breed = function () {
    if (!SETTINGS.maxMascots || manager.mascots.length >= SETTINGS.maxMascots) return;
    var m = this.mascot;
    var setName = this.param("BornMascot", m.setName);
    var bx = this.num("BornX", 0), by = this.num("BornY", 0);
    var b = new Mascot(setName);
    b.lookRight = m.lookRight;
    b.anchor.x = m.anchor.x + (m.lookRight ? -bx : bx);
    b.anchor.y = m.anchor.y + by;
    b.setBehavior(this.param("BornBehavior", "Fall"));
    manager.add(b);
  };
  Breed.prototype.hasNext = function () {
    return this.time() < this.animTotal() && ActionBase.prototype.hasNext.call(this);
  };

  var EMBEDDED = {
    Look: Look, Offset: Offset, Mute: Mute, Fall: Fall, Jump: Jump, Dragged: Dragged, Regist: Regist,
    Breed: Breed, FallWithIE: Nop, WalkWithIE: Nop, ThrowIE: Nop
  };
  var TYPES = { Stay: Stay, Animate: Animate, Move: Move, Sequence: Sequence, Select: Select };

  function instantiate(set, def, refParams) {
    var C = def.t === "Embedded" ? EMBEDDED[def.c] : TYPES[def.t];
    if (!C) throw new Error("Acción desconocida: " + (def.c || def.t));
    return new C(set, def, refParams);
  }
  function buildChild(set, child) {
    if (child.r) {
      var def = set.actions[child.r];
      if (!def) throw new Error("Acción no encontrada: " + child.r);
      return instantiate(set, def, child.p);
    }
    return instantiate(set, child.d, child.d.p);
  }
  function buildAction(set, name) {
    var def = set.actions[name];
    if (!def) throw new Error("Acción no encontrada: " + name);
    return instantiate(set, def, null);
  }

  /* =====================================================================
     COMPORTAMIENTOS (behaviors.xml)
     ===================================================================== */
  function chooseNext(set, prevName, mascot) {
    var scope = { mascot: mascot };
    var cands = [], total = 0;
    function addList(list, useRefCond) {
      list.forEach(function (b) {
        if (b.f <= 0) return;
        if (useRefCond) { if (b.c && !evalCondString(b.c, scope)) return; }
        else if (b.c && !b.c.every(function (c) { return evalCondString(c, scope); })) return;
        cands.push({ n: b.n, f: b.f });
        total += b.f;
      });
    }
    var prev = prevName && set.byName[prevName];
    if (prev && prev.nx) {
      addList(prev.nx.r, true);
      if (prev.nx.a) addList(set.behaviors, false);
    } else {
      addList(set.behaviors, false);
    }
    if (total === 0) {
      // nada aplicable: reaparece cayendo desde arriba, como en el original
      mascot.anchor.x = Math.floor(Math.random() * (wa.right - wa.left)) + wa.left;
      mascot.anchor.y = wa.top - 256;
      return "Fall";
    }
    var r = Math.random() * total;
    for (var i = 0; i < cands.length; i++) {
      r -= cands[i].f;
      if (r < 0) return cands[i].n;
    }
    return cands[cands.length - 1].n;
  }

  function Behavior(mascot, name) {
    this.mascot = mascot;
    this.name = name;
    this.action = buildAction(mascot.set, name);
    this.action.init(mascot);
  }

  /* =====================================================================
     MASCOT
     ===================================================================== */
  var layer = null;

  function Mascot(setName) {
    this.setName = setName;
    this.set = getSet(setName);
    this.anchor = { x: 0, y: 0 };
    this.lookRight = Math.random() < 0.5;
    this.time = 0;
    this.behavior = null;
    this.dragging = false;
    this.image = null;
    this.imgAnchor = { x: 0, y: 0 };
    this.dirty = true;
    this.environment = env;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "ditto-sprite";
    this.canvas.style.visibility = "hidden";
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.bubble = null;
  }
  Object.defineProperty(Mascot.prototype, "totalCount", { get: function () { return manager.mascots.length; } });
  Object.defineProperty(Mascot.prototype, "count", { get: function () {
    var n = this.setName; return manager.mascots.filter(function (m) { return m.setName === n; }).length;
  } });

  Mascot.prototype.setPose = function (file, ax, ay) {
    if (this.image !== file || this.imgAnchor.x !== ax || this.imgAnchor.y !== ay) {
      this.image = file; this.imgAnchor.x = ax; this.imgAnchor.y = ay; this.dirty = true;
    }
  };

  Mascot.prototype.setBehavior = function (name) {
    this.behavior = new Behavior(this, name);
  };

  Mascot.prototype.advance = function (prevName) {
    var name = prevName, b = null;
    for (var tries = 0; tries < TICK_LIMIT; tries++) {
      name = chooseNext(this.set, name, this);
      b = new Behavior(this, name);
      if (b.action.hasNext()) { this.behavior = b; return; }
    }
    this.behavior = new Behavior(this, "Fall");
  };

  Mascot.prototype.tick = function () {
    try {
      if (!this.behavior) this.setBehavior("Fall");
      var b = this.behavior;
      try {
        b.action.next();
        if (!b.action.hasNext() && this.behavior === b) this.advance(b.name);
      } catch (e) {
        if (e === LOST) this.setBehavior("Fall"); else throw e;
      }
    } catch (err) {
      console.error("ditto:", err);
      try { this.setBehavior("Fall"); } catch (e2) {}
    }
    this.time++;
  };

  Mascot.prototype.startDrag = function () { this.dragging = true; this.setBehavior("Dragged"); };
  Mascot.prototype.endDrag = function () { this.dragging = false; this.setBehavior("Thrown"); };

  Mascot.prototype.say = function (text, ms) {
    var self = this;
    if (!this.bubble) {
      this.bubble = document.createElement("div");
      this.bubble.className = "ditto-bubble";
      layer.appendChild(this.bubble);
    }
    this.bubble.textContent = text;
    this.bubble.classList.add("show");
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(function () { if (self.bubble) self.bubble.classList.remove("show"); }, ms || 1800);
  };

  Mascot.prototype.render = function () {
    if (!this.image) return;
    var e = getImage(this.setName, this.image);
    if (!e.ok) return;
    var c = this.canvas;
    if (this.dirty || this.lastRight !== this.lookRight || c.width !== e.w || c.height !== e.h) {
      if (c.width !== e.w || c.height !== e.h) { c.width = e.w; c.height = e.h; }
      this.ctx.clearRect(0, 0, e.w, e.h);
      this.ctx.save();
      if (this.lookRight) { this.ctx.translate(e.w, 0); this.ctx.scale(-1, 1); }
      this.ctx.drawImage(e.img, 0, 0);
      this.ctx.restore();
      this.lastRight = this.lookRight;
      this.dirty = false;
      this.w = e.w; this.h = e.h;
    }
    var ax = this.lookRight ? e.w - this.imgAnchor.x : this.imgAnchor.x;
    this.left = this.anchor.x - ax;
    this.top = this.anchor.y - this.imgAnchor.y;
    c.style.transform = "translate(" + this.left + "px," + this.top + "px)";
    c.style.visibility = "visible";
    if (this.bubble) {
      this.bubble.style.transform = "translate(" + Math.round(this.left + e.w / 2) + "px," + Math.round(this.top) + "px) translate(-50%,-100%)";
    }
  };

  /* ¿el punto (x,y) toca un píxel visible del Ditto? */
  Mascot.prototype.hit = function (x, y) {
    if (this.w == null) return false;
    var lx = Math.floor(x - this.left), ly = Math.floor(y - this.top);
    if (lx < 0 || ly < 0 || lx >= this.w || ly >= this.h) return false;
    try { return this.ctx.getImageData(lx, ly, 1, 1).data[3] > 16; }
    catch (e) { return true; }   // si el navegador bloquea leer píxeles (file://), basta el rectángulo
  };

  /* =====================================================================
     MANAGER: bucle principal + interacción
     ===================================================================== */
  var manager = {
    mascots: [],
    add: function (m) { this.mascots.push(m); layer.appendChild(m.canvas); },
    remove: function (m) {
      var i = this.mascots.indexOf(m);
      if (i >= 0) this.mascots.splice(i, 1);
      if (m.canvas.parentNode) m.canvas.parentNode.removeChild(m.canvas);
      if (m.bubble && m.bubble.parentNode) m.bubble.parentNode.removeChild(m.bubble);
    }
  };

  function tickAll() {
    env.cursor.dx = env.cursor.x - prevCursor.x;
    env.cursor.dy = env.cursor.y - prevCursor.y;
    prevCursor.x = env.cursor.x; prevCursor.y = env.cursor.y;
    var list = manager.mascots.slice();
    for (var i = 0; i < list.length; i++) list[i].tick();
  }

  var acc = 0, last = 0;
  function frame(now) {
    acc += Math.min(now - last, 250);
    last = now;
    var steps = 0;
    while (acc >= SETTINGS.tickMs && steps < 8) { tickAll(); acc -= SETTINGS.tickMs; steps++; }
    if (steps >= 8) acc = 0;
    var l = manager.mascots;
    for (var i = 0; i < l.length; i++) l[i].render();
    requestAnimationFrame(frame);
  }

  /* ---------- puntero: agarrar, arrastrar y lanzar ---------- */
  var drag = null, suppressClick = false;

  function topMascotAt(x, y) {
    var l = manager.mascots;
    for (var i = l.length - 1; i >= 0; i--) if (l[i].hit(x, y)) return l[i];
    return null;
  }
  function setCursor(e) {
    env.cursor.x = Math.max(wa.left, Math.min(wa.right, Math.round(e.clientX)));
    env.cursor.y = Math.max(wa.top, Math.min(wa.bottom, Math.round(e.clientY)));
  }

  window.addEventListener("pointermove", function (e) {
    setCursor(e);
    if (drag) { drag.dist = Math.max(drag.dist, Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0)); }
  }, { passive: true });

  window.addEventListener("pointerdown", function (e) {
    loadSounds();
    setCursor(e);
    if (e.button !== undefined && e.button !== 0) return;
    var m = topMascotAt(e.clientX, e.clientY);
    if (!m) return;
    e.preventDefault();
    prevCursor.x = env.cursor.x; prevCursor.y = env.cursor.y;
    env.cursor.dx = env.cursor.dy = 0;
    drag = { m: m, x0: e.clientX, y0: e.clientY, dist: 0, t0: performance.now() };
    m.startDrag();
  }, { capture: true });

  function release() {
    if (!drag) return;
    var d = drag; drag = null;
    d.m.endDrag();
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    if (d.dist < 6 && performance.now() - d.t0 < 400) {
      d.m.say(SETTINGS.phrases[Math.floor(Math.random() * SETTINGS.phrases.length)]);
    }
  }
  window.addEventListener("pointerup", release, { capture: true });
  window.addEventListener("pointercancel", release, { capture: true });
  window.addEventListener("click", function (e) {
    if (suppressClick) { e.stopPropagation(); e.preventDefault(); }
  }, { capture: true });
  // en pantallas táctiles evita que el gesto sobre Ditto haga scroll
  window.addEventListener("touchstart", function (e) {
    var t = e.touches[0];
    if (t && topMascotAt(t.clientX, t.clientY)) e.preventDefault();
  }, { capture: true, passive: false });

  window.addEventListener("resize", function () {
    updateWorkArea();
    manager.mascots.forEach(function (m) {
      m.anchor.x = Math.max(wa.left, Math.min(wa.right, m.anchor.x));
      if (m.anchor.y > wa.bottom && !m.dragging) m.anchor.y = wa.bottom;
    });
  });
  document.addEventListener("visibilitychange", function () { last = performance.now(); acc = 0; });

  /* ---------- arranque ---------- */
  function start() {
    layer = document.createElement("div");
    layer.id = "ditto-layer";
    document.body.appendChild(layer);

    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem("ditto") || "{}"); } catch (e) {}

    var m = new Mascot(CFG.base);
    // como el original: aparece arriba y cae; recuerda por dónde iba al cambiar de página
    m.anchor.x = typeof saved.x === "number" ? Math.max(wa.left, Math.min(wa.right, saved.x))
                                              : Math.floor(Math.random() * (wa.right - wa.left)) + wa.left;
    m.anchor.y = wa.top;
    if (saved.dir === -1) m.lookRight = false; else if (saved.dir === 1) m.lookRight = true;
    m.setBehavior("Fall");
    manager.add(m);

    window.addEventListener("pagehide", function () {
      var p = manager.mascots[0];
      if (!p) return;
      try { sessionStorage.setItem("ditto", JSON.stringify({ x: p.anchor.x, dir: p.lookRight ? 1 : -1 })); } catch (e) {}
    });

    // precarga el set shiny y los sonidos sin bloquear la página
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1500); };
    idle(function () { getSet("Ditto_Shiny"); loadSounds(); });

    last = performance.now();
    requestAnimationFrame(frame);
  }

  // para depurar desde la consola
  window.dittoShimeji = { manager: manager, env: env, settings: SETTINGS, tick: tickAll };

  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
