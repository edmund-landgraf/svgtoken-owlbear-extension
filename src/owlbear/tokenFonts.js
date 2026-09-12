export const TOKEN_FONT_URL = "/fonts/CinzelDecorative-Bold.ttf";

export const TOKEN_FONTS = [
  {
    key: "cinzel-decorative",
    label: "Cinzel Decorative",
    family: "CinzelDecorative, serif",
    css: `@font-face{font-family:"CinzelDecorative";src:url("${TOKEN_FONT_URL}") format("truetype");font-weight:700;}`,
    weight: "700",
  },
  { key: "arial-black", label: "Arial Black", family: '"Arial Black", Arial, Helvetica, sans-serif', weight: "900" },
  { key: "verdana", label: "Verdana", family: "Verdana, Geneva, sans-serif", weight: "800" },
  { key: "georgia", label: "Georgia", family: "Georgia, serif", weight: "700" },
  { key: "trebuchet", label: "Trebuchet MS", family: '"Trebuchet MS", Arial, sans-serif', weight: "800" },
  { key: "tahoma", label: "Tahoma", family: "Tahoma, Geneva, sans-serif", weight: "800" },
  { key: "impact", label: "Impact", family: "Impact, Haettenschweiler, sans-serif", weight: "400" },
  { key: "courier-new", label: "Courier New", family: '"Courier New", Courier, monospace', weight: "800" },
];

export function tokenFontByKey(key) {
  return TOKEN_FONTS.find((font) => font.key === key) ?? TOKEN_FONTS[0];
}
