/*
  Warnings:

  - A unique constraint covering the columns `[donorId,listingId]` on the table `adoptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "adoptions_donorId_listingId_key" ON "adoptions"("donorId", "listingId");
