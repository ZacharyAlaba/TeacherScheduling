import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await prisma.scheduleBlock.findMany({
      include: {
        teacher: { include: { user: true } },
        subject: true,
        section: true,
      },
    });

    const workloadMap: { [key: string]: any } = {};

    // Aggregate by teacher
    schedules.forEach((schedule) => {
      const teacherId = schedule.teacherId;
      if (!workloadMap[teacherId]) {
        workloadMap[teacherId] = {
          teacherId,
          teacherName: schedule.teacher.user.name,
          periods: 0,
          subjects: new Set<string>(),
          sections: new Set<string>(),
        };
      }

      workloadMap[teacherId].periods++;
      workloadMap[teacherId].subjects.add(schedule.subject.name);
      workloadMap[teacherId].sections.add(schedule.section.name);
    });

    // Convert to array and add status
    const workloads = Object.values(workloadMap).map((w: any) => ({
      teacherId: w.teacherId,
      teacherName: w.teacherName,
      periods: w.periods,
      subjects: Array.from(w.subjects),
      sections: Array.from(w.sections),
      workloadPercentage: Math.round((w.periods / 24) * 100), // 24 = full load
      status: w.periods < 18 ? "underloaded" : w.periods > 24 ? "overloaded" : "balanced",
    }));

    return NextResponse.json(workloads);
  } catch (error) {
    console.error("Workload report error:", error);
    return NextResponse.json({ error: "Failed to generate workload report" }, { status: 500 });
  }
}
