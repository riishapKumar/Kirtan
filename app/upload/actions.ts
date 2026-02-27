"use server";

import { prisma } from "@/lib/prisma";
import { detectDevanagari, segmentLines, slugify, type EditableLine } from "@/lib/text-processing";
import { romanizeDevanagari, validateRomanizedLatin } from "@/lib/romanize";
import pdfParse from "pdf-parse";

const LOG_PREFIX = "[upload.extractPdfText]";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported.");
  }

  if (file.size === 0) {
    throw new Error("The uploaded PDF is empty.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`PDF exceeds the maximum allowed size of ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`);
  }

  let parsed: Awaited<ReturnType<typeof pdfParse>>;

  try {
    parsed = await pdfParse(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to parse uploaded PDF.`, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      stack: error instanceof Error ? error.stack : String(error),
    });
    throw new Error("PDF extraction failed. Please try a smaller or text-based PDF.");
  }

  const extractedText = (parsed.text ?? "").replace(/\u0000/g, " ").trim();

  return {
    extractedText,
    isDevanagari: detectDevanagari(extractedText),
    lines: segmentLines(extractedText),
  };
}

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
