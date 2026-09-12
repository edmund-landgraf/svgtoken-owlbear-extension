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

function clampInsideToken(x, y, radius = 148) {
  const dx = x - 256;
  const dy = y - 256;
  const dist = Math.hypot(dx, dy);
  if (dist <= radius) return { x, y };
  const scale = radius / dist;
  return { x: 256 + dx * scale, y: 256 + dy * scale };
}

function copyNumberGlyph({ copyNumber, anchor, nudgeX = 0.4, nudgeY = -0.38, fontFamily, fontWeight, fill, stroke }) {
  if (!copyNumber || !anchor) return "";
  const digits = String(copyNumber);
  const size = Math.max(54, Math.min(86, (digits.length > 1 ? 0.36 : 0.4) * anchor.size));
  const rawX = anchor.x + anchor.size * nudgeX;
  const rawY = anchor.y + anchor.size * nudgeY;
  const { x, y } = clampInsideToken(rawX, rawY, 152 - size * 0.28);
  return tokenGlyph({
    glyph: digits,
    x,
    y,
    size,
    strokeWidth: 3.2,
    fontFamily,
    fontWeight,
    fill,
    stroke,
  });
}

function tokenGlyphs({ label, copyNumber, numberPlacement = "superscript", fontFamily, fontWeight, fill, stroke }) {
  const glyphs = Array.from(String(label || "?").slice(0, 3));
  const letterCount = Math.max(glyphs.length, 1);
  const numbered = Boolean(copyNumber);
  const subscript = numbered && numberPlacement === "subscript";
  const shiftX = numbered ? { 1: -18, 2: -20, 3: -16 }[letterCount] : 0;
  const shiftY = numbered ? (subscript ? -6 : 10) : 0;
  const style = { fontFamily, fontWeight, fill, stroke };

  let letters;
  let superAnchor;
  let subAnchor;
  if (glyphs.length <= 1) {
    const main = {
      x: 256 + shiftX,
      y: 278 + shiftY,
      size: numbered ? 276 : 300,
    };
    superAnchor = main;
    subAnchor = main;
    letters = tokenGlyph({
      glyph: glyphs[0] || "?",
      ...main,
      strokeWidth: 10,
      ...style,
    });
  } else if (glyphs.length === 2) {
    const first = { x: 214 + shiftX, y: 280 + shiftY, size: 268 };
    const second = { x: 318 + shiftX, y: 286 + shiftY, size: 160 };
    superAnchor = second;
    subAnchor = second;
    letters = [
      tokenGlyph({ glyph: glyphs[0], ...first, strokeWidth: 10, ...style }),
      tokenGlyph({ glyph: glyphs[1], ...second, strokeWidth: 8, ...style }),
    ].join("\n  ");
  } else {
    const first = { x: 200 + shiftX, y: 286 + shiftY, size: 236 };
    const second = { x: 312 + shiftX, y: 232 + shiftY, size: 112 };
    const third = { x: 314 + shiftX, y: 324 + shiftY, size: 118 };
    superAnchor = second;
    subAnchor = third;
    letters = [
      tokenGlyph({ glyph: glyphs[0], ...first, strokeWidth: 10, ...style }),
      tokenGlyph({ glyph: glyphs[1], ...second, strokeWidth: 7, ...style }),
      tokenGlyph({ glyph: glyphs[2], ...third, strokeWidth: 7, ...style }),
    ].join("\n  ");
  }

  const mark = copyNumberGlyph({
    copyNumber,
    anchor: subscript ? subAnchor : superAnchor,
    nudgeX: subscript
      ? glyphs.length >= 3
        ? 0.12
        : glyphs.length === 2
          ? 0.2
          : 0.28
      : glyphs.length >= 3
        ? 0.46
        : glyphs.length === 2
          ? 0.38
          : 0.42,
    nudgeY: subscript
      ? glyphs.length >= 3
        ? 0.42
        : glyphs.length === 2
          ? 0.28
          : 0.32
      : glyphs.length >= 3
        ? -0.52
        : glyphs.length === 2
          ? -0.44
          : -0.4,
    fontFamily,
    fontWeight,
    fill,
    stroke,
  });
  return mark ? `${letters}\n  ${mark}` : letters;
}

export function letterTokenSvg({
  label,
  copyNumber,
  numberPlacement = "superscript",
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
    numberPlacement,
    fontFamily,
    fontWeight,
    fill: glyphColors.fill,
    stroke: glyphColors.stroke,
  })}
</svg>`.trim();
}
