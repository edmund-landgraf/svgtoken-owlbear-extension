export const TOKEN_FONT_URL = "/fonts/CinzelDecorative-Bold.ttf";

function bundledFont({ key, label, family, file, weight = "700", weightRange }) {
  const url = `/fonts/${file}`;
  const cssWeight = weightRange ?? weight;
  return {
    key,
    label,
    family,
    assetUrl: url,
    css: `@font-face{font-family:"${family}";src:url("${url}") format("truetype");font-weight:${cssWeight};}`,
    weight,
  };
}

export const TOKEN_FONTS = [
  bundledFont({ key: "cinzel-decorative", label: "Cinzel Decorative", family: "CinzelDecorative", file: "CinzelDecorative-Bold.ttf" }),
  bundledFont({ key: "bangers", label: "Bangers", family: "Bangers", file: "Bangers-Regular.ttf", weight: "400" }),
  bundledFont({ key: "oswald", label: "Oswald", family: "Oswald", file: "Oswald-Variable.ttf", weight: "700", weightRange: "200 700" }),
  bundledFont({ key: "roboto-condensed", label: "Roboto Condensed", family: "RobotoCondensed", file: "RobotoCondensed-Variable.ttf", weight: "700", weightRange: "100 900" }),
  bundledFont({ key: "uncial-antiqua", label: "Uncial Antiqua", family: "UncialAntiqua", file: "UncialAntiqua-Regular.ttf", weight: "400" }),
  bundledFont({ key: "rye", label: "Rye", family: "Rye", file: "Rye-Regular.ttf", weight: "400" }),
  bundledFont({ key: "pirata-one", label: "Pirata One", family: "PirataOne", file: "PirataOne-Regular.ttf", weight: "400" }),
  { key: "arial-black", label: "Arial Black", family: '"Arial Black", Arial, Helvetica, sans-serif', weight: "900" },
  { key: "verdana", label: "Verdana", family: "Verdana, Geneva, sans-serif", weight: "800" },
  { key: "georgia", label: "Georgia", family: "Georgia, serif", weight: "700" },
  { key: "trebuchet", label: "Trebuchet MS", family: '"Trebuchet MS", Arial, sans-serif', weight: "800" },
  { key: "tahoma", label: "Tahoma", family: "Tahoma, Geneva, sans-serif", weight: "800" },
  { key: "impact", label: "Impact", family: "Impact, Haettenschweiler, sans-serif", weight: "400" },
  { key: "courier-new", label: "Courier New", family: '"Courier New", Courier, monospace', weight: "800" },
];

export const TOKEN_FONT_URLS = TOKEN_FONTS.flatMap((font) => (font.assetUrl ? [font.assetUrl] : []));

export function tokenFontByKey(key) {
  return TOKEN_FONTS.find((font) => font.key === key) ?? TOKEN_FONTS[0];
}
