import type { PortableTextBlock } from "@portabletext/types";
import { toPlainText } from "@portabletext/toolkit";

/** Round-trip friendly enough for editing: paragraphs from markdown-style input. */
export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  const trimmed = markdown.trim();
  if (!trimmed) return [];

  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return paragraphs.map((text, i) => {
    const key = `b-${i}-${Math.random().toString(36).slice(2, 9)}`;
    return {
      _type: "block",
      _key: key,
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: `${key}-s`,
          text,
          marks: [],
        },
      ],
    } as unknown as PortableTextBlock;
  });
}

export function portableTextToEditorText(
  body: PortableTextBlock[] | PortableTextBlock | undefined | null
): string {
  if (body == null) return "";
  const blocks = Array.isArray(body) ? body : [body];
  if (blocks.length === 0) return "";
  return toPlainText(blocks as Parameters<typeof toPlainText>[0]);
}
