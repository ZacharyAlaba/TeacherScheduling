import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('prisma keys', Object.keys(prisma).sort());
  const rows: any = await prisma.$queryRawUnsafe('SELECT count(*)::int AS c FROM "AttendanceRecord"');
  console.log('attendance count', Array.isArray(rows) ? rows[0].c : rows.c);

  const students = await prisma.student.findMany({ select: { id: true, studentId: true, userId: true } });
  console.log('students', students);

  const records: any = await prisma.$queryRawUnsafe('SELECT * FROM "AttendanceRecord" LIMIT 5');
  console.log('records', records);

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log('users', users);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
