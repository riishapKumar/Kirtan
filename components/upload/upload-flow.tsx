"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { type EditableLine } from "@/lib/text-processing";
import { romanizeDevanagari, validateRomanizedLatin } from "@/lib/romanize";
import { Button } from "@/components/ui/button";
import { saveUploadedText } from "@/app/upload/actions";
import { type ExtractionResult } from "@/lib/pdf-extraction";

interface UploadFlowProps {
  initialResult?: ExtractionResult;
}

export function UploadFlow({ initialResult }: UploadFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isExtracting, startExtracting] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [sourcePdfFile, setSourcePdfFile] = useState<File | null>(null);
  const [isDevanagari, setIsDevanagari] = useState(false);
  const [lines, setLines] = useState<EditableLine[]>(initialResult?.lines ?? []);
  const [romanizedLines, setRomanizedLines] = useState<string[]>(
    (initialResult?.lines ?? []).map((line) => romanizeDevanagari(line.content)),
  );
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(
    () => tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  );

  const hasRomanizationWarning = useMemo(
    () => romanizedLines.some((line) => validateRomanizedLatin(line).hasDevanagari),
    [romanizedLines],
  );

  const runExtraction = (formData: FormData) => {
    setError(null);
    startExtracting(async () => {
      try {
        const sourcePdf = formData.get("pdf");

        if (!(sourcePdf instanceof File)) {
          throw new Error("Please provide a PDF file.");
        }

        setSourcePdfFile(sourcePdf);

        const requestBody = new FormData();
        requestBody.set("pdf", sourcePdf);

        const response = await fetch("/api/extract-pdf", {
          method: "POST",
          body: requestBody,
        });

        const payload = (await response.json()) as Partial<ExtractionResult> & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Extraction failed.");
        }

        if (typeof payload.extractedText !== "string" || typeof payload.isDevanagari !== "boolean" || !Array.isArray(payload.lines)) {
          throw new Error("Unexpected extraction response.");
        }

        const result: ExtractionResult = {
          extractedText: payload.extractedText,
          isDevanagari: payload.isDevanagari,
          lines: payload.lines,
        };

        setRawContent(result.extractedText);
        setIsDevanagari(result.isDevanagari);
        setLines(result.lines);
        setRomanizedLines(result.lines.map((line) => romanizeDevanagari(line.content)));
        setStep(2);
      } catch (extractError) {
        setError(extractError instanceof Error ? extractError.message : "Extraction failed.");
      }
    });
  };

  const updateLine = (id: string, value: string) => {
    const lineIndex = lines.findIndex((line) => line.id === id);
    setLines((current) => current.map((line) => (line.id === id ? { ...line, content: value } : line)));
    if (lineIndex >= 0) {
      setRomanizedLines((current) => current.map((line, index) => (index === lineIndex ? romanizeDevanagari(value) : line)));
    }
  };

  const updateRomanizedLine = (index: number, value: string) => {
    setRomanizedLines((current) => current.map((line, lineIndex) => (lineIndex === index ? value : line)));
  };

  const trimLine = (id: string) => {
    const target = lines.find((line) => line.id === id);
    if (!target) return;
    updateLine(id, target.content.trim());
  };

  const deleteLine = (id: string) => {
    setLines((current) => {
      const index = current.findIndex((line) => line.id === id);
      if (index < 0) return current;
      setRomanizedLines((romanizedCurrent) => romanizedCurrent.filter((_, romanizedIndex) => romanizedIndex !== index));
      return current.filter((line) => line.id !== id);
    });
  };

  const splitLine = (id: string) => {
    setLines((current) => {
      const targetIndex = current.findIndex((line) => line.id === id);
      if (targetIndex < 0) return current;
      const target = current[targetIndex];
      const midpoint = Math.max(1, Math.floor(target.content.length / 2));
      const left = target.content.slice(0, midpoint).trim();
      const right = target.content.slice(midpoint).trim();
      const nextLines = [
        ...current.slice(0, targetIndex),
        { id: `${id}-a`, content: left || target.content },
        { id: `${id}-b`, content: right || "" },
        ...current.slice(targetIndex + 1),
      ].filter((line) => line.content.length > 0);
      setRomanizedLines(nextLines.map((line) => romanizeDevanagari(line.content)));
      return nextLines;
    });
  };

  const mergeWithNext = (id: string) => {
    setLines((current) => {
      const idx = current.findIndex((line) => line.id === id);
      if (idx < 0 || idx === current.length - 1) return current;
      const merged = `${current[idx].content} ${current[idx + 1].content}`.trim();
      const nextLines = [...current.slice(0, idx), { id: current[idx].id, content: merged }, ...current.slice(idx + 2)];
      setRomanizedLines(nextLines.map((line) => romanizeDevanagari(line.content)));
      return nextLines;
    });
  };

  const moveLine = (id: string, direction: -1 | 1) => {
    setLines((current) => {
      const idx = current.findIndex((line) => line.id === id);
      const swapIdx = idx + direction;
      if (idx < 0 || swapIdx < 0 || swapIdx >= current.length) return current;
      const cloned = [...current];
      [cloned[idx], cloned[swapIdx]] = [cloned[swapIdx], cloned[idx]];
      setRomanizedLines(cloned.map((line) => romanizeDevanagari(line.content)));
      return cloned;
    });
  };

  const save = () => {
    setError(null);
    startSaving(async () => {
      try {
        const cleanedLines = lines.map((line) => line.content.trim()).filter(Boolean);
        const cleanedRomanizedLines = romanizedLines.map((line) => line.trim()).filter((_, index) => lines[index]?.content.trim().length > 0);

        const result = await saveUploadedText({
          title,
          tags,
          rawContent,
          lines: cleanedLines,
          romanizedLines: cleanedRomanizedLines,
          sourcePdfFile: sourcePdfFile ?? undefined,
        });
        setSavedSlug(result.slug);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Save failed.");
      }
    });
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Upload Text</h1>
      <p className="text-sm text-muted-foreground">Step {step} of 2</p>
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 rounded-lg border p-4">
        <label className="grid gap-1 text-sm">
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-md border px-3 py-2" placeholder="Bhajan title" />
        </label>
        <label className="grid gap-1 text-sm">
          Tags (comma separated)
          <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} className="rounded-md border px-3 py-2" placeholder="morning, aarti" />
        </label>

        {step === 1 ? (
          <form action={runExtraction} className="grid gap-2">
            <label className="grid gap-1 text-sm">
              PDF file
              <input name="pdf" type="file" accept="application/pdf" required className="rounded-md border px-3 py-2" />
            </label>
            <Button type="submit" disabled={isExtracting}>{isExtracting ? "Extracting..." : "Run Extraction"}</Button>
          </form>
        ) : null}
      </div>

      {step === 2 ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm">
            <p>Devanagari detected: <strong>{isDevanagari ? "Yes" : "No"}</strong></p>
            <p className="text-muted-foreground">Segmentation mode: newline-first, fallback on danda markers (`।`, `॥`).</p>
          </div>

          {hasRomanizationWarning ? (
            <p className="rounded-md border border-amber-500/50 bg-amber-500/10 p-2 text-sm text-amber-700">
              Warning: Romanized (Latin) still contains Devanagari characters. Please manually edit before save.
            </p>
          ) : null}

          <div className="grid gap-3">
            {lines.map((line, index) => (
              <div key={line.id} className="grid gap-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Line {index + 1}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => moveLine(line.id, -1)}>↑</Button>
                    <Button size="sm" variant="outline" onClick={() => moveLine(line.id, 1)}>↓</Button>
                    <Button size="sm" variant="outline" onClick={() => splitLine(line.id)}>Split</Button>
                    <Button size="sm" variant="outline" onClick={() => mergeWithNext(line.id)}>Merge</Button>
                    <Button size="sm" variant="outline" onClick={() => trimLine(line.id)}>Trim</Button>
                    <Button size="sm" variant="outline" onClick={() => deleteLine(line.id)}>Delete</Button>
                  </div>
                </div>
                <label className="grid gap-1 text-sm">
                  Source (Devanagari)
                  <textarea value={line.content} onChange={(event) => updateLine(line.id, event.target.value)} className="min-h-20 rounded-md border px-3 py-2" />
                </label>
                <label className="grid gap-1 text-sm">
                  Romanized (Latin)
                  <textarea
                    value={romanizedLines[index] ?? ""}
                    onChange={(event) => updateRomanizedLine(index, event.target.value)}
                    className="min-h-20 rounded-md border px-3 py-2"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
            <div>
              <h2 className="mb-2 font-medium">Source (Devanagari)</h2>
              <ol className="list-decimal space-y-1 pl-6 text-sm">
                {lines.map((line) => <li key={`${line.id}-hi`}>{line.content}</li>)}
              </ol>
            </div>
            <div>
              <h2 className="mb-2 font-medium">Romanized (Latin)</h2>
              <ol className="list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
                {romanizedLines.map((line, index) => <li key={`${lines[index]?.id ?? index}-ro`}>{line}</li>)}
              </ol>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save as v1"}</Button>
            {savedSlug ? <Link className="text-sm underline" href={`/t/${savedSlug}`}>Open teleprompter</Link> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
