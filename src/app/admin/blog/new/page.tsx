import { PostEditorForm } from "@/app/admin/blog/_components/PostEditorForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New post",
};

export default function AdminBlogNewPage() {
  return (
    <div className="p-6 md:p-8">
      <PostEditorForm mode="new" initial={null} initialCoverUrl={null} />
    </div>
  );
}
