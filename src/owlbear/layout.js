export const NS = "com.edmundlandgraf.svgtoken.owlbear";

export function gridPosition(index, { startX, startY, columns, gapX, gapY }) {
  const row = Math.floor(index / columns);
  const column = index % columns;
  return {
    x: startX + column * gapX,
    y: startY + row * gapY,
  };
}
