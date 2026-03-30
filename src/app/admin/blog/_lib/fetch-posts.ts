import { client, urlFor } from "@/lib/sanity/client";
import { groq } from "next-sanity";
import type { PortableTextBlock } from "@portabletext/types";

const listQuery = groq`
  *[_type == "blogPost"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    coverImage,
    seoTitle
  }
`;

export type BlogPostListRow = {
  _id: string;
  title: string;
  slug?: { current?: string };
  publishedAt?: string | null;
  excerpt?: string | null;
  coverImage?: unknown;
  seoTitle?: string | null;
  thumbUrl: string | null;
};

export async function fetchBlogPostsForAdmin(): Promise<BlogPostListRow[]> {
  const rows = await client.fetch<BlogPostListRow[]>(listQuery);
  return rows.map((row) => {
    let thumbUrl: string | null = null;
    if (row.coverImage) {
      try {
        thumbUrl = urlFor(row.coverImage).width(120).height(80).url();
      } catch {
        thumbUrl = null;
      }
    }
    return { ...row, thumbUrl };
  });
}

const detailQuery = groq`
  *[_type == "blogPost" && _id == $id][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    coverImage,
    body,
    seoTitle,
    seoDescription
  }
`;

export type BlogPostDetail = {
  _id: string;
  title: string;
  slug?: { current?: string };
  publishedAt?: string | null;
  excerpt?: string | null;
  coverImage?: unknown;
  body?: PortableTextBlock[] | PortableTextBlock | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export async function fetchBlogPostById(
  id: string
): Promise<BlogPostDetail | null> {
  const doc = await client.fetch<BlogPostDetail | null>(detailQuery, { id });
  return doc;
}
