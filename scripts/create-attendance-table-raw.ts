import { prisma } from "../lib/prisma";

async function main() {
  console.log("Creating Attendance enum and table if not exists (non-destructive)...");

  // Create enum if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendancestatus') THEN
        CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','ABSENT','LATE');
      END IF;
    END$$;
  `);

  // Create table if not exists (no foreign keys to avoid schema drift/resets)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
      id TEXT PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "teacherId" TEXT NOT NULL,
      "subjectId" TEXT NOT NULL,
      "sectionId" TEXT NOT NULL,
      "gradingPeriod" TEXT NOT NULL,
      "academicYear" TEXT NOT NULL,
      status "AttendanceStatus" NOT NULL,
      remarks TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    );
  `);

  // Add unique index if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'AttendanceRecord' AND indexname = 'attendance_unique_idx'
      ) THEN
        CREATE UNIQUE INDEX attendance_unique_idx ON "AttendanceRecord" ("studentId", "subjectId", "gradingPeriod", "academicYear");
      END IF;
    END$$;
  `);

  console.log("Attendance table ready.");
}

main()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
