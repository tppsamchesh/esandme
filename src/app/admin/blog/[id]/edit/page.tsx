import { PostEditorForm } from "@/app/admin/blog/_components/PostEditorForm";
import { fetchBlogPostById } from "@/app/admin/blog/_lib/fetch-posts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchBlogPostById(id);
  if (!post) return { title: "Post" };
  return { title: `Edit: ${post.title}` };
}

export default async function AdminBlogEditPage({ params }: Props) {
  const { id } = await params;
  const post = await fetchBlogPostById(id);
  if (!post) notFound();

  const initialCoverUrl =
    typeof post.coverImage === "string" ? post.coverImage : null;

  return (
    <div className="p-6 md:p-8">
      <PostEditorForm
        mode="edit"
        initial={post}
        initialCoverUrl={initialCoverUrl}
      />
    </div>
  );
}
