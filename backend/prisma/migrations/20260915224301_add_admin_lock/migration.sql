-- CreateTable
CREATE TABLE "AdminLock" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "adminUserId" INTEGER,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLock_pkey" PRIMARY KEY ("id")
);
