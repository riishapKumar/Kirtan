interface TemplatePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params;

  return <h1 className="text-xl font-semibold">Template: {slug}</h1>;
}
