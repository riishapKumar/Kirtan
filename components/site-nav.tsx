import Link from "next/link";

const links = [
  { href: "/library", label: "Library" },
  { href: "/upload", label: "Upload" },
  { href: "/t/demo-slug", label: "Template" },
  { href: "/edit/1", label: "Edit" },
];

export function SiteNav() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-foreground">
          Kirtan
        </Link>
        <ul className="flex items-center gap-4 text-sm text-muted-foreground">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
