CREATE TABLE "Text" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourcePdf" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Text_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TextVersion" (
  "id" TEXT NOT NULL,
  "textId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "rawContent" TEXT NOT NULL,
  "extractedContent" TEXT NOT NULL,
  "romanizedContent" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TextVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TextVersionLine" (
  "id" TEXT NOT NULL,
  "textVersionId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "rawContent" TEXT NOT NULL,
  "extractedContent" TEXT NOT NULL,
  "romanizedContent" TEXT NOT NULL,
  CONSTRAINT "TextVersionLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TextVersionTag" (
  "textVersionId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "TextVersionTag_pkey" PRIMARY KEY ("textVersionId","tagId")
);

CREATE UNIQUE INDEX "Text_slug_key" ON "Text"("slug");
CREATE UNIQUE INDEX "TextVersion_textId_versionNumber_key" ON "TextVersion"("textId", "versionNumber");
CREATE UNIQUE INDEX "TextVersionLine_textVersionId_lineNumber_key" ON "TextVersionLine"("textVersionId", "lineNumber");
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

ALTER TABLE "TextVersion" ADD CONSTRAINT "TextVersion_textId_fkey" FOREIGN KEY ("textId") REFERENCES "Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TextVersionLine" ADD CONSTRAINT "TextVersionLine_textVersionId_fkey" FOREIGN KEY ("textVersionId") REFERENCES "TextVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TextVersionTag" ADD CONSTRAINT "TextVersionTag_textVersionId_fkey" FOREIGN KEY ("textVersionId") REFERENCES "TextVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TextVersionTag" ADD CONSTRAINT "TextVersionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
