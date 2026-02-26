import Link from "next/link";

import { prisma } from "@/lib/prisma";

interface LibraryPageProps {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { q = "", tag = "" } = await searchParams;

  const [tags, texts] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.text.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        ...(tag
          ? {
              versions: {
                some: {
                  tags: {
                    some: {
                      tag: { name: tag },
                    },
                  },
                },
              },
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { tags: { include: { tag: true } }, lines: true },
        },
      },
    }),
  ]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library</h1>
        <Link href="/upload" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Upload Text</Link>
      </div>

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Search by title..." className="rounded-md border px-3 py-2" />
        <button type="submit" className="h-10 rounded-md border px-4 py-2 text-sm">Search</button>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <Link href={`/library${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={`rounded-full border px-3 py-1 text-xs ${!tag ? "bg-primary text-primary-foreground" : ""}`}>All</Link>
          {tags.map((item: { id: string; name: string }) => {
            const href = `/library?${new URLSearchParams({ ...(q ? { q } : {}), tag: item.name }).toString()}`;
            return (
              <Link key={item.id} href={href} className={`rounded-full border px-3 py-1 text-xs ${tag === item.name ? "bg-primary text-primary-foreground" : ""}`}>
                {item.name}
              </Link>
            );
          })}
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {texts.map((text: { id: string; title: string; slug: string; versions: Array<{ versionNumber: number; lines: unknown[]; tags: Array<{ tagId: string; tag: { name: string } }> }> }) => {
          const latest = text.versions[0];
          return (
            <article key={text.id} className="grid gap-2 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{text.title}</h2>
                <Link href={`/t/${text.slug}`} className="text-xs underline">Open</Link>
              </div>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                {latest?.tags.map((tvTag: { tagId: string; tag: { name: string } }) => (
                  <span key={tvTag.tagId} className="rounded-full border px-2 py-0.5">#{tvTag.tag.name}</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{latest?.lines.length ?? 0} scripts · v{latest?.versionNumber ?? 0}</p>
            </article>
          );
        })}
        {texts.length === 0 ? <p className="text-sm text-muted-foreground">No texts found.</p> : null}
      </div>
    </section>
  );
}
