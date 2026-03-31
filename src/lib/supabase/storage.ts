import { getSupabase } from "@/lib/supabase/client";

const BUCKET = "product-images";

/** Uploads a file to the public `product-images` bucket; returns the public object URL. */
export async function uploadPublicImage(
  file: File,
  pathPrefix: string,
): Promise<string> {
  const supabase = getSupabase();
  const ext =
    file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return pub.publicUrl;
}
