import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slug = "shri-guru-charan";

  await prisma.text.upsert({
    where: { slug },
    update: {},
    create: {
      title: "Shri Guru Charan",
      slug,
      versions: {
        create: {
          versionNumber: 1,
          rawContent: "श्रीगुरु चरन सरोज रज\nनिज मन मुकुर सुधारि",
          extractedContent: "श्रीगुरु चरन सरोज रज\nनिज मन मुकुर सुधारि",
          romanizedContent: "Shri Guru Charan Saroj Raj\nNij Man Mukur Sudhari",
          lines: {
            create: [
              {
                lineNumber: 1,
                rawContent: "श्रीगुरु चरन सरोज रज",
                extractedContent: "श्रीगुरु चरन सरोज रज",
                romanizedContent: "Shri Guru Charan Saroj Raj",
              },
              {
                lineNumber: 2,
                rawContent: "निज मन मुकुर सुधारि",
                extractedContent: "निज मन मुकुर सुधारि",
                romanizedContent: "Nij Man Mukur Sudhari",
              },
            ],
          },
          tags: {
            create: ["aarti", "bhajan"].map((name) => ({
              tag: { connectOrCreate: { where: { name }, create: { name } } },
            })),
          },
        },
      },
    },
  });
}

main().finally(async () => prisma.$disconnect());
