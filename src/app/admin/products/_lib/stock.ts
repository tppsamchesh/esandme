import type { VariantRow } from "./types";

export function variantNumericStock(stock: number | null | undefined): number {
  if (typeof stock === "number" && !Number.isNaN(stock)) return Math.max(0, stock);
  return 0;
}

export function totalVariantStock(variants: VariantRow[] | null | undefined): number {
  if (!variants?.length) return 0;
  return variants.reduce((sum, v) => sum + variantNumericStock(v.stock), 0);
}

export function productStockBadge(
  variants: VariantRow[] | null | undefined
): "out" | "low" | null {
  const vs = variants ?? [];
  if (vs.some((v) => variantNumericStock(v.stock) === 0)) return "out";
  if (vs.some((v) => {
    const n = variantNumericStock(v.stock);
    return n > 0 && n < 5;
  }))
    return "low";
  return null;
}
