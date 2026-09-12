import OBR, { buildImage } from "@owlbear-rodeo/sdk";
import { rasterizeSvgFile, safeName, sceneImageFromFile } from "./imageUtils.js";
import { gridPosition, NS } from "./layout.js";
import { requireOpenScene } from "./sceneService.js";
import { tokenFontByKey } from "./tokenFonts.js";
import { TOKEN_COLORS } from "./tokenPalette.js";
import { tokenSizeByKey } from "./tokenSizes.js";
import { letterTokenSvg } from "./tokenSvg.js";

const TOKEN_SIZE = 512;

async function tokenPlacementGrid(size) {
  const gridDpi = await OBR.scene.grid.getDpi();
  const step = gridDpi * size.cells;
  return {
    startX: step,
    startY: step,
    columns: 8,
    gapX: step,
    gapY: step,
  };
}

export function normalizeLetter(value) {
  const match = String(value ?? "").trim().match(/^[a-z]$/i);
  return match ? match[0].toUpperCase() : "";
}

function normalizeTokenLabel(...letters) {
  return letters.map(normalizeLetter).join("");
}

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

export function validateTokenRequest({ letter, letter2, letter3, quantity, color, fontKey, sizeKey, addTextLabel }) {
  const normalizedLetter = normalizeLetter(letter);
  if (!normalizedLetter) throw new Error("Choose a first letter from A to Z.");
  if (hasValue(letter2) && !normalizeLetter(letter2)) throw new Error("Letter 2 must be A to Z or blank.");
  if (hasValue(letter3) && !normalizeLetter(letter3)) throw new Error("Letter 3 must be A to Z or blank.");
  const label = normalizeTokenLabel(letter, letter2, letter3);

  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 100) {
    throw new Error("Quantity must be a whole number from 1 to 100.");
  }

  const selectedColor = TOKEN_COLORS.includes(color) ? color : TOKEN_COLORS[0];
  const font = tokenFontByKey(fontKey);
  const size = tokenSizeByKey(sizeKey);

  return {
    letter: normalizedLetter,
    label,
    quantity: parsedQuantity,
    color: selectedColor,
    font,
    size,
    addTextLabel: Boolean(addTextLabel),
  };
}

async function buildTokenItem({ label, letter, quantity, color, font, size, addTextLabel, index, placement }) {
  const copyNumber = index + 1;
  const tokenLabel = quantity > 1 ? `${label}${copyNumber}` : label;
  const name = quantity > 1 ? `${label} ${copyNumber}` : label;
  const dpi = Math.round(TOKEN_SIZE / Math.max(size.cells, 0.5));
  const svg = letterTokenSvg({
    label,
    copyNumber: quantity > 1 ? copyNumber : undefined,
    name,
    color,
    fontFamily: font.family,
    fontCss: font.css,
    fontWeight: font.weight,
  });
  const svgFile = new File([svg], `${safeName(name)}.svg`, { type: "image/svg+xml" });
  const pngFile = await rasterizeSvgFile(svgFile, `${safeName(name)}.png`, TOKEN_SIZE, TOKEN_SIZE);
  const info = await sceneImageFromFile(pngFile, {
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    dpi,
    mime: "image/png",
  });

  return buildImage(info.image, info.grid)
    .name(name)
    .description(`SVG Token Owlbear generated ${tokenLabel} token`)
    .plainText(addTextLabel ? tokenLabel : "")
    .layer("CHARACTER")
    .position(gridPosition(index, placement))
    .metadata({
      [`${NS}/kind`]: "letter-token",
      [`${NS}/letter`]: letter,
      [`${NS}/label`]: label,
      [`${NS}/tokenLabel`]: tokenLabel,
      [`${NS}/color`]: color,
      [`${NS}/fontKey`]: font.key,
      [`${NS}/size`]: size.key,
      [`${NS}/sizeCells`]: size.cells,
      [`${NS}/addTextLabel`]: addTextLabel,
      [`${NS}/copyIndex`]: copyNumber,
    })
    .build();
}

export async function createLetterTokens(request, onStatus = () => {}) {
  const options = validateTokenRequest(request);
  onStatus("Checking Owlbear scene...");
  await requireOpenScene();

  const placement = await tokenPlacementGrid(options.size);
  const items = [];
  for (let index = 0; index < options.quantity; index += 1) {
    onStatus(`Rendering ${options.size.label} ${options.label} ${index + 1} of ${options.quantity}...`);
    items.push(await buildTokenItem({ ...options, index, placement }));
  }

  onStatus(`Adding ${items.length} token${items.length === 1 ? "" : "s"} to the scene...`);
  await OBR.scene.items.addItems(items);
  return items.length;
}
