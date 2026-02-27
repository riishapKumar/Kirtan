import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { EditVersionEditor } from "@/components/edit/edit-version-editor";

export const runtime = "edge";
interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;

  const text = await prisma.text.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          lines: { orderBy: { lineNumber: "asc" } },
        },
      },
    },
  });

  if (!text || text.versions.length === 0) notFound();

  const latest = text.versions[0];

  return (
    <EditVersionEditor
      textId={text.id}
      initialLines={latest.lines.map((line: (typeof latest.lines)[number]) => ({ id: line.id, extractedContent: line.extractedContent, romanizedContent: line.romanizedContent }))}
      versions={text.versions.map((version: (typeof text.versions)[number]) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        createdAt: version.createdAt.toISOString(),
      }))}
    />
  );
}
