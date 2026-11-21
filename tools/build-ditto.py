#!/usr/bin/env python3
"""
build-ditto.py — convierte el pack "Ditto Shimeji" (Shimeji-ee) en archivos para la web.

Uso:  python3 tools/build-ditto.py RUTA/A/0132_-_Ditto_Shimeji
Genera:
  public/assets/ditto/<Set>/*.png   sprites usados por actions.xml
  public/js/ditto-config.js         actions.xml + behaviors.xml compilados (JSON)
  public/js/ditto-sounds.js         sonidos .wav -> mp3 en base64 (requiere ffmpeg)
"""
import sys, os, re, json, shutil, base64, subprocess, tempfile
import xml.etree.ElementTree as ET

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
NS = "{http://www.group-finity.com/Mascot}"
SETS = ["Ditto", "Ditto_Shiny"]
BASE = "Ditto"

def pose(p):
    ax, ay = (int(float(v)) for v in p.get("ImageAnchor").split(","))
    vx, vy = (int(float(v)) for v in p.get("Velocity", "0,0").split(","))
    snd = p.get("Sound")
    return [p.get("Image").lstrip("/"), ax, ay, vx, vy, int(p.get("Duration")),
            snd.lstrip("/") if snd else "", int(float(p.get("Volume", "0")))]

def conv(a):
    d = {"t": a.get("Type")}
    if a.get("BorderType"): d["b"] = a.get("BorderType")
    if a.get("Class"): d["c"] = a.get("Class").split(".")[-1]
    if a.get("Loop") == "true": d["l"] = 1
    p = {k: v for k, v in a.attrib.items() if k not in ("Name", "Type", "BorderType", "Class", "Loop")}
    if p: d["p"] = p
    an = []
    for x in a.findall(NS + "Animation"):
        e = {"ps": [pose(q) for q in x.findall(NS + "Pose")]}
        if x.get("Condition"): e["c"] = x.get("Condition")
        an.append(e)
    if an: d["an"] = an
    ch = []
    for c in a:
        tag = c.tag.replace(NS, "")
        if tag == "ActionReference":
            r = {"r": c.get("Name")}
            q = {k: v for k, v in c.attrib.items() if k != "Name"}
            if q: r["p"] = q
            ch.append(r)
        elif tag == "Action":
            ch.append({"d": conv(c)})
    if ch: d["ch"] = ch
    return d

def parse_actions(path):
    out = {}
    for al in ET.parse(path).getroot().findall(NS + "ActionList"):
        for a in al.findall(NS + "Action"):
            out[a.get("Name")] = conv(a)
    return out

def parse_behaviors(path):
    out = []
    def walk(node, conds):
        for c in node:
            tag = c.tag.replace(NS, "")
            if tag == "Condition":
                walk(c, conds + [c.get("Condition")])
            elif tag == "Behavior":
                cc = list(conds)
                if c.get("Condition"): cc.append(c.get("Condition"))
                b = {"n": c.get("Name"), "f": int(c.get("Frequency", "0"))}
                if cc: b["c"] = cc
                nl = c.find(NS + "NextBehaviorList")
                if nl is not None:
                    refs = []
                    for r in nl.findall(NS + "BehaviorReference"):
                        e = {"n": r.get("Name"), "f": int(r.get("Frequency", "0"))}
                        if r.get("Condition"): e["c"] = r.get("Condition")
                        refs.append(e)
                    b["nx"] = {"a": 1 if nl.get("Add") == "true" else 0, "r": refs}
                out.append(b)
    walk(ET.parse(path).getroot().find(NS + "BehaviorList"), [])
    return out

cfg = {"base": BASE, "sets": {}}
used = {}
base_actions = base_behaviors = None
for s in SETS:
    conf = os.path.join(SRC, "img", s, "conf")
    acts = parse_actions(os.path.join(conf, "actions.xml"))
    behs = parse_behaviors(os.path.join(conf, "behaviors.xml"))
    imgs = set()
    def collect(d):
        for an in d.get("an", []):
            for p in an["ps"]: imgs.add(p[0])
        for ch in d.get("ch", []):
            if "d" in ch: collect(ch["d"])
    for d in acts.values(): collect(d)
    used[s] = imgs
    if s == BASE:
        base_actions, base_behaviors = acts, behs
        cfg["sets"][s] = {"actions": acts, "behaviors": behs}
    else:  # solo guardamos lo que cambia respecto al set base
        entry = {"actions": {k: v for k, v in acts.items() if base_actions.get(k) != v}}
        if behs != base_behaviors: entry["behaviors"] = behs
        cfg["sets"][s] = entry

# sprites
maxw = maxh = 0
from PIL import Image
for s, imgs in used.items():
    dst = os.path.join(PUB, "assets", "ditto", s)
    shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst)
    for f in sorted(imgs):
        shutil.copy(os.path.join(SRC, "img", s, f), os.path.join(dst, f))
        w, h = Image.open(os.path.join(dst, f)).size
        maxw, maxh = max(maxw, w), max(maxh, h)
    print(s, len(imgs), "sprites")
print("sprite máximo:", maxw, "x", maxh)

with open(os.path.join(PUB, "js", "ditto-config.js"), "w", encoding="utf-8") as f:
    f.write("/* generado por tools/build-ditto.py — no editar a mano */\n")
    f.write("window.DITTO_CONFIG=" + json.dumps(cfg, ensure_ascii=False, separators=(",", ":")) + ";\n")

# sonidos (wav -> mp3 mono pequeño, en base64 para no depender del tipo de archivo que acepte Neocities)
snd = {}
for fn in sorted(os.listdir(os.path.join(SRC, "sound"))):
    if not fn.endswith(".wav"): continue
    with tempfile.NamedTemporaryFile(suffix=".mp3") as t:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(SRC, "sound", fn),
                        "-ac", "1", "-ar", "22050", "-b:a", "48k", t.name], check=True)
        snd[fn] = "data:audio/mpeg;base64," + base64.b64encode(open(t.name, "rb").read()).decode()
with open(os.path.join(PUB, "js", "ditto-sounds.js"), "w") as f:
    f.write("/* generado por tools/build-ditto.py — no editar a mano */\n")
    f.write("window.DITTO_SOUNDS=" + json.dumps(snd, separators=(",", ":")) + ";\n")
print("listo")
