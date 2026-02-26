export interface EditableLine {
  id: string;
  content: string;
}

const devanagariRegex = /[\u0900-\u097F]/;

export function detectDevanagari(content: string): boolean {
  return devanagariRegex.test(content);
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
  return content
    .normalize("NFD")
    .replace(/[\u0900-\u097F]/g, (char) => (char === "\u0964" ? "." : char === "\u0965" ? ".." : ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
