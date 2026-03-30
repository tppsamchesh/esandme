export type VariantRow = {
  _key: string;
  title?: string;
  size?: string;
  colour?: string;
  sku?: string;
  price?: number | null;
  stock?: number | null;
};

export type ProductDoc = {
  _id: string;
  title: string;
  slug?: { current?: string };
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  images?: unknown[];
  collection?: { _id: string; title: string; slug?: { current?: string } } | null;
  variants?: VariantRow[] | null;
};

export type ProductListItem = ProductDoc & {
  thumbUrl: string | null;
  galleryUrls: string[];
};
