import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        section: true,
      },
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const grades = await prisma.gradeRecord.findMany({
      where: { studentId: student.id },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        section: true,
      },
      orderBy: [
        { gradingPeriod: "asc" },
        { updatedAt: "desc" },
      ],
    });

    const average = grades.length
      ? Number((grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length).toFixed(2))
      : 0;

    return NextResponse.json({
      studentId: student.studentId,
      name: student.user.name,
      email: student.user.email,
      gradeLevel: student.gradeLevel,
      section: student.section,
      grades,
      average,
    });
  } catch (error) {
    console.error("Student grades fetch error:", error);
    return NextResponse.json({ message: "Failed to load grades" }, { status: 500 });
  }
}