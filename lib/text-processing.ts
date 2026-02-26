import { containsDevanagari, romanizeDevanagari } from "@/lib/romanize";

export interface EditableLine {
  id: string;
  content: string;
}

export function detectDevanagari(content: string): boolean {
  return containsDevanagari(content);
}

export function segmentLines(rawText: string): EditableLine[] {
  const newlineSegments = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const segments = newlineSegments.length > 0
    ? newlineSegments
    : rawText
        .split(/(?<=[\u0964\u0965])/)
        .map((line) => line.trim())
        .filter(Boolean);

  return segments.map((content, index) => ({ id: `line-${index + 1}`, content }));
}

export function romanizeLine(content: string): string {
  return romanizeDevanagari(content, { titleCase: true });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
