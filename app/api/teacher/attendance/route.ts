import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        scheduleBlocks: {
          include: {
            subject: true,
            section: {
              include: {
                students: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }

    const sectionMap = new Map<string, { id: string; name: string; gradeLevel: string; track: string; students: any[] }>();
    const subjectMap = new Map<string, { id: string; name: string; gradeLevel: string; track: string | null }>();

    for (const block of teacher.scheduleBlocks) {
      if (!sectionMap.has(block.sectionId)) {
        sectionMap.set(block.sectionId, {
          id: block.section.id,
          name: block.section.name,
          gradeLevel: block.section.gradeLevel,
          track: block.section.track,
          students: block.section.students.map((student) => ({
            id: student.id,
            studentId: student.studentId,
            name: student.user.name,
            email: student.user.email,
          })),
        });
      }

      if (!subjectMap.has(block.subjectId)) {
        subjectMap.set(block.subjectId, {
          id: block.subject.id,
          name: block.subject.name,
          gradeLevel: block.subject.gradeLevel,
          track: block.subject.track,
        });
      }
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { teacherId: teacher.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        subject: true,
        section: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({
      academicYear: getAcademicYear(),
      sections: Array.from(sectionMap.values()),
      subjects: Array.from(subjectMap.values()),
      attendanceRecords,
    });
  } catch (error) {
    console.error("Teacher attendance fetch error:", error);
    return NextResponse.json({ message: "Failed to load attendance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }

    const { studentId, subjectId, sectionId, gradingPeriod, status, remarks, academicYear } = await request.json();

    if (!studentId || !subjectId || !sectionId || !gradingPeriod || !status) {
      return NextResponse.json({ message: "studentId, subjectId, sectionId, gradingPeriod, and status are required" }, { status: 400 });
    }

    const sectionBlock = await prisma.scheduleBlock.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId,
        sectionId,
      },
    });

    if (!sectionBlock) {
      return NextResponse.json({ message: "You are not assigned to this section and subject" }, { status: 403 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        sectionId,
      },
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found in this section" }, { status: 404 });
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        studentId_subjectId_gradingPeriod_academicYear: {
          studentId,
          subjectId,
          gradingPeriod,
          academicYear: academicYear || getAcademicYear(),
        },
      },
      create: {
        studentId,
        subjectId,
        sectionId,
        teacherId: teacher.id,
        gradingPeriod,
        academicYear: academicYear || getAcademicYear(),
        status,
        remarks: remarks || null,
      },
      update: {
        sectionId,
        teacherId: teacher.id,
        status,
        remarks: remarks || null,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        subject: true,
        section: true,
      },
    });

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error("Teacher attendance save error:", error);
    return NextResponse.json({ message: "Failed to save attendance" }, { status: 500 });
  }
}
