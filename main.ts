// Leonida Trophy Guide — the hand-in program (Node 22, standard library only).
//
// The guide itself is plain static files in app/ (index.html, app.js, style.css and
// app/data/trophies.json), served with no build step and no network at run time.
// This program's only job is to hand those files in: it copies app/ and screenshots/
// from the directory beside this file into the output directory and writes
// /output/dossier.json with buildDossier from the vendored make.fun library, so the
// judge can read the screenshots, the first load's files and bytes, and the source.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used instead.
// Both runs must write the same bytes; the program is deterministic (plain copies
// plus the library's own dossier writer).
//
// Leave vendor/makefun-frontend.ts exactly as it is: the scorer rebuilds the dossier
// with its own copy of the library and requires the two to match byte for byte.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the kit's gate states them: at most 4 screenshots, each at
// most 256 KiB; app/ at most 993 files and directories and 48 MiB in all. The
// dossier text is capped at 160 KiB by text_max_bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
