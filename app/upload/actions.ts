"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/text-processing";
import { romanizeDevanagari, validateRomanizedLatin } from "@/lib/romanize";
async function uploadPdfToSupabase(file: File): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "pdfs";

  if (!supabaseUrl || !serviceRole) return null;

  const objectPath = `${Date.now()}-${file.name}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRole}`,
      apikey: serviceRole,
      "Content-Type": file.type || "application/pdf",
      "x-upsert": "true",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) throw new Error("Failed to upload PDF to Supabase Storage.");
  return `${bucket}/${objectPath}`;
}

interface SavePayload {
  title: string;
  tags: string[];
  rawContent: string;
  lines: string[];
  romanizedLines: string[];
  sourcePdfFile?: File;
}

export async function saveUploadedText(payload: SavePayload): Promise<{ textId: string; slug: string }> {
  const cleanedTitle = payload.title.trim();

  if (!cleanedTitle || payload.lines.length === 0) {
    throw new Error("Title and at least one line are required.");
  }

  if (payload.lines.length !== payload.romanizedLines.length) {
    throw new Error("Romanized (Latin) lines must match source lines.");
  }

  for (const line of payload.romanizedLines) {
    if (validateRomanizedLatin(line).hasDevanagari) {
      throw new Error("Romanized (Latin) text still contains Devanagari characters. Please edit before saving.");
    }
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
      sourcePdf: payload.sourcePdfFile ? await uploadPdfToSupabase(payload.sourcePdfFile) : null,
      versions: {
        create: {
          versionNumber: 1,
          rawContent: payload.rawContent,
          extractedContent: payload.lines.join("\n"),
          romanizedContent: payload.romanizedLines.join("\n"),
          lines: {
            create: payload.lines.map((line, index) => ({
              lineNumber: index + 1,
              rawContent: line,
              extractedContent: line,
              romanizedContent: payload.romanizedLines[index] ?? romanizeDevanagari(line),
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
