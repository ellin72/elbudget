import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDefaultCategories() {
  const existingDefaults = await prisma.category.count({ where: { isDefault: true } });
  if (existingDefaults > 0) {
    return;
  }

  const defaults = [
    { name: "Salary", type: "INCOME", icon: "💼", color: "#10b981" },
    { name: "Freelance", type: "INCOME", icon: "🧾", color: "#14b8a6" },
    { name: "Food", type: "EXPENSE", icon: "🍽️", color: "#f59e0b" },
    { name: "Transport", type: "EXPENSE", icon: "🚗", color: "#3b82f6" },
    { name: "Utilities", type: "EXPENSE", icon: "💡", color: "#8b5cf6" },
    { name: "Debt Payment", type: "EXPENSE", icon: "💳", color: "#ef4444" },
    { name: "Savings", type: "TRANSFER", icon: "🏦", color: "#22c55e" },
  ];

  for (const category of defaults) {
    await prisma.category.create({
      data: {
        ...category,
        isDefault: true,
        userId: null,
      },
    });
  }
}

async function main() {
  await seedDefaultCategories();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
