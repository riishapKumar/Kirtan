import { NextResponse } from "next/server";

import { extractPdfTextFromFile, PdfExtractionError } from "@/lib/pdf-extraction";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please provide a PDF file." }, { status: 400 });
    }

    const result = await extractPdfTextFromFile(file);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[api.extract-pdf] Unexpected extraction failure.", error);
    return NextResponse.json({ error: "Extraction failed. Please try again." }, { status: 500 });
  }
}
