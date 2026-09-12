import { TOKEN_FONT_URL } from "./tokenFonts.js";

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

let embeddedFontSrc;

async function embeddedTokenFontSrc() {
  if (embeddedFontSrc) return embeddedFontSrc;
  const response = await fetch(TOKEN_FONT_URL);
  if (!response.ok) throw new Error(`Unable to load token font: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  embeddedFontSrc = `data:font/ttf;base64,${bytesToBase64(bytes)}`;
  return embeddedFontSrc;
}

export async function svgFileWithEmbeddedTokenFont(svgFile) {
  const text = await svgFile.text();
  if (!text.includes(TOKEN_FONT_URL)) return svgFile;
  const src = await embeddedTokenFontSrc();
  return new File([text.replaceAll(TOKEN_FONT_URL, src)], svgFile.name, { type: "image/svg+xml" });
}

function parseHex(hex) {
  const value = String(hex ?? "").replace("#", "").trim();
  const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return { r: 0, g: 0, b: 0 };
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function channelLuminance(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastingGlyphColors(hex) {
  return relativeLuminance(hex) > 0.38
    ? { fill: "#111827", stroke: "#ffffff" }
    : { fill: "#ffffff", stroke: "#1f160f" };
}

function tokenGlyph({
  glyph,
  x,
  y,
  size,
  strokeWidth,
  fontFamily,
  fontWeight,
  fill,
  stroke,
}) {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
        font-family="${escapeXml(fontFamily)}" font-size="${size}"
        font-weight="${escapeXml(fontWeight)}" fill="${escapeXml(fill)}"
        stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}"
        paint-order="stroke fill">${escapeXml(glyph)}</text>`;
}

function copyNumberGlyph({ copyNumber, letterCount, fontFamily, fontWeight, fill, stroke }) {
  if (!copyNumber) return "";
  const digits = String(copyNumber);
  const positions = {
    1: { x: 348, y: 378, size: 108 },
    2: { x: 398, y: 372, size: 92 },
    3: { x: 408, y: 364, size: 84 },
  };
  const pos = positions[Math.min(Math.max(letterCount, 1), 3)];
  const size = digits.length > 1 ? pos.size * 0.82 : pos.size;
  const x = digits.length > 1 ? pos.x + 10 : pos.x;
  return tokenGlyph({
    glyph: digits,
    x,
    y: pos.y,
    size,
    strokeWidth: 5,
    fontFamily,
    fontWeight,
    fill,
    stroke,
  });
}

function tokenGlyphs({ label, copyNumber, fontFamily, fontWeight, fill, stroke }) {
  const glyphs = Array.from(String(label || "?").slice(0, 3));
  const letterCount = Math.max(glyphs.length, 1);
  const letters =
    glyphs.length <= 1
      ? tokenGlyph({
          glyph: glyphs[0] || "?",
          x: 256,
          y: 278,
          size: 300,
          strokeWidth: 10,
          fontFamily,
          fontWeight,
          fill,
          stroke,
        })
      : glyphs.length === 2
        ? [
            tokenGlyph({
              glyph: glyphs[0],
              x: 222,
              y: 280,
              size: 284,
              strokeWidth: 10,
              fontFamily,
              fontWeight,
              fill,
              stroke,
            }),
            tokenGlyph({
              glyph: glyphs[1],
              x: 338,
              y: 288,
              size: 176,
              strokeWidth: 8,
              fontFamily,
              fontWeight,
              fill,
              stroke,
            }),
          ].join("\n  ")
        : [
            tokenGlyph({
              glyph: glyphs[0],
              x: 208,
              y: 280,
              size: 250,
              strokeWidth: 10,
              fontFamily,
              fontWeight,
              fill,
              stroke,
            }),
            tokenGlyph({
              glyph: glyphs[1],
              x: 330,
              y: 232,
              size: 120,
              strokeWidth: 7,
              fontFamily,
              fontWeight,
              fill,
              stroke,
            }),
            tokenGlyph({
              glyph: glyphs[2],
              x: 332,
              y: 326,
              size: 128,
              strokeWidth: 7,
              fontFamily,
              fontWeight,
              fill,
              stroke,
            }),
          ].join("\n  ");

  const subscript = copyNumberGlyph({
    copyNumber,
    letterCount,
    fontFamily,
    fontWeight,
    fill,
    stroke,
  });
  return subscript ? `${letters}\n  ${subscript}` : letters;
}

export function letterTokenSvg({
  label,
  copyNumber,
  name,
  color = "#7c3aed",
  fontFamily,
  fontCss = "",
  fontWeight = "800",
  fontSize = 300,
  textFill,
  textStroke,
}) {
  const rawGlyph = String(label || "?").slice(0, 3);
  const title = escapeXml(name || `${rawGlyph} Token`);
  const fill = escapeXml(color);
  const glyphColors = {
    ...contrastingGlyphColors(color),
    ...(textFill ? { fill: textFill } : {}),
    ...(textStroke ? { stroke: textStroke } : {}),
  };
  const style = fontCss ? `<style><![CDATA[${fontCss}]]></style>` : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    ${style}
    <radialGradient id="tokenFill" cx="34%" cy="26%" r="74%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="42%" stop-color="${fill}" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="#111827" stop-opacity="0.92"/>
    </radialGradient>
    <filter id="tokenShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <title>${title}</title>
  <circle cx="256" cy="256" r="222" fill="url(#tokenFill)" stroke="#f8fafc" stroke-width="18" filter="url(#tokenShadow)"/>
  <circle cx="256" cy="256" r="184" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="8"/>
  ${tokenGlyphs({
    label: rawGlyph,
    copyNumber,
    fontFamily,
    fontWeight,
    fill: glyphColors.fill,
    stroke: glyphColors.stroke,
  })}
</svg>`.trim();
}
