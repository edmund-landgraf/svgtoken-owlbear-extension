import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { letterTokenSvg } from "../src/owlbear/tokenSvg.js";
import { TOKEN_FONTS } from "../src/owlbear/tokenFonts.js";

const root = process.cwd();
const outDir = join(root, ".generated-tokens", "smoke");
mkdirSync(outDir, { recursive: true });

const fontUrl = pathToFileURL(join(root, "public/fonts/CinzelDecorative-Bold.ttf")).href;
const fontCss = `@font-face{font-family:"CinzelDecorative";src:url("${fontUrl}") format("truetype");font-weight:700;}`;
const fontFamily = "CinzelDecorative, serif";

const cases = [
  { id: "e-super", label: "E", copyNumber: 1, numberPlacement: "superscript", color: "#16a34a" },
  { id: "e-sub", label: "E", copyNumber: 1, numberPlacement: "subscript", color: "#16a34a" },
  { id: "tr-super", label: "TR", copyNumber: 1, numberPlacement: "superscript", color: "#0e7490" },
  { id: "tr-sub", label: "TR", copyNumber: 1, numberPlacement: "subscript", color: "#0e7490" },
  { id: "abc-super", label: "ABC", copyNumber: 10, numberPlacement: "superscript", color: "#c2410c" },
  { id: "abc-sub", label: "ABC", copyNumber: 10, numberPlacement: "subscript", color: "#c2410c" },
];

const expectedBadgePositions = {
  "e-super": { x: 363, y: 107, width: 50 },
  "e-sub": { x: 363, y: 355, width: 50 },
  "tr-super": { x: 377, y: 107, width: 50 },
  "tr-sub": { x: 377, y: 359, width: 50 },
  "abc-super": { x: 373, y: 91, width: 70 },
  "abc-sub": { x: 373, y: 373, width: 70 },
};

const svgs = cases.map((item) => {
  let svg = letterTokenSvg({
    label: item.label,
    copyNumber: item.copyNumber,
    numberPlacement: item.numberPlacement,
    name: `${item.label} ${item.copyNumber}`,
    color: item.color,
    fontFamily,
    fontCss,
    fontWeight: "700",
  });
  const expected = expectedBadgePositions[item.id];
  const badge = `<rect x="${expected.x}" y="${expected.y}" width="${expected.width}" height="50" rx="18"`;
  if (!svg.includes(badge)) {
    throw new Error(`Unexpected ${item.numberPlacement} badge position for ${item.label}`);
  }
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

// Exercise every bundled font so a missing asset or malformed @font-face rule
// is caught during the same smoke check as the superscript/subscript layout.
for (const font of TOKEN_FONTS.filter((item) => item.assetUrl)) {
  for (const numberPlacement of ["superscript", "subscript"]) {
    const svg = letterTokenSvg({
      label: "ABC",
      copyNumber: 10,
      numberPlacement,
      name: `${font.label} ${numberPlacement} smoke test`,
      color: "#7c3aed",
      fontFamily: font.family,
      fontCss: font.css,
      fontWeight: font.weight,
    });
    if (!svg.includes(font.assetUrl)) {
      throw new Error(`Font asset was not included in ${font.label} SVG`);
    }
    writeFileSync(join(outDir, `font-${font.key}-${numberPlacement}.svg`), svg);
  }
}

const contrastCases = [
  { mode: "auto", fill: "#ffffff", stroke: "#1f160f" },
  { mode: "dark-on-light", fill: "#111827", stroke: "#ffffff" },
  { mode: "light-on-dark", fill: "#ffffff", stroke: "#1f160f" },
];

for (const item of contrastCases) {
  const svg = letterTokenSvg({
    label: "E",
    copyNumber: 1,
    numberPlacement: "superscript",
    contrastMode: item.mode,
    name: `${item.mode} contrast smoke test`,
    color: "#7c3aed",
    fontFamily,
    fontCss,
    fontWeight: "700",
  });
  if (!svg.includes(`fill="${item.fill}"`) || !svg.includes(`stroke="${item.stroke}"`)) {
    throw new Error(`Unexpected ${item.mode} contrast colors`);
  }
  writeFileSync(join(outDir, `contrast-${item.mode}.svg`), svg);
}

console.log(`wrote ${outDir}`);
