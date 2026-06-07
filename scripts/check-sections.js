const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

(async () => {
  try {
    const sections = await prisma.section.findMany({
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }]
    });
    
    console.log(`\n📚 Total sections in database: ${sections.length}\n`);
    
    const g11 = sections.filter(s => s.gradeLevel === 'G11');
    const g12 = sections.filter(s => s.gradeLevel === 'G12');
    
    console.log(`Grade 11 Sections (${g11.length}):`);
    g11.forEach(s => console.log(`  - ${s.name} (${s.track})`));
    
    console.log(`\nGrade 12 Sections (${g12.length}):`);
    g12.forEach(s => console.log(`  - ${s.name} (${s.track})`));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
