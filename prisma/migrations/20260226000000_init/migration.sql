-- CreateTable
CREATE TABLE "Text" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Text_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextVersion" (
    "id" TEXT NOT NULL,
    "textId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "rawContent" TEXT NOT NULL,
    "extractedContent" TEXT NOT NULL,
    "romanizedContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextLine" (
    "id" TEXT NOT NULL,
    "textVersionId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "rawContent" TEXT NOT NULL,
    "extractedContent" TEXT NOT NULL,
    "romanizedContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextVersionTag" (
    "textVersionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextVersionTag_pkey" PRIMARY KEY ("textVersionId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Text_slug_key" ON "Text"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TextVersion_textId_versionNumber_key" ON "TextVersion"("textId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TextLine_textVersionId_lineNumber_key" ON "TextLine"("textVersionId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- AddForeignKey
ALTER TABLE "TextVersion" ADD CONSTRAINT "TextVersion_textId_fkey" FOREIGN KEY ("textId") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextLine" ADD CONSTRAINT "TextLine_textVersionId_fkey" FOREIGN KEY ("textVersionId") REFERENCES "TextVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextVersionTag" ADD CONSTRAINT "TextVersionTag_textVersionId_fkey" FOREIGN KEY ("textVersionId") REFERENCES "TextVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextVersionTag" ADD CONSTRAINT "TextVersionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
