import { prisma } from "@/lib/prisma";

/**
 * Generate enhanced Student ID in format: YYYY-GG-NNN
 * Example: 2026-11-001
 */
export async function generateStudentId(gradeLevel: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const gradeCode = gradeLevel === "G12" ? "12" : "11";
  
  // Find the highest sequence number for this year and grade
  const lastStudent = await prisma.student.findFirst({
    where: {
      studentId: {
        startsWith: `${currentYear}-${gradeCode}-`,
      },
    },
    orderBy: {
      studentId: "desc",
    },
  });

  let sequenceNumber = 1;
  if (lastStudent) {
    const parts = lastStudent.studentId.split("-");
    const lastSequence = parseInt(parts[2], 10);
    sequenceNumber = lastSequence + 1;
  }

  const paddedSequence = String(sequenceNumber).padStart(3, "0");
  return `${currentYear}-${gradeCode}-${paddedSequence}`;
}
