"use server";

import { prisma } from "@/lib/prisma";
import { validateRomanizedLatin } from "@/lib/romanize";

export async function saveNewVersion(textId: string, lines: string[], romanizedLines: string[]) {
  const text = await prisma.text.findUnique({
    where: { id: textId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!text) throw new Error("Text not found.");
  if (lines.length !== romanizedLines.length) throw new Error("Romanized (Latin) lines must match source lines.");

  for (const line of romanizedLines) {
    if (validateRomanizedLatin(line).hasDevanagari) {
      throw new Error("Romanized (Latin) text still contains Devanagari characters. Please edit before saving.");
    }
  }

  const nextVersion = (text.versions[0]?.versionNumber ?? 0) + 1;

  await prisma.textVersion.create({
    data: {
      textId,
      versionNumber: nextVersion,
      rawContent: lines.join("\n"),
      extractedContent: lines.join("\n"),
      romanizedContent: romanizedLines.join("\n"),
      lines: {
        create: lines.map((line, index) => ({
          lineNumber: index + 1,
          rawContent: line,
          extractedContent: line,
          romanizedContent: romanizedLines[index],
        })),
      },
    },
  });

  return nextVersion;
}
