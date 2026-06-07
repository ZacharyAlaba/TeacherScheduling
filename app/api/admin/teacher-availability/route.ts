import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  const timeSlotId = searchParams.get("timeSlotId");

  try {
    if (!teacherId) {
      return Response.json({ error: "Teacher ID required" }, { status: 400 });
    }

    // Get teacher info
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) {
      return Response.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get all schedules for this teacher
    const schedules = await prisma.scheduleBlock.findMany({
      where: { teacherId },
      include: {
        subject: true,
        section: true,
        timeSlot: true,
      },
    });

    // Get teacher's workload
    const totalPeriods = schedules.length;
    const uniqueSubjects = new Set(schedules.map((s: any) => s.subject.name));
    const uniqueSections = new Set(schedules.map((s: any) => s.section.name));

    // Check if trying to assign at a time slot where teacher is already busy
    let hasConflict = false;
    if (timeSlotId) {
      hasConflict = schedules.some((s: any) => s.timeSlotId === timeSlotId);
    }

    return Response.json({
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
      },
      workload: {
        totalPeriods,
        subjects: Array.from(uniqueSubjects),
        sections: Array.from(uniqueSections),
        status:
          totalPeriods < 18
            ? "underloaded"
            : totalPeriods > 24
            ? "overloaded"
            : "balanced",
      },
      conflict: hasConflict ? "Teacher already has class at this time" : null,
      schedule: schedules.map((s: any) => ({
        subject: s.subject.name,
        section: s.section.name,
        day: s.timeSlot.day,
        time: `${s.timeSlot.startTime}-${s.timeSlot.endTime}`,
      })),
    });
  } catch (error) {
    console.error("Teacher availability error:", error);
    return Response.json({
      teacher: null,
      workload: {
        totalPeriods: 0,
        subjects: [],
        sections: [],
        status: "underloaded",
      },
      conflict: null,
      schedule: [],
    });
  }
}
