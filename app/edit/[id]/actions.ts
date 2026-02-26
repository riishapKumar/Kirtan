"use server";

import { prisma } from "@/lib/prisma";
import { romanizeLine } from "@/lib/text-processing";

export async function saveNewVersion(textId: string, lines: string[]) {
  const text = await prisma.text.findUnique({
    where: { id: textId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!text) throw new Error("Text not found.");

  const nextVersion = (text.versions[0]?.versionNumber ?? 0) + 1;

  await prisma.textVersion.create({
    data: {
      textId,
      versionNumber: nextVersion,
      rawContent: lines.join("\n"),
      extractedContent: lines.join("\n"),
      romanizedContent: lines.map((line) => romanizeLine(line)).join("\n"),
      lines: {
        create: lines.map((line, index) => ({
          lineNumber: index + 1,
          rawContent: line,
          extractedContent: line,
          romanizedContent: romanizeLine(line),
        })),
      },
    },
  });

  return nextVersion;
}
