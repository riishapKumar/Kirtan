"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { romanizeLine, type EditableLine } from "@/lib/text-processing";
import { Button } from "@/components/ui/button";
import { extractPdfText, saveUploadedText, type ExtractionResult } from "@/app/upload/actions";

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
  const [isDevanagari, setIsDevanagari] = useState(false);
  const [lines, setLines] = useState<EditableLine[]>(initialResult?.lines ?? []);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(
    () => tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  );

  const runExtraction = (formData: FormData) => {
    setError(null);
    startExtracting(async () => {
      try {
        const result = await extractPdfText(formData);
        setRawContent(result.extractedText);
        setIsDevanagari(result.isDevanagari);
        setLines(result.lines);
        setStep(2);
      } catch (extractError) {
        setError(extractError instanceof Error ? extractError.message : "Extraction failed.");
      }
    });
  };

  const updateLine = (id: string, value: string) => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, content: value } : line)));
  };

  const trimLine = (id: string) => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, content: line.content.trim() } : line)));
  };

  const deleteLine = (id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  };

  const splitLine = (id: string) => {
    setLines((current) => {
      const targetIndex = current.findIndex((line) => line.id === id);
      if (targetIndex < 0) return current;
      const target = current[targetIndex];
      const midpoint = Math.max(1, Math.floor(target.content.length / 2));
      const left = target.content.slice(0, midpoint).trim();
      const right = target.content.slice(midpoint).trim();
      return [
        ...current.slice(0, targetIndex),
        { id: `${id}-a`, content: left || target.content },
        { id: `${id}-b`, content: right || "" },
        ...current.slice(targetIndex + 1),
      ].filter((line) => line.content.length > 0);
    });
  };

  const mergeWithNext = (id: string) => {
    setLines((current) => {
      const idx = current.findIndex((line) => line.id === id);
      if (idx < 0 || idx === current.length - 1) return current;
      const merged = `${current[idx].content} ${current[idx + 1].content}`.trim();
      return [...current.slice(0, idx), { id: current[idx].id, content: merged }, ...current.slice(idx + 2)];
    });
  };

  const moveLine = (id: string, direction: -1 | 1) => {
    setLines((current) => {
      const idx = current.findIndex((line) => line.id === id);
      const swapIdx = idx + direction;
      if (idx < 0 || swapIdx < 0 || swapIdx >= current.length) return current;
      const cloned = [...current];
      [cloned[idx], cloned[swapIdx]] = [cloned[swapIdx], cloned[idx]];
      return cloned;
    });
  };

  const save = () => {
    setError(null);
    startSaving(async () => {
      try {
        const result = await saveUploadedText({
          title,
          tags,
          rawContent,
          lines: lines.map((line) => line.content.trim()).filter(Boolean),
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
                <textarea value={line.content} onChange={(event) => updateLine(line.id, event.target.value)} className="min-h-20 rounded-md border px-3 py-2" />
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
            <div>
              <h2 className="mb-2 font-medium">Hindi</h2>
              <ol className="list-decimal space-y-1 pl-6 text-sm">
                {lines.map((line) => <li key={`${line.id}-hi`}>{line.content}</li>)}
              </ol>
            </div>
            <div>
              <h2 className="mb-2 font-medium">Romanized</h2>
              <ol className="list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
                {lines.map((line) => <li key={`${line.id}-ro`}>{romanizeLine(line.content)}</li>)}
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
