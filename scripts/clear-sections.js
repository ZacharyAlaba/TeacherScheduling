const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.section.deleteMany();
    console.log("✅ Deleted all existing sections");
  } catch (error) {
    console.error("Error clearing sections:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
