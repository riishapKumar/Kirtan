import pdfParse from "pdf-parse";

import { detectDevanagari, segmentLines, type EditableLine } from "@/lib/text-processing";

const LOG_PREFIX = "[api.extract-pdf]";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface ExtractionResult {
  extractedText: string;
  isDevanagari: boolean;
  lines: EditableLine[];
}

export class PdfExtractionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

export async function extractPdfTextFromFile(file: File): Promise<ExtractionResult> {
  if (file.type !== "application/pdf") {
    throw new PdfExtractionError("Only PDF files are supported.", 415);
  }

  if (file.size === 0) {
    throw new PdfExtractionError("The uploaded PDF is empty.", 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PdfExtractionError(`PDF exceeds the maximum allowed size of ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`, 413);
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
    throw new PdfExtractionError("PDF extraction failed. Please try a smaller or text-based PDF.", 422);
  }

  const extractedText = (parsed.text ?? "").replace(/\u0000/g, " ").trim();

  return {
    extractedText,
    isDevanagari: detectDevanagari(extractedText),
    lines: segmentLines(extractedText),
  };
}
