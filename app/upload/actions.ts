"use server";

import { prisma } from "@/lib/prisma";
import { detectDevanagari, romanizeLine, segmentLines, slugify, type EditableLine } from "@/lib/text-processing";

export interface ExtractionResult {
  extractedText: string;
  isDevanagari: boolean;
  lines: EditableLine[];
}

export async function extractPdfText(formData: FormData): Promise<ExtractionResult> {
  const file = formData.get("pdf");

  if (!(file instanceof File)) {
    throw new Error("Please provide a PDF file.");
  }

  const content = Buffer.from(await file.arrayBuffer()).toString("utf-8");
  const cleanedContent = content.replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, " ").replace(/\s+/g, " ").trim();

  const extractedText = cleanedContent.length > 0 ? cleanedContent : "";

  return {
    extractedText,
    isDevanagari: detectDevanagari(extractedText),
    lines: segmentLines(extractedText),
  };
}

interface SavePayload {
  title: string;
  tags: string[];
  rawContent: string;
  lines: string[];
}

export async function saveUploadedText(payload: SavePayload): Promise<{ textId: string; slug: string }> {
  const cleanedTitle = payload.title.trim();

  if (!cleanedTitle || payload.lines.length === 0) {
    throw new Error("Title and at least one line are required.");
  }

  const baseSlug = slugify(cleanedTitle) || "untitled";
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.text.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const normalizedTags = Array.from(new Set(payload.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)));

  const text = await prisma.text.create({
    data: {
      title: cleanedTitle,
      slug,
      versions: {
        create: {
          versionNumber: 1,
          rawContent: payload.rawContent,
          extractedContent: payload.lines.join("\n"),
          romanizedContent: payload.lines.map((line) => romanizeLine(line)).join("\n"),
          lines: {
            create: payload.lines.map((line, index) => ({
              lineNumber: index + 1,
              rawContent: line,
              extractedContent: line,
              romanizedContent: romanizeLine(line),
            })),
          },
          tags: {
            create: normalizedTags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
        },
      },
    },
  });

  return { textId: text.id, slug: text.slug };
}
