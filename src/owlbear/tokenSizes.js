export const TOKEN_SIZES = [
  { key: "tiny", label: "Tiny", cells: 0.5 },
  { key: "small", label: "Small", cells: 1 },
  { key: "medium", label: "Medium", cells: 1 },
  { key: "large", label: "Large", cells: 2 },
  { key: "huge", label: "Huge", cells: 3 },
  { key: "gargantuan", label: "Gargantuan", cells: 4 },
];

export function tokenSizeByKey(key) {
  return TOKEN_SIZES.find((size) => size.key === key) ?? TOKEN_SIZES.find((size) => size.key === "medium");
}
