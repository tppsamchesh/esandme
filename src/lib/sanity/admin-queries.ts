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
