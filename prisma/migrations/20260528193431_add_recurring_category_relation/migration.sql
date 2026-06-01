-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recurring_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "nextDueDate" DATETIME NOT NULL,
    "lastPaid" DATETIME,
    "categoryId" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoPost" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "recurring_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recurring_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_recurring_items" ("amount", "autoPost", "categoryId", "color", "createdAt", "frequency", "icon", "id", "isActive", "lastPaid", "name", "nextDueDate", "notes", "type", "updatedAt", "userId") SELECT "amount", "autoPost", "categoryId", "color", "createdAt", "frequency", "icon", "id", "isActive", "lastPaid", "name", "nextDueDate", "notes", "type", "updatedAt", "userId" FROM "recurring_items";
DROP TABLE "recurring_items";
ALTER TABLE "new_recurring_items" RENAME TO "recurring_items";
CREATE INDEX "recurring_items_userId_idx" ON "recurring_items"("userId");
CREATE INDEX "recurring_items_userId_nextDueDate_idx" ON "recurring_items"("userId", "nextDueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
