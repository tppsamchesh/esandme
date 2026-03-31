import { groq } from "next-sanity";

export const productCountQuery = groq`count(*[_type == "product"])`;

export const productsWithVariantsQuery = groq`
  *[_type == "product"] {
    _id,
    title,
    "slug": slug.current,
    variants[]{ title, size, colour, stock, sku }
  }
`;

/** Admin products list: variants include _key + price for full editing on /admin/products */
export const adminProductsListQuery = groq`
  *[_type == "product"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    price,
    comparePrice,
    hidden,
    images,
    collection->{ _id, title, slug },
    variants[]{ _key, title, size, colour, sku, price, stock }
  }
`;

/** Admin collections list for /admin/collections */
export const adminCollectionsListQuery = groq`
  *[_type == "collection"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    heroImage
  }
`;
