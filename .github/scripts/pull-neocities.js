// Trae a public/ lo que esté más nuevo en Neocities (archivos subidos o editados allí).
// - Nunca borra nada del repo.
// - Modo completo (PULL_MODE=full): baja todo lo que sea distinto, sin mirar fechas (Neocities manda).
// - Modo normal: no pisa cambios de GitHub que aún no se publicaron: un archivo distinto solo se baja si en Neocities
//   se modificó DESPUÉS del último commit de ese archivo en el repo.
// - data/social.js nunca se baja (una copia antigua en Neocities puede traer un tema de ntfy secreto de cuando se usaba).
// La clave (NEOCITIES_API_TOKEN) no se imprime.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

const KEY = (process.env.NEOCITIES_API_TOKEN || "").trim();
const API = (process.env.NEOCITIES_API || "https://neocities.org").replace(/\/$/, "");
const ROOT = "public";
const SKIP = new Set(["data/social.js"]);
const MAX = 25 * 1024 * 1024;
const FULL = (process.env.PULL_MODE || "").trim() === "full"; // descarga completa: Neocities manda, sin comparar fechas

function fail(msg) { console.error(msg); process.exit(1); }
if (!KEY) fail("Falta el secreto NEOCITIES_API_TOKEN (el mismo que usa el deploy).");

async function api(p) {
  const r = await fetch(API + p, { headers: { Authorization: "Bearer " + KEY } });
  if (!r.ok) fail("Neocities respondió HTTP " + r.status + " en " + p.split("?")[0] + (r.status === 403 ? " (¿clave incorrecta?)" : ""));
  const j = await r.json();
  if (j.result && j.result !== "success") fail("Neocities: " + (j.message || j.error_type || "error"));
  return j;
}
const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const lastCommit = (rel) => {
  try { return parseInt(cp.execFileSync("git", ["log", "-1", "--format=%ct", "--", path.posix.join(ROOT, rel)], { encoding: "utf8" }).trim(), 10) * 1000 || 0; }
  catch (e) { return 0; }
};

(async () => {
  const info = (await api("/api/info")).info || {};
  const base = process.env.NEOCITIES_SITE_URL || (info.domain ? "https://" + info.domain : "https://" + info.sitename + ".neocities.org");
  const files = (await api("/api/list")).files || [];
  const pulled = [], same = [], kept = [], skipped = [];

  for (const f of files) {
    if (f.is_directory) continue;
    const rel = path.posix.normalize(String(f.path || "")).replace(/^\/+/, "");
    if (!rel || rel.startsWith("..") || rel.split("/").includes(".git") || rel.includes("\0")) { skipped.push(f.path + " (ruta no válida)"); continue; }
    if (SKIP.has(rel)) { skipped.push(rel + " (no se baja: una copia antigua puede traer un secreto)"); continue; }
    if (f.size > MAX) { skipped.push(rel + " (demasiado grande)"); continue; }

    const local = path.join(ROOT, rel);
    let localSha = "";
    try { localSha = sha1(fs.readFileSync(local)); } catch (e) {}
    if (localSha && localSha === f.sha1_hash) { same.push(rel); continue; }
    if (localSha) {
      // existe y es distinto: ¿cuál es más nuevo?
      const neo = Date.parse(f.updated_at) || 0;
      if (!FULL && !(neo > lastCommit(rel))) { kept.push(rel); continue; }
    }
    const r = await fetch(base + "/" + rel.split("/").map(encodeURIComponent).join("/") + "?nc=" + encodeURIComponent(f.sha1_hash || Date.now()), { cache: "no-store" });
    if (!r.ok) { skipped.push(rel + " (HTTP " + r.status + ")"); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    if (f.sha1_hash && sha1(buf) !== f.sha1_hash) { skipped.push(rel + " (la descarga no coincide con la lista; puede ser caché: reintenta en unos minutos)"); continue; }
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, buf);
    pulled.push((localSha ? "editado: " : "nuevo: ") + rel);
  }

  const lines = [
    (FULL ? "Descarga completa" : "Traído") + " de Neocities: " + pulled.length + " archivo(s).",
    ...pulled.map((x) => "  + " + x),
    kept.length ? "Se dejaron los de GitHub (más nuevos o sin publicar): " + kept.length : "",
    ...kept.map((x) => "  = " + x),
    skipped.length ? "Omitidos: " + skipped.length : "",
    ...skipped.map((x) => "  ! " + x),
    "Iguales en ambos lados: " + same.length,
  ].filter(Boolean);
  console.log(lines.join("\n"));
  fs.writeFileSync("pull-summary.txt", lines.join("\n") + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "```\n" + lines.join("\n") + "\n```\n");
})().catch((e) => fail("Error: " + e.message));
