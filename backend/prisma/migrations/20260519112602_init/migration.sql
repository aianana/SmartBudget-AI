
DROP TABLE IF EXISTS "Advice";
DROP TABLE IF EXISTS "History";
DROP TABLE IF EXISTS "Transaction";
DROP TABLE IF EXISTS "User";

-- Создаём User со ВСЕМИ полями из schema.prisma
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "filesUsed" INTEGER NOT NULL DEFAULT 0,
    "questionsUsed" INTEGER NOT NULL DEFAULT 0,
    "statsJson" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- История вопросов и ответов
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- Транзакции
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- Советы от AI
CREATE TABLE "Advice" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Advice_pkey" PRIMARY KEY ("id")
);

-- Внешние ключи
ALTER TABLE "History"     ADD CONSTRAINT "History_userId_fkey"     FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Advice"      ADD CONSTRAINT "Advice_userId_fkey"      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
