-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "serviceId" INTEGER,
ALTER COLUMN "blockId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ExtraService" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceUsd" DECIMAL(10,2) NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceVideo" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePurchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL,
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtraService_slug_key" ON "ExtraService"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceVideo_serviceId_videoId_key" ON "ServiceVideo"("serviceId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePurchase_mpPaymentId_key" ON "ServicePurchase"("mpPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePurchase_userId_serviceId_key" ON "ServicePurchase"("userId", "serviceId");

-- CreateIndex
CREATE INDEX "Routine_serviceId_idx" ON "Routine"("serviceId");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ExtraService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVideo" ADD CONSTRAINT "ServiceVideo_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ExtraService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVideo" ADD CONSTRAINT "ServiceVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePurchase" ADD CONSTRAINT "ServicePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePurchase" ADD CONSTRAINT "ServicePurchase_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ExtraService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Servicios complementarios iniciales (U$S 2 cada uno; precio, texto y estado se editan desde el admin)
INSERT INTO "ExtraService" ("slug", "name", "description", "priceUsd", "sortOrder", "updatedAt") VALUES
  ('flexibilidad', 'Rutina Flexibilidad', 'Estiramientos progresivos para ganar rango de movimiento y soltar el cuerpo.', 2, 1, CURRENT_TIMESTAMP),
  ('higiene-columna', 'Rutina Higiene de columna', 'Postura y fortalecimiento del core para cuidar tu espalda en el día a día.', 2, 2, CURRENT_TIMESTAMP),
  ('en-casa', 'Rutina en casa', 'Entrenamientos completos sin equipamiento, para cualquier espacio de tu casa.', 2, 3, CURRENT_TIMESTAMP),
  ('trabajo', 'Rutina entrenamiento en el trabajo', 'Pausas activas cortas para hacer en la oficina o en tu lugar de trabajo.', 2, 4, CURRENT_TIMESTAMP),
  ('en-equipo', 'Rutina en equipo', 'Rutinas para entrenar en pareja o en grupo, con ejercicios compartidos.', 2, 5, CURRENT_TIMESTAMP),
  ('antimigrana', 'Rutina antimigraña', 'Movilidad de cuello y hombros, respiración y relajación para aliviar la tensión asociada a la migraña.', 2, 6, CURRENT_TIMESTAMP),
  ('tension-muscular', 'Rutina Tensión muscular', 'Liberación y estiramientos suaves para aflojar contracturas y tensión acumulada.', 2, 7, CURRENT_TIMESTAMP),
  ('hiperlaxitud', 'Rutina Hiperlaxitud', 'Fortalecimiento y control articular para dar estabilidad a articulaciones con exceso de movilidad.', 2, 8, CURRENT_TIMESTAMP),
  ('bruxismo', 'Rutina Bruxismo', 'Relajación de mandíbula y cuello con ejercicios de respiración para reducir la tensión al apretar los dientes.', 2, 9, CURRENT_TIMESTAMP),
  ('autismo', 'Rutina Autismo', 'Rutinas adaptadas, predecibles y sensorialmente amables, pensadas para personas dentro del espectro autista.', 2, 10, CURRENT_TIMESTAMP),
  ('adulto-mayor', 'Rutina adulto mayor (fisioterapia)', 'Ejercicios de fisioterapia para equilibrio, fuerza y autonomía, adaptados a adultos mayores.', 2, 11, CURRENT_TIMESTAMP),
  ('movilidad-articular', 'Rutina movilidad articular y estiramientos', 'Movilidad de pies a cabeza y estiramientos para empezar o cerrar el día.', 2, 12, CURRENT_TIMESTAMP);
