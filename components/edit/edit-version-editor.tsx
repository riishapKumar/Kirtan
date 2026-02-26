"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { saveNewVersion } from "@/app/edit/[id]/actions";
import { romanizeDevanagari, validateRomanizedLatin } from "@/lib/romanize";

interface EditVersionEditorProps {
  textId: string;
  initialLines: { id: string; extractedContent: string; romanizedContent: string }[];
  versions: { id: string; versionNumber: number; createdAt: string }[];
}

export function EditVersionEditor({ textId, initialLines, versions }: EditVersionEditorProps) {
  const [lines, setLines] = useState(initialLines.map((line) => line.extractedContent));
  const [romanizedLines, setRomanizedLines] = useState(
    initialLines.map((line) => line.romanizedContent || romanizeDevanagari(line.extractedContent)),
  );
  const [isSaving, startSaving] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const hasRomanizationWarning = useMemo(
    () => romanizedLines.some((line) => validateRomanizedLatin(line).hasDevanagari),
    [romanizedLines],
  );

  const updateLine = (index: number, value: string) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? value : line)));
    setRomanizedLines((current) => current.map((line, lineIndex) => (
      lineIndex === index ? romanizeDevanagari(value) : line
    )));
  };

  const updateRomanizedLine = (index: number, value: string) => {
    setRomanizedLines((current) => current.map((line, lineIndex) => (lineIndex === index ? value : line)));
  };

  const deleteLine = (index: number) => {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
    setRomanizedLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const addLineAfter = (index: number) => {
    setLines((current) => [...current.slice(0, index + 1), "", ...current.slice(index + 1)]);
    setRomanizedLines((current) => [...current.slice(0, index + 1), "", ...current.slice(index + 1)]);
  };

  const save = () => {
    startSaving(async () => {
      try {
        const cleanedLines = lines.map((line) => line.trim()).filter(Boolean);
        const cleanedRomanizedLines = romanizedLines.map((line) => line.trim()).filter((_, index) => lines[index]?.trim().length > 0);
        const nextVersion = await saveNewVersion(textId, cleanedLines, cleanedRomanizedLines);
        setStatus(`Saved as version ${nextVersion}. Refresh to see updated history.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unable to save.");
      }
    });
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3 rounded-lg border p-4">
        <h1 className="text-xl font-semibold">Edit Lines</h1>
        {hasRomanizationWarning ? (
          <p className="rounded-md border border-amber-500/50 bg-amber-500/10 p-2 text-sm text-amber-700">
            Warning: Romanized (Latin) contains Devanagari characters. Please fix highlighted lines before saving.
          </p>
        ) : null}
        {lines.map((line, index) => (
          <div key={`${index}-${line.slice(0, 8)}`} className="grid gap-2 rounded-md border p-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Line {index + 1}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => addLineAfter(index)}>Split/Add</Button>
                <Button size="sm" variant="outline" onClick={() => deleteLine(index)}>Delete</Button>
              </div>
            </div>
            <label className="grid gap-1 text-sm">
              Source (Devanagari)
              <textarea value={line} onChange={(event) => updateLine(index, event.target.value)} className="min-h-16 rounded-md border px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Romanized (Latin)
              <textarea
                value={romanizedLines[index] ?? ""}
                onChange={(event) => updateRomanizedLine(index, event.target.value)}
                className="min-h-16 rounded-md border px-3 py-2"
              />
            </label>
          </div>
        ))}
        <Button onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save New Version"}</Button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </div>

      <aside className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Version History</h2>
        <ul className="space-y-2 text-sm">
          {versions.map((version) => (
            <li key={version.id} className="rounded-md border p-2">
              <p>v{version.versionNumber}</p>
              <p className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
