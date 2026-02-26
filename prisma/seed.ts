import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.text.create({
    data: {
      slug: "govinda-jaya-jaya",
      title: "Govinda Jaya Jaya",
      versions: {
        create: {
          versionNumber: 1,
          rawContent: "govinda jaya jaya\ngopala jaya jaya\nradha-ramana hari govinda jaya jaya",
          extractedContent:
            "Govinda jaya jaya\nGopala jaya jaya\nRadha-ramana hari Govinda jaya jaya",
          romanizedContent:
            "govinda jaya jaya\ngopāla jaya jaya\nrādhā-ramaṇa hari govinda jaya jaya",
          lines: {
            create: [
              {
                lineNumber: 1,
                rawContent: "govinda jaya jaya",
                extractedContent: "Govinda jaya jaya",
                romanizedContent: "govinda jaya jaya",
              },
              {
                lineNumber: 2,
                rawContent: "gopala jaya jaya",
                extractedContent: "Gopala jaya jaya",
                romanizedContent: "gopāla jaya jaya",
              },
              {
                lineNumber: 3,
                rawContent: "radha-ramana hari govinda jaya jaya",
                extractedContent: "Radha-ramana hari Govinda jaya jaya",
                romanizedContent: "rādhā-ramaṇa hari govinda jaya jaya",
              },
            ],
          },
          tags: {
            create: [
              {
                tag: {
                  connectOrCreate: {
                    where: { name: "kirtan" },
                    create: { name: "kirtan" },
                  },
                },
              },
              {
                tag: {
                  connectOrCreate: {
                    where: { name: "maha-mantra" },
                    create: { name: "maha-mantra" },
                  },
                },
              },
            ],
          },
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
