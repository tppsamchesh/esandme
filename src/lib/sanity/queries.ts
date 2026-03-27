import { groq } from 'next-sanity'

export const allProductsQuery = groq`
  *[_type == "product"] {
    _id, title, slug, price, comparePrice,
    images, collection->{title, slug},
    variants, seoTitle, seoDescription
  }
`

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id, title, slug, description, price, comparePrice,
    images, collection->{title, slug},
    variants, reviews, seoTitle, seoDescription
  }
`

export const collectionBySlugQuery = groq`
  *[_type == "collection" && slug.current == $slug][0] {
    _id, title, slug, description, heroImage,
    seoTitle, seoDescription,
    "products": *[_type == "product" && collection._ref == ^._id] {
      _id, title, slug, price, comparePrice, images, variants
    }
  }
`

export const allCollectionsQuery = groq`
  *[_type == "collection"] {
    _id, title, slug, description, heroImage
  }
`

export const allBlogPostsQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, publishedAt, excerpt, coverImage
  }
`

export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, excerpt, coverImage, body,
    seoTitle, seoDescription
  }
`

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    announcementBar, freeDeliveryThreshold, nav
  }
`
