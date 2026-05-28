/**
 * Scans TSX files for likely hardcoded English UI strings.
 * Run: node scripts/i18n-audit.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "src");

const SKIP_DIRS = new Set(["node_modules", ".next"]);
const SKIP_FILES = /i18n(-extensions)?\.ts$/;

/** Patterns that often indicate user-facing English literals */
const PATTERNS = [
  />\s*["'`]([A-Za-z][^"'`]{2,80})["'`]\s*</g,
  /(?:title|placeholder|label|aria-label)=\{?["'`]([A-Za-z][^"'`]{2,60})["'`]/g,
  /(?:title|placeholder|label|aria-label)=["'`]([A-Za-z][^"'`]{2,60})["'`]/g,
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out);
    } else if (/\.(tsx|ts)$/.test(name) && !SKIP_FILES.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function usesI18n(content) {
  return /useLanguage\s*\(/.test(content) || /\bt\s*\(\s*["']/.test(content);
}

const files = walk(SRC);
const findings = [];
let withI18n = 0;

for (const file of files) {
  const rel = path.relative(path.join(__dirname, ".."), file);
  const content = fs.readFileSync(file, "utf8");
  if (usesI18n(content)) withI18n++;

  if (/\/lib\/(api|types|utils|dummy-data|payment-flow)/.test(rel)) continue;

  const hits = new Set();
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content))) {
      const s = m[1].trim();
      if (/^(https?|#|\/|className|flex|grid|px-|py-|w-|h-)/.test(s)) continue;
      if (/^\{/.test(s) || s.includes("${")) continue;
      if (s.length < 4) continue;
      hits.add(s);
    }
  }

  if (hits.size > 0 && !usesI18n(content)) {
    findings.push({ rel, count: hits.size, samples: [...hits].slice(0, 8) });
  } else if (hits.size > 5) {
    findings.push({ rel, count: hits.size, samples: [...hits].slice(0, 5), partial: true });
  }
}

findings.sort((a, b) => b.count - a.count);

const coverage = Math.round((withI18n / files.length) * 100);
console.log(`\n=== i18n audit ===`);
console.log(`Files scanned: ${files.length}`);
console.log(`Files using useLanguage/t(): ${withI18n} (${coverage}%)`);
console.log(`\nTop files with likely hardcoded UI strings:\n`);
for (const f of findings.slice(0, 40)) {
  console.log(`  ${f.rel} (~${f.count}${f.partial ? ", has some i18n" : ""})`);
  for (const s of f.samples) console.log(`    - "${s}"`);
}
console.log(`\nTotal flagged files: ${findings.length}`);
