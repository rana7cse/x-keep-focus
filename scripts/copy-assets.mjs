// Copies the extension's static assets (everything under src/ that isn't
// TypeScript) into dist/, preserving directory structure. Run after `tsc`
// so dist/ ends up a complete, loadable unpacked extension.
import { cp, rm, mkdir, readdir } from "node:fs/promises";
import { join, extname } from "node:path";

const SRC = "src";
const DIST = "dist";

/** Recursively collect files under `dir` whose extension is not `.ts`. */
async function staticFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await staticFiles(path)));
    } else if (extname(entry.name) !== ".ts") {
      files.push(path);
    }
  }
  return files;
}

const files = await staticFiles(SRC);
for (const file of files) {
  const dest = join(DIST, file.slice(SRC.length + 1));
  await mkdir(join(dest, ".."), { recursive: true });
  await cp(file, dest);
}

console.log(`Copied ${files.length} static asset(s) to ${DIST}/`);
