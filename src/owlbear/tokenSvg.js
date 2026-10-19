import { TOKEN_FONT_URLS } from "./tokenFonts.js";

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

const embeddedFontSources = new Map();

async function embeddedTokenFontSrc(fontUrl) {
  if (embeddedFontSources.has(fontUrl)) return embeddedFontSources.get(fontUrl);
  const response = await fetch(fontUrl);
  if (!response.ok) throw new Error(`Unable to load token font ${fontUrl}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const source = `data:font/ttf;base64,${bytesToBase64(bytes)}`;
  embeddedFontSources.set(fontUrl, source);
  return source;
}

export async function svgFileWithEmbeddedTokenFont(svgFile) {
  const text = await svgFile.text();
  const fontUrls = TOKEN_FONT_URLS.filter((fontUrl) => text.includes(fontUrl));
  if (!fontUrls.length) return svgFile;

  let embeddedText = text;
  for (const fontUrl of fontUrls) {
    embeddedText = embeddedText.replaceAll(fontUrl, await embeddedTokenFontSrc(fontUrl));
  }
  return new File([embeddedText], svgFile.name, { type: "image/svg+xml" });
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

export function glyphColorsForMode(hex, contrastMode = "auto") {
  if (contrastMode === "dark-on-light") return { fill: "#111827", stroke: "#ffffff" };
  if (contrastMode === "light-on-dark") return { fill: "#ffffff", stroke: "#1f160f" };
  return contrastingGlyphColors(hex);
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

function copyNumberSlot(letterCount, placement) {
  // Keep the copy number in a reserved corner instead of nudging it from a
  // letter anchor. Font metrics vary substantially between Arial, Impact,
  // Cinzel, and the other selectable fonts, so anchor-relative placement
  // makes the number collide with 2- and 3-letter labels unpredictably.
  const slots = {
    1: {
      superscript: { x: 388, y: 132 },
      subscript: { x: 388, y: 380 },
    },
    2: {
      superscript: { x: 402, y: 132 },
      subscript: { x: 402, y: 384 },
    },
    3: {
      superscript: { x: 408, y: 116 },
      subscript: { x: 408, y: 398 },
    },
  };
  return slots[Math.min(Math.max(letterCount, 1), 3)][placement === "subscript" ? "subscript" : "superscript"];
}

function copyNumberGlyph({ copyNumber, letterCount, numberPlacement, fontFamily, fontWeight, fill, stroke }) {
  if (!copyNumber) return "";

  const digits = String(copyNumber);
  const { x, y } = copyNumberSlot(letterCount, numberPlacement);
  const twoDigit = digits.length > 1;
  const width = twoDigit ? 70 : 50;
  const height = 50;
  const fontSize = twoDigit ? 34 : 38;

  // The outlined badge is intentionally small and follows the superscript /
  // subscript slot. It gives 1- and 2-digit values a stable silhouette and a
  // clear separation from the smaller secondary letters in 2- and 3-letter
  // tokens. The badge also avoids relying on browser-specific baseline math.
  return `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="18"
        fill="${escapeXml(stroke)}" fill-opacity="0.82" stroke="${escapeXml(fill)}" stroke-width="4"/>
    ${tokenGlyph({
      glyph: digits,
      x,
      y,
      size: fontSize,
      strokeWidth: 2.4,
      fontFamily,
      fontWeight,
      fill,
      stroke: "#ffffff",
    })}`;
}

function tokenGlyphs({ label, copyNumber, numberPlacement = "superscript", fontFamily, fontWeight, fill, stroke }) {
  const glyphs = Array.from(String(label || "?").slice(0, 3));
  const letterCount = Math.max(glyphs.length, 1);
  const numbered = Boolean(copyNumber);
  const style = { fontFamily, fontWeight, fill, stroke };

  let letters;
  if (glyphs.length <= 1) {
    const main = {
      x: 256,
      y: 278,
      size: numbered ? 276 : 300,
    };
    letters = tokenGlyph({
      glyph: glyphs[0] || "?",
      ...main,
      strokeWidth: 10,
      ...style,
    });
  } else if (glyphs.length === 2) {
    const first = { x: 214, y: 280, size: 268 };
    const second = { x: 318, y: 286, size: 160 };
    letters = [
      tokenGlyph({ glyph: glyphs[0], ...first, strokeWidth: 10, ...style }),
      tokenGlyph({ glyph: glyphs[1], ...second, strokeWidth: 8, ...style }),
    ].join("\n  ");
  } else {
    const first = { x: 200, y: 286, size: 236 };
    const second = { x: 312, y: 232, size: 112 };
    const third = { x: 314, y: 324, size: 118 };
    letters = [
      tokenGlyph({ glyph: glyphs[0], ...first, strokeWidth: 10, ...style }),
      tokenGlyph({ glyph: glyphs[1], ...second, strokeWidth: 7, ...style }),
      tokenGlyph({ glyph: glyphs[2], ...third, strokeWidth: 7, ...style }),
    ].join("\n  ");
  }

  const mark = copyNumberGlyph({
    copyNumber,
    letterCount,
    numberPlacement,
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
  contrastMode = "auto",
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
    ...glyphColorsForMode(color, contrastMode),
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
