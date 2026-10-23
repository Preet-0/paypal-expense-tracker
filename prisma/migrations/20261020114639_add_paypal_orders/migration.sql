-- CreateTable
CREATE TABLE "PayPalOrder" (
    "id" TEXT NOT NULL,
    "paypalOrderId" TEXT NOT NULL,
    "paypalCaptureId" TEXT,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayPalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayPalOrder_paypalOrderId_key" ON "PayPalOrder"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PayPalOrder_paypalCaptureId_key" ON "PayPalOrder"("paypalCaptureId");

-- CreateIndex
CREATE UNIQUE INDEX "PayPalOrder_transactionId_key" ON "PayPalOrder"("transactionId");

-- CreateIndex
CREATE INDEX "PayPalOrder_userId_idx" ON "PayPalOrder"("userId");

-- AddForeignKey
ALTER TABLE "PayPalOrder" ADD CONSTRAINT "PayPalOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
