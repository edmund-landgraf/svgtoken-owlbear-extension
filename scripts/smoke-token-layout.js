import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { letterTokenSvg } from "../src/owlbear/tokenSvg.js";

const root = process.cwd();
const outDir = join(root, ".generated-tokens", "smoke");
mkdirSync(outDir, { recursive: true });

const fontUrl = pathToFileURL(join(root, "public/fonts/CinzelDecorative-Bold.ttf")).href;
const fontCss = `@font-face{font-family:"CinzelDecorative";src:url("${fontUrl}") format("truetype");font-weight:700;}`;
const fontFamily = "CinzelDecorative, serif";

const cases = [
  { id: "e1", label: "E", copyNumber: 1, color: "#16a34a" },
  { id: "e2", label: "E", copyNumber: 2, color: "#16a34a" },
  { id: "tr1", label: "TR", copyNumber: 1, color: "#0e7490" },
  { id: "tr2", label: "TR", copyNumber: 2, color: "#0e7490" },
  { id: "abc1", label: "ABC", copyNumber: 1, color: "#c2410c" },
  { id: "abc2", label: "ABC", copyNumber: 2, color: "#c2410c" },
];

const svgs = cases.map((item) => {
  let svg = letterTokenSvg({
    label: item.label,
    copyNumber: item.copyNumber,
    name: `${item.label} ${item.copyNumber}`,
    color: item.color,
    fontFamily,
    fontCss,
    fontWeight: "700",
  });
  svg = svg.replaceAll("tokenFill", `tokenFill_${item.id}`).replaceAll("tokenShadow", `tokenShadow_${item.id}`);
  writeFileSync(join(outDir, `${item.id}.svg`), svg);
  return { ...item, svg };
});

const html = `<!doctype html>
<html>
<head>
<style>
  body { margin: 24px; background: #1f3a34; display: flex; flex-wrap: wrap; gap: 24px; max-width: 1400px; }
  .tok { width: 200px; text-align: center; }
  .tok svg { width: 200px; height: 200px; display: block; }
  p { color: #fff; font: 14px sans-serif; }
</style>
</head>
<body>
${svgs
  .map(
    (item) =>
      `<div class="tok">${item.svg}<p>${item.label} copy ${item.copyNumber}</p></div>`
  )
  .join("")}
</body>
</html>
`;
writeFileSync(join(outDir, "smoke.html"), html);
console.log(`wrote ${outDir}`);
