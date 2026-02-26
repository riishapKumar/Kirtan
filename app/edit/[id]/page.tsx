interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;

  return <h1 className="text-xl font-semibold">Edit: {id}</h1>;
}
