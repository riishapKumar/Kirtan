import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { TeleprompterView } from "@/components/teleprompter/teleprompter-view";

interface TemplatePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params;

  const text = await prisma.text.findUnique({
    where: { slug },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          lines: {
            orderBy: { lineNumber: "asc" },
          },
        },
      },
    },
  });

  if (!text || text.versions.length === 0) {
    notFound();
  }

  return <TeleprompterView title={text.title} lines={text.versions[0].lines} />;
}
