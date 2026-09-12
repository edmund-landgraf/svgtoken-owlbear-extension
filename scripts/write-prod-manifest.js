import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "public", "manifest.prod.json"), "utf8");
const distDir = join(root, "dist");
mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, "manifest.json"), source.endsWith("\n") ? source : `${source}\n`);
