import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking existing attendance records...");
  let existing = -1;
  try {
    const res: any = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS c FROM "AttendanceRecord"');
    existing = Array.isArray(res) ? res[0].c : res.c;
  } catch (e) {
    console.warn('Attendance table may not exist yet or is inaccessible:', e.message || e);
    existing = -1;
  }

  let students = await prisma.student.findMany();
  if (students.length === 0) {
    console.log("No students found — cannot seed attendance demo.");
    return;
  }

  const existingStudentIds: Set<string> = new Set();
  if (existing > 0) {
    const existingRows: any = await prisma.$queryRawUnsafe('SELECT DISTINCT "studentId" FROM "AttendanceRecord"');
    for (const row of existingRows) {
      existingStudentIds.add(row.studentId);
    }
  }

  const subjects = await prisma.subject.findMany({ take: 5 });
  if (subjects.length === 0) {
    console.log("No subjects found — cannot seed attendance demo.");
    return;
  }

  const teachers = await prisma.teacher.findMany({ take: 5 });
  const sections = await prisma.section.findMany({ take: 5 });

  if (sections.length === 0) {
    console.log("No sections found — cannot seed attendance demo.");
    return;
  }

  const gradingPeriod = "Midterm";
  const academicYear = "2025-2026";

  const demoUserId = "demo-student";
  const demoStudentId = "STU001";
  const demoPassword = "student123";
  const demoEmail = "student@school.edu";

  const demoUser = await prisma.user.findUnique({ where: { id: demoUserId } });
  if (!demoUser) {
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    await prisma.user.create({
      data: {
        id: demoUserId,
        email: demoEmail,
        password: hashedPassword,
        name: "Student User",
        role: "STUDENT",
      },
    });
    console.log("Created demo student user.");
  }

  const demoStudent = await prisma.student.findUnique({ where: { studentId: demoStudentId } });
  if (!demoStudent) {
    await prisma.student.create({
      data: {
        userId: demoUserId,
        studentId: demoStudentId,
        gradeLevel: "G11",
        sectionId: sections[0].id,
      },
    });
    console.log("Created demo student record.");
  }

  students = await prisma.student.findMany();
  console.log(`Seeding attendance for ${students.length} students`);

  let inserted = 0;
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (existingStudentIds.has(student.id)) {
      continue;
    }

    const subject = subjects[i % subjects.length];
    const teacher = teachers[i % Math.max(1, teachers.length)];
    const section = sections[i % Math.max(1, sections.length)];
    const status = i % 5 === 0 ? "ABSENT" : "PRESENT";

    const sql = `INSERT INTO "AttendanceRecord" ("id","studentId","teacherId","subjectId","sectionId","gradingPeriod","academicYear",status,remarks,"createdAt","updatedAt") SELECT gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7::"AttendanceStatus",$8,now(),now() WHERE NOT EXISTS (SELECT 1 FROM "AttendanceRecord" WHERE "studentId"=$1 AND "subjectId"=$3 AND "sectionId"=$4 AND "gradingPeriod"=$5 AND "academicYear"=$6);`;
    try {
      await prisma.$executeRawUnsafe(sql, student.id, teacher?.id ?? null, subject.id, section?.id ?? null, gradingPeriod, academicYear, status, 'Demo seed');
      inserted++;
    } catch (err) {
      console.warn('Insert failed for', student.id, err.message || err);
    }
  }

  console.log(`Inserted ${inserted} demo attendance records (or skipped duplicates).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
