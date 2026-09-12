import { publishTokenPng } from "./tokenHost.js";
import { svgFileWithEmbeddedTokenFont } from "./tokenSvg.js";

export function safeName(value, fallback = "asset") {
  return (
    String(value ?? fallback)
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || fallback
  );
}

export async function imageSizeFromBlob(blob, name) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error(`Unable to decode ${name} (${blob.type || "unknown type"}, ${blob.size ?? 0} bytes).`);
  }
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

export async function sceneImageFromFile(file, { width, height, dpi, mime } = {}) {
  const size =
    Number.isFinite(width) && Number.isFinite(height)
      ? { width, height }
      : await imageSizeFromBlob(file, file.name);
  const url = await publishTokenPng(file);
  const gridDpi = dpi ?? Math.max(size.width, size.height);
  return {
    file,
    image: { ...size, url, mime: mime || file.type || "image/png" },
    grid: { dpi: gridDpi, offset: { x: size.width / 2, y: size.height / 2 } },
  };
}

export async function rasterizeSvgFile(svgFile, filename, width, height) {
  const file = await svgFileWithEmbeddedTokenFont(svgFile);
  const svgText = await file.text();
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error(`Unable to render ${filename}`));
            return;
          }
          resolve(new File([blob], filename, { type: "image/png" }));
        }, "image/png");
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to decode ${filename}`));
    };

    image.src = objectUrl;
  });
}
